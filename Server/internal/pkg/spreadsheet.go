package pkg

import (
	"bytes"
	"encoding/csv"
	"strings"

	"github.com/xuri/excelize/v2"
)

func isXLSX(data []byte) bool {
	return len(data) > 4 && data[0] == 0x50 && data[1] == 0x4B && data[2] == 0x03 && data[3] == 0x04
}

func ParseSpreadsheet(filename string, data []byte) ([][]string, error) {
	if isXLSX(data) || strings.HasSuffix(strings.ToLower(filename), ".xlsx") {
		return parseXLSX(data)
	}
	return parseCSV(data)
}

func parseCSV(data []byte) ([][]string, error) {
	data = bytes.TrimPrefix(data, []byte{0xEF, 0xBB, 0xBF})
	reader := csv.NewReader(bytes.NewReader(data))
	reader.FieldsPerRecord = -1
	return reader.ReadAll()
}

func parseXLSX(data []byte) ([][]string, error) {
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	if sheet == "" {
		return nil, nil
	}
	return f.GetRows(sheet)
}

func WriteSpreadsheet(format string, headers []string, rows [][]string) ([]byte, error) {
	if format == "xlsx" {
		return writeXLSX(headers, rows)
	}
	return writeCSV(headers, rows)
}

func writeCSV(headers []string, rows [][]string) ([]byte, error) {
	var b bytes.Buffer
	w := csv.NewWriter(&b)
	if err := w.Write(headers); err != nil {
		return nil, err
	}
	for _, r := range rows {
		if err := w.Write(r); err != nil {
			return nil, err
		}
	}
	w.Flush()
	return b.Bytes(), w.Error()
}

func writeXLSX(headers []string, rows [][]string) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Sheet1"
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
	for ri, row := range rows {
		for ci, val := range row {
			cell, _ := excelize.CoordinatesToCellName(ci+1, ri+2)
			f.SetCellValue(sheet, cell, val)
		}
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return b.Bytes(), nil
}