package main

import (
	"os"
	"os/signal"
	"syscall"

	"qasir-crm/internal/config"
	"qasir-crm/internal/handler"
	"qasir-crm/internal/middleware"
	"qasir-crm/internal/pkg"
	"qasir-crm/internal/repository"
	"qasir-crm/internal/router"
	"qasir-crm/internal/service"

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
	authSvc := service.NewAuthService(userSvc, jwtService, tenantSvc)
	customerSvc := service.NewCustomerService(db)
	transactionSvc := service.NewTransactionService(db)

	authHandler := handler.NewAuthHandler(authSvc)
	userHandler := handler.NewUserHandler(userSvc)
	customerHandler := handler.NewCustomerHandler(customerSvc)
	transactionHandler := handler.NewTransactionHandler(transactionSvc)
	dashboardHandler := handler.NewDashboardHandler(customerSvc, transactionSvc)

	r := router.Setup(log, jwtService, authHandler, userHandler, customerHandler, transactionHandler, dashboardHandler)
	r.Use(middleware.CORS(cfg.CORSOrigins))

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
