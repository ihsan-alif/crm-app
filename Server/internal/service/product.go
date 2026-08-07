package service

import (
	"app-crm/internal/model"
	"app-crm/internal/pkg"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductService interface {
	Create(tenantID, userID uuid.UUID, req model.Product) (*model.Product, error)
	FindByID(tenantID, id uuid.UUID) (*model.Product, error)
	List(tenantID uuid.UUID, search, category string, page, perPage int) ([]model.Product, *model.Pagination, error)
	Update(tenantID, userID, id uuid.UUID, req model.Product) (*model.Product, error)
	Delete(tenantID, userID, id uuid.UUID) error
	All(tenantID uuid.UUID) ([]model.Product, error)
}

type productService struct {
	db *gorm.DB
}

func NewProductService(db *gorm.DB) ProductService {
	return &productService{db: db}
}

func (s *productService) Create(tenantID, userID uuid.UUID, req model.Product) (*model.Product, error) {
	product := &model.Product{
		TenantID:    tenantID,
		Name:        req.Name,
		Price:       req.Price,
		SKU:         req.SKU,
		Description: req.Description,
		Category:    req.Category,
		IsActive:    req.IsActive,
	}

	if err := s.db.Create(product).Error; err != nil {
		return nil, err
	}

	createActivityLog(s.db, tenantID, &userID, "create", "product", "Produk "+product.Name+" ditambahkan", &product.ID)

	return product, nil
}

func (s *productService) FindByID(tenantID, id uuid.UUID) (*model.Product, error) {
	var product model.Product
	err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&product).Error
	if err != nil {
		return nil, pkg.ErrNotFound
	}
	return &product, nil
}

func (s *productService) List(tenantID uuid.UUID, search, category string, page, perPage int) ([]model.Product, *model.Pagination, error) {
	query := s.db.Where("tenant_id = ?", tenantID)

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR sku ILIKE ?", like, like)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	var total int64
	query.Model(&model.Product{}).Count(&total)

	offset := (page - 1) * perPage
	var products []model.Product
	err := query.Order("name ASC").Offset(offset).Limit(perPage).Find(&products).Error

	pagination := &model.Pagination{
		Page:    page,
		PerPage: perPage,
		Total:   int(total),
	}

	return products, pagination, err
}

func (s *productService) Update(tenantID, userID, id uuid.UUID, req model.Product) (*model.Product, error) {
	product, err := s.FindByID(tenantID, id)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{
		"name":     req.Name,
		"price":    req.Price,
		"is_active": req.IsActive,
	}
	if req.SKU != nil {
		updates["sku"] = *req.SKU
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}

	if err := s.db.Model(product).Updates(updates).Error; err != nil {
		return nil, err
	}

	createActivityLog(s.db, tenantID, &userID, "update", "product", "Produk "+product.Name+" diperbarui", &product.ID)

	return product, nil
}

func (s *productService) Delete(tenantID, userID, id uuid.UUID) error {
	var product model.Product
	if err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&product).Error; err != nil {
		return pkg.ErrNotFound
	}

	result := s.db.Delete(&product)
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}

	createActivityLog(s.db, tenantID, &userID, "delete", "product", "Produk "+product.Name+" dihapus", &product.ID)
	return result.Error
}

func (s *productService) All(tenantID uuid.UUID) ([]model.Product, error) {
	var products []model.Product
	err := s.db.Where("tenant_id = ? AND is_active = ?", tenantID, true).
		Order("name ASC").Find(&products).Error
	return products, err
}
