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
		} else {
			chatMsg = models.Message{
				SenderID:   userID,
				ReceiverID: msgData.ReceiverID,
				Content:    msgData.Content,
				FileURL:    msgData.FileURL,
				FileName:   msgData.FileName,
				FileType:   msgData.FileType,
			}
			db.DB.Create(&chatMsg)
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

	messages := []models.Message{}
	db.DB.Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)", 
		userID, otherUserID, otherUserID, userID).
		Order("created_at asc").
		Find(&messages)

	c.JSON(http.StatusOK, messages)
}
