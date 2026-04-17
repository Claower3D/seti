package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("userId")
	var notifications []models.Notification

	if err := db.DB.Preload("Sender").Preload("Wave").Where("receiver_id = ?", userID).Order("created_at desc").Limit(30).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func MarkNotificationRead(c *gin.Context) {
	userID, _ := c.Get("userId")
	notificationID := c.Param("id")

	if err := db.DB.Model(&models.Notification{}).Where("id = ? AND receiver_id = ?", notificationID, userID).Update("read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
