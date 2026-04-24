package handlers

import (
	"net/http"
	"strconv"
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
		MemberIDs   []uint `json:"memberIds"`
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
	for _, mid := range input.MemberIDs {
		if mid != userID.(uint) {
			db.DB.Create(&models.GroupMember{GroupID: group.ID, UserID: mid, Role: "member"})
		}
	}
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
		
		// Map archived status from members to groups
		memberMap := make(map[uint]bool)
		for _, m := range members {
			memberMap[m.GroupID] = m.IsArchived
		}
		for i := range groups {
			groups[i].IsArchived = memberMap[groups[i].ID]
		}
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
	db.DB.Preload("Sender").Where("group_id = ?", groupID).Order("created_at asc").Find(&messages)
	if messages == nil {
		messages = []models.Message{}
	}
	c.JSON(http.StatusOK, messages)
}

func AddGroupMembers(c *gin.Context) {
	groupID := c.Param("id")
	var input struct {
		MemberIDs []uint `json:"memberIds" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, mid := range input.MemberIDs {
		// Check if already a member
		var existing models.GroupMember
		if err := db.DB.Where("group_id = ? AND user_id = ?", groupID, mid).First(&existing).Error; err != nil {
			db.DB.Create(&models.GroupMember{
				GroupID: parseUint(groupID),
				UserID:  mid,
				Role:    "member",
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Members added successfully"})
}

func parseUint(s string) uint {
	val, _ := strconv.ParseUint(s, 10, 32)
	return uint(val)
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

func UpdateGroup(c *gin.Context) {
	groupID := c.Param("id")
	userID, _ := c.Get("userId")

	var group models.Group
	if err := db.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	if group.OwnerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the owner can update group details"})
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Avatar      string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		group.Name = input.Name
	}
	group.Description = input.Description
	group.Avatar = input.Avatar

	if err := db.DB.Save(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update group"})
		return
	}

	c.JSON(http.StatusOK, group)
}

func GetGroupPosts(c *gin.Context) {
	groupID := c.Param("id")
	var posts []models.Post
	if err := db.DB.Preload("User").Preload("Group").Where("group_id = ?", groupID).Order("created_at desc").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group posts"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func CreateGroupPost(c *gin.Context) {
	groupID := c.Param("id")
	userID, _ := c.Get("userId")

	var input struct {
		Content   string `json:"content" binding:"required"`
		ImageURL  string `json:"imageUrl"`
		VideoURL  string `json:"videoUrl"`
		MediaType string `json:"mediaType"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gID := parseUint(groupID)
	post := models.Post{
		Content:   input.Content,
		ImageURL:  input.ImageURL,
		VideoURL:  input.VideoURL,
		MediaType: input.MediaType,
		UserID:    userID.(uint),
		GroupID:   &gID,
	}

	if err := db.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group post"})
		return
	}

	db.DB.Preload("User").Preload("Group").First(&post, post.ID)
	c.JSON(http.StatusCreated, post)
}
