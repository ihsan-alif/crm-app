package handler

import (
	"strconv"

	"qasir-crm/internal/model"
	"qasir-crm/internal/pkg"
	"qasir-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type CustomerHandler struct {
	customerService service.CustomerService
}

func NewCustomerHandler(customerService service.CustomerService) *CustomerHandler {
	return &CustomerHandler{customerService: customerService}
}

func (h *CustomerHandler) List(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	search := c.Query("search")
	tag := c.Query("tag")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	customers, pagination, err := h.customerService.List(tenantID, search, tag, page, perPage)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OKWithMeta(c, customers, pagination)
}

func (h *CustomerHandler) Get(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	customer, err := h.customerService.FindByID(tenantID, uint(id))
	if err != nil {
		pkg.NotFound(c, "Pelanggan tidak ditemukan")
		return
	}

	pkg.OK(c, customer)
}

func (h *CustomerHandler) Create(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	userID := c.GetUint("user_id")

	var req model.Customer
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	customer, err := h.customerService.Create(tenantID, userID, req)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.Created(c, customer)
}

func (h *CustomerHandler) Update(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var req model.Customer
	if err := c.ShouldBindJSON(&req); err != nil {
		pkg.BadRequest(c, "Format data tidak valid")
		return
	}

	customer, err := h.customerService.Update(tenantID, uint(id), req)
	if err != nil {
		pkg.NotFound(c, "Pelanggan tidak ditemukan")
		return
	}

	pkg.OK(c, customer)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := h.customerService.Delete(tenantID, uint(id)); err != nil {
		pkg.NotFound(c, "Pelanggan tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Pelanggan berhasil dihapus"})
}
