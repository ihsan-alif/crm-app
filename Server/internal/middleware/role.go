package middleware

import (
	"qasir-crm/internal/pkg"

	"github.com/gin-gonic/gin"
)

func Role(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")

		for _, r := range roles {
			if userRole == r {
				c.Next()
				return
			}
		}

		pkg.Forbidden(c)
		c.Abort()
	}
}
