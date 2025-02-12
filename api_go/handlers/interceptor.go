package handlers

import (
	"bytes"
	"gitkarma/be/logger"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func LoggerInterceptor() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Read the body
		var bodyBytes []byte
		if c.Request.Body != nil {
			bodyBytes, _ = io.ReadAll(c.Request.Body)
		}

		// Restore the body to its original state
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Process the request
		c.Next()

		// Log details after processing the request
		duration := time.Since(start)
		logger.Info(
			"HTTP request",
			zap.String("method", c.Request.Method),
			zap.String("endpoint", c.Request.RequestURI),
			zap.ByteString("body", bodyBytes),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("duration", duration),
		)
	}
}
