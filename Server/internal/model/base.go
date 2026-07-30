package model

import "time"

type Base struct {
	ID        uint       `gorm:"primarykey" json:"id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

type Pagination struct {
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
	Total   int `json:"total"`
}
