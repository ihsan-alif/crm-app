package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func Logger(log zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		log.Info().
			Int("status", status).
			Str("method", c.Request.Method).
			Str("path", path).
			Str("latency", latency.String()).
			Str("ip", c.ClientIP()).
			Msg("request")
	}
}
