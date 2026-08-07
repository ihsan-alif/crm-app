package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	DBTimeZone string

	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	ServerPort string
	ServerEnv  string

	CORSOrigins string

	WAVerifyToken string
	UploadDir    string
}

func Load() *Config {
	godotenv.Load("../../.env")

	return &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		DBSSLMode:  os.Getenv("DB_SSLMODE"),
		DBTimeZone: getEnv("DB_TIME_ZONE", "Asia/Jakarta"),

		JWTSecret:        os.Getenv("JWT_SECRET"),
		JWTAccessExpiry:  parseDuration("JWT_ACCESS_EXPIRY", 15*time.Minute),
		JWTRefreshExpiry: parseDuration("JWT_REFRESH_EXPIRY", 7*24*time.Hour),

		ServerPort: os.Getenv("SERVER_PORT"),
		ServerEnv:  os.Getenv("SERVER_ENV"),

		CORSOrigins: os.Getenv("CORS_ORIGINS"),

		WAVerifyToken: os.Getenv("WA_VERIFY_TOKEN"),
	UploadDir:     getEnv("UPLOAD_DIR", "uploads"),
	}
}

func parseDuration(key string, def time.Duration) time.Duration {
	val := os.Getenv(key)
	if val == "" {
		return def
	}
	d, err := time.ParseDuration(val)
	if err != nil {
		return def
	}
	return d
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func (c *Config) IsProduction() bool {
	return c.ServerEnv == "production"
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=" + c.DBTimeZone
}
