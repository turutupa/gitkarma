package handlers

import (
	"gitkarma/be/db"
	log "gitkarma/be/logger"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func accounts(r *gin.RouterGroup) {
	r.GET("/accounts/:id", func(c *gin.Context) {
		// Extract account ID from URL parameters
		idStr := c.Param("id")
		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid account ID format."})
			return
		}
		account := db.GetAccountById(id)
		if account.Error != nil {

		}
		c.JSON(200, account.Data)
	})

	type AccountDTO struct {
		ID uint64 `json:"id" validate:"required"`
	}

	r.POST("/accounts", func(c *gin.Context) {
		var accountDto AccountDTO
		if err := c.BindJSON(&accountDto); err != nil {
			log.Error("Error binding JSON:", zap.Error(err))
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}
		account := db.CreateAccount(accountDto.ID)
		if account.Error != nil {
			c.JSON(500, gin.H{"error": account.Error})
			return
		}
		c.JSON(200, account.Data)
	})

}
