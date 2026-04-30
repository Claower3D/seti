package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"social-network/internal/db"
	"social-network/internal/models"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

var (
	streamCache   = map[string]cachedStream{}
	streamCacheMu sync.RWMutex
)

type cachedStream struct {
	url       string
	expiresAt time.Time
}

func searchYouTube(query string) []models.Song {
	apiKey := os.Getenv("YOUTUBE_API_KEY")
	if apiKey == "" {
		return nil
	}

	searchURL := fmt.Sprintf(
		"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=15&q=%s&key=%s",
		url.QueryEscape(query), apiKey,
	)

	resp, err := http.Get(searchURL)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result struct {
		Items []struct {
			ID struct {
				VideoID string `json:"videoId"`
			} `json:"id"`
			Snippet struct {
				Title        string `json:"title"`
				ChannelTitle string `json:"channelTitle"`
				Thumbnails   struct {
					High struct {
						URL string `json:"url"`
					} `json:"high"`
				} `json:"thumbnails"`
			} `json:"snippet"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil
	}

	var songs []models.Song
	for _, item := range result.Items {
		if item.ID.VideoID == "" {
			continue
		}
		songs = append(songs, models.Song{
			Title:    item.Snippet.Title,
			Artist:   item.Snippet.ChannelTitle,
			URL:      "/api/music/proxy/yt/" + item.ID.VideoID,
			ImageURL: item.Snippet.Thumbnails.High.URL,
			Source:   "youtube",
		})
	}
	return songs
}

func resolveYTStream(id string) (string, error) {
	streamCacheMu.RLock()
	if cached, ok := streamCache[id]; ok && time.Now().Before(cached.expiresAt) {
		streamCacheMu.RUnlock()
		return cached.url, nil
	}
	streamCacheMu.RUnlock()

	cmd := exec.Command("yt-dlp",
		"https://www.youtube.com/watch?v="+id,
		"-f", "bestaudio[ext=m4a]/bestaudio/best",
		"--get-url",
		"--no-warnings",
		"-q",
	)
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("yt-dlp failed: %w", err)
	}
	streamURL := strings.TrimSpace(string(out))
	if streamURL == "" {
		return "", fmt.Errorf("empty stream url")
	}

	streamCacheMu.Lock()
	streamCache[id] = cachedStream{
		url:       streamURL,
		expiresAt: time.Now().Add(4 * time.Hour),
	}
	streamCacheMu.Unlock()

	return streamURL, nil
}

func SearchMusic(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}

	var allSongs []models.Song
	var wg sync.WaitGroup
	var mu sync.Mutex

	// YouTube — основной источник
	wg.Add(1)
	go func() {
		defer wg.Done()
		songs := searchYouTube(query)
		mu.Lock()
		allSongs = append(allSongs, songs...)
		mu.Unlock()
	}()

	// Jamendo — полные треки, Creative Commons
	wg.Add(1)
	go func() {
		defer wg.Done()
		searchURL := fmt.Sprintf(
			"https://api.jamendo.com/v3.0/tracks/?client_id=56d30cce&format=json&limit=5&search=%s&audioformat=mp32",
			url.QueryEscape(query),
		)
		resp, err := http.Get(searchURL)
		if err != nil {
			return
		}
		defer resp.Body.Close()
		var res struct {
			Results []struct {
				Name     string `json:"name"`
				Artist   string `json:"artist_name"`
				Audio    string `json:"audio"`
				Image    string `json:"image"`
				Duration int    `json:"duration"`
			} `json:"results"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&res); err == nil {
			mu.Lock()
			for _, t := range res.Results {
				allSongs = append(allSongs, models.Song{
					Title:    t.Name,
					Artist:   t.Artist,
					URL:      "/api/music/proxy/raw?url=" + url.QueryEscape(t.Audio),
					ImageURL: t.Image,
					Source:   "jamendo",
					Duration: t.Duration,
				})
			}
			mu.Unlock()
		}
	}()

	wg.Wait()
	c.JSON(http.StatusOK, allSongs)
}

func ProxyStream(c *gin.Context) {
	typeStr := c.Param("type")
	var finalStreamURL string

	switch typeStr {
	case "raw":
		finalStreamURL = c.Query("url")
	case "yt":
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing video ID"})
			return
		}
		var err error
		finalStreamURL, err = resolveYTStream(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Could not resolve stream"})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown type"})
		return
	}

	if finalStreamURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Empty URL"})
		return
	}

	client := &http.Client{Timeout: 30 * time.Minute}
	req, _ := http.NewRequest("GET", finalStreamURL, nil)
	req.Header.Set("User-Agent", userAgent)
	if r := c.GetHeader("Range"); r != "" {
		req.Header.Set("Range", r)
	}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Stream failed"})
		return
	}
	defer resp.Body.Close()

	c.Writer.Header().Set("Accept-Ranges", "bytes")
	ct := resp.Header.Get("Content-Type")
	if ct == "" || ct == "application/octet-stream" {
		ct = "audio/mpeg"
	}
	c.Writer.Header().Set("Content-Type", ct)
	if h := resp.Header.Get("Content-Length"); h != "" {
		c.Writer.Header().Set("Content-Length", h)
	}
	if h := resp.Header.Get("Content-Range"); h != "" {
		c.Writer.Header().Set("Content-Range", h)
	}
	c.Writer.WriteHeader(resp.StatusCode)
	io.Copy(c.Writer, resp.Body)
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
