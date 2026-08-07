package service

import (
	"app-crm/internal/model"
	"app-crm/internal/pkg"

	"gorm.io/gorm"
)

type AuthService interface {
	Register(req model.RegisterRequest) (*model.LoginResponse, error)
	Login(req model.LoginRequest) (*model.LoginResponse, error)
	RefreshToken(refreshToken string) (*model.LoginResponse, error)
}

type authService struct {
	db          *gorm.DB
	userService UserService
	jwtService  pkg.JWTService
	tenantSvc   TenantService
}

func NewAuthService(db *gorm.DB, userService UserService, jwtService pkg.JWTService, tenantSvc TenantService) AuthService {
	return &authService{
		db:          db,
		userService: userService,
		jwtService:  jwtService,
		tenantSvc:   tenantSvc,
	}
}

func (s *authService) Register(req model.RegisterRequest) (*model.LoginResponse, error) {
	tenant, err := s.tenantSvc.Create(req.TenantName)
	if err != nil {
		return nil, err
	}

	user, err := s.userService.Create(tenant.ID, req.Name, req.Email, req.Password, string(model.RoleAdmin))
	if err != nil {
		return nil, err
	}

	createActivityLog(s.db, tenant.ID, &user.ID, "register", "auth",
		"Akun "+user.Email+" didaftarkan", &user.ID)

	tokens, err := s.generateTokens(user)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         *user,
	}, nil
}

func (s *authService) Login(req model.LoginRequest) (*model.LoginResponse, error) {
	user, err := s.userService.FindByEmail(req.Email)
	if err != nil {
		return nil, pkg.ErrInvalidCreds
	}

	if user.Tenant != nil && !user.Tenant.IsActive {
		return nil, pkg.ErrTenantInactive
	}

	if !user.IsActive {
		return nil, pkg.ErrNotActive
	}

	if !pkg.CheckPassword(req.Password, user.PasswordHash) {
		return nil, pkg.ErrInvalidCreds
	}

	s.userService.UpdateLastLogin(user.ID)

	createActivityLog(s.db, user.TenantID, &user.ID, "login", "auth",
		user.Name+" login ke sistem", &user.ID)

	tokens, err := s.generateTokens(user)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         *user,
	}, nil
}

func (s *authService) RefreshToken(refreshToken string) (*model.LoginResponse, error) {
	claims, err := s.jwtService.ValidateToken(refreshToken)
	if err != nil {
		return nil, pkg.ErrInvalidCreds
	}

	user, err := s.userService.FindByID(claims.UserID)
	if err != nil {
		return nil, pkg.ErrInvalidCreds
	}

	if !user.IsActive {
		return nil, pkg.ErrNotActive
	}

	if user.Tenant != nil && !user.Tenant.IsActive {
		return nil, pkg.ErrTenantInactive
	}

	tokens, err := s.generateTokens(user)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}, nil
}

func (s *authService) generateTokens(user *model.User) (*model.LoginResponse, error) {
	claims := pkg.TokenClaims{
		UserID:   user.ID,
		TenantID: user.TenantID,
		Role:     string(user.Role),
	}

	accessToken, err := s.jwtService.GenerateAccessToken(claims)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(claims)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
