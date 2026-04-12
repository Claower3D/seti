package models

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"uniqueIndex;not null" json:"username"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `json:"-"`
	Bio       string         `json:"bio"`
	Avatar    string         `json:"avatar"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Posts     []Post         `json:"posts,omitempty"`
	Friends   []User         `gorm:"many2many:friendships;" json:"friends,omitempty"`
}

type Friendship struct {
	ID        uint `gorm:"primaryKey"`
	UserID    uint `gorm:"not null"`
	FriendID  uint `gorm:"not null"`
	Status    string `gorm:"default:'pending'"` // 'pending', 'accepted'
	CreatedAt time.Time
}

type Message struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SenderID   uint      `json:"senderId"`
	ReceiverID uint      `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}

type Post struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Content   string         `gorm:"not null" json:"content"`
	UserID    uint           `json:"userId"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ImageURL  string         `json:"imageUrl"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Comments  []Comment      `json:"comments,omitempty"`
}

type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Content   string         `gorm:"not null" json:"content"`
	UserID    uint           `json:"userId"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PostID    uint           `json:"postId"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
