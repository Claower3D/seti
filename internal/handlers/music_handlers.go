package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"social-network/internal/db"
	"social-network/internal/models"
	"strings"

	"github.com/gin-gonic/gin"
)

// SearchMusic uses a failover engine to search multiple high-reliability sources
func SearchMusic(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}

	encodedQuery := url.QueryEscape(query)
	songs := []models.Song{}

	// Source 1 & 2: Invidious Instances (Decentralized YouTube)
	invidiousInstances := []string{
		"https://iv.melmac.space",
		"https://invidious.projectsegfau.lt",
		"https://inv.tux.im",
		"https://invidious.nerdvpn.de",
	}

	for _, instance := range invidiousInstances {
		searchURL := fmt.Sprintf("%s/api/v1/search?q=%s&type=video", instance, encodedQuery)
		resp, err := http.Get(searchURL)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		var results []struct {
			Title         string `json:"title"`
			VideoID       string `json:"videoId"`
			Author        string `json:"author"`
			VideoThumbnails []struct {
				URL string `json:"url"`
			} `json:"videoThumbnails"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&results); err == nil && len(results) > 0 {
			for _, r := range results {
				thumb := ""
				if len(r.VideoThumbnails) > 0 {
					thumb = r.VideoThumbnails[0].URL
				}
				songs = append(songs, models.Song{
					Title:    r.Title,
					Artist:   r.Author,
					URL:      fmt.Sprintf("/api/music/proxy/%s", r.VideoID),
					ImageURL: thumb,
					Source:   "invidious",
				})
			}
			break // Found results, stop searching
		}
	}

	// Source 3: Deezer (Fallback for meta-data if YouTube-based search fails)
	if len(songs) == 0 {
		deezerURL := fmt.Sprintf("https://api.deezer.com/search?q=%s&limit=20", encodedQuery)
		resp, err := http.Get(deezerURL)
		if err == nil {
			defer resp.Body.Close()
			var dResult struct {
				Data []struct {
					Title string `json:"title"`
					Artist struct { Name string `json:"name"` } `json:"artist"`
					Preview string `json:"preview"`
					Album struct { CoverMedium string `json:"cover_medium"` } `json:"album"`
				} `json:"data"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&dResult); err == nil {
				for _, r := range dResult.Data {
					songs = append(songs, models.Song{
						Title: r.Title, Artist: r.Artist.Name, URL: r.Preview, ImageURL: r.Album.CoverMedium, Source: "deezer",
					})
				}
			}
		}
	}

	if len(songs) == 0 {
		c.JSON(http.StatusOK, []models.Song{}) // Return empty but valid array
		return
	}

	c.JSON(http.StatusOK, songs)
}

func ProxyStream(c *gin.Context) {
	videoID := c.Param("id")
	if videoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Video ID is required"})
		return
	}

	// List of relatively stable Piped instances to try
	instances := []string{
		"https://pipedapi.kavin.rocks",
		"https://piped-api.lunar.icu",
		"https://api.piped.victr.me",
		"https://pipedapi.leptons.xyz",
	}

	var streamURL string
	for _, instance := range instances {
		url := fmt.Sprintf("%s/streams/%s", instance, videoID)
		resp, err := http.Get(url)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		var result struct {
			AudioStreams []struct {
				URL string `json:"url"`
			} `json:"audioStreams"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&result); err == nil && len(result.AudioStreams) > 0 {
			streamURL = result.AudioStreams[0].URL
			break
		}
	}

	if streamURL == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve stream after trying multiple mirrors"})
		return
	}

	// Redirect to the first audio stream
	c.Redirect(http.StatusTemporaryRedirect, streamURL)
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
