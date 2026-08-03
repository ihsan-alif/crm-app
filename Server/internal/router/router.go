package router

import (
	"app-crm/internal/handler"
	"app-crm/internal/middleware"
	"app-crm/internal/pkg"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func Setup(
	log zerolog.Logger,
	jwtService pkg.JWTService,
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	customerHandler *handler.CustomerHandler,
	transactionHandler *handler.TransactionHandler,
	dashboardHandler *handler.DashboardHandler,
	whatsAppHandler *handler.WhatsAppHandler,
	activityLogHandler *handler.ActivityLogHandler,
) *gin.Engine {
	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(middleware.Logger(log))

	r.GET("/webhook/wa", whatsAppHandler.WebhookVerify)
	r.POST("/webhook/wa", whatsAppHandler.WebhookReceive)

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		protected := api.Group("")
		protected.Use(middleware.Auth(jwtService))
		{
			protected.POST("/auth/logout", authHandler.Logout)

			protected.GET("/users/me", userHandler.Me)
			protected.PUT("/users/me", userHandler.UpdateProfile)
			protected.PUT("/users/password", userHandler.ChangePassword)
			protected.GET("/users", middleware.Role("admin"), userHandler.List)

			customers := protected.Group("/customers")
			{
				customers.GET("", customerHandler.List)
				customers.GET("/template", customerHandler.Template)
				customers.GET("/export", customerHandler.Export)
				customers.POST("/import", customerHandler.Import)
				customers.GET("/:id", customerHandler.Get)
				customers.POST("", customerHandler.Create)
				customers.PUT("/:id", customerHandler.Update)
				customers.DELETE("/:id", customerHandler.Delete)
			}

			transactions := protected.Group("/transactions")
			{
				transactions.GET("", transactionHandler.List)
				transactions.GET("/export", transactionHandler.ExportCSV)
				transactions.GET("/:id", transactionHandler.Get)
				transactions.POST("", transactionHandler.Create)
				transactions.PUT("/:id", transactionHandler.Update)
				transactions.PUT("/:id/status", transactionHandler.UpdateStatus)
				transactions.DELETE("/:id", transactionHandler.Delete)
			}

			protected.GET("/dashboard", dashboardHandler.Index)

			protected.GET("/activity-logs", activityLogHandler.List)

			wa := protected.Group("/wa")
			{
				wa.GET("/config", whatsAppHandler.GetConfig)
				wa.PUT("/config", whatsAppHandler.SaveConfig)
				wa.POST("/send", whatsAppHandler.Send)
				wa.GET("/broadcasts", whatsAppHandler.ListBroadcasts)
				wa.POST("/broadcasts", whatsAppHandler.CreateBroadcast)
				wa.POST("/broadcasts/:id/send", whatsAppHandler.SendBroadcast)
				wa.GET("/messages", whatsAppHandler.ListMessages)
			}
		}
	}

	return r
}
