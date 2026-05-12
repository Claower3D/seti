package db

import (
	"fmt"
	"log"
	"os"
	"social-network/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	var db *gorm.DB
	var err error

	if dsn != "" {
		fmt.Println("Connecting to PostgreSQL...")
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	} else {
		dataDir := os.Getenv("DATA_DIR")
		if dataDir == "" {
			dataDir = "."
		}
		dbPath := dataDir + "/social_network.db"
		fmt.Printf("No DATABASE_URL found, falling back to local SQLite (%s)\n", dbPath)
		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	}

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Connected to database successfully")

	// Auto Migration
	err = db.AutoMigrate(&models.User{}, &models.Post{}, &models.Comment{}, &models.Friendship{}, &models.Message{}, &models.Group{}, &models.GroupMember{}, &models.Story{}, &models.Wave{}, &models.WaveLike{}, &models.WaveComment{}, &models.Notification{}, &models.PostLike{}, &models.Song{}, &models.UserSong{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	DB = db
}


