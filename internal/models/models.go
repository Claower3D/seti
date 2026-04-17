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
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"not null"`
	FriendID  uint   `gorm:"not null"`
	Status    string `gorm:"default:'pending'"`
	CreatedAt time.Time
}

type Message struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SenderID   uint      `json:"senderId"`
	ReceiverID uint      `json:"receiverId"`
	GroupID    *uint     `json:"groupId,omitempty"`
	Content    string    `json:"content"`
	FileURL    string    `json:"fileUrl,omitempty"`
	FileType   string    `json:"fileType,omitempty"`
	FileName   string    `json:"fileName,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

type Group struct {
	ID          uint          `gorm:"primaryKey" json:"id"`
	Name        string        `gorm:"not null" json:"name"`
	Description string        `json:"description"`
	Avatar      string        `json:"avatar"`
	OwnerID     uint          `json:"ownerId"`
	Owner       User          `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Members     []GroupMember `json:"members,omitempty"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}

type GroupMember struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GroupID   uint      `gorm:"not null" json:"groupId"`
	UserID    uint      `gorm:"not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role      string    `gorm:"default:'member'" json:"role"`
	CreatedAt time.Time `json:"createdAt"`
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

type Story struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ImageURL  string    `json:"imageUrl"`
	CreatedAt time.Time `json:"createdAt"`
}
