package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreatePostInput struct {
	Content   string `json:"content" binding:"required"`
	ImageURL  string `json:"imageUrl"`
	VideoURL  string `json:"videoUrl"`
	MediaType string `json:"mediaType"`
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
		Content:   input.Content,
		ImageURL:  input.ImageURL,
		VideoURL:  input.VideoURL,
		MediaType: input.MediaType,
		UserID:    userID.(uint),
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
	if err := db.DB.Preload("Posts.User").
		Preload("Waves.User").
		Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func GetUserFriends(c *gin.Context) {
	username := c.Param("username")
	var user models.User
	if err := db.DB.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	friends := []models.User{}
	db.DB.Raw(`
		SELECT u.* FROM users u
		JOIN friendships f ON (f.user_id = u.id OR f.friend_id = u.id)
		WHERE (f.user_id = ? OR f.friend_id = ?)
		AND f.status = 'accepted'
		AND u.id != ?
		AND u.deleted_at IS NULL
	`, user.ID, user.ID, user.ID).Scan(&friends)

	c.JSON(http.StatusOK, friends)
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
	userID, _ := c.Get("userId")
	postID := c.Param("id")

	var like models.PostLike
	if err := db.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&like).Error; err == nil {
		// Unlike
		db.DB.Delete(&like)
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("likes_count", db.DB.Raw("likes_count - 1"))
	} else {
		// Like
		var post models.Post
		if err := db.DB.First(&post, postID).Error; err == nil {
			like = models.PostLike{UserID: userID.(uint), PostID: post.ID}
			db.DB.Create(&like)
			db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("likes_count", db.DB.Raw("likes_count + 1"))

			// Notify owner
			if post.UserID != userID.(uint) {
				db.DB.Create(&models.Notification{
					ReceiverID: post.UserID,
					SenderID:   userID.(uint),
					Type:       "like",
					PostID:     post.ID,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func GetPostComments(c *gin.Context) {
	postID := c.Param("id")
	var comments []models.Comment
	if err := db.DB.Preload("User").Where("post_id = ?", postID).Order("created_at asc").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	c.JSON(http.StatusOK, comments)
}

func CreatePostComment(c *gin.Context) {
	postID := c.Param("id")
	userID, _ := c.Get("userId")

	var input struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var pID uint
	db.DB.Raw("SELECT id FROM posts WHERE id = ?", postID).Scan(&pID)

	comment := models.Comment{
		UserID:  userID.(uint),
		PostID:  pID,
		Content: input.Content,
	}

	if err := db.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	// Update comments count (if we add the field to model later, for now we can just count)
	
	// Notify owner
	var post models.Post
	if err := db.DB.First(&post, postID).Error; err == nil && post.UserID != userID.(uint) {
		db.DB.Create(&models.Notification{
			ReceiverID: post.UserID,
			SenderID:   userID.(uint),
			Type:       "comment",
			PostID:     post.ID,
			Content:    input.Content,
		})
	}

	db.DB.Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}


func GetStories(c *gin.Context) {
	stories := []models.Story{}
	userID, _ := c.Get("userId")

	// Get friend IDs
	var friendIDs []uint
	db.DB.Raw(`
		SELECT user_id FROM friendships WHERE friend_id = ? AND status = 'accepted'
		UNION
		SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted'
	`, userID, userID).Scan(&friendIDs)

	// Include current user
	allowedIDs := append(friendIDs, userID.(uint))

	if err := db.DB.Preload("User").Where("user_id IN (?)", allowedIDs).Order("created_at desc").Find(&stories).Error; err != nil {
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
