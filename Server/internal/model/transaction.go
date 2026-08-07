package model

import "github.com/google/uuid"

type TransactionStatus string

const (
	StatusPaid   TransactionStatus = "paid"
	StatusUnpaid TransactionStatus = "unpaid"
)

type Transaction struct {
	Base
	TenantID   uuid.UUID          `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID     *uuid.UUID         `gorm:"type:uuid" json:"user_id,omitempty"`
	CustomerID uuid.UUID          `gorm:"type:uuid;not null" json:"customer_id"`
	Number     string             `gorm:"size:30;uniqueIndex;not null" json:"number"`
	Total      float64            `gorm:"type:decimal(15,2)" json:"total"`
	Status     TransactionStatus  `gorm:"size:10;default:'unpaid'" json:"status"`
	Notes      *string            `gorm:"type:text" json:"notes,omitempty"`

	Items    []TransactionItem `gorm:"foreignKey:TransactionID" json:"items,omitempty"`
	Customer *Customer         `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Tenant   *Tenant           `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

type TransactionItem struct {
	Base
	TransactionID uuid.UUID `gorm:"type:uuid;not null;index" json:"transaction_id"`
	ProductID     uuid.UUID `gorm:"type:uuid" json:"product_id"`
	Name          string    `gorm:"size:200;not null" json:"name"`
	Qty           int       `gorm:"not null" json:"qty"`
	Price         float64   `gorm:"type:decimal(15,2)" json:"price"`
	Subtotal      float64   `gorm:"type:decimal(15,2)" json:"subtotal"`
}

type TransactionRequest struct {
	CustomerID uuid.UUID               `json:"customer_id" binding:"required"`
	Status     TransactionStatus       `json:"status" binding:"required,oneof=paid unpaid"`
	Notes      *string                 `json:"notes"`
	Items      []TransactionItemRequest `json:"items" binding:"required,min=1,dive"`
}

type TransactionItemRequest struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Qty       int       `json:"qty" binding:"required,min=1"`
}
