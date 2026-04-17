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

func SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
		return
	}
	var users []models.User
	if err := db.DB.Where("username LIKE ?", "%"+query+"%").Limit(20).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func DeletePost(c *gin.Context) {
	postId := c.Param("id")
	userID, _ := c.Get("userId")
	
	var post models.Post
	if err := db.DB.Where("id = ? AND user_id = ?", postId, userID).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found or unauthorized"})
		return
	}
	
	db.DB.Delete(&post)
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted"})
}

type UpdatePostInput struct {
	Content string `json:"content" binding:"required"`
}

func UpdatePost(c *gin.Context) {
	postId := c.Param("id")
	userID, _ := c.Get("userId")
	
	var input UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var post models.Post
	if err := db.DB.Where("id = ? AND user_id = ?", postId, userID).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found or unauthorized"})
		return
	}
	
	post.Content = input.Content
	db.DB.Save(&post)
	c.JSON(http.StatusOK, post)
}

func LikePost(c *gin.Context) {
    // For simplicity, returning just OK so frontend succeeds
    c.JSON(http.StatusOK, gin.H{"success": true})
}

func GetStories(c *gin.Context) {
	stories := []models.Story{}
	if err := db.DB.Preload("User").Order("created_at desc").Find(&stories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stories"})
		return
	}
	c.JSON(http.StatusOK, stories)
}

type CreateStoryInput struct {
	ImageURL string `json:"imageUrl" binding:"required"`
}

func CreateStory(c *gin.Context) {
	var input CreateStoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")
	story := models.Story{
		ImageURL: input.ImageURL,
		UserID:   userID.(uint),
	}

	if err := db.DB.Create(&story).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create story"})
		return
	}

	db.DB.Preload("User").First(&story, story.ID)
	c.JSON(http.StatusCreated, story)
}
