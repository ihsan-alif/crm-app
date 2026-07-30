package router

import (
	"qasir-crm/internal/handler"
	"qasir-crm/internal/middleware"
	"qasir-crm/internal/pkg"

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
) *gin.Engine {
	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(middleware.Logger(log))

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
			protected.GET("/users", middleware.Role("admin"), userHandler.List)

			customers := protected.Group("/customers")
			{
				customers.GET("", customerHandler.List)
				customers.GET("/:id", customerHandler.Get)
				customers.POST("", customerHandler.Create)
				customers.PUT("/:id", customerHandler.Update)
				customers.DELETE("/:id", customerHandler.Delete)
			}

			transactions := protected.Group("/transactions")
			{
				transactions.GET("", transactionHandler.List)
				transactions.GET("/:id", transactionHandler.Get)
				transactions.POST("", transactionHandler.Create)
				transactions.PUT("/:id/status", transactionHandler.UpdateStatus)
				transactions.DELETE("/:id", transactionHandler.Delete)
			}

			protected.GET("/dashboard/summary", dashboardHandler.Summary)
		}
	}

	return r
}
