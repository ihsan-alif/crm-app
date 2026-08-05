package repository

import (
	"fmt"
	"regexp"
	"app-crm/internal/config"
	"app-crm/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDB(cfg *config.Config) (*gorm.DB, error) {
	if err := createDBIfNotExist(cfg); err != nil {
		return nil, fmt.Errorf("gagal buat database: %w", err)
	}

	logLevel := logger.Warn
	if !cfg.IsProduction() {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)

	return db, nil
}

func createDBIfNotExist(cfg *config.Config) error {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBSSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Warn)})
	if err != nil {
		return err
	}

	var exists int64
	db.Raw("SELECT 1 FROM pg_database WHERE datname = ?", cfg.DBName).Scan(&exists)
	if exists == 0 {
		if !regexp.MustCompile(`^[a-zA-Z0-9_-]+$`).MatchString(cfg.DBName) {
			return fmt.Errorf("nama database tidak valid: %s", cfg.DBName)
		}
		db.Exec(fmt.Sprintf(`CREATE DATABASE "%s"`, cfg.DBName))
	}

	sqlDB, _ := db.DB()
	sqlDB.Close()
	return nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.Tenant{},
		&model.User{},
		&model.Customer{},
		&model.Product{},
		&model.Transaction{},
		&model.TransactionItem{},
		&model.WABroadcast{},
		&model.WAMessage{},
		&model.ActivityLog{},
	)
}
