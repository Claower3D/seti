package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"social-network/internal/db"
	"social-network/internal/models"
	"sync"

	"github.com/gin-gonic/gin"
)

// Music API Result Structure (General)
type MusicAPIResult struct {
	Status string `json:"status"`
	Data   []struct {
		ID           string `json:"id"`
		Name         string `json:"name"`
		Album        struct { Name string `json:"name"` } `json:"album"`
		Duration     string `json:"duration"`
		Artist       string `json:"primaryArtists"`
		Image        []struct { Link string `json:"link"` } `json:"image"`
		DownloadURL  []struct { 
			Link    string `json:"link"` 
			Quality string `json:"quality"` 
		} `json:"downloadUrl"`
	} `json:"data"`
}

// SearchMusic now uses a multi-engine aggregator for absolute coverage
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

	// ENGINE 1: Global Hi-Fi (Saavn)
	wg.Add(1)
	go func() {
		defer wg.Done()
		musicURL := fmt.Sprintf("https://saavn.me/search/songs?query=%s&limit=20", encodedQuery)
		resp, err := http.Get(musicURL)
		if err == nil {
			defer resp.Body.Close()
			var res MusicAPIResult
			if err := json.NewDecoder(resp.Body).Decode(&res); err == nil {
				mu.Lock()
				for _, item := range res.Data {
					streamURL := ""
					if len(item.DownloadURL) > 0 {
						streamURL = item.DownloadURL[len(item.DownloadURL)-1].Link
					}
					thumb := ""
					if len(item.Image) > 0 {
						thumb = item.Image[len(item.Image)-1].Link
					}
					allSongs = append(allSongs, models.Song{
						Title:    item.Name,
						Artist:   item.Artist,
						URL:      streamURL,
						ImageURL: thumb,
						Source:   "hifi",
					})
				}
				mu.Unlock()
			}
		}
	}()

	// ENGINE 2: YouTube Music (Piped Aggregator)
	wg.Add(1)
	go func() {
		defer wg.Done()
		pipedURL := fmt.Sprintf("https://pipedapi.kavin.rocks/search?q=%s&filter=music_songs", encodedQuery)
		resp, err := http.Get(pipedURL)
		if err == nil {
			defer resp.Body.Close()
			var pRes struct {
				Items []struct {
					Title     string `json:"title"`
					URL       string `json:"url"`
					Uploader  string `json:"uploaderName"`
					Thumbnail string `json:"thumbnail"`
				} `json:"items"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&pRes); err == nil {
				mu.Lock()
				for _, item := range pRes.Items {
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
			}
		}
	}()

	wg.Wait()

	if len(allSongs) == 0 {
		c.JSON(http.StatusOK, []models.Song{})
		return
	}

	c.JSON(http.StatusOK, allSongs)
}

func ProxyStream(c *gin.Context) {
	videoID := c.Param("id")
	instances := []string{
		"https://pipedapi.kavin.rocks",
		"https://piped-api.lunar.icu",
	}
	
	for _, inst := range instances {
		resp, err := http.Get(fmt.Sprintf("%s/streams/%s", inst, videoID))
		if err != nil { continue }
		defer resp.Body.Close()

		var res struct { 
			AudioStreams []struct { 
				URL string `json:"url"` 
			} `json:"audioStreams"` 
		}
		if err := json.NewDecoder(resp.Body).Decode(&res); err == nil && len(res.AudioStreams) > 0 {
			c.Redirect(http.StatusTemporaryRedirect, res.AudioStreams[0].URL)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Stream not found"})
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
