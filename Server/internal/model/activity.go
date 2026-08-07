package model

import "github.com/google/uuid"

type ActivityLog struct {
	Base
	TenantID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID      *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	Action      string     `gorm:"size:50;index" json:"action"`
	Entity      string     `gorm:"size:50" json:"entity"`
	EntityID    *uuid.UUID `gorm:"type:uuid" json:"entity_id,omitempty"`
	Description string     `gorm:"type:text" json:"description"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
