package handlers

import (
	"net/http"
	"social-network/internal/db"
	"social-network/internal/middleware"
	"social-network/internal/models"
	"github.com/gin-gonic/gin"
)

type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginInput struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := middleware.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username: input.Username,
		Email:    input.Email,
		Phone:    input.Phone,
		Password: hashedPassword,
		Avatar:   "https://api.dicebear.com/7.x/avataaars/svg?seed=" + input.Username,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пользователь уже существует или ошибка базы данных"})
		return
	}

	token, err := middleware.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user": user, "token": token})
}

func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("username = ? OR phone = ?", input.Identifier, input.Identifier).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные данные"})
		return
	}

	if !middleware.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные данные"})
		return
	}

	token, err := middleware.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "token": token})
}

func GetMe(c *gin.Context) {
	userID, _ := c.Get("userId")
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	db.DB.Model(&models.Friendship{}).Where("status = 'accepted' AND (user_id = ? OR friend_id = ?)", user.ID, user.ID).Count(&user.FriendsCount)
	db.DB.Model(&models.Friendship{}).Where("status = 'pending' AND friend_id = ?", user.ID).Count(&user.FollowersCount)
	db.DB.Model(&models.Friendship{}).Where("status = 'pending' AND user_id = ?", user.ID).Count(&user.FollowingCount)

	c.JSON(http.StatusOK, user)
}

func DeleteAccount(c *gin.Context) {
	userID, _ := c.Get("userId")
	
	if err := db.DB.Delete(&models.User{}, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true})
}
