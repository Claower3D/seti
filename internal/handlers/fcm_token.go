package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

func RegisterFCMToken(c *gin.Context) {
	userID, _ := c.Get("userId")

	var input struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.DB.Model(&models.User{}).Where("id = ?", userID).Update("fcm_token", input.Token)
	c.JSON(http.StatusOK, gin.H{"success": true})
}
