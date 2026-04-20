package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	ext := filepath.Ext(file.Filename)
	newName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := "./uploads/" + newName

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Smart mimetype detection
	contentType := file.Header.Get("Content-Type")
	f, err := file.Open()
	if err == nil {
		defer f.Close()
		buffer := make([]byte, 512)
		if _, err := f.Read(buffer); err == nil {
			detected := http.DetectContentType(buffer)
			if detected != "application/octet-stream" {
				contentType = detected
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      "/uploads/" + newName,
		"fileName": file.Filename,
		"fileType": contentType,
	})
}
