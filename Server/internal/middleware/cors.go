package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(origins string) gin.HandlerFunc {
	allowedOrigins := strings.Split(origins, ",")

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		for _, allowed := range allowedOrigins {
			if strings.TrimSpace(allowed) == origin {
				c.Header("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Tenant-ID")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
