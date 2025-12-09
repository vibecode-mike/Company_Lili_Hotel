package v1

import (
	"fmt"
	"meta_page_backend/app/controllers/page"
	"meta_page_backend/app/models/webhook"
	"meta_page_backend/pkg/e"
	api "meta_page_backend/routers/api"

	"github.com/gin-gonic/gin"
)

// MetaHook 處理 Meta Webhook 驗證
func MetaHook(c *gin.Context) {
	mode := c.Query("hub.mode")
	challenge := c.Query("hub.challenge")
	verify_token := c.Query("hub.verify_token")
	expected_verify_token := "ren_verify_12345"

	// Meta 驗證有要求回傳固定格式，不能用我們自己包好的 response 格式。
	if mode == "subscribe" && verify_token == expected_verify_token {
		c.String(200, challenge)
	} else {
		c.String(403, "Forbidden")
	}
}

// MetaHookPost 接收 meta webhook 的資料
func MetaHookPost(c *gin.Context) {
	var input webhook.WebhookPayload
	// var input any

	if err := c.Bind(&input); err != nil {
		api.Defaultreturntemplate(c, e.PARAMETER_ERROR, "")
		return
	}

	fmt.Printf("======\n %+v\n\n", input)
	code := page.HandleMetaPageWebhook(input)
	api.Defaultreturntemplate(c, code, input)
}

// GetMetaPageFeed 取得 Meta 粉絲專頁貼文
func GetMetaPageFeed(c *gin.Context) {
	page_info, code := page.GetMetaPageFeed()
	if code != e.SUCCESS {
		api.Defaultreturntemplate(c, code, "")
	} else {
		api.Defaultreturntemplate(c, code, page_info)
	}
}

// GetMetaPageComments 取得 Meta 粉絲專頁貼文留言
func GetMetaPageComments(c *gin.Context) {
	feed_id := c.Query("feed_id")

	page_info, code := page.GetMetaPageComments(feed_id)
	if code != e.SUCCESS {
		api.Defaultreturntemplate(c, code, "")
	} else {
		api.Defaultreturntemplate(c, code, page_info)
	}
}

// PostMetaPageComment 發布留言到指定貼文
func PostMetaPageComment(c *gin.Context) {
	input := struct {
		Message string `json:"message"`
		FeedId  string `json:"feed_id"`
	}{}

	if err := c.Bind(&input); err != nil {
		api.Defaultreturntemplate(c, e.PARAMETER_ERROR, "")
		return
	}

	page_info, code := page.PostMetaPageComment(input.FeedId, input.Message)
	if code != e.SUCCESS {
		api.Defaultreturntemplate(c, code, "")
	} else {
		api.Defaultreturntemplate(c, code, page_info)
	}
}

// DeleteMetaPageComment 刪除指定留言
func DeleteMetaPageComment(c *gin.Context) {
	comment_id := c.Query("comment_id")

	page_info, code := page.DeleteMetaPageComment(comment_id)
	if code != e.SUCCESS {
		api.Defaultreturntemplate(c, code, "")
	} else {
		api.Defaultreturntemplate(c, code, page_info)
	}
}

// PostMetaMessage 主動發送訊息
func PostMetaMessage(c *gin.Context) {
	message_request := struct {
		Recipient string `json:"recipient"`
		Text      string `json:"text"`
	}{}

	err := c.ShouldBind(&message_request)
	if err != nil {
		api.Defaultreturntemplate(c, e.PARAMETER_ERROR, "")
		return
	}

	page_info, code := page.PostMetaMessage(message_request.Recipient, message_request.Text)
	if code != e.SUCCESS {
		api.Defaultreturntemplate(c, code, "")
	} else {
		api.Defaultreturntemplate(c, code, page_info)
	}
}
