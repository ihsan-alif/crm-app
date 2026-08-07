package handler

import (
	"app-crm/internal/model"
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

type createUserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email,max=150"`
	Password string `json:"password" binding:"required,min=6,max=100"`
	Role     string `json:"role" binding:"required,oneof=sales"`
}

type resetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6,max=100"`
}

type toggleActiveRequest struct {
	IsActive bool `json:"is_active"`
}

func (h *UserHandler) Me(c *gin.Context) {
	userID := pkg.UserID(c)

	user, err := h.userService.FindByID(userID)
	if err != nil {
		pkg.NotFound(c, "User tidak ditemukan")
		return
	}

	pkg.OK(c, user)
}

func (h *UserHandler) List(c *gin.Context) {
	tenantID := pkg.TenantID(c)

	users, err := h.userService.ListByTenant(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, users)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := pkg.UserID(c)

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
	userID := pkg.UserID(c)

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

func (h *UserHandler) Create(c *gin.Context) {
	tenantID := pkg.TenantID(c)

	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.ValidationError(c, pkg.ParseValidationErrors(err))
		return
	}

	user, err := h.userService.Create(tenantID, req.Name, req.Email, req.Password, string(model.RoleSales))
	if err != nil {
		switch err {
		case pkg.ErrEmailExists:
			pkg.Conflict(c, "Email sudah digunakan")
		default:
			pkg.InternalError(c)
		}
		return
	}

	pkg.Created(c, user)
}

func (h *UserHandler) ToggleActive(c *gin.Context) {
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	if id == pkg.UserID(c) {
		pkg.BadRequest(c, "Tidak dapat mengubah status akun sendiri")
		return
	}

	var req toggleActiveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.BadRequest(c, "Format data tidak valid")
		return
	}

	if err := h.userService.SetActive(id, req.IsActive); err != nil {
		pkg.NotFound(c, "User tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Status akun diperbarui"})
}

func (h *UserHandler) AdminResetPassword(c *gin.Context) {
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.ValidationError(c, pkg.ParseValidationErrors(err))
		return
	}

	if err := h.userService.AdminResetPassword(id, req.NewPassword); err != nil {
		pkg.NotFound(c, "User tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Password berhasil direset"})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	if id == pkg.UserID(c) {
		pkg.BadRequest(c, "Tidak dapat menghapus akun sendiri")
		return
	}

	if err := h.userService.Delete(id); err != nil {
		pkg.NotFound(c, "User tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Akun dihapus"})
}
