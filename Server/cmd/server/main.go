package main

import (
	"os"
	"os/signal"
	"syscall"

	"app-crm/internal/config"
	"app-crm/internal/handler"
	"app-crm/internal/middleware"
	"app-crm/internal/pkg"
	"app-crm/internal/repository"
	"app-crm/internal/router"
	"app-crm/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func main() {
	cfg := config.Load()

	log := zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout}).
		With().Timestamp().Logger()
	if cfg.IsProduction() {
		log = zerolog.New(os.Stderr).With().Timestamp().Logger()
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := repository.NewDB(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Gagal konek database")
	}
	log.Info().Msg("Database connected")

	if err := repository.AutoMigrate(db); err != nil {
		log.Fatal().Err(err).Msg("Gagal migrasi database")
	}
	log.Info().Msg("Database migrated")

	jwtService := pkg.NewJWTService(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)

	tenantSvc := service.NewTenantService(db)
	userSvc := service.NewUserService(db)
	authSvc := service.NewAuthService(db, userSvc, jwtService, tenantSvc)
	customerSvc := service.NewCustomerService(db)
	productSvc := service.NewProductService(db)
	transactionSvc := service.NewTransactionService(db)
	whatsAppSvc := service.NewWhatsAppService(db)
	activitySvc := service.NewActivityLogService(db)

	authHandler := handler.NewAuthHandler(authSvc)
	userHandler := handler.NewUserHandler(userSvc)
	tenantHandler := handler.NewTenantHandler(tenantSvc, cfg.UploadDir)
	customerHandler := handler.NewCustomerHandler(customerSvc)
	productHandler := handler.NewProductHandler(productSvc)
	transactionHandler := handler.NewTransactionHandler(transactionSvc)
	dashboardHandler := handler.NewDashboardHandler(customerSvc, transactionSvc)
	whatsAppHandler := handler.NewWhatsAppHandler(whatsAppSvc, cfg.WAVerifyToken)
	activityLogHandler := handler.NewActivityLogHandler(activitySvc)

	r := router.Setup(log, jwtService, authHandler, userHandler, tenantHandler, customerHandler, productHandler, transactionHandler, dashboardHandler, whatsAppHandler, activityLogHandler)
	r.Use(middleware.CORS(cfg.CORSOrigins))
	r.Static("/uploads", cfg.UploadDir)

	go func() {
		log.Info().Str("port", cfg.ServerPort).Msg("Server started")
		if err := r.Run(":" + cfg.ServerPort); err != nil {
			log.Fatal().Err(err).Msg("Server gagal start")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("Server shutdown")
}
