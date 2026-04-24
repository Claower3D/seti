package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

// SearchMusic searches for music via Jamendo API
func SearchMusic(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}

	// Jamendo API (using a public client_id from their examples)
	clientID := "56d30c55"
	url := fmt.Sprintf("https://api.jamendo.com/v3.0/tracks/?client_id=%s&format=json&limit=30&search=%s&include=musicinfo&audioformat=mp32", clientID, query)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch music"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		Results []struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			Artist    string `json:"artist_name"`
			Image     string `json:"image"`
			Audio     string `json:"audio"`
			Duration  int    `json:"duration"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse music data"})
		return
	}

	// Convert to our internal format
	songs := []models.Song{}
	for _, r := range result.Results {
		songs = append(songs, models.Song{
			Title:    r.Name,
			Artist:   r.Artist,
			URL:      r.Audio,
			ImageURL: r.Image,
			Duration: r.Duration,
			Source:   "jamendo",
		})
	}

	c.JSON(http.StatusOK, songs)
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
