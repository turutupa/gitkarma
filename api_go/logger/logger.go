// logger/logger.go
package logger

import (
	"sync"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	log  *zap.Logger
	once sync.Once
)

// InitLogger initializes the logger instance.
func InitLogger() {
	once.Do(func() {
		config := zap.NewProductionConfig()
		config.Encoding = "json" // or "console" for human-readable output
		config.EncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

		// Create the logger with caller information and skip
		logger, err := config.Build(zap.AddCaller(), zap.AddCallerSkip(1)) // Skip 1 frame for the wrapper
		if err != nil {
			panic(err)
		}
		log = logger
	})
}

// Info logs an informational message.
func Info(msg string, fields ...zap.Field) {
	getLogger().Info(msg, fields...)
}

// Warn logs a warning message.
func Warn(msg string, fields ...zap.Field) {
	getLogger().Warn(msg, fields...)
}

// Error logs an error message.
func Error(msg string, fields ...zap.Field) {
	getLogger().Error(msg, fields...)
}

// Fatal logs a fatal message and exits the application.
func Fatal(msg string, fields ...zap.Field) {
	getLogger().Fatal(msg, fields...)
}

// getLogger returns the initialized logger instance.
func getLogger() *zap.Logger {
	if log == nil {
		InitLogger()
	}
	return log
}

// SyncLogger flushes any buffered log entries.
func SyncLogger() {
	if log != nil {
		_ = log.Sync()
	}
}
