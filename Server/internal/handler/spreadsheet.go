package handler

import (
	"fmt"

	"app-crm/internal/pkg"

	"github.com/gin-gonic/gin"
)

func serveSpreadsheet(c *gin.Context, format, baseName string, headers []string, rows [][]string) {
	data, err := pkg.WriteSpreadsheet(format, headers, rows)
	if err != nil {
		pkg.InternalError(c)
		return
	}

	if format == "xlsx" {
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.xlsx", baseName))
	} else {
		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.csv", baseName))
	}
	c.Data(200, "", data)
}