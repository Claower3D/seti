package main

import (
	"log"
	"net/http"
	"os"
	"social-network/internal/db"
	"social-network/internal/handlers"
	"social-network/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	db.InitDB()
	handlers.InitFCM()

	r := gin.Default()
	r.Static("/uploads", "./uploads")

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/users/search", handlers.SearchUsers)
			protected.GET("/me", handlers.GetMe)
			protected.DELETE("/me", handlers.DeleteAccount)
			protected.GET("/stories", handlers.GetStories)
			protected.POST("/stories", handlers.CreateStory)
			protected.DELETE("/stories/:id", handlers.DeleteStory)
			protected.GET("/posts", handlers.GetPosts)
			protected.POST("/posts", handlers.CreatePost)
			protected.DELETE("/posts/:id", handlers.DeletePost)
			protected.PATCH("/posts/:id", handlers.UpdatePost)
			protected.POST("/posts/:id/like", handlers.LikePost)
			protected.GET("/posts/:id/comments", handlers.GetPostComments)
			protected.POST("/posts/:id/comments", handlers.CreatePostComment)

			protected.GET("/profile/:username", handlers.GetUserProfile)
			protected.GET("/profile/:username/friends", handlers.GetUserFriends)
			protected.GET("/profile/:username/followers", handlers.GetUserFollowers)
			protected.GET("/profile/:username/following", handlers.GetUserFollowing)
			protected.PUT("/profile", handlers.UpdateProfile)
			protected.PUT("/security", handlers.UpdateSecurity)

			protected.GET("/friends/requests", handlers.GetFriendRequests)
			protected.GET("/friends", handlers.GetFriends)
			protected.POST("/friends/request/:id", handlers.SendFriendRequest)
			protected.POST("/friends/accept/:id", handlers.AcceptFriendRequest)
			protected.DELETE("/friends/request/:id", handlers.DeclineFriendRequest)
			protected.DELETE("/friends/:id", handlers.RemoveFriend)

			protected.POST("/upload", handlers.UploadFile)
			protected.GET("/groups", handlers.GetGroups)
			protected.POST("/groups", handlers.CreateGroup)
			protected.GET("/groups/search", handlers.SearchGroups)
			protected.GET("/groups/:id", handlers.GetGroup)
			protected.POST("/groups/:id/join", handlers.JoinGroup)
			protected.POST("/groups/:id/leave", handlers.LeaveGroup)
			protected.GET("/groups/:id/messages", handlers.GetGroupMessages)
			protected.GET("/groups/:id/posts", handlers.GetGroupPosts)
			protected.POST("/groups/:id/posts", handlers.CreateGroupPost)
			protected.POST("/groups/:id/members", handlers.AddGroupMembers)
			protected.PUT("/groups/:id", handlers.UpdateGroup)
			protected.GET("/messages/media", handlers.GetChatMedia)
			protected.GET("/messages/:otherId", handlers.GetMessages)
			protected.GET("/messages/unread-count", handlers.GetUnreadMessageCount)
			protected.POST("/messages", handlers.CreateMessage)
			protected.POST("/conversations/archive", handlers.ArchiveConversation)
			protected.GET("/waves", handlers.GetWaves)
			protected.POST("/waves", handlers.CreateWave)
			protected.POST("/waves/:id/like", handlers.LikeWave)
			protected.GET("/waves/:id/comments", handlers.GetWaveComments)
			protected.POST("/waves/:id/comments", handlers.CreateWaveComment)
			protected.DELETE("/waves/:id", handlers.DeleteWave)

			protected.POST("/fcm-token", handlers.RegisterFCMToken)
			protected.GET("/notifications", handlers.GetNotifications)
			protected.POST("/notifications/:id/read", handlers.MarkNotificationRead)

			// Music
			protected.GET("/music/search", handlers.SearchMusic)
			protected.GET("/music/my", handlers.GetMyMusic)
			protected.POST("/music/my", handlers.AddToMyMusic)
			protected.DELETE("/music/my/:id", handlers.RemoveFromMyMusic)
		}
	}

	r.GET("/ws", handlers.WebSocketHandler)
	r.StaticFile("/logo.png", "./frontend/dist/logo.png")
	r.StaticFS("/assets", http.Dir("./frontend/dist/assets"))
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if _, err := os.Stat("./frontend/dist" + path); err == nil && path != "/" {
			c.File("./frontend/dist" + path)
			return
		}
		c.File("./frontend/dist/index.html")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
