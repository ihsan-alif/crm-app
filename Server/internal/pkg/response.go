package pkg

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Data  any `json:"data,omitempty"`
	Meta  any `json:"meta,omitempty"`
	Error any `json:"error,omitempty"`
}

type ErrorDetail struct {
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Details []FieldError `json:"details,omitempty"`
}

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Response{Data: data})
}

func OKWithMeta(c *gin.Context, data any, meta any) {
	c.JSON(http.StatusOK, Response{Data: data, Meta: meta})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, Response{Data: data})
}

func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, Response{
		Error: ErrorDetail{Code: "BAD_REQUEST", Message: message},
	})
}

func ValidationError(c *gin.Context, details []FieldError) {
	c.JSON(http.StatusBadRequest, Response{
		Error: ErrorDetail{
			Code:    "VALIDATION_ERROR",
			Message: "Data yang dikirim tidak valid",
			Details: details,
		},
	})
}

func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, Response{
		Error: ErrorDetail{Code: "UNAUTHORIZED", Message: message},
	})
}

func Forbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, Response{
		Error: ErrorDetail{Code: "FORBIDDEN", Message: "Akses ditolak"},
	})
}

func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, Response{
		Error: ErrorDetail{Code: "NOT_FOUND", Message: message},
	})
}

func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, Response{
		Error: ErrorDetail{Code: "CONFLICT", Message: message},
	})
}

func InternalError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, Response{
		Error: ErrorDetail{Code: "INTERNAL_ERROR", Message: "Terjadi kesalahan server"},
	})
}
