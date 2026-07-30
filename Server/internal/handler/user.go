package handler

import (
	"qasir-crm/internal/pkg"
	"qasir-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
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
