package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type TenantConfig map[string]any

func (c TenantConfig) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *TenantConfig) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, c)
}

type Tenant struct {
	Base
	Name      string       `gorm:"size:150;not null" json:"name"`
	Subdomain string       `gorm:"size:50;uniqueIndex;not null" json:"subdomain"`
	LogoURL   *string      `gorm:"size:255" json:"logo_url,omitempty"`
	IsActive  bool         `gorm:"default:true" json:"is_active"`
	Settings  TenantConfig `gorm:"type:jsonb;default:'{}'" json:"settings"`
}
