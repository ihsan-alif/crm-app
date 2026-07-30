package repository

import (
	"qasir-crm/internal/config"
	"qasir-crm/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDB(cfg *config.Config) (*gorm.DB, error) {
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

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.Tenant{},
		&model.User{},
		&model.Customer{},
		&model.Transaction{},
		&model.TransactionItem{},
	)
}
