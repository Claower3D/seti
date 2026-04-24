package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"social-network/internal/db"
	"social-network/internal/models"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Global User-Agent
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// Defined outside to prevent nested struct parsing errors
type SaavnSong struct {
	Name           string `json:"name"`
	PrimaryArtists string `json:"primaryArtists"`
	Image          []struct {
		Link string `json:"link"`
	} `json:"image"`
	DownloadUrl []struct {
		Link string `json:"link"`
	} `json:"downloadUrl"`
}

type SaavnResult struct {
	Status string      `json:"status"`
	Data   []SaavnSong `json:"data"`
}

type PipedItem struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	Uploader  string `json:"uploaderName"`
	Thumbnail string `json:"thumbnail"`
}

type PipedSearchResult struct {
	Items []PipedItem `json:"items"`
}

type PipedStream struct {
	URL string `json:"url"`
}

type PipedStreamResult struct {
	AudioStreams []PipedStream `json:"audioStreams"`
}

func fetchWithUA(targetUrl string) ([]byte, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, _ := http.NewRequest("GET", targetUrl, nil)
	req.Header.Set("User-Agent", userAgent)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func SearchMusic(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}

	encodedQuery := url.QueryEscape(query)
	var allSongs []models.Song
	var mu sync.Mutex
	var wg sync.WaitGroup

	// ENGINE 1: JioSaavn
	wg.Add(1)
	go func() {
		defer wg.Done()
		mirrors := []string{
			"https://saavn.me/search/songs?query=%s",
			"https://jiosaavn-api-beta.vercel.app/search/songs?query=%s",
		}
		for _, m := range mirrors {
			data, err := fetchWithUA(fmt.Sprintf(m, encodedQuery))
			if err != nil { continue }
			var res SaavnResult
			if err := json.Unmarshal(data, &res); err == nil && len(res.Data) > 0 {
				mu.Lock()
				for _, item := range res.Data {
					stream := ""
					if len(item.DownloadUrl) > 0 {
						stream = item.DownloadUrl[len(item.DownloadUrl)-1].Link
					}
					thumb := ""
					if len(item.Image) > 0 {
						thumb = item.Image[len(item.Image)-1].Link
					}
					allSongs = append(allSongs, models.Song{
						Title:    item.Name,
						Artist:   item.PrimaryArtists,
						URL:      stream,
						ImageURL: thumb,
						Source:   "hifi",
					})
				}
				mu.Unlock()
				return
			}
		}
	}()

	// ENGINE 2: Piped Music
	wg.Add(1)
	go func() {
		defer wg.Done()
		pipedMirrors := []string{
			"https://pipedapi.kavin.rocks/search?q=%s&filter=music_songs",
			"https://piped-api.lunar.icu/search?q=%s&filter=music_songs",
		}
		for _, m := range pipedMirrors {
			data, err := fetchWithUA(fmt.Sprintf(m, encodedQuery))
			if err != nil { continue }
			var res PipedSearchResult
			if err := json.Unmarshal(data, &res); err == nil && len(res.Items) > 0 {
				mu.Lock()
				for _, item := range res.Items {
					u, _ := url.Parse(item.URL)
					vID := u.Query().Get("v")
					if vID == "" { continue }
					allSongs = append(allSongs, models.Song{
						Title:    item.Title,
						Artist:   item.Uploader,
						URL:      fmt.Sprintf("/api/music/proxy/%s", vID),
						ImageURL: item.Thumbnail,
						Source:   "piped",
					})
				}
				mu.Unlock()
				return
			}
		}
	}()

	wg.Wait()
	c.JSON(http.StatusOK, allSongs)
}

func ProxyStream(c *gin.Context) {
	videoID := c.Param("id")
	instances := []string{
		"https://pipedapi.kavin.rocks",
		"https://piped-api.lunar.icu",
		"https://api.piped.victr.me",
	}

	for _, inst := range instances {
		data, err := fetchWithUA(fmt.Sprintf("%s/streams/%s", inst, videoID))
		if err != nil { continue }
		var res PipedStreamResult
		if err := json.Unmarshal(data, &res); err == nil && len(res.AudioStreams) > 0 {
			c.Redirect(http.StatusTemporaryRedirect, res.AudioStreams[0].URL)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Failed to resolve stream"})
}

func AddToMyMusic(c *gin.Context) {
	var input models.Song
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("userId")
	var song models.Song
	if err := db.DB.Where("url = ?", input.URL).First(&song).Error; err != nil {
		song = input
		db.DB.Create(&song)
	}
	var userSong models.UserSong
	if err := db.DB.Where("user_id = ? AND song_id = ?", userID, song.ID).First(&userSong).Error; err != nil {
		userSong = models.UserSong{UserID: userID.(uint), SongID: song.ID}
		db.DB.Create(&userSong)
	}
	c.JSON(http.StatusOK, song)
}

func GetMyMusic(c *gin.Context) {
	userID, _ := c.Get("userId")
	var songs []models.Song
	db.DB.Joins("JOIN user_songs ON user_songs.song_id = songs.id").
		Where("user_songs.user_id = ?", userID).
		Order("user_songs.created_at desc").
		Find(&songs)
	c.JSON(http.StatusOK, songs)
}

func RemoveFromMyMusic(c *gin.Context) {
	songID := c.Param("id")
	userID, _ := c.Get("userId")
	db.DB.Where("user_id = ? AND song_id = ?", userID, songID).Delete(&models.UserSong{})
	c.JSON(http.StatusOK, gin.H{"success": true})
}
