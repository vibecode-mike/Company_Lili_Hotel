package api

import (
	"meta_page_backend/pkg/e"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Defaultreturntemplate 一般回傳格式
func Defaultreturntemplate(c *gin.Context, code int, detail interface{}) {
	if detail != "" && detail != "error" {
		c.JSON(http.StatusOK, gin.H{
			"status": code,
			"msg":    e.GetMsg(code),
			"data":   detail,
		})
		return
	} else if detail == "error" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error_code": code,
			"msg":        e.GetMsg(code),
		})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{
			"status": code,
			"msg":    e.GetMsg(code),
		})
		return
	}
}

// InInt 判斷是否存在於陣列
func InInt(target int, str_array []int) bool {
	for _, element := range str_array {
		if target == element {
			return true
		}
	}
	return false
}

// InStr 判斷是否存在於陣列
func InStr(target string, str_array []string) bool {
	for _, element := range str_array {
		if target == element {
			return true
		}
	}
	return false
}
