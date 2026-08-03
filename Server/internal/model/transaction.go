package model

type TransactionStatus string

const (
	StatusPaid   TransactionStatus = "paid"
	StatusUnpaid TransactionStatus = "unpaid"
)

type Transaction struct {
	Base
	TenantID   uint               `gorm:"not null;index" json:"tenant_id"`
	UserID     *uint              `json:"user_id,omitempty"`
	CustomerID uint               `gorm:"not null" json:"customer_id"`
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
	TransactionID uint    `gorm:"not null;index" json:"transaction_id"`
	Name          string  `gorm:"size:200;not null" json:"name"`
	Qty           int     `gorm:"not null" json:"qty"`
	Price         float64 `gorm:"type:decimal(15,2)" json:"price"`
	Subtotal      float64 `gorm:"type:decimal(15,2)" json:"subtotal"`
}

type TransactionRequest struct {
	CustomerID uint                    `json:"customer_id" binding:"required"`
	Status     TransactionStatus       `json:"status" binding:"required,oneof=paid unpaid"`
	Notes      *string                 `json:"notes"`
	Items      []TransactionItemRequest `json:"items" binding:"required,min=1,dive"`
}

type TransactionItemRequest struct {
	Name     string  `json:"name" binding:"required"`
	Qty      int     `json:"qty" binding:"required,min=1"`
	Price    float64 `json:"price" binding:"required,min=0"`
	Subtotal float64 `json:"subtotal"`
}
