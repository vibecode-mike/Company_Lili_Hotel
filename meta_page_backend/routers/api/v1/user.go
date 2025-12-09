package v1

import (
	"meta_page_backend/app/controllers/user"
	"meta_page_backend/pkg/e"

	api "meta_page_backend/routers/api"

	"github.com/gin-gonic/gin"
)

func GetMetaUserProfile(c *gin.Context) {
	fields := c.Query("fields")
	access_token := c.Query("access_token")
	user_id := c.Query("user_id")

	page_info, code := user.GetMetaUserProfile(access_token, fields, user_id)
	if code != e.SUCCESS {
		api.Defaultreturntemplate(c, code, "")
	} else {
		api.Defaultreturntemplate(c, code, page_info)
	}

}
