package handler

import (
	"fmt"
	"io"
	"net/http"

	"app-crm/internal/model"
	"app-crm/internal/pkg"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type WhatsAppHandler struct {
	waService   service.WhatsAppService
	verifyToken string
}

func NewWhatsAppHandler(waService service.WhatsAppService, verifyToken string) *WhatsAppHandler {
	return &WhatsAppHandler{waService: waService, verifyToken: verifyToken}
}

func (h *WhatsAppHandler) WebhookVerify(c *gin.Context) {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode == "subscribe" && token == h.verifyToken {
		c.String(http.StatusOK, challenge)
		return
	}
	c.JSON(http.StatusForbidden, gin.H{"error": "Verifikasi webhook gagal"})
}

func (h *WhatsAppHandler) WebhookReceive(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"received": false})
		return
	}
	if err := h.waService.HandleWebhook(payload); err != nil {
		fmt.Println("WA webhook error:", err)
	}
	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *WhatsAppHandler) GetConfig(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	cfg, err := h.waService.GetConfig(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}
	cfg.Token = maskToken(cfg.Token)
	pkg.OK(c, cfg)
}

func (h *WhatsAppHandler) SaveConfig(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	var cfg service.WAConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		pkg.BadRequest(c, "Format data tidak valid")
		return
	}
	if err := h.waService.SaveConfig(tenantID, pkg.UserID(c), cfg); err != nil {
		pkg.InternalError(c)
		return
	}
	pkg.OK(c, gin.H{"message": "Konfigurasi WhatsApp berhasil disimpan"})
}

func (h *WhatsAppHandler) Send(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	userID := pkg.UserID(c)

	var req model.WASendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	msg, err := h.waService.SendMessage(tenantID, userID, req.CustomerID, req.Message)
	if err != nil {
		pkg.BadRequest(c, err.Error())
		return
	}

	pkg.Created(c, msg)
}

func (h *WhatsAppHandler) CreateBroadcast(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	userID := pkg.UserID(c)

	var req model.WABroadcastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		details := pkg.ParseValidationErrors(err)
		if details != nil {
			pkg.ValidationError(c, details)
		} else {
			pkg.BadRequest(c, "Format data tidak valid")
		}
		return
	}

	b, err := h.waService.CreateBroadcast(tenantID, userID, req)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.Created(c, b)
}

func (h *WhatsAppHandler) SendBroadcast(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	id, ok := pkg.ParsePathID(c)
	if !ok {
		pkg.BadRequest(c, "ID tidak valid")
		return
	}

	if err := h.waService.SendBroadcast(tenantID, pkg.UserID(c), id); err != nil {
		pkg.BadRequest(c, err.Error())
		return
	}

	pkg.OK(c, gin.H{"message": "Broadcast sedang dikirim"})
}

func (h *WhatsAppHandler) ListBroadcasts(c *gin.Context) {
	tenantID := pkg.TenantID(c)

	list, err := h.waService.ListBroadcasts(tenantID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, list)
}

func (h *WhatsAppHandler) ListMessages(c *gin.Context) {
	tenantID := pkg.TenantID(c)
	customerID, err := uuid.Parse(c.Query("customer_id"))
	if err != nil || customerID == uuid.Nil {
		pkg.BadRequest(c, "customer_id wajib diisi")
		return
	}

	list, err := h.waService.ListMessages(tenantID, customerID)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	pkg.OK(c, list)
}

func maskToken(token string) string {
	if len(token) <= 8 {
		return "****"
	}
	return token[:4] + "****" + token[len(token)-4:]
}
