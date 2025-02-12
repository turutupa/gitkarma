package handlers

import (
	"fmt"
	"io"

	"github.com/gin-gonic/gin"
)

type PullRequestEvent struct {
	Action     string `json:"action"`
	Repository struct {
		FullName string `json:"full_name"`
	} `json:"repository"`
	PullRequest struct {
		Number int `json:"number"`
	} `json:"pull_request"`
}

func webhook(r *gin.RouterGroup) {
	r.POST("/webhook", func(c *gin.Context) {
		event, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(500, "Something went wrong reading body")
		}
		fmt.Println("")
		fmt.Println(string(event))
		fmt.Println("")
		c.JSON(200, string(event))
	})
}
