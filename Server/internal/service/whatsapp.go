package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"app-crm/internal/model"
	"app-crm/internal/pkg"

	"gorm.io/gorm"
)

type WAConfig struct {
	PhoneNumberID string `json:"phone_number_id"`
	Token         string `json:"token"`
	IsActive      bool   `json:"is_active"`
}

type WhatsAppService interface {
	GetConfig(tenantID uint) (*WAConfig, error)
	SaveConfig(tenantID, userID uint, cfg WAConfig) error
	SendMessage(tenantID, userID, customerID uint, message string) (*model.WAMessage, error)
	CreateBroadcast(tenantID, userID uint, req model.WABroadcastRequest) (*model.WABroadcast, error)
	SendBroadcast(tenantID, userID, broadcastID uint) error
	ListBroadcasts(tenantID uint) ([]model.WABroadcast, error)
	ListMessages(tenantID uint, customerID uint) ([]model.WAMessage, error)
	HandleWebhook(payload []byte) error
}

type whatsAppService struct {
	db *gorm.DB
	hc *http.Client
}

func NewWhatsAppService(db *gorm.DB) WhatsAppService {
	return &whatsAppService{
		db: db,
		hc: &http.Client{Timeout: 15 * time.Second},
	}
}

func (s *whatsAppService) GetConfig(tenantID uint) (*WAConfig, error) {
	var tenant model.Tenant
	if err := s.db.First(&tenant, tenantID).Error; err != nil {
		return nil, err
	}
	settings := tenant.Settings
	cfg := WAConfig{}
	if wa, ok := settings["whatsapp"]; ok {
		if m, ok := wa.(map[string]any); ok {
			cfg.PhoneNumberID, _ = m["phone_number_id"].(string)
			cfg.Token, _ = m["token"].(string)
			cfg.IsActive, _ = m["is_active"].(bool)
		}
	}
	return &cfg, nil
}

func (s *whatsAppService) SaveConfig(tenantID, userID uint, cfg WAConfig) error {
	var tenant model.Tenant
	if err := s.db.First(&tenant, tenantID).Error; err != nil {
		return err
	}
	settings := tenant.Settings
	if settings == nil {
		settings = model.TenantConfig{}
	}
	settings["whatsapp"] = map[string]any{
		"phone_number_id": cfg.PhoneNumberID,
		"token":           cfg.Token,
		"is_active":       cfg.IsActive,
	}
	if err := s.db.Model(&tenant).Update("settings", settings).Error; err != nil {
		return err
	}

	createActivityLog(s.db, tenantID, &userID, "update", "whatsapp", "Konfigurasi WhatsApp diperbarui", nil)
	return nil
}

func (s *whatsAppService) SendMessage(tenantID, userID, customerID uint, message string) (*model.WAMessage, error) {
	cfg, err := s.GetConfig(tenantID)
	if err != nil || !cfg.IsActive {
		return nil, fmt.Errorf("WhatsApp belum dikonfigurasi")
	}

	customer, err := s.findCustomer(tenantID, customerID)
	if err != nil {
		return nil, pkg.ErrNotFound
	}

	phone := normalizePhone(customer.Phone)
	personalized := replacePlaceholders(message, customer.Name, customer.Phone)

	waID, apiErr := s.callAPI(cfg.PhoneNumberID, cfg.Token, phone, personalized)

	status := model.WASuccess
	var waMsgID, errMsg *string
	if apiErr != nil {
		status = model.WAError
		errStr := apiErr.Error()
		errMsg = &errStr
	} else {
		waMsgID = &waID
	}

	now := time.Now()
	msg := model.WAMessage{
		TenantID:    tenantID,
		CustomerID:  &customerID,
		Phone:       phone,
		Direction:   model.WAOutbound,
		Message:     personalized,
		Status:      status,
		WAMessageID: waMsgID,
		ErrorMsg:    errMsg,
		SentAt:      &now,
	}
	s.db.Create(&msg)

	createActivityLog(s.db, tenantID, &userID, "send", "whatsapp",
		"Pesan WhatsApp dikirim ke "+customer.Name, &customerID)

	return &msg, apiErr
}

func (s *whatsAppService) CreateBroadcast(tenantID, userID uint, req model.WABroadcastRequest) (*model.WABroadcast, error) {
	b := &model.WABroadcast{
		TenantID:  tenantID,
		UserID:    &userID,
		Title:     req.Title,
		Message:   req.Message,
		TargetAll: req.All,
		Status:    model.WADraft,
	}
	if req.Tag != nil && *req.Tag != "" {
		b.TargetTag = req.Tag
	}
	if err := s.db.Create(b).Error; err != nil {
		return nil, err
	}
	return b, nil
}

