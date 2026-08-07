package handler

import (
	"strconv"

	"app-crm/internal/model"
	"app-crm/internal/pkg"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	productService service.ProductService
}

func NewProductHandler(productService service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

func (h *ProductHandler) List(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	search := c.Query("search")
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	products, pagination, err := h.productService.List(tenantID, search, category, page, perPage)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OKWithMeta(c, products, pagination)
}

func (h *ProductHandler) Get(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	product, err := h.productService.FindByID(tenantID, id)
	if err != nil {
		pkg.NotFound(c, "Produk tidak ditemukan")
		return
	}

	pkg.OK(c, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	userID := pkg.UserID(c)

	var req model.Product
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	product, err := h.productService.Create(tenantID, userID, req)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.Created(c, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	userID := pkg.UserID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	var req model.Product
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	product, err := h.productService.Update(tenantID, userID, id, req)
	if err != nil {
		if err == pkg.ErrNotFound {
			pkg.NotFound(c, "Produk tidak ditemukan")
		} else {
			pkg.InternalError(c)
		}
		return
	}

	pkg.OK(c, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	if err := h.productService.Delete(tenantID, pkg.UserID(c), id); err != nil {
		pkg.NotFound(c, "Produk tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Produk berhasil dihapus"})
}
