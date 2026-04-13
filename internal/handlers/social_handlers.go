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
postID := c.Param("id")
userID, _ := c.Get("userId")
var post models.Post
if err := db.DB.First(&post, postID).Error; err != nil {
c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
return
}
if post.UserID != userID.(uint) {
c.JSON(http.StatusForbidden, gin.H{"error": "Not your post"})
return
}
db.DB.Delete(&post)
c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func UpdatePost(c *gin.Context) {
postID := c.Param("id")
userID, _ := c.Get("userId")
var post models.Post
if err := db.DB.First(&post, postID).Error; err != nil {
c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
return
}
if post.UserID != userID.(uint) {
c.JSON(http.StatusForbidden, gin.H{"error": "Not your post"})
return
}
var input struct {
Content string `json:"content"`
}
c.ShouldBindJSON(&input)
if input.Content != "" {
post.Content = input.Content
}
db.DB.Save(&post)
db.DB.Preload("User").First(&post, post.ID)
c.JSON(http.StatusOK, post)
}

func LikePost(c *gin.Context) {
postID := c.Param("id")
userID, _ := c.Get("userId")
var like models.Like
err := db.DB.Where("post_id = ? AND user_id = ?", postID, userID).First(&like).Error
if err != nil {
db.DB.Create(&models.Like{PostID: parseUint(postID), UserID: userID.(uint)})
} else {
db.DB.Delete(&like)
}
var count int64
db.DB.Model(&models.Like{}).Where("post_id = ?", postID).Count(&count)
c.JSON(http.StatusOK, gin.H{"likesCount": count})
}

func parseUint(s string) uint {
var n uint64
for _, c := range s {
if c >= '0' && c <= '9' {
n = n*10 + uint64(c-'0')
}
}
return uint(n)
}
