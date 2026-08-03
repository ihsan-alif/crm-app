package handler

import (
	"app-crm/internal/pkg"
	"app-crm/internal/service"

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

func (h *DashboardHandler) Index(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")

	customerCount, _ := h.customerService.CountByTenant(tenantID)
	transactionCount, _ := h.transactionService.CountByTenant(tenantID)
	revenue, _ := h.transactionService.TotalRevenueByTenant(tenantID)

	recentCustomers, _ := h.customerService.Recent(tenantID, 5)
	recentTransactions, _ := h.transactionService.Recent(tenantID, 5)
	revenueChart, _ := h.transactionService.RevenueByDay(tenantID, 7)

	pkg.OK(c, gin.H{
		"summary": gin.H{
			"total_customers":    customerCount,
			"total_transactions": transactionCount,
			"total_revenue":      revenue,
		},
		"recent_customers":    recentCustomers,
		"recent_transactions": recentTransactions,
		"revenue_chart":       revenueChart,
	})
}
