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

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
const scClientID = "1Gbi6DBGBMULQh8MuhNvl1HzL9AiX2Pa"

var (
	streamCache   = map[string]cachedStream{}
	streamCacheMu sync.RWMutex
)

type cachedStream struct {
	url       string
	expiresAt time.Time
}

func searchSoundCloud(query string) []models.Song {
	searchURL := fmt.Sprintf(
		"https://api-v2.soundcloud.com/search/tracks?q=%s&client_id=%s&limit=15&offset=0",
		url.QueryEscape(query), scClientID,
	)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", searchURL, nil)
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result struct {
		Collection []struct {
			ID         int    `json:"id"`
			Title      string `json:"title"`
			Duration   int    `json:"duration"`
			ArtworkURL string `json:"artwork_url"`
			StreamURL  string `json:"stream_url"`
			Permalink  string `json:"permalink_url"`
			User       struct {
				Username string `json:"username"`
			} `json:"user"`
			Media struct {
				Transcodings []struct {
					URL    string `json:"url"`
					Format struct {
						Protocol string `json:"protocol"`
						MimeType string `json:"mime_type"`
					} `json:"format"`
				} `json:"transcodings"`
			} `json:"media"`
		} `json:"collection"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil
	}

	var songs []models.Song
	for _, item := range result.Collection {
		if item.ID == 0 {
			continue
		}
		artwork := item.ArtworkURL
		if artwork == "" {
			artwork = "https://a-v2.sndcdn.com/assets/images/sc-icons/fluid-b4e7a64b8b.png"
		} else {
			artwork = strings.Replace(artwork, "large", "t500x500", 1)
		}
		songs = append(songs, models.Song{
			Title:    item.Title,
			Artist:   item.User.Username,
			URL:      fmt.Sprintf("/api/music/proxy/sc/%d", item.ID),
			ImageURL: artwork,
			Source:   "soundcloud",
			Duration: item.Duration / 1000,
		})
	}
	return songs
}

func resolveSCStream(id string) (string, error) {
	streamCacheMu.RLock()
	if cached, ok := streamCache[id]; ok && time.Now().Before(cached.expiresAt) {
		streamCacheMu.RUnlock()
		return cached.url, nil
	}
	streamCacheMu.RUnlock()

	// Получаем информацию о треке
	trackURL := fmt.Sprintf("https://api-v2.soundcloud.com/tracks/%s?client_id=%s", id, scClientID)
	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", trackURL, nil)
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("track fetch failed: %w", err)
	}
	defer resp.Body.Close()

	var track struct {
		Media struct {
			Transcodings []struct {
				URL    string `json:"url"`
				Format struct {
					Protocol string `json:"protocol"`
					MimeType string `json:"mime_type"`
				} `json:"format"`
			} `json:"transcodings"`
		} `json:"media"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&track); err != nil {
		return "", fmt.Errorf("decode failed: %w", err)
	}

	// Ищем progressive (прямой mp3) стрим
	var streamEndpoint string
	for _, t := range track.Media.Transcodings {
		if t.Format.Protocol == "progressive" {
			streamEndpoint = t.URL
			break
		}
	}
	// Fallback на первый доступный
	if streamEndpoint == "" && len(track.Media.Transcodings) > 0 {
		streamEndpoint = track.Media.Transcodings[0].URL
	}
	if streamEndpoint == "" {
		return "", fmt.Errorf("no transcodings found")
	}

	// Получаем финальный URL стрима
	streamReq := fmt.Sprintf("%s?client_id=%s", streamEndpoint, scClientID)
	resp2, err := client.Get(streamReq)
	if err != nil {
		return "", fmt.Errorf("stream resolve failed: %w", err)
	}
	defer resp2.Body.Close()

	var streamData struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(resp2.Body).Decode(&streamData); err != nil {
		return "", fmt.Errorf("stream decode failed: %w", err)
	}

	if streamData.URL == "" {
		return "", fmt.Errorf("empty stream url")
	}

	streamCacheMu.Lock()
	streamCache[id] = cachedStream{
		url:       streamData.URL,
		expiresAt: time.Now().Add(1 * time.Hour),
	}
	streamCacheMu.Unlock()

	return streamData.URL, nil
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

	// SoundCloud — основной источник
	wg.Add(1)
	go func() {
		defer wg.Done()
		songs := searchSoundCloud(query)
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
	case "sc":
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing track ID"})
			return
		}
		var err error
		finalStreamURL, err = resolveSCStream(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Could not resolve stream: " + err.Error()})
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
