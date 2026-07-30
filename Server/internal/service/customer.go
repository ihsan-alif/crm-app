package service

import (
	"math"

	"qasir-crm/internal/model"
	"qasir-crm/internal/pkg"

	"gorm.io/gorm"
)

type CustomerService interface {
	Create(tenantID, userID uint, req model.Customer) (*model.Customer, error)
	FindByID(tenantID, id uint) (*model.Customer, error)
	List(tenantID uint, search, tag string, page, perPage int) ([]model.Customer, *model.Pagination, error)
	Update(tenantID, id uint, req model.Customer) (*model.Customer, error)
	Delete(tenantID, id uint) error
	CountByTenant(tenantID uint) (int64, error)
}

type customerService struct {
	db *gorm.DB
}

func NewCustomerService(db *gorm.DB) CustomerService {
	return &customerService{db: db}
}

func (s *customerService) Create(tenantID, userID uint, req model.Customer) (*model.Customer, error) {
	customer := &model.Customer{
		TenantID: tenantID,
		UserID:   &userID,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		Address:  req.Address,
		Tag:      req.Tag,
		Source:   req.Source,
		Notes:    req.Notes,
	}

	if err := s.db.Create(customer).Error; err != nil {
		return nil, err
	}

	return customer, nil
}

func (s *customerService) FindByID(tenantID, id uint) (*model.Customer, error) {
	var customer model.Customer
	err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&customer).Error
	if err != nil {
		return nil, pkg.ErrNotFound
	}
	return &customer, nil
}

func (s *customerService) List(tenantID uint, search, tag string, page, perPage int) ([]model.Customer, *model.Pagination, error) {
	query := s.db.Where("tenant_id = ?", tenantID)

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR phone ILIKE ? OR email ILIKE ?", like, like, like)
	}

	if tag != "" {
		query = query.Where("tag = ?", tag)
	}

	var total int64
	query.Model(&model.Customer{}).Count(&total)

	offset := (page - 1) * perPage
	var customers []model.Customer
	err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&customers).Error

	pagination := &model.Pagination{
		Page:    page,
		PerPage: perPage,
		Total:   int(total),
	}

	return customers, pagination, err
}

func (s *customerService) Update(tenantID, id uint, req model.Customer) (*model.Customer, error) {
	customer, err := s.FindByID(tenantID, id)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Address != nil {
		updates["address"] = *req.Address
	}
	if req.Tag != nil {
		updates["tag"] = *req.Tag
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	if err := s.db.Model(customer).Updates(updates).Error; err != nil {
		return nil, err
	}

	return customer, nil
}

func (s *customerService) Delete(tenantID, id uint) error {
	result := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&model.Customer{})
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}
	return result.Error
}

func (s *customerService) CountByTenant(tenantID uint) (int64, error) {
	var count int64
	err := s.db.Model(&model.Customer{}).Where("tenant_id = ?", tenantID).Count(&count).Error
	return count, err
}

func calcPages(total int, perPage int) int {
	return int(math.Ceil(float64(total) / float64(perPage)))
}
