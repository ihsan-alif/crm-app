package handler

import (
	"strconv"

	"qasir-crm/internal/model"
	"qasir-crm/internal/pkg"
	"qasir-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService service.TransactionService
}

func NewTransactionHandler(transactionService service.TransactionService) *TransactionHandler {
	return &TransactionHandler{transactionService: transactionService}
}

func (h *TransactionHandler) List(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	transactions, pagination, err := h.transactionService.List(tenantID, status, page, perPage)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OKWithMeta(c, transactions, pagination)
}

func (h *TransactionHandler) Get(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	tx, err := h.transactionService.FindByID(tenantID, uint(id))
	if err != nil {
		pkg.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	pkg.OK(c, tx)
}

func (h *TransactionHandler) Create(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	userID := c.GetUint("user_id")

	var req model.TransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	tx, err := h.transactionService.Create(tenantID, &userID, req)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.Created(c, tx)
}

func (h *TransactionHandler) UpdateStatus(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var req struct {
		Status model.TransactionStatus `json:"status" binding:"required,oneof=paid unpaid"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	if err := h.transactionService.UpdateStatus(tenantID, uint(id), req.Status); err != nil {
		pkg.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Status berhasil diubah"})
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := h.transactionService.Delete(tenantID, uint(id)); err != nil {
		pkg.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Transaksi berhasil dihapus"})
}
