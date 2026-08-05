package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type fixedWindow struct {
	count   int
	resetAt time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	limit    int
	window   time.Duration
	requests map[string]*fixedWindow
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		limit:    limit,
		window:   window,
		requests: make(map[string]*fixedWindow),
	}
}

func (r *RateLimiter) Allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(r.requests) > 10000 {
		r.cleanup()
	}

	now := time.Now()
	w, ok := r.requests[key]
	if !ok || now.After(w.resetAt) {
		r.requests[key] = &fixedWindow{count: 1, resetAt: now.Add(r.window)}
		return true
	}
	w.count++
	return w.count <= r.limit
}

func (r *RateLimiter) cleanup() {
	now := time.Now()
	for k, w := range r.requests {
		if now.After(w.resetAt) {
			delete(r.requests, k)
		}
	}
}

func RateLimit(limiter *RateLimiter, scope string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := scope + ":" + c.ClientIP()
		if !limiter.Allow(key) {
			c.JSON(429, gin.H{
				"error": map[string]any{
					"code":    "TOO_MANY_REQUESTS",
					"message": "Terlalu banyak permintaan, silakan coba lagi nanti",
				},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
