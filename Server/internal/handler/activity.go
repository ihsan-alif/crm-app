package handler

import (
	"strconv"

	"app-crm/internal/pkg"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type ActivityLogHandler struct {
	activityService service.ActivityLogService
}

func NewActivityLogHandler(activityService service.ActivityLogService) *ActivityLogHandler {
	return &ActivityLogHandler{activityService: activityService}
}

func (h *ActivityLogHandler) List(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	logs, pagination, err := h.activityService.List(tenantID, page, perPage)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OKWithMeta(c, logs, pagination)
}
