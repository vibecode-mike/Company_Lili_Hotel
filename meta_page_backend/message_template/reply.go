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

	// BOOKING_AD is a canned carousel promoting weekday room discounts.
	BOOKING_AD = webhook.ReplyBody{
		Recipient: webhook.User{ID: ""},
		Message: webhook.ReplyMessage{
			Attachment: &webhook.Attachment{
				Type: "template",
				Payload: webhook.GenericTemplatePayload{
					TemplateType: "generic",
					Elements: []webhook.Element{
						{
							Title:    "Weekday room promotion",
							Subtitle: "Double room from 68% of standard price; only 8 rooms left.",
							ImageURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9h9_oJPww83HRiwVd771_JqtXPpm8vytzdg&s",
							DefaultAction: &webhook.Action{
								Type: "web_url",
								URL:  "https://www.shopee.com",
							},
							Buttons: []webhook.Button{
								{
									Type:    "postback",
									Title:   "Book now",
									Payload: "#double_room,#campaign",
								},
								{
									Type:  "web_url",
									Title: "View more",
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

// NewGeneralReply creates an empty generic template reply shell.
func NewGeneralReply() webhook.ReplyBody {
	return webhook.ReplyBody{
		Recipient: webhook.User{},
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
}
