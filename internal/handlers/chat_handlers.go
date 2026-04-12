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
			ReceiverID uint   `json:"receiverId"`
			Content    string `json:"content"`
		}

		if err := json.Unmarshal(message, &msgData); err != nil {
			continue
		}

		// Save to DB
		chatMsg := models.Message{
			SenderID:   userID,
			ReceiverID: msgData.ReceiverID,
			Content:    msgData.Content,
		}
		db.DB.Create(&chatMsg)

		// Send to receiver if online
		mu.Lock()
		if receiver, ok := clients[msgData.ReceiverID]; ok {
			receiver.Conn.WriteJSON(chatMsg)
		}
		// Echo back to sender
		if sender, ok := clients[userID]; ok {
			sender.Conn.WriteJSON(chatMsg)
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
