package handlers

import "github.com/gin-gonic/gin"

func registration(r *gin.RouterGroup) {
	r.GET("/callback", func(c *gin.Context) {
		c.JSON(200, "App authorized!")
	})
}
