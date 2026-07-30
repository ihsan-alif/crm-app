package service

import (
	"fmt"
	"time"

	"qasir-crm/internal/model"
	"qasir-crm/internal/pkg"

	"gorm.io/gorm"
)

type TransactionService interface {
	Create(tenantID uint, userID *uint, req model.TransactionRequest) (*model.Transaction, error)
	FindByID(tenantID, id uint) (*model.Transaction, error)
	List(tenantID uint, status string, page, perPage int) ([]model.Transaction, *model.Pagination, error)
	UpdateStatus(tenantID, id uint, status model.TransactionStatus) error
	Delete(tenantID, id uint) error
	CountByTenant(tenantID uint) (int64, error)
	TotalRevenueByTenant(tenantID uint) (float64, error)
}

type transactionService struct {
	db *gorm.DB
}

func NewTransactionService(db *gorm.DB) TransactionService {
	return &transactionService{db: db}
}

func (s *transactionService) Create(tenantID uint, userID *uint, req model.TransactionRequest) (*model.Transaction, error) {
	number := generateTransactionNumber()

	total := 0.0
	var items []model.TransactionItem
	for _, item := range req.Items {
		subtotal := float64(item.Qty) * item.Price
		total += subtotal
		items = append(items, model.TransactionItem{
			Name:     item.Name,
			Qty:      item.Qty,
			Price:    item.Price,
			Subtotal: subtotal,
		})
	}

	tx := &model.Transaction{
		TenantID:   tenantID,
		UserID:     userID,
		CustomerID: req.CustomerID,
		Number:     number,
		Total:      total,
		Status:     req.Status,
		Notes:      req.Notes,
		Items:      items,
	}

	if err := s.db.Create(tx).Error; err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *transactionService) FindByID(tenantID, id uint) (*model.Transaction, error) {
	var tx model.Transaction
	err := s.db.Preload("Items").Where("tenant_id = ? AND id = ?", tenantID, id).First(&tx).Error
	if err != nil {
		return nil, pkg.ErrNotFound
	}
	return &tx, nil
}

func (s *transactionService) List(tenantID uint, status string, page, perPage int) ([]model.Transaction, *model.Pagination, error) {
	query := s.db.Where("tenant_id = ?", tenantID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Model(&model.Transaction{}).Count(&total)

	offset := (page - 1) * perPage
	var transactions []model.Transaction
	err := query.Preload("Items").Order("created_at DESC").Offset(offset).Limit(perPage).Find(&transactions).Error

	pagination := &model.Pagination{
		Page:    page,
		PerPage: perPage,
		Total:   int(total),
	}

	return transactions, pagination, err
}

func (s *transactionService) UpdateStatus(tenantID, id uint, status model.TransactionStatus) error {
	result := s.db.Model(&model.Transaction{}).
		Where("tenant_id = ? AND id = ?", tenantID, id).
		Update("status", status)
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}
	return result.Error
}

func (s *transactionService) Delete(tenantID, id uint) error {
	result := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&model.Transaction{})
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}
	return result.Error
}

func (s *transactionService) CountByTenant(tenantID uint) (int64, error) {
	var count int64
	err := s.db.Model(&model.Transaction{}).Where("tenant_id = ?", tenantID).Count(&count).Error
	return count, err
}

func (s *transactionService) TotalRevenueByTenant(tenantID uint) (float64, error) {
	var result struct {
		Total float64
	}
	err := s.db.Model(&model.Transaction{}).
		Select("COALESCE(SUM(total), 0) as total").
		Where("tenant_id = ? AND status = ? AND deleted_at IS NULL", tenantID, model.StatusPaid).
		Scan(&result).Error
	return result.Total, err
}

func generateTransactionNumber() string {
	now := time.Now()
	return fmt.Sprintf("INV-%s-%04d", now.Format("20060102"), now.UnixMilli()%10000)
}