func (s *whatsAppService) SendBroadcast(tenantID, userID, broadcastID uint) error {
	cfg, err := s.GetConfig(tenantID)
	if err != nil || !cfg.IsActive {
		return fmt.Errorf("WhatsApp belum dikonfigurasi")
	}

	var broadcast model.WABroadcast
	if err := s.db.Where("tenant_id = ? AND id = ?", tenantID, broadcastID).First(&broadcast).Error; err != nil {
		return pkg.ErrNotFound
	}

	s.db.Model(&broadcast).Update("status", model.WASending)

	var customers []model.Customer
	query := s.db.Where("tenant_id = ?", tenantID)
	if broadcast.TargetAll {
		// semua pelanggan
	} else if broadcast.TargetTag != nil {
		query = query.Where("tag = ?", *broadcast.TargetTag)
	}
	query.Find(&customers)

	sent, failed := 0, 0
	for _, c := range customers {
		phone := normalizePhone(c.Phone)
		personalized := replacePlaceholders(broadcast.Message, c.Name, c.Phone)

		waID, apiErr := s.callAPI(cfg.PhoneNumberID, cfg.Token, phone, personalized)

		status := model.WASuccess
		var waMsgID, errMsg *string
		if apiErr != nil {
			status = model.WAError
			failed++
			errStr := apiErr.Error()
			errMsg = &errStr
		} else {
			sent++
			waMsgID = &waID
		}

		now := time.Now()
		s.db.Create(&model.WAMessage{
			TenantID:    tenantID,
			BroadcastID: &broadcast.ID,
			CustomerID:  &c.ID,
			Phone:       phone,
			Direction:   model.WAOutbound,
			Message:     personalized,
			Status:      status,
			WAMessageID: waMsgID,
			ErrorMsg:    errMsg,
			SentAt:      &now,
		})
	}

	now := time.Now()
	total := len(customers)
	s.db.Model(&broadcast).Updates(map[string]any{
		"status":   model.WASent,
		"total":    total,
		"sent":     sent,
		"failed":   failed,
		"sent_at":  now,
	})

	createActivityLog(s.db, tenantID, &userID, "broadcast", "whatsapp",
		fmt.Sprintf("Broadcast %q dikirim ke %d pelanggan (%d terkirim, %d gagal)", broadcast.Title, total, sent, failed), &broadcast.ID)

	return nil
}

