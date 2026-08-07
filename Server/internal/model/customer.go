package model

import (
	"time"

	"github.com/google/uuid"
)

type Customer struct {
	Base
	TenantID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID          *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	Name            string     `gorm:"size:150;not null" json:"name"`
	Phone           string     `gorm:"size:20;not null" json:"phone"`
	Email           *string    `gorm:"size:150" json:"email,omitempty"`
	Address         *string    `gorm:"size:255" json:"address,omitempty"`
	Tag             *string    `gorm:"size:50" json:"tag,omitempty"`
	Source          string     `gorm:"size:20;default:'manual'" json:"source"`
	Notes           *string    `gorm:"type:text" json:"notes,omitempty"`
	LastContactedAt *time.Time `json:"last_contacted_at,omitempty"`
}
