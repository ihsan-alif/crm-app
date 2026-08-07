package model

import (
	"time"

	"github.com/google/uuid"
)

type WABroadcastStatus string

const (
	WADraft  WABroadcastStatus = "draft"
	WASending WABroadcastStatus = "sending"
	WASent   WABroadcastStatus = "sent"
	WAFailed WABroadcastStatus = "failed"
)

type WAMessageStatus string

const (
	WAPending WAMessageStatus = "pending"
	WASuccess WAMessageStatus = "sent"
	WAError  WAMessageStatus = "failed"
)

type WADirection string

const (
	WAInbound  WADirection = "inbound"
	WAOutbound WADirection = "outbound"
)

type WABroadcast struct {
	Base
	TenantID  uuid.UUID           `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID    *uuid.UUID          `gorm:"type:uuid" json:"user_id,omitempty"`
	Title     string              `gorm:"size:150;not null" json:"title"`
	Message   string              `gorm:"type:text;not null" json:"message"`
	TargetTag *string             `gorm:"size:50" json:"target_tag,omitempty"`
	TargetAll bool                `gorm:"default:false" json:"target_all"`
	Status    WABroadcastStatus   `gorm:"size:10;default:'draft'" json:"status"`
	Total     int                 `gorm:"default:0" json:"total"`
	Sent      int                 `gorm:"default:0" json:"sent"`
	Failed    int                 `gorm:"default:0" json:"failed"`
	SchedAt   *time.Time          `json:"scheduled_at,omitempty"`
	SentAt    *time.Time          `json:"sent_at,omitempty"`
}

type WAMessage struct {
	Base
	TenantID    uuid.UUID       `gorm:"type:uuid;not null;index" json:"tenant_id"`
	BroadcastID *uuid.UUID      `gorm:"type:uuid" json:"broadcast_id,omitempty"`
	CustomerID  *uuid.UUID      `gorm:"type:uuid;index" json:"customer_id,omitempty"`
	Phone       string          `gorm:"size:20;not null" json:"phone"`
	Direction   WADirection     `gorm:"size:10;default:'outbound';index" json:"direction"`
	Message     string          `gorm:"type:text;not null" json:"message"`
	Status      WAMessageStatus `gorm:"size:10;default:'pending'" json:"status"`
	WAMessageID *string         `gorm:"size:100" json:"wa_message_id,omitempty"`
	ErrorMsg    *string         `gorm:"type:text" json:"error_msg,omitempty"`
	SentAt      *time.Time      `json:"sent_at,omitempty"`

	Customer *Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

type WABroadcastRequest struct {
	Title   string  `json:"title" binding:"required"`
	Message string  `json:"message" binding:"required"`
	Tag     *string `json:"tag"`
	All     bool    `json:"all"`
}

type WASendRequest struct {
	CustomerID uuid.UUID `json:"customer_id" binding:"required"`
	Message    string    `json:"message" binding:"required"`
}
