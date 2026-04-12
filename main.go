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
	// Load .env if it exists
	_ = godotenv.Load()

	// Initialize Database
	db.InitDB()

	r := gin.Default()

	// CORS Middleware
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

	// API Routes
	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		// Protected Routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/users/search", handlers.SearchUsers)
protected.GET("/me", handlers.GetMe)
			protected.GET("/posts", handlers.GetPosts)
			protected.POST("/posts", handlers.CreatePost)
			// Profile
			protected.GET("/profile/:username", handlers.GetUserProfile)
			protected.PUT("/profile", handlers.UpdateProfile)

			// Friends
			protected.GET("/friends/requests", handlers.GetFriendRequests)
                        protected.GET("/friends", handlers.GetFriends)
			protected.POST("/friends/request/:id", handlers.SendFriendRequest)
			protected.POST("/friends/accept/:id", handlers.AcceptFriendRequest)

			// Messaging
			protected.GET("/messages/:otherId", handlers.GetMessages)
		}
	}

	// WebSocket
	r.GET("/ws", handlers.WebSocketHandler)

	// Serve Static Files (Frontend)
	r.StaticFS("/assets", http.Dir("./frontend/dist/assets"))
	r.NoRoute(func(c *gin.Context) {
		// Serve index.html for all other routes to support SPA routing
		c.File("./frontend/dist/index.html")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

