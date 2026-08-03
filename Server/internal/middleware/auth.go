package middleware

import (
	"strings"

	"app-crm/internal/pkg"

	"github.com/gin-gonic/gin"
)

func Auth(jwtService pkg.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			pkg.Unauthorized(c, "Token tidak ditemukan")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			pkg.Unauthorized(c, "Format token tidak valid")
			c.Abort()
			return
		}

		claims, err := jwtService.ValidateToken(parts[1])
		if err != nil {
			pkg.Unauthorized(c, "Token tidak valid atau sudah kadaluarsa")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("tenant_id", claims.TenantID)
		c.Set("role", claims.Role)

		c.Next()
	}
}
