package handler

import (
	"encoding/csv"
	"strconv"
	"strings"

	"app-crm/internal/model"
	"app-crm/internal/pkg"
	"app-crm/internal/service"

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

	customer, err := h.customerService.Update(tenantID, c.GetUint("user_id"), uint(id), req)
	if err != nil {
		pkg.NotFound(c, "Pelanggan tidak ditemukan")
		return
	}

	pkg.OK(c, customer)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := h.customerService.Delete(tenantID, c.GetUint("user_id"), uint(id)); err != nil {
		pkg.NotFound(c, "Pelanggan tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Pelanggan berhasil dihapus"})
}

func (h *CustomerHandler) Import(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	userID := c.GetUint("user_id")

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		pkg.BadRequest(c, "File CSV tidak ditemukan")
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		pkg.BadRequest(c, "Format CSV tidak valid")
		return
	}

	if len(records) < 2 {
		pkg.BadRequest(c, "File CSV kosong atau hanya berisi header")
		return
	}

	result, err := h.customerService.ImportCSV(tenantID, userID, records)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, result)
}

func (h *CustomerHandler) Export(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")

	csvData, err := h.customerService.ExportCSV(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=pelanggan.csv")
	c.String(200, csvData)
}

func (h *CustomerHandler) Template(c *gin.Context) {
	var b strings.Builder
	writer := csv.NewWriter(&b)
	writer.Write([]string{"nama", "no_wa", "email", "alamat", "tag", "catatan"})
	writer.Write([]string{"Contoh Budi", "08123456789", "budi@email.com", "Jakarta", "reguler", "Pelanggan baru"})
	writer.Flush()

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=template_pelanggan.csv")
	c.String(200, b.String())
}

func (h *CustomerHandler) ExportJSON(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")

	customers, err := h.customerService.All(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, customers)
}
