package user

import (
	"fmt"
	"meta_page_backend/pkg/e"
	"meta_page_backend/pkg/request"
	"os"
)

func GetMetaUserProfile(access_token, fields, user_id string) (page_info map[string]any, code int) {
	code = e.SUCCESS

	url := fmt.Sprintf("https://graph.facebook.com/%s/%s?fields=%s&access_token=%s", os.Getenv("API_VERSION"), user_id, fields, access_token)

	page_info, err := request.SendMetaGetRequest(url)
	if err != nil {
		code = e.CALLAPIERROR
	}

	return
}
