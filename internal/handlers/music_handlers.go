package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

// SearchMusic searches for music via Piped API (YouTube Music proxy)
func SearchMusic(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}

	// Piped API (YouTube proxy) - Search for songs
	url := fmt.Sprintf("https://pipedapi.kavin.rocks/search?q=%s&filter=music_songs", query)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search service temporarily unavailable"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		Items []struct {
			Title      string `json:"title"`
			Uploader   string `json:"uploaderName"`
			Thumbnail  string `json:"thumbnail"`
			URL        string `json:"url"` // This contains /watch?v=ID
			Duration   int    `json:"duration"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse music data"})
		return
	}

	// Convert to our internal format
	songs := []models.Song{}
	for _, r := range result.Items {
		videoID := ""
		if len(r.URL) > 9 {
			videoID = r.URL[9:]
		}

		if videoID == "" {
			continue
		}

		songs = append(songs, models.Song{
			Title:    r.Title,
			Artist:   r.Uploader,
			// Using our internal proxy to get the real stream URL
			URL:      fmt.Sprintf("/api/music/proxy/%s", videoID),
			ImageURL: r.Thumbnail,
			Duration: r.Duration,
			Source:   "youtube",
		})
	}

	c.JSON(http.StatusOK, songs)
}

func ProxyStream(c *gin.Context) {
	videoID := c.Param("id")
	if videoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Video ID is required"})
		return
	}

	// Fetch stream info from Piped
	url := fmt.Sprintf("https://pipedapi.kavin.rocks/streams/%s", videoID)
	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve stream"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		AudioStreams []struct {
			URL      string `json:"url"`
			Format   string `json:"format"`
			MimeType string `json:"mimeType"`
		} `json:"audioStreams"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || len(result.AudioStreams) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No audio stream found"})
		return
	}

	// Redirect to the first audio stream
	c.Redirect(http.StatusTemporaryRedirect, result.AudioStreams[0].URL)
}

func AddToMyMusic(c *gin.Context) {
	var input models.Song
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")

	// 1. Check if song already exists by URL
	var song models.Song
	if err := db.DB.Where("url = ?", input.URL).First(&song).Error; err != nil {
		// New song, save it
		song = input
		if err := db.DB.Create(&song).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save song metadata"})
			return
		}
	}

	// 2. Check if already in user's library
	var userSong models.UserSong
	if err := db.DB.Where("user_id = ? AND song_id = ?", userID, song.ID).First(&userSong).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "Already in library"})
		return
	}

	// 3. Add to library
	userSong = models.UserSong{
		UserID: userID.(uint),
		SongID: song.ID,
	}
	if err := db.DB.Create(&userSong).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to library"})
		return
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

	if err := db.DB.Where("user_id = ? AND song_id = ?", userID, songID).Delete(&models.UserSong{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from library"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
