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
	tenantID := c.GetUint("tenant_id")
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
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	product, err := h.productService.FindByID(tenantID, uint(id))
	if err != nil {
		pkg.NotFound(c, "Produk tidak ditemukan")
		return
	}

	pkg.OK(c, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	tenantID := c.GetUint("tenant_id")
	userID := c.GetUint("user_id")

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
	tenantID := c.GetUint("tenant_id")
	userID := c.GetUint("user_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

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

	product, err := h.productService.Update(tenantID, userID, uint(id), req)
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
	tenantID := c.GetUint("tenant_id")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := h.productService.Delete(tenantID, c.GetUint("user_id"), uint(id)); err != nil {
		pkg.NotFound(c, "Produk tidak ditemukan")
		return
	}

	pkg.OK(c, gin.H{"message": "Produk berhasil dihapus"})
}
