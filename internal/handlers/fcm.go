package handlers

import (
	"context"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

var fcmClient *messaging.Client

func InitFCM() {
	opt := option.WithCredentialsFile("./internal/firebase-key.json")
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Printf("FCM init error: %v", err)
		return
	}
	client, err := app.Messaging(context.Background())
	if err != nil {
		log.Printf("FCM messaging error: %v", err)
		return
	}
	fcmClient = client
	log.Println("FCM initialized successfully")
}

func SendPushNotification(token, title, body string) {
	if fcmClient == nil || token == "" {
		return
	}
	message := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Sound: "default",
			},
		},
	}
	_, err := fcmClient.Send(context.Background(), message)
	if err != nil {
		log.Printf("FCM send error: %v", err)
	}
}
