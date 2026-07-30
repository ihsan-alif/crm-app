package pkg

import (
	"errors"
	"strings"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("data tidak ditemukan")
	ErrEmailExists  = errors.New("email sudah terdaftar")
	ErrInvalidCreds = errors.New("email atau password salah")
	ErrNotActive    = errors.New("akun tidak aktif")
)

func ParseValidationErrors(err error) []FieldError {
	var ve validator.ValidationErrors
	if !errors.As(err, &ve) {
		return nil
	}

	fields := make([]FieldError, len(ve))
	for i, fe := range ve {
		msg := formatValidationMessage(fe)
		fields[i] = FieldError{
			Field:   fe.Field(),
			Message: msg,
		}
	}
	return fields
}

func formatValidationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return fe.Field() + " wajib diisi"
	case "email":
		return "Format email tidak valid"
	case "min":
		return fe.Field() + " minimal " + fe.Param() + " karakter"
	case "max":
		return fe.Field() + " maksimal " + fe.Param() + " karakter"
	case "oneof":
		return fe.Field() + " harus salah satu dari: " + fe.Param()
	default:
		return fe.Field() + " tidak valid"
	}
}

func IsDuplicateError(err error) bool {
	return strings.Contains(err.Error(), "duplicate key")
}

func IsNotFoundError(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
