package service

import (
	"encoding/csv"
	"fmt"
	"strings"
	"time"

	"app-crm/internal/model"
	"app-crm/internal/pkg"

	"gorm.io/gorm"
)

type RevenuePoint struct {
	Date  string  `json:"date"`
	Total float64 `json:"total"`
}

type TransactionService interface {
	Create(tenantID uint, userID *uint, req model.TransactionRequest) (*model.Transaction, error)
	FindByID(tenantID, id uint) (*model.Transaction, error)
	List(tenantID uint, status string, page, perPage int) ([]model.Transaction, *model.Pagination, error)
	Update(tenantID, userID, id uint, req model.TransactionRequest) (*model.Transaction, error)
	UpdateStatus(tenantID, userID, id uint, status model.TransactionStatus) error
	Delete(tenantID, userID, id uint) error
	CountByTenant(tenantID uint) (int64, error)
	TotalRevenueByTenant(tenantID uint) (float64, error)
	ExportCSV(tenantID uint) (string, error)
	Recent(tenantID uint, limit int) ([]model.Transaction, error)
	RevenueByDay(tenantID uint, days int) ([]RevenuePoint, error)
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

	createActivityLog(s.db, tenantID, userID, "create", "transaction",
		fmt.Sprintf("Transaksi %s dibuat sebesar Rp %.0f", number, total), &tx.ID)

	return tx, nil
}

func (s *transactionService) FindByID(tenantID, id uint) (*model.Transaction, error) {
	var tx model.Transaction
	err := s.db.Preload("Items").Preload("Customer").Preload("Tenant").
		Where("tenant_id = ? AND id = ?", tenantID, id).First(&tx).Error
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

func (s *transactionService) Update(tenantID, userID, id uint, req model.TransactionRequest) (*model.Transaction, error) {
	var tx model.Transaction
	if err := s.db.Preload("Items").Where("tenant_id = ? AND id = ?", tenantID, id).First(&tx).Error; err != nil {
		return nil, pkg.ErrNotFound
	}

	total := 0.0
	items := make([]model.TransactionItem, 0, len(req.Items))
	for _, item := range req.Items {
		subtotal := float64(item.Qty) * item.Price
		total += subtotal
		items = append(items, model.TransactionItem{
			TransactionID: tx.ID,
			Name:          item.Name,
			Qty:           item.Qty,
			Price:         item.Price,
			Subtotal:      subtotal,
		})
	}

	err := s.db.Transaction(func(txdb *gorm.DB) error {
		if err := txdb.Where("transaction_id = ?", tx.ID).Delete(&model.TransactionItem{}).Error; err != nil {
			return err
		}

		updates := map[string]any{
			"customer_id": req.CustomerID,
			"status":      req.Status,
			"total":       total,
		}
		if req.Notes != nil {
			updates["notes"] = *req.Notes
		}

		if err := txdb.Model(&tx).Updates(updates).Error; err != nil {
			return err
		}
		return txdb.Create(&items).Error
	})
	if err != nil {
		return nil, err
	}

	createActivityLog(s.db, tenantID, &userID, "update", "transaction",
		fmt.Sprintf("Transaksi %s diperbarui sebesar Rp %.0f", tx.Number, total), &tx.ID)

	return s.FindByID(tenantID, tx.ID)
}

func (s *transactionService) UpdateStatus(tenantID, userID, id uint, status model.TransactionStatus) error {
	var tx model.Transaction
	if err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&tx).Error; err != nil {
		return pkg.ErrNotFound
	}

	result := s.db.Model(&tx).Update("status", status)
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}

	label := "belum lunas"
	if status == model.StatusPaid {
		label = "lunas"
	}
	createActivityLog(s.db, tenantID, &userID, "update", "transaction",
		fmt.Sprintf("Status transaksi %s diubah menjadi %s", tx.Number, label), &tx.ID)
	return result.Error
}

func (s *transactionService) Delete(tenantID, userID, id uint) error {
	var tx model.Transaction
	if err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&tx).Error; err != nil {
		return pkg.ErrNotFound
	}

	result := s.db.Delete(&tx)
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}

	createActivityLog(s.db, tenantID, &userID, "delete", "transaction",
		fmt.Sprintf("Transaksi %s dihapus", tx.Number), &tx.ID)
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

func (s *transactionService) Recent(tenantID uint, limit int) ([]model.Transaction, error) {
	var transactions []model.Transaction
	err := s.db.Where("tenant_id = ?", tenantID).
		Preload("Items").
		Order("created_at DESC").
		Limit(limit).
		Find(&transactions).Error
	return transactions, err
}

func (s *transactionService) RevenueByDay(tenantID uint, days int) ([]RevenuePoint, error) {
	var results []RevenuePoint
	err := s.db.Model(&model.Transaction{}).
		Select("DATE(created_at) as date, COALESCE(SUM(total), 0) as total").
		Where("tenant_id = ? AND status = ? AND created_at >= CURRENT_DATE - INTERVAL '1 day' * ? AND deleted_at IS NULL",
			tenantID, model.StatusPaid, days).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	if results == nil {
		results = []RevenuePoint{}
	}
	return results, nil
}

func (s *transactionService) ExportCSV(tenantID uint) (string, error) {
	var transactions []model.Transaction
	err := s.db.Preload("Items").
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&transactions).Error
	if err != nil {
		return "", err
	}

	var b strings.Builder
	writer := csv.NewWriter(&b)
	writer.Write([]string{"no_transaksi", "tanggal", "pelanggan_id", "total", "status", "catatan"})

	for _, t := range transactions {
		notes := ""
		if t.Notes != nil {
			notes = *t.Notes
		}
		writer.Write([]string{
			t.Number,
			t.CreatedAt.Format("2006-01-02"),
			fmt.Sprintf("%d", t.CustomerID),
			fmt.Sprintf("%.0f", t.Total),
			string(t.Status),
			notes,
		})
	}
	writer.Flush()

	return b.String(), writer.Error()
}

func generateTransactionNumber() string {
	now := time.Now()
	return fmt.Sprintf("INV-%s-%04d", now.Format("20060102"), now.UnixMilli()%10000)
}
