package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"social-network/internal/db"
	"social-network/internal/models"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Music API Result Structure (JioSaavn)
type SaavnResult struct {
	Status string `json:"status"`
	Data   []struct {
		Name         string `json:"name"`
		Artist       string `json:"primaryArtists"`
		Image        []struct { Link string `json:"link"` } `json:"image"`
		DownloadURL  []struct { Link string `json:"link"` } `json:"downloadUrl"`
	} `json:"data"`
}

// Global User-Agent to avoid blocks
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

func fetchWithUA(url string) ([]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", userAgent)
	resp, err := client.Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// SearchMusic now uses an indestructible multi-source failover engine
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

	// ENGINE 1: JioSaavn Mirrors (High Quality Studio Tracks)
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
					if len(item.DownloadURL) > 0 { stream = item.DownloadURL[len(item.DownloadURL)-1].Link }
					thumb := ""
					if len(item.Image) > 0 { thumb = item.Image[len(item.Image)-1].Link }
					allSongs = append(allSongs, models.Song{
						Title: item.Name, Artist: item.Artist, URL: stream, ImageURL: thumb, Source: "hifi",
					})
				}
				mu.Unlock()
				return // Success
			}
		}
	}()

	// ENGINE 2: YouTube Music / Piped Mirrors (Absolute Coverage)
	wg.Add(1)
	go func() {
		defer wg.Done()
		pipedMirrors := []string{
			"https://pipedapi.kavin.rocks/search?q=%s&filter=music_songs",
			"https://piped-api.lunar.icu/search?q=%s&filter=music_songs",
			"https://api.piped.victr.me/search?q=%s&filter=music_songs",
			"https://pipedapi.leptons.xyz/search?q=%s&filter=music_songs",
		}
		for _, m := range pipedMirrors {
			data, err := fetchWithUA(fmt.Sprintf(m, encodedQuery))
			if err != nil { continue }
			var pRes struct {
				Items []struct {
					Title string `json:"title"`
					URL   string `json:"url"`
					Uploader string `json:"uploaderName"`
					Thumbnail string `json:"thumbnail"`
				} `json:"items"`
			}
			if err := json.Unmarshal(data, &pRes); err == nil && len(pRes.Items) > 0 {
				mu.Lock()
				for _, item := range pRes.Items {
					parts := strings.Split(item.URL, "=")
					if len(parts) < 2 { continue }
					vID := parts[1]
					allSongs = append(allSongs, models.Song{
						Title: item.Title, Artist: item.Uploader, URL: fmt.Sprintf("/api/music/proxy/%s", vID), ImageURL: item.Thumbnail, Source: "piped",
					})
				}
				mu.Unlock()
				return
			}
		}
	}()

	wg.Wait()

	// Dedup and send
	c.JSON(http.StatusOK, allSongs)
}

func ProxyStream(c *gin.Context) {
	videoID := c.Param("id")
	// Try multiple instances for the actual stream URL
	instances := []string{
		"https://pipedapi.kavin.rocks",
		"https://piped-api.lunar.icu",
		"https://api.piped.victr.me",
		"https://piped-api.garudalinux.org",
	}

	for _, inst := range instances {
		data, err := fetchWithUA(fmt.Sprintf("%s/streams/%s", inst, videoID))
		if err != nil { continue }
		var res struct { AudioStreams []struct { URL string `json:"url" } `json:"audioStreams" }
		if err := json.Unmarshal(data, &res); err == nil && len(res.AudioStreams) > 0 {
			c.Redirect(http.StatusTemporaryRedirect, res.AudioStreams[0].URL)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Failed to resolve stream"})
}

// User-Library logic (Remains same)
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
		if err := db.DB.Create(&song).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save song"})
			return
		}
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
