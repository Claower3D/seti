package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
)

func CreateGroup(c *gin.Context) {
	userID, _ := c.Get("userId")
	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Avatar      string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	group := models.Group{
		Name:        input.Name,
		Description: input.Description,
		Avatar:      input.Avatar,
		OwnerID:     userID.(uint),
	}
	if err := db.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group"})
		return
	}
	db.DB.Create(&models.GroupMember{GroupID: group.ID, UserID: userID.(uint), Role: "owner"})
	db.DB.Preload("Owner").Preload("Members.User").First(&group, group.ID)
	c.JSON(http.StatusCreated, group)
}

func GetGroups(c *gin.Context) {
	userID, _ := c.Get("userId")
	var members []models.GroupMember
	db.DB.Where("user_id = ?", userID).Find(&members)
	var groupIDs []uint
	for _, m := range members {
		groupIDs = append(groupIDs, m.GroupID)
	}
	var groups []models.Group
	if len(groupIDs) > 0 {
		db.DB.Preload("Owner").Preload("Members.User").Where("id IN ?", groupIDs).Find(&groups)
	}
	if groups == nil {
		groups = []models.Group{}
	}
	c.JSON(http.StatusOK, groups)
}

func GetGroup(c *gin.Context) {
	id := c.Param("id")
	var group models.Group
	if err := db.DB.Preload("Owner").Preload("Members.User").First(&group, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}
	c.JSON(http.StatusOK, group)
}

func JoinGroup(c *gin.Context) {
	userID, _ := c.Get("userId")
	groupID := c.Param("id")
	var existing models.GroupMember
	if err := db.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already a member"})
		return
	}
	var group models.Group
	if err := db.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}
	db.DB.Create(&models.GroupMember{GroupID: group.ID, UserID: userID.(uint), Role: "member"})
	c.JSON(http.StatusOK, gin.H{"message": "Joined group"})
}

func LeaveGroup(c *gin.Context) {
	userID, _ := c.Get("userId")
	groupID := c.Param("id")
	db.DB.Where("group_id = ? AND user_id = ?", groupID, userID).Delete(&models.GroupMember{})
	c.JSON(http.StatusOK, gin.H{"message": "Left group"})
}

func GetGroupMessages(c *gin.Context) {
	groupID := c.Param("id")
	var messages []models.Message
	db.DB.Where("group_id = ?", groupID).Order("created_at asc").Find(&messages)
	if messages == nil {
		messages = []models.Message{}
	}
	c.JSON(http.StatusOK, messages)
}

func SearchGroups(c *gin.Context) {
	q := c.Query("q")
	var groups []models.Group
	db.DB.Preload("Owner").Where("name LIKE ?", "%"+q+"%").Limit(20).Find(&groups)
	if groups == nil {
		groups = []models.Group{}
	}
	c.JSON(http.StatusOK, groups)
}
