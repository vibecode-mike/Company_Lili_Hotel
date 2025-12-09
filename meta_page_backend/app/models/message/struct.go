package message

// ===== 定義發送給 Meta 的回覆結構 (簡單文字訊息) =====
type Recipient struct {
	ID string `json:"id"`
}

type Message struct {
	Text string `json:"text"`
}

type SendRequest struct {
	Recipient     Recipient `json:"recipient"`
	Message       Message   `json:"message"`
	MessagingType string    `json:"messaging_type"`
}
