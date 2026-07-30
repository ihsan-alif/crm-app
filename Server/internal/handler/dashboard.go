package handler

import (
	"qasir-crm/internal/pkg"
	"qasir-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	customerService    service.CustomerService
	transactionService service.TransactionService
}

func NewDashboardHandler(customerService service.CustomerService, transactionService service.TransactionService) *DashboardHandler {
	return &DashboardHandler{
		customerService:    customerService,
		transactionService: transactionService,
	}
}

func (h *DashboardHandler) Summary(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")

	customerCount, _ := h.customerService.CountByTenant(tenantID)
	transactionCount, _ := h.transactionService.CountByTenant(tenantID)
	revenue, _ := h.transactionService.TotalRevenueByTenant(tenantID)

	pkg.OK(c, gin.H{
		"total_customers":    customerCount,
		"total_transactions": transactionCount,
		"total_revenue":      revenue,
	})
}