func (s *whatsAppService) ListBroadcasts(tenantID uint) ([]model.WABroadcast, error) {
	var list []model.WABroadcast
	err := s.db.Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (s *whatsAppService) ListMessages(tenantID uint, customerID uint) ([]model.WAMessage, error) {
	var list []model.WAMessage
	err := s.db.Where("tenant_id = ? AND customer_id = ?", tenantID, customerID).
		Order("created_at DESC").Limit(50).Find(&list).Error
	return list, err
}

func (s *whatsAppService) HandleWebhook(payload []byte) error {
	var data waWebhookPayload
	if err := json.Unmarshal(payload, &data); err != nil {
		return err
	}
	if data.Object != "whatsapp_business_account" {
		return nil
	}

	for _, entry := range data.Entry {
		for _, change := range entry.Changes {
			value := change.Value
			if value.Metadata.PhoneNumberID == "" {
				continue
			}
			tenantID, err := s.findTenantByPhoneID(value.Metadata.PhoneNumberID)
			if err != nil {
				continue
			}
			if len(value.Messages) > 0 {
				s.saveInboundMessages(tenantID, value)
			}
			if len(value.Statuses) > 0 {
				s.updateMessageStatuses(tenantID, value.Statuses)
			}
		}
	}
	return nil
}

func (s *whatsAppService) findTenantByPhoneID(phoneID string) (uint, error) {
	var tenant model.Tenant
	err := s.db.Where("settings -> 'whatsapp' ->> 'phone_number_id' = ?", phoneID).First(&tenant).Error
	return tenant.ID, err
}

func (s *whatsAppService) saveInboundMessages(tenantID uint, value waWebhookValue) {
	for _, msg := range value.Messages {
		name := ""
		for _, contact := range value.Contacts {
			if contact.WAID == msg.From {
				name = contact.Profile.Name
				break
			}
		}

		customer, err := s.findOrCreateCustomer(tenantID, msg.From, name)
		if err != nil {
			continue
		}

		now := time.Now()
		waMsgID := msg.ID
		s.db.Create(&model.WAMessage{
			TenantID:    tenantID,
			CustomerID:  &customer.ID,
			Phone:       msg.From,
			Direction:   model.WAInbound,
			Message:     msg.Text.Body,
			Status:      model.WASuccess,
			WAMessageID: &waMsgID,
			SentAt:      &now,
		})
		s.db.Model(&model.Customer{}).Where("id = ?", customer.ID).
			Update("last_contacted_at", now)
	}
}

func (s *whatsAppService) updateMessageStatuses(tenantID uint, statuses []waWebhookStatus) {
	for _, st := range statuses {
		status := mapStatus(st.Status)
		if status == "" {
			continue
		}
		s.db.Model(&model.WAMessage{}).
			Where("tenant_id = ? AND wa_message_id = ?", tenantID, st.ID).
			Update("status", status)
	}
}

func mapStatus(s string) model.WAMessageStatus {
	switch s {
	case "sent", "delivered", "read":
		return model.WASuccess
	case "failed":
		return model.WAError
	default:
		return ""
	}
}

func (s *whatsAppService) findOrCreateCustomer(tenantID uint, phone, name string) (*model.Customer, error) {
	norm := normalizePhone(phone)

	var customers []model.Customer
	s.db.Where("tenant_id = ?", tenantID).Find(&customers)
	for i := range customers {
		if normalizePhone(customers[i].Phone) == norm {
			return &customers[i], nil
		}
	}

	customer := &model.Customer{
		TenantID: tenantID,
		Name:     name,
		Phone:    phone,
		Source:   "whatsapp",
	}
	if customer.Name == "" {
		customer.Name = phone
	}
	if err := s.db.Create(customer).Error; err != nil {
		return nil, err
	}
	return customer, nil
}

type waWebhookPayload struct {
	Object string            `json:"object"`
	Entry  []waWebhookEntry  `json:"entry"`
}

type waWebhookEntry struct {
	ID      string             `json:"id"`
	Changes []waWebhookChange  `json:"changes"`
}

type waWebhookChange struct {
	Value waWebhookValue `json:"value"`
	Field string         `json:"field"`
}

type waWebhookValue struct {
	MessagingProduct string              `json:"messaging_product"`
	Metadata         waWebhookMetadata   `json:"metadata"`
	Contacts         []waWebhookContact  `json:"contacts"`
	Messages         []waWebhookMessage  `json:"messages"`
	Statuses         []waWebhookStatus   `json:"statuses"`
}

type waWebhookMetadata struct {
	DisplayPhoneNumber string `json:"display_phone_number"`
	PhoneNumberID      string `json:"phone_number_id"`
}

type waWebhookContact struct {
	Profile struct {
		Name string `json:"name"`
	} `json:"profile"`
	WAID string `json:"wa_id"`
}

type waWebhookMessage struct {
	From      string `json:"from"`
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Type      string `json:"type"`
	Text      struct {
		Body string `json:"body"`
	} `json:"text"`
}

type waWebhookStatus struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

func (s *whatsAppService) findCustomer(tenantID, customerID uint) (*model.Customer, error) {
	var c model.Customer
	err := s.db.Where("tenant_id = ? AND id = ?", tenantID, customerID).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *whatsAppService) callAPI(phoneID, token, to, message string) (string, error) {
	body := map[string]any{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              "text",
		"text":              map[string]string{"body": message},
	}
	data, _ := json.Marshal(body)

	req, err := http.NewRequest("POST",
		fmt.Sprintf("https://graph.facebook.com/v21.0/%s/messages", phoneID),
		bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.hc.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal terhubung ke WA API: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Messages []struct {
			ID string `json:"id"`
		} `json:"messages"`
		Error *struct {
			Message string `json:"message"`
			Code    int    `json:"code"`
		} `json:"error"`
	}
	json.NewDecoder(resp.Body).Decode(&result)

	if result.Error != nil {
		return "", fmt.Errorf("WA API error (%d): %s", result.Error.Code, result.Error.Message)
	}
	if len(result.Messages) > 0 {
		return result.Messages[0].ID, nil
	}
	return "", fmt.Errorf("tidak ada response dari WA API")
}

func normalizePhone(phone string) string {
	phone = strings.TrimSpace(phone)
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, "+", "")
	if strings.HasPrefix(phone, "0") {
		phone = "62" + phone[1:]
	}
	return phone
}

func replacePlaceholders(msg, name, phone string) string {
	r := strings.NewReplacer(
		"{nama}", name,
		"{name}", name,
		"{telepon}", phone,
		"{phone}", phone,
	)
	return r.Replace(msg)
}
