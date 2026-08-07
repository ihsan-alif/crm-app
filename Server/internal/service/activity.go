package service

import (
	"app-crm/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityLogService interface {
	List(tenantID uuid.UUID, page, perPage int) ([]model.ActivityLog, *model.Pagination, error)
}

type activityLogService struct {
	db *gorm.DB
}

func NewActivityLogService(db *gorm.DB) ActivityLogService {
	return &activityLogService{db: db}
}

func (s *activityLogService) List(tenantID uuid.UUID, page, perPage int) ([]model.ActivityLog, *model.Pagination, error) {
	query := s.db.Where("tenant_id = ?", tenantID)

	var total int64
	query.Model(&model.ActivityLog{}).Count(&total)

	offset := (page - 1) * perPage
	var logs []model.ActivityLog
	err := query.Preload("User").
		Order("created_at DESC").
		Offset(offset).Limit(perPage).
		Find(&logs).Error

	pagination := &model.Pagination{
		Page:    page,
		PerPage: perPage,
		Total:   int(total),
	}

	return logs, pagination, err
}

func createActivityLog(db *gorm.DB, tenantID uuid.UUID, userID *uuid.UUID, action, entity, description string, entityID *uuid.UUID) {
	entry := model.ActivityLog{
		TenantID:    tenantID,
		UserID:      userID,
		Action:      action,
		Entity:      entity,
		EntityID:    entityID,
		Description: description,
	}
	db.Create(&entry)
}
