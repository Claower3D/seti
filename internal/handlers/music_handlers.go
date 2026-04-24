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

// SearchMusic searches for music directly through YouTube to ensure 100% up-time
func SearchMusic(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}

	// Double-encode query for YouTube
	safeQuery := url.QueryEscape(query)
	searchURL := fmt.Sprintf("https://www.youtube.com/results?search_query=%s&sp=EgIQAQ%253D%253D", safeQuery)

	client := &http.Client{}
	req, _ := http.NewRequest("GET", searchURL, nil)
	// Mask as a real browser to avoid being blocked
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reach search source"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	bodyStr := string(body)

	// Extract ytInitialData which contains the search results
	startTag := "var ytInitialData = "
	startIndex := strings.Index(bodyStr, startTag)
	if startIndex == -1 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search engine error (no data)"})
		return
	}

	dataPart := bodyStr[startIndex+len(startTag):]
	endIndex := strings.Index(dataPart, ";</script>")
	if endIndex == -1 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search engine error (parse error)"})
		return
	}

	jsonData := dataPart[:endIndex]
	
	// Convert to internal format (simplified since we just need video IDs, titles and thumbs)
	songs := []models.Song{}
	
	// We use regex to extract what we need quickly without complex JSON parsing of huge YT objects
	re := regexp.MustCompile(`"videoRenderer":\{"videoId":"([^"]+)","thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"[^}]+\]\},"title":\{"runs":\[\{"text":"([^"]+)"\}\]\},"longBylineText":\{"runs":\[\{"text":"([^"]+)"`)
	matches := re.FindAllStringSubmatch(jsonData, 20)

	for _, m := range matches {
		if len(m) < 5 {
			continue
		}
		songs = append(songs, models.Song{
			Title:    m[3],
			Artist:   m[4],
			URL:      fmt.Sprintf("/api/music/proxy/%s", m[1]),
			ImageURL: m[2],
			Duration: 0, // YouTube search doesn't easily giveaway duration in this simple format
			Source:   "youtube_direct",
		})
	}

	if len(songs) == 0 {
		// Fallback to Piped if scraping fails (Plan B)
		apiURL := fmt.Sprintf("https://piped-api.lunar.icu/search?q=%s&filter=music_songs", safeQuery)
		resp, err := http.Get(apiURL)
		if err == nil {
			defer resp.Body.Close()
			var pResult struct { Items []struct { Title string `json:"title"`; Uploader string `json:"uploaderName"`; Thumbnail string `json:"thumbnail"`; URL string `json:"url"` } }
			if err := json.NewDecoder(resp.Body).Decode(&pResult); err == nil {
				for _, r := range pResult.Items {
					if len(r.URL) > 9 {
						songs = append(songs, models.Song{
							Title: r.Title, Artist: r.Uploader, URL: fmt.Sprintf("/api/music/proxy/%s", r.URL[9:]), ImageURL: r.Thumbnail, Source: "piped_fallback",
						})
					}
				}
			}
		}
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
