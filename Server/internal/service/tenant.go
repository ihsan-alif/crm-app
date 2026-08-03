package service

import (
	"app-crm/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TenantService interface {
	Create(name string) (*model.Tenant, error)
	FindByID(id uint) (*model.Tenant, error)
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

func (s *tenantService) FindByID(id uint) (*model.Tenant, error) {
	var tenant model.Tenant
	err := s.db.First(&tenant, id).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}
