package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreatePostInput struct {
	Content  string `json:"content" binding:"required"`
	ImageURL string `json:"imageUrl"`
}

func GetPosts(c *gin.Context) {
	posts := []models.Post{}
	if err := db.DB.Preload("User").Order("created_at desc").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func CreatePost(c *gin.Context) {
	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")
	post := models.Post{
		Content:  input.Content,
		ImageURL: input.ImageURL,
		UserID:   userID.(uint),
	}

	if err := db.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	// Preload user for the response
	db.DB.Preload("User").First(&post, post.ID)

	c.JSON(http.StatusCreated, post)
}

type UpdateProfileInput struct {
	Bio    string `json:"bio"`
	Avatar string `json:"avatar"`
}

func UpdateProfile(c *gin.Context) {
	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update fields
	if input.Bio != "" {
		user.Bio = input.Bio
	}
	if input.Avatar != "" {
		user.Avatar = input.Avatar
	}

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func GetUserProfile(c *gin.Context) {
	username := c.Param("username")
	var user models.User
	if err := db.DB.Preload("Posts", func(db *gorm.DB) *gorm.DB { return db.Order("created_at desc") }).Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}
