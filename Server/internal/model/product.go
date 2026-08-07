package model

import "github.com/google/uuid"

type Product struct {
	Base
	TenantID    uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name        string    `gorm:"size:200;not null" json:"name" binding:"required"`
	Price       float64   `gorm:"type:decimal(15,2);not null" json:"price" binding:"required,min=0"`
	SKU         *string   `gorm:"size:50" json:"sku,omitempty"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	Category    *string   `gorm:"size:100" json:"category,omitempty"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
}
