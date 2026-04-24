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
	receiverIDStr := c.Param("id")

	var rid uint
	fmt.Sscanf(receiverIDStr, "%d", &rid)

	if senderID.(uint) == rid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot follow yourself"})
		return
	}

	// Check if already friends or already following
	var friendship models.Friendship
	if err := db.DB.Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", senderID, rid, rid, senderID).First(&friendship).Error; err == nil {
		if friendship.Status == "accepted" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You are already friends"})
			return
		}
		if friendship.UserID == senderID.(uint) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You are already following this user"})
			return
		}
		
		// If WE are the receiver of an existing request, and we just sent one -> AUTOMATIC ACCEPT
		friendship.Status = "accepted"
		db.DB.Save(&friendship)
		c.JSON(http.StatusOK, gin.H{"message": "Mutual follow! You are now friends", "status": "accepted"})
		return
	}

	// Normal case: Start following
	friendship = models.Friendship{
		UserID:   senderID.(uint),
		FriendID: rid,
		Status:   "pending",
	}

	if err := db.DB.Create(&friendship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "You are now following this user", "status": "pending"})
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

func DeclineFriendRequest(c *gin.Context) {
receiverID, _ := c.Get("userId")
senderID := c.Param("id")

if err := db.DB.Where("user_id = ? AND friend_id = ? AND status = ?", senderID, receiverID, "pending").
Delete(&models.Friendship{}).Error; err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decline request"})
return
}

c.JSON(http.StatusOK, gin.H{"message": "Friend request declined"})
}

func RemoveFriend(c *gin.Context) {
	userID, _ := c.Get("userId")
	friendID := c.Param("id")

	var fid uint
	fmt.Sscanf(friendID, "%d", &fid)

	db.DB.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		userID, fid, fid, userID,
	).Delete(&models.Friendship{})

	c.JSON(http.StatusOK, gin.H{"message": "Friend removed"})
}

func GetFriends(c *gin.Context) {
userID, _ := c.Get("userId")
friends := []models.User{}

db.DB.Raw(`
    SELECT u.*, 
    CASE 
        WHEN f.user_id = ? THEN f.is_archived_by_sender 
        ELSE f.is_archived_by_receiver 
    END AS is_archived
    FROM users u
    JOIN friendships f ON (f.user_id = u.id OR f.friend_id = u.id)
    WHERE (f.user_id = ? OR f.friend_id = ?)
    AND f.status = 'accepted'
    AND u.id != ?
    AND u.deleted_at IS NULL
    `, userID, userID, userID, userID).Scan(&friends)

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
