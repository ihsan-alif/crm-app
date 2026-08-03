package handler

import (
	"app-crm/internal/pkg"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

type updateProfileRequest struct {
	Name  string `json:"name" binding:"required,min=2,max=100"`
	Email string `json:"email" binding:"required,email"`
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required,min=6"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func (h *UserHandler) Me(c *gin.Context) {
	userID := c.GetUint("user_id")

	user, err := h.userService.FindByID(userID)
	if err != nil {
		pkg.NotFound(c, "User tidak ditemukan")
		return
	}

	pkg.OK(c, user)
}

func (h *UserHandler) List(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")

	users, err := h.userService.ListByTenant(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, users)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.ValidationError(c, pkg.ParseValidationErrors(err))
		return
	}

	user, err := h.userService.UpdateProfile(userID, req.Name, req.Email)
	if err != nil {
		switch err {
		case pkg.ErrEmailExists:
			pkg.Conflict(c, "Email sudah digunakan")
		default:
			pkg.InternalError(c)
		}
		return
	}

	pkg.OK(c, user)
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.ValidationError(c, pkg.ParseValidationErrors(err))
		return
	}

	if err := h.userService.ChangePassword(userID, req.OldPassword, req.NewPassword); err != nil {
		switch err {
		case pkg.ErrPasswordWrong:
			pkg.BadRequest(c, "Password lama salah")
		default:
			pkg.InternalError(c)
		}
		return
	}

	pkg.OK(c, gin.H{"message": "Password berhasil diubah"})
}
