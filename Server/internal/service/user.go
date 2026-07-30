package service

import (
	"qasir-crm/internal/model"
	"qasir-crm/internal/pkg"

	"gorm.io/gorm"
)

type UserService interface {
	Create(tenantID uint, name, email, password, role string) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	FindByID(id uint) (*model.User, error)
	ListByTenant(tenantID uint) ([]model.User, error)
	UpdateLastLogin(id uint) error
}

type userService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) UserService {
	return &userService{db: db}
}

func (s *userService) Create(tenantID uint, name, email, password, role string) (*model.User, error) {
	var exists int64
	s.db.Model(&model.User{}).Where("email = ?", email).Count(&exists)
	if exists > 0 {
		return nil, pkg.ErrEmailExists
	}

	hash, err := pkg.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		TenantID:     tenantID,
		Name:         name,
		Email:        email,
		PasswordHash: hash,
		Role:         model.UserRole(role),
		IsActive:     true,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := s.db.Where("email = ?", email).Preload("Tenant").First(&user).Error
	if err != nil {
		return nil, pkg.ErrNotFound
	}
	return &user, nil
}

func (s *userService) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := s.db.First(&user, id).Error
	if err != nil {
		return nil, pkg.ErrNotFound
	}
	return &user, nil
}

func (s *userService) ListByTenant(tenantID uint) ([]model.User, error) {
	var users []model.User
	err := s.db.Where("tenant_id = ?", tenantID).Find(&users).Error
	return users, err
}

func (s *userService) UpdateLastLogin(id uint) error {
	return s.db.Model(&model.User{}).Where("id = ?", id).
		UpdateColumn("last_login_at", gorm.Expr("NOW()")).Error
}
