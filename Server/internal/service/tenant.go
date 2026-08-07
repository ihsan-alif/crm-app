package service

import (
	"strings"

	"app-crm/internal/model"
	"app-crm/internal/pkg"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TenantService interface {
	Create(name string) (*model.Tenant, error)
	FindByID(id uuid.UUID) (*model.Tenant, error)
	Update(id uuid.UUID, req model.TenantUpdate) (*model.Tenant, error)
}

type tenantService struct {
	db *gorm.DB
}

func NewTenantService(db *gorm.DB) TenantService {
	return &tenantService{db: db}
}

func (s *tenantService) Create(name string) (*model.Tenant, error) {
	tenant := &model.Tenant{
		Name:      name,
		Subdomain: uuid.New().String()[:8],
		IsActive:  true,
		Settings:  model.TenantConfig{},
	}

	if err := s.db.Create(tenant).Error; err != nil {
		return nil, err
	}

	return tenant, nil
}

func (s *tenantService) FindByID(id uuid.UUID) (*model.Tenant, error) {
	var tenant model.Tenant
	err := s.db.First(&tenant, id).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (s *tenantService) Update(id uuid.UUID, req model.TenantUpdate) (*model.Tenant, error) {
	var tenant model.Tenant
	if err := s.db.First(&tenant, id).Error; err != nil {
		return nil, pkg.ErrNotFound
	}

	updates := map[string]any{"name": req.Name}
	if req.LogoURL != nil {
		logo := strings.TrimSpace(*req.LogoURL)
		if logo == "" {
			updates["logo_url"] = nil
		} else {
			updates["logo_url"] = logo
		}
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := s.db.Model(&tenant).Updates(updates).Error; err != nil {
		return nil, err
	}

	return s.FindByID(id)
}
