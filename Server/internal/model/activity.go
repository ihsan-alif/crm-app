package model

type ActivityLog struct {
	Base
	TenantID    uint   `gorm:"not null;index" json:"tenant_id"`
	UserID      *uint  `gorm:"index" json:"user_id,omitempty"`
	Action      string `gorm:"size:50;index" json:"action"`
	Entity      string `gorm:"size:50" json:"entity"`
	EntityID    *uint  `json:"entity_id,omitempty"`
	Description string `gorm:"type:text" json:"description"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
