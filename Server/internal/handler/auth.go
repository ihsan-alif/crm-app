package handler

import (
	"net/http"

	"qasir-crm/internal/model"
	"qasir-crm/internal/pkg"
	"qasir-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	resp, err := h.authService.Register(req)
	if err != nil {
		if err == pkg.ErrEmailExists {
			pkg.Conflict(c, "Email sudah terdaftar")
		} else {
			pkg.InternalError(c)
		}
		return
	}

	c.JSON(http.StatusCreated, pkg.Response{Data: resp})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	resp, err := h.authService.Login(req)
	if err != nil {
		switch err {
		case pkg.ErrInvalidCreds:
			pkg.Unauthorized(c, "Email atau password salah")
		case pkg.ErrNotActive:
			pkg.Forbidden(c)
		default:
			pkg.InternalError(c)
		}
		return
	}

	pkg.OK(c, resp)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req model.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	resp, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		pkg.Unauthorized(c, "Token refresh tidak valid")
		return
	}

	pkg.OK(c, resp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	pkg.OK(c, gin.H{"message": "Berhasil logout"})
}
