package handlers

import (
	"fmt"
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

func SendFriendRequest(c *gin.Context) {
	senderID, _ := c.Get("userId")
	receiverID := c.Param("id")

	var friendship models.Friendship
	if err := db.DB.Where("user_id = ? AND friend_id = ?", senderID, receiverID).First(&friendship).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request already exists"})
		return
	}

	var friendID uint
	fmt.Sscanf(receiverID, "%d", &friendID)

	friendship = models.Friendship{
		UserID:   senderID.(uint),
		FriendID: friendID,
		Status:   "pending",
	}

	if err := db.DB.Create(&friendship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request sent"})
}

func AcceptFriendRequest(c *gin.Context) {
	receiverID, _ := c.Get("userId")
	senderID := c.Param("id")

	if err := db.DB.Model(&models.Friendship{}).
		Where("user_id = ? AND friend_id = ?", senderID, receiverID).
		Update("status", "accepted").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted"})
}

func GetFriends(c *gin.Context) {
	userID, _ := c.Get("userId")
	friends := []models.User{}

	// Simplified: find accepted friendships where user is either sender or receiver
	db.DB.Raw(`
		SELECT u.* FROM users u
		JOIN friendships f ON (f.user_id = u.id OR f.friend_id = u.id)
		WHERE (f.user_id = ? OR f.friend_id = ?) 
		AND f.status = 'accepted'
		AND u.id != ?
	`, userID, userID, userID).Scan(&friends)

	c.JSON(http.StatusOK, friends)
}


func GetFriendRequests(c *gin.Context) {
	userID, _ := c.Get("userId")
	var friendships []models.Friendship
	db.DB.Where("friend_id = ? AND status = ?", userID, "pending").Find(&friendships)
	var users []models.User
	for _, f := range friendships {
		var u models.User
		db.DB.First(&u, f.UserID)
		users = append(users, u)
	}
	if users == nil {
		users = []models.User{}
	}
	c.JSON(http.StatusOK, users)
}
