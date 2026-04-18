package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"social-network/internal/db"
	"social-network/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true 
	},
}

type Client struct {
	ID   uint
	Conn *websocket.Conn
}

var clients = make(map[uint]*Client)
var mu sync.Mutex

func WebSocketHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket: %v", err)
		return
	}

	userIDStr := c.Query("userId")
	var userID uint
	fmt.Sscanf(userIDStr, "%d", &userID)

	if userID == 0 {
		conn.Close()
		return
	}

	client := &Client{ID: userID, Conn: conn}
	
	mu.Lock()
	clients[userID] = client
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(clients, userID)
		mu.Unlock()
		conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msgData struct {
			Action     string `json:"action"`
			MessageID  uint   `json:"messageId"`
			ReceiverID uint   `json:"receiverId"`
			Content    string `json:"content"`
			FileURL    string `json:"fileUrl"`
			FileName   string `json:"fileName"`
			FileType   string `json:"fileType"`
			ReplyStoryURL string `json:"replyStoryUrl"`
		}

		if err := json.Unmarshal(message, &msgData); err != nil {
			continue
		}

		if msgData.Action == "" {
			msgData.Action = "send"
		}

		var chatMsg models.Message

		if msgData.Action == "delete" {
			if err := db.DB.Where("id = ? AND sender_id = ?", msgData.MessageID, userID).First(&chatMsg).Error; err == nil {
				db.DB.Delete(&chatMsg)
			} else {
				continue
			}
		} else if msgData.Action == "edit" {
			if err := db.DB.Where("id = ? AND sender_id = ?", msgData.MessageID, userID).First(&chatMsg).Error; err == nil {
				chatMsg.Content = msgData.Content
				db.DB.Save(&chatMsg)
			} else {
				continue
			}
		} else if msgData.Action == "read" {
			// Mark all messages from sender to receiver as read
			db.DB.Model(&models.Message{}).
				Where("receiver_id = ? AND sender_id = ? AND is_read = ?", userID, msgData.ReceiverID, false).
				Update("is_read", true)
			
			// Broadcast read receipt to the original sender
			mu.Lock()
			if sender, ok := clients[msgData.ReceiverID]; ok {
				sender.Conn.WriteJSON(map[string]interface{}{
					"action": "read_receipt",
					"senderId": userID,
				})
			}
			mu.Unlock()
			continue
		} else {
			chatMsg = models.Message{
				SenderID:   userID,
				ReceiverID: msgData.ReceiverID,
				Content:    msgData.Content,
				FileURL:    msgData.FileURL,
				FileName:   msgData.FileName,
				FileType:   msgData.FileType,
				ReplyStoryURL: msgData.ReplyStoryURL,
			}
			db.DB.Create(&chatMsg)
                        // Send push notification
                        var receiver models.User
                        db.DB.First(&receiver, msgData.ReceiverID)
                        if receiver.FCMToken != "" {
                                var sender models.User
                                db.DB.First(&sender, userID)
                                go SendPushNotification(receiver.FCMToken, sender.Username, msgData.Content)
                        }
			// Preload sender info for notifications
			db.DB.Preload("Sender").First(&chatMsg, chatMsg.ID)
		}

		outData := map[string]interface{}{
			"action":  msgData.Action,
			"message": chatMsg,
		}

		mu.Lock()
		if receiver, ok := clients[chatMsg.ReceiverID]; ok {
			receiver.Conn.WriteJSON(outData)
		}
		if sender, ok := clients[chatMsg.SenderID]; ok {
			sender.Conn.WriteJSON(outData)
		}
		mu.Unlock()
	}
}

func GetMessages(c *gin.Context) {
	userID, _ := c.Get("userId")
	otherUserID := c.Param("otherId")

	// Mark messages from other user as read
	db.DB.Model(&models.Message{}).
		Where("receiver_id = ? AND sender_id = ? AND is_read = ?", userID, otherUserID, false).
		Update("is_read", true)

	messages := []models.Message{}
	db.DB.Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)", 
		userID, otherUserID, otherUserID, userID).
		Order("created_at asc").
		Find(&messages)

	c.JSON(http.StatusOK, messages)
}

func CreateMessage(c *gin.Context) {
	var input struct {
		ReceiverID    uint   `json:"receiverId" binding:"required"`
		Content       string `json:"content"`
		ReplyStoryURL string `json:"replyStoryUrl"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")
	msg := models.Message{
		SenderID:      userID.(uint),
		ReceiverID:    input.ReceiverID,
		Content:       input.Content,
		ReplyStoryURL: input.ReplyStoryURL,
	}

	if err := db.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save message"})
		return
	}

	c.JSON(http.StatusCreated, msg)
}

func GetUnreadMessageCount(c *gin.Context) {
	userID, _ := c.Get("userId")
	var count int64
	db.DB.Model(&models.Message{}).Where("receiver_id = ? AND is_read = ?", userID, false).Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}
