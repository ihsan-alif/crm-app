package service

import (
	"fmt"
	"math"
	"strings"

	"app-crm/internal/model"
	"app-crm/internal/pkg"

	"gorm.io/gorm"
)

type ImportResult struct {
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Errors  []string `json:"errors"`
}

type CustomerService interface {
	Create(tenantID, userID uint, req model.Customer) (*model.Customer, error)
	FindByID(tenantID, id uint) (*model.Customer, error)
	List(tenantID uint, search, tag string, page, perPage int) ([]model.Customer, *model.Pagination, error)
	Update(tenantID, userID, id uint, req model.Customer) (*model.Customer, error)
	Delete(tenantID, userID, id uint) error
	CountByTenant(tenantID uint) (int64, error)
	ImportCSV(tenantID, userID uint, records [][]string) (*ImportResult, error)
	ExportData(tenantID uint) ([]string, [][]string, error)
	All(tenantID uint) ([]model.Customer, error)
	Recent(tenantID uint, limit int) ([]model.Customer, error)
}

type customerService struct {
	db *gorm.DB
}

func NewCustomerService(db *gorm.DB) CustomerService {
	return &customerService{db: db}
}

func (s *customerService) Create(tenantID, userID uint, req model.Customer) (*model.Customer, error) {
	customer := &model.Customer{
		TenantID: tenantID,
		UserID:   &userID,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		Address:  req.Address,
		Tag:      req.Tag,
		Source:   req.Source,
		Notes:    req.Notes,
	}

	if err := s.db.Create(customer).Error; err != nil {
		return nil, err
	}

	createActivityLog(s.db, tenantID, &userID, "create", "customer", "Pelanggan "+customer.Name+" ditambahkan", &customer.ID)

	return customer, nil
}

func (s *customerService) FindByID(tenantID, id uint) (*model.Customer, error) {
	var customer model.Customer
	err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&customer).Error
	if err != nil {
		return nil, pkg.ErrNotFound
	}
	return &customer, nil
}

func (s *customerService) List(tenantID uint, search, tag string, page, perPage int) ([]model.Customer, *model.Pagination, error) {
	query := s.db.Where("tenant_id = ?", tenantID)

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR phone ILIKE ? OR email ILIKE ?", like, like, like)
	}

	if tag != "" {
		query = query.Where("tag = ?", tag)
	}

	var total int64
	query.Model(&model.Customer{}).Count(&total)

	offset := (page - 1) * perPage
	var customers []model.Customer
	err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&customers).Error

	pagination := &model.Pagination{
		Page:    page,
		PerPage: perPage,
		Total:   int(total),
	}

	return customers, pagination, err
}

func (s *customerService) Update(tenantID, userID, id uint, req model.Customer) (*model.Customer, error) {
	customer, err := s.FindByID(tenantID, id)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Address != nil {
		updates["address"] = *req.Address
	}
	if req.Tag != nil {
		updates["tag"] = *req.Tag
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	if err := s.db.Model(customer).Updates(updates).Error; err != nil {
		return nil, err
	}

	createActivityLog(s.db, tenantID, &userID, "update", "customer", "Pelanggan "+customer.Name+" diperbarui", &customer.ID)

	return customer, nil
}

func (s *customerService) Delete(tenantID, userID, id uint) error {
	var customer model.Customer
	if err := s.db.Where("tenant_id = ? AND id = ?", tenantID, id).First(&customer).Error; err != nil {
		return pkg.ErrNotFound
	}

	result := s.db.Delete(&customer)
	if result.RowsAffected == 0 {
		return pkg.ErrNotFound
	}

	createActivityLog(s.db, tenantID, &userID, "delete", "customer", "Pelanggan "+customer.Name+" dihapus", &customer.ID)
	return result.Error
}

func (s *customerService) CountByTenant(tenantID uint) (int64, error) {
	var count int64
	err := s.db.Model(&model.Customer{}).Where("tenant_id = ?", tenantID).Count(&count).Error
	return count, err
}

func (s *customerService) All(tenantID uint) ([]model.Customer, error) {
	var customers []model.Customer
	err := s.db.Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&customers).Error
	return customers, err
}

func (s *customerService) Recent(tenantID uint, limit int) ([]model.Customer, error) {
	var customers []model.Customer
	err := s.db.Where("tenant_id = ?", tenantID).Order("created_at DESC").Limit(limit).Find(&customers).Error
	return customers, err
}

func (s *customerService) ImportCSV(tenantID, userID uint, records [][]string) (*ImportResult, error) {
	result := &ImportResult{}

	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) < 2 {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Baris %d: data tidak lengkap", i+1))
			continue
		}

		name := strings.TrimSpace(row[0])
		phone := strings.TrimSpace(row[1])
		if name == "" || phone == "" {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Baris %d: nama dan no WA wajib diisi", i+1))
			continue
		}

		customer := model.Customer{
			TenantID: tenantID,
			UserID:   &userID,
			Name:     name,
			Phone:    phone,
		}
		if len(row) > 2 && strings.TrimSpace(row[2]) != "" {
			email := strings.TrimSpace(row[2])
			customer.Email = &email
		}
		if len(row) > 3 && strings.TrimSpace(row[3]) != "" {
			addr := strings.TrimSpace(row[3])
			customer.Address = &addr
		}
		if len(row) > 4 && strings.TrimSpace(row[4]) != "" {
			tag := strings.TrimSpace(row[4])
			customer.Tag = &tag
		}
		if len(row) > 5 && strings.TrimSpace(row[5]) != "" {
			notes := strings.TrimSpace(row[5])
			customer.Notes = &notes
		}

		if err := s.db.Create(&customer).Error; err != nil {
			if strings.Contains(err.Error(), "duplicate") {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("Baris %d: no WA %s sudah terdaftar", i+1, phone))
			} else {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("Baris %d: %s", i+1, err.Error()))
			}
			continue
		}
		result.Success++
	}

	createActivityLog(s.db, tenantID, &userID, "import", "customer", fmt.Sprintf("Import CSV selesai: %d berhasil, %d gagal", result.Success, result.Failed), nil)

	return result, nil
}

func (s *customerService) ExportData(tenantID uint) ([]string, [][]string, error) {
	customers, err := s.All(tenantID)
	if err != nil {
		return nil, nil, err
	}

	headers := []string{"nama", "no_wa", "email", "alamat", "tag", "catatan", "sumber", "tanggal_daftar"}
	rows := make([][]string, 0, len(customers))

	for _, c := range customers {
		email := ""
		if c.Email != nil {
			email = *c.Email
		}
		address := ""
		if c.Address != nil {
			address = *c.Address
		}
		tag := ""
		if c.Tag != nil {
			tag = *c.Tag
		}
		notes := ""
		if c.Notes != nil {
			notes = *c.Notes
		}
		rows = append(rows, []string{
			c.Name, c.Phone, email, address, tag, notes, c.Source,
			c.CreatedAt.Format("2006-01-02"),
		})
	}

	return headers, rows, nil
}

func calcPages(total int, perPage int) int {
	return int(math.Ceil(float64(total) / float64(perPage)))
}
