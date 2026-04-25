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
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

// Updated Piped instances for 2024-2025 stability
var pipedMirrors = []string{
	"https://pipedapi.kavin.rocks",
	"https://pipedapi.tokhmi.pw",
	"https://api.piped.victr.me",
	"https://piped-api.garudalinux.org",
	"https://pipedapi.re-glass.com",
	"https://api-piped.mha.fi",
}

type ITunesResult struct {
	Results []struct {
		TrackName    string `json:"trackName"`
		ArtistName   string `json:"artistName"`
		PreviewUrl   string `json:"previewUrl"`
		ArtworkUrl100 string `json:"artworkUrl100"`
	} `json:"results"`
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

	// ENGINE 1: iTunes
	wg.Add(1)
	go func() {
		defer wg.Done()
		searchURL := fmt.Sprintf("https://itunes.apple.com/search?term=%s&entity=song&limit=15", url.QueryEscape(query))
		resp, err := http.Get(searchURL)
		if err != nil { return }
		defer resp.Body.Close()
		var res ITunesResult
		if err := json.NewDecoder(resp.Body).Decode(&res); err == nil {
			mu.Lock()
			for _, t := range res.Results {
				allSongs = append(allSongs, models.Song{
					Title: t.TrackName, Artist: t.ArtistName, URL: "/api/music/proxy/raw?url=" + url.QueryEscape(t.PreviewUrl), ImageURL: t.ArtworkUrl100, Source: "itunes",
				})
			}
			mu.Unlock()
		}
	}()

	// ENGINE 2: VK-style (Hitmo.me)
	wg.Add(1)
	go func() {
		defer wg.Done()
		searchURL := fmt.Sprintf("https://hitmo.me/search?q=%s", url.QueryEscape(query))
		client := &http.Client{Timeout: 8 * time.Second}
		req, _ := http.NewRequest("GET", searchURL, nil)
		req.Header.Set("User-Agent", userAgent)
		resp, err := client.Do(req)
		if err != nil { return }
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		html := string(body)

		titleRegex := regexp.MustCompile(`class="track__title"[^>]*>([^<]+)`)
		artistRegex := regexp.MustCompile(`class="track__artist"[^>]*>([^<]+)`)
		linkRegex := regexp.MustCompile(`track__info-l"[^>]*href="([^"]+)"`)

		titles := titleRegex.FindAllStringSubmatch(html, 15)
		artists := artistRegex.FindAllStringSubmatch(html, 15)
		links := linkRegex.FindAllStringSubmatch(html, 15)

		mu.Lock()
		for i := 0; i < len(links) && i < len(titles); i++ {
			artist := "Unknown Artist"
			if i < len(artists) { artist = strings.TrimSpace(artists[i][1]) }
			streamURL := links[i][1]
			if streamURL[0] == '/' { streamURL = "https://hitmo.me" + streamURL }
			allSongs = append(allSongs, models.Song{
				Title: strings.TrimSpace(titles[i][1]), Artist: artist, URL: "/api/music/proxy/raw?url=" + url.QueryEscape(streamURL), ImageURL: "https://hitmo.me/static/img/no-cover.png", Source: "vk-style",
			})
		}
		mu.Unlock()
	}()

	// ENGINE 3: YouTube Music
	wg.Add(1)
	go func() {
		defer wg.Done()
		for _, mirror := range pipedMirrors {
			searchURL := fmt.Sprintf("%s/search?q=%s&filter=music_songs", mirror, url.QueryEscape(query))
			client := &http.Client{Timeout: 5 * time.Second}
			resp, err := client.Get(searchURL)
			if err != nil || resp.StatusCode != 200 { continue }
			var res struct { Items []struct { Title string; UploaderName string; Url string; Thumbnail string } }
			if err := json.NewDecoder(resp.Body).Decode(&res); err == nil && len(res.Items) > 0 {
				mu.Lock()
				for _, item := range res.Items {
					u, _ := url.Parse(item.Url)
					id := u.Query().Get("v")
					if id == "" { id = strings.TrimPrefix(item.Url, "/watch?v=") }
					if id == "" { continue }
					allSongs = append(allSongs, models.Song{
						Title: item.Title, Artist: item.UploaderName, URL: fmt.Sprintf("/api/music/proxy/yt/%s", id), ImageURL: item.Thumbnail, Source: "youtube",
					})
				}
				mu.Unlock()
				resp.Body.Close()
				break
			}
			resp.Body.Close()
		}
	}()

	wg.Wait()
	c.JSON(http.StatusOK, allSongs)
}

func ProxyStream(c *gin.Context) {
	typeStr := c.Param("type")
	var finalStreamURL string

	if typeStr == "raw" {
		finalStreamURL = c.Query("url")
	} else if typeStr == "yt" {
		id := c.Param("id")
		resolved := false
		for _, inst := range pipedMirrors {
			client := &http.Client{Timeout: 5 * time.Second}
			resp, err := client.Get(fmt.Sprintf("%s/streams/%s", inst, id))
			if err != nil || resp.StatusCode != 200 { continue }
			var res struct { AudioStreams []struct { URL string `json:"url"` } `json:"audioStreams"` }
			if err := json.NewDecoder(resp.Body).Decode(&res); err == nil && len(res.AudioStreams) > 0 {
				finalStreamURL = res.AudioStreams[0].URL
				resp.Body.Close()
				resolved = true
				break
			}
			resp.Body.Close()
		}
		if !resolved {
			c.JSON(http.StatusNotFound, gin.H{"error": "Could not resolve stream"})
			return
		}
	}

	if finalStreamURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Empty URL"})
		return
	}

	client := &http.Client{Timeout: 30 * time.Minute}
	req, _ := http.NewRequest("GET", finalStreamURL, nil)
	req.Header.Set("User-Agent", userAgent)
	if strings.Contains(finalStreamURL, "hitmo.me") {
		req.Header.Set("Referer", "https://hitmo.me/")
	}
	if r := c.GetHeader("Range"); r != "" { req.Header.Set("Range", r) }

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed"})
		return
	}
	defer resp.Body.Close()

	c.Writer.Header().Set("Accept-Ranges", "bytes")
	ct := resp.Header.Get("Content-Type")
	if ct == "" || ct == "application/octet-stream" { ct = "audio/mpeg" }
	c.Writer.Header().Set("Content-Type", ct)
	if h := resp.Header.Get("Content-Length"); h != "" { c.Writer.Header().Set("Content-Length", h) }
	if h := resp.Header.Get("Content-Range"); h != "" { c.Writer.Header().Set("Content-Range", h) }

	c.Writer.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(c.Writer, resp.Body)
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
