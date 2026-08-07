package handler

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"app-crm/internal/model"
	"app-crm/internal/pkg"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
)

type TenantHandler struct {
	tenantService service.TenantService
	uploadDir     string
}

func NewTenantHandler(tenantService service.TenantService, uploadDir string) *TenantHandler {
	return &TenantHandler{tenantService: tenantService, uploadDir: uploadDir}
}

func (h *TenantHandler) Get(c *gin.Context) {
	tenantID := pkg.TenantID(c)

	tenant, err := h.tenantService.FindByID(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, tenant)
}

func (h *TenantHandler) Update(c *gin.Context) {
	tenantID := pkg.TenantID(c)

	var req model.TenantUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	tenant, err := h.tenantService.Update(tenantID, req)
	if err != nil {
		if err == pkg.ErrNotFound {
			pkg.NotFound(c, "Tenant tidak ditemukan")
		} else {
			pkg.InternalError(c)
		}
		return
	}

	pkg.OK(c, tenant)
}

func (h *TenantHandler) UploadLogo(c *gin.Context) {
	tenantID := pkg.TenantID(c)

	file, header, err := c.Request.FormFile("logo")
	if err != nil {
		pkg.BadRequest(c, "File logo tidak ditemukan")
		return
	}
	defer file.Close()

	if header.Size > 2*1024*1024 {
		pkg.BadRequest(c, "Ukuran file maksimal 2MB")
		return
	}

	ext := extForContentType(header.Header.Get("Content-Type"))
	if ext == "" {
		pkg.BadRequest(c, "Format gambar harus PNG, JPG, atau WEBP")
		return
	}

	if err := os.MkdirAll(h.uploadDir, 0o755); err != nil {
		pkg.InternalError(c)
		return
	}

	old, _ := filepath.Glob(filepath.Join(h.uploadDir, fmt.Sprintf("logo-%s.*", tenantID.String())))
	for _, o := range old {
		os.Remove(o)
	}

	filename := fmt.Sprintf("logo-%s%s", tenantID.String(), ext)
	dst, err := os.Create(filepath.Join(h.uploadDir, filename))
	if err != nil {
		pkg.InternalError(c)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		pkg.InternalError(c)
		return
	}

	logoURL := "/uploads/" + filename
	tenant, err := h.tenantService.Update(tenantID, model.TenantUpdate{LogoURL: &logoURL})
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, tenant)
}

func extForContentType(contentType string) string {
	ct := strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
	switch ct {
	case "image/png":
		return ".png"
	case "image/jpeg", "image/jpg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	}
	return ""
}
