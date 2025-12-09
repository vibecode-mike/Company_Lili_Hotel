package message_template

import "meta_page_backend/app/models/webhook"

var (
	GENERAL_REPLY = webhook.ReplyBody{
		Recipient: webhook.User{ID: ""},
		Message: webhook.ReplyMessage{
			Attachment: &webhook.Attachment{
				Type: "template",
				Payload: webhook.GenericTemplatePayload{
					TemplateType: "generic",
					Elements:     []webhook.Element{},
				},
			},
		},
	}

	BOOKING_AD = webhook.ReplyBody{
		Recipient: webhook.User{ID: ""}, // 在使用時再填入 sender_id
		Message: webhook.ReplyMessage{
			Attachment: &webhook.Attachment{
				Type: "template",
				Payload: webhook.GenericTemplatePayload{
					TemplateType: "generic",
					Elements: []webhook.Element{
						{
							Title:    "🎉 你符合本週平日住房優惠資格！",
							Subtitle: "雙人房 限時 68 折，僅剩 8 間",
							ImageURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9h9_oJPww83HRiwVd771_JqtXPpm8vytzdg&s",
							DefaultAction: &webhook.Action{
								Type: "web_url",
								URL:  "https://www.shopee.com",
							},
							Buttons: []webhook.Button{
								{
									Type:    "postback",
									Title:   "立即預訂",
									Payload: "#雙人房, #促銷活動",
								},
								{
									Type:  "web_url",
									Title: "查看更多",
									URL:   "https://www.google.com",
								},
							},
						},
					},
				},
			},
		},
	}
)
