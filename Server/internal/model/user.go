package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleSales UserRole = "sales"
)

type User struct {
	Base
	TenantID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name         string     `gorm:"size:100;not null" json:"name"`
	Email        string     `gorm:"size:150;uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"size:255;not null" json:"-"`
	Role         UserRole   `gorm:"size:20;not null;default:'sales'" json:"role"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`

	Tenant *Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

type RegisterRequest struct {
	TenantName string `json:"tenant_name" binding:"required,min=3,max=100"`
	Name       string `json:"name" binding:"required,min=2,max=100"`
	Email      string `json:"email" binding:"required,email,max=150"`
	Password   string `json:"password" binding:"required,min=6,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type TokenClaims struct {
	UserID   uint     `json:"user_id"`
	TenantID uint     `json:"tenant_id"`
	Role     UserRole `json:"role"`
}
