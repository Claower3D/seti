package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

func GetWaves(c *gin.Context) {
	userID, _ := c.Get("userId")
	var waves []models.Wave

	if err := db.DB.Preload("User").Order("created_at desc").Find(&waves).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch waves"})
		return
	}

	// Mark liked waves
	uid := userID.(uint)
	for i := range waves {
		var like models.WaveLike
		if db.DB.Where("user_id = ? AND wave_id = ?", uid, waves[i].ID).First(&like).Error == nil {
			waves[i].Liked = true
		}
	}

	c.JSON(http.StatusOK, waves)
}

type CreateWaveInput struct {
	VideoURL    string `json:"videoUrl" binding:"required"`
	Description string `json:"description"`
}

func CreateWave(c *gin.Context) {
	var input CreateWaveInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")
	wave := models.Wave{
		VideoURL:    input.VideoURL,
		Description: input.Description,
		UserID:      userID.(uint),
	}

	if err := db.DB.Create(&wave).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wave"})
		return
	}

	db.DB.Preload("User").First(&wave, wave.ID)
	c.JSON(http.StatusCreated, wave)
}

func LikeWave(c *gin.Context) {
	userID, _ := c.Get("userId")
	waveID := c.Param("id")

	var like models.WaveLike
	if db.DB.Where("user_id = ? AND wave_id = ?", userID, waveID).First(&like).Error == nil {
		// Unlike
		db.DB.Delete(&like)
		db.DB.Model(&models.Wave{}).Where("id = ?", waveID).UpdateColumn("likes_count", db.DB.Raw("likes_count - 1"))
	} else {
		// Like
		var waveIDUint uint
		db.DB.Raw("SELECT id FROM waves WHERE id = ?", waveID).Scan(&waveIDUint)
		like = models.WaveLike{UserID: userID.(uint), WaveID: waveIDUint}
		db.DB.Create(&like)
		db.DB.Model(&models.Wave{}).Where("id = ?", waveID).UpdateColumn("likes_count", db.DB.Raw("likes_count + 1"))
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
