package page

import (
	"encoding/json"
	"fmt"
	"os"

	"meta_page_backend/app/models/message"
	"meta_page_backend/app/models/webhook"
	"meta_page_backend/message_template"
	"meta_page_backend/pkg/e"
	"meta_page_backend/pkg/request"
)

func GetMetaPageFeed() (page_info map[string]any, code int) {
	code = e.SUCCESS

	url := fmt.Sprintf("https://graph.facebook.com/%s/%s/feed?access_token=%s", os.Getenv("API_VERSION"), os.Getenv("page_id"), os.Getenv("page_access_token"))

	page_info, err := request.SendMetaGetRequest(url)
	if err != nil {
		code = e.CALLAPIERROR
	}

	return
}

func GetMetaPageComments(feed_id string) (page_info map[string]any, code int) {
	code = e.SUCCESS

	url := fmt.Sprintf("https://graph.facebook.com/%s/%s/comments?access_token=%s", os.Getenv("API_VERSION"), feed_id, os.Getenv("page_access_token"))

	page_info, err := request.SendMetaGetRequest(url)
	if err != nil {
		code = e.CALLAPIERROR
	}

	return
}

func PostMetaPageComment(feed_id, message string) (page_info map[string]any, code int) {
	code = e.SUCCESS

	url := fmt.Sprintf("https://graph.facebook.com/%s/%s/comments", os.Getenv("API_VERSION"), feed_id)

	payload := struct {
		AccessToken string
		Message     string
	}{
		AccessToken: os.Getenv("page_access_token"),
		Message:     message,
	}

	payload_json, _ := json.Marshal(payload)

	page_info, err := request.SendMetaPostRequest(url, payload_json)
	if err != nil {
		code = e.CALLAPIERROR
	}

	return
}

func DeleteMetaPageComment(comment_id string) (page_info map[string]any, code int) {
	code = e.SUCCESS

	url := fmt.Sprintf("https://graph.facebook.com/%s/%s?access_token=%s", os.Getenv("API_VERSION"), comment_id, os.Getenv("page_access_token"))

	page_info, err := request.SendMetaDeleteRequest(url)
	if err != nil {
		code = e.CALLAPIERROR
	}

	return
}

func PostMetaMessage(recipient, message_text string) (page_info map[string]any, code int) {
	code = e.SUCCESS

	url := fmt.Sprintf("https://graph.facebook.com/%s/me/messages?access_token=%s", os.Getenv("API_VERSION"), os.Getenv("page_access_token"))

	reply := message.SendRequest{
		Recipient:     message.Recipient{ID: recipient},
		Message:       message.Message{Text: message_text},
		MessagingType: "RESPONSE",
	}

	payload_json, _ := json.Marshal(reply)

	page_info, err := request.SendMetaPostRequest(url, payload_json)
	if err != nil {
		code = e.CALLAPIERROR
	}

	return
}

func HandleMetaPageWebhook(payload webhook.WebhookPayload) (code int) {
	code = e.SUCCESS

	// 確認是否為 Page message 的 Webhook
	if payload.Object == "page" {
		// 資料定位
		entry := payload.Entry[0]
		messaging := entry.Messaging[0]

		// Recipient.ID 用來判斷是否為機器人自己發的訊息，避免無限回覆自己。
		if messaging.Recipient.ID == os.Getenv("page_id") {
			sender_id := messaging.Sender.ID
			received_text := messaging.Message.Text
			postback_title := messaging.Postback.Title

			// 4. 判斷關鍵字 "早安"
			if received_text == "這是測試用口令" {
				// 啟動 Goroutine 發送回覆 (避免卡住 Webhook 回應)
				// go func() {
				message_element := webhook.Element{
					Title:    "本週住房優惠開跑！",
					Subtitle: "週一～週四入住雙人房最低 68 折",
				}

				// 訊息一
				reply := message_template.GENERAL_REPLY
				reply.Recipient.ID = sender_id
				reply.Message.Attachment.Payload.Elements = append(reply.Message.Attachment.Payload.Elements, message_element)

				reply_json, _ := json.Marshal(reply)
				resp, err := request.SendMetaPostRequest(fmt.Sprintf("https://graph.facebook.com/%s/me/messages?access_token=%s", os.Getenv("API_VERSION"), os.Getenv("page_access_token")), reply_json)
				fmt.Println("Error sending reply:", resp, err)

				// 訊息二
				reply = message_template.BOOKING_AD
				reply.Recipient.ID = sender_id

				reply_json, _ = json.Marshal(reply)
				resp, err = request.SendMetaPostRequest(fmt.Sprintf("https://graph.facebook.com/%s/me/messages?access_token=%s", os.Getenv("API_VERSION"), os.Getenv("page_access_token")), reply_json)
				fmt.Println("Error sending reply:", resp, err)

			} else if postback_title == "立即預訂" {
				// DB 貼標籤

				// 發訊息
				message_element := webhook.Element{
					Title:    "👉 查看優惠詳情與房型",
					Subtitle: "https://chatbot-poc-n3cm.vercel.app/",
					DefaultAction: &webhook.Action{
						Type:               "web_url",
						URL:                "https://chatbot-poc-n3cm.vercel.app/",
						WebviewHeightRatio: "full",
					},
					// Buttons: []webhook.Button{
					// 	{
					// 		Type:  "web_url",
					// 		Title: "👉 查看優惠詳情與房型",
					// 		URL:   "https://chatbot-poc-n3cm.vercel.app/",
					// 	},
					// },
				}

				reply := message_template.GENERAL_REPLY
				reply.Recipient.ID = sender_id
				reply.Message.Attachment.Payload.Elements = append(reply.Message.Attachment.Payload.Elements, message_element)

				reply_json, _ := json.Marshal(reply)
				resp, err := request.SendMetaPostRequest(fmt.Sprintf("https://graph.facebook.com/%s/me/messages?access_token=%s", os.Getenv("API_VERSION"), os.Getenv("page_access_token")), reply_json)
				fmt.Println("Error sending reply:", resp, err)
			}
		}
	} else {
		fmt.Println("222222")
		fmt.Printf(">>>>>>> \n%+v\n\n", payload)
	}

	return
}
