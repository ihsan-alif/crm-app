package handler

import (
	"strconv"

	"app-crm/internal/model"
	"app-crm/internal/pkg"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService service.TransactionService
}

func NewTransactionHandler(transactionService service.TransactionService) *TransactionHandler {
	return &TransactionHandler{transactionService: transactionService}
}

func (h *TransactionHandler) List(c *gin.Context) {
	tenantID := pkg.TenantID(c)
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
	tenantID := pkg.TenantID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	tx, err := h.transactionService.FindByID(tenantID, id)
	if err != nil {
		pkg.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	pkg.OK(c, tx)
}

func (h *TransactionHandler) Create(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	userID := pkg.UserID(c)

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
		if err == pkg.ErrInvalidProduct {
			pkg.BadRequest(c, err.Error())
		} else if err == pkg.ErrInvalidCustomer {
			pkg.BadRequest(c, err.Error())
		} else {
			pkg.InternalError(c)
		}
		return
	}

	pkg.Created(c, tx)
}

func (h *TransactionHandler) UpdateStatus(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

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

	if err := h.transactionService.UpdateStatus(tenantID, pkg.UserID(c), id, req.Status); err != nil {
		pkg.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Status berhasil diubah"})
}

func (h *TransactionHandler) Update(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	userID := pkg.UserID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

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

	tx, err := h.transactionService.Update(tenantID, userID, id, req)
	if err != nil {
		if err == pkg.ErrNotFound {
			pkg.NotFound(c, "Transaksi tidak ditemukan")
		} else if err == pkg.ErrInvalidProduct {
			pkg.BadRequest(c, err.Error())
		} else if err == pkg.ErrInvalidCustomer {
			pkg.BadRequest(c, err.Error())
		} else {
			pkg.InternalError(c)
		}
		return
	}

	pkg.OK(c, tx)
}

func (h *TransactionHandler) ExportCSV(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	format := c.DefaultQuery("format", "csv")

	headers, rows, err := h.transactionService.ExportData(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	serveSpreadsheet(c, format, "transaksi", headers, rows)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	if err := h.transactionService.Delete(tenantID, pkg.UserID(c), id); err != nil {
		pkg.NotFound(c, "Transaksi tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Transaksi berhasil dihapus"})
}
