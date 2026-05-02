package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Check for Cloudinary configuration
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL != "" {
		// Initialize Cloudinary
		cld, err := cloudinary.NewFromURL(cloudinaryURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloudinary configuration error"})
			return
		}

		// Open uploaded file
		fileContent, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
			return
		}
		defer fileContent.Close()

		// Upload to Cloudinary
		ctx := context.Background()
		uploadResult, err := cld.Upload.Upload(ctx, fileContent, uploader.UploadParams{
			Folder: "seti",
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloudinary upload failed: " + err.Error()})
			return
		}

		// Return Cloudinary URL
		c.JSON(http.StatusOK, gin.H{
			"url":      uploadResult.SecureURL,
			"fileName": file.Filename,
			"fileType": file.Header.Get("Content-Type"),
		})
		return
	}

	// FALLBACK: Local storage (will be lost on Railway updates)
	ext := filepath.Ext(file.Filename)
	newName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := "./uploads/" + newName

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file locally"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      "/uploads/" + newName,
		"fileName": file.Filename,
		"fileType": file.Header.Get("Content-Type"),
	})
}
