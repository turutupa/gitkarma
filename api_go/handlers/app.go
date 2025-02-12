package handlers

import (
	"github.com/gin-gonic/gin"
)

// rg == router group
var rg *gin.Engine = gin.New()

func NewApp() *gin.Engine {
	rg.Use(LoggerInterceptor())
	registerHandlers()
	return rg
}

func registerHandlers() {
	v1 := rg.Group("/v1")
	registration(v1)
	webhook(v1)
	accounts(v1)
	health(v1)
	users(v1)
}
