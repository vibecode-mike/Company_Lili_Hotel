package webhook

// ===== Webhook 接收的資料結構 =====
type WebhookPayload struct {
	Object string  `json:"object"`
	Entry  []Entry `json:"entry"`
}

type Entry struct {
	ID        string      `json:"id"`
	Messaging []Messaging `json:"messaging"`
	Time      float64     `json:"time"`
}

type Messaging struct {
	Sender    User            `json:"sender"`
	Recipient User            `json:"recipient"`
	Timestamp float64         `json:"timestamp"`
	Message   Message         `json:"message,omitempty"` // 使用指標，若無此欄位則為 nil
	Postback  PostbackPayload `json:"postback,omitempty"`
}

type User struct {
	ID string `json:"id"`
}

type Message struct {
	MID    string `json:"mid"`
	Text   string `json:"text,omitempty"`
	IsEcho bool   `json:"is_echo,omitempty"` // 重要：用來判斷是否為機器人自己發的訊息
}

// ===== 定義發送給 Meta 的回覆結構 (Button Template) =====
type ReplyBody struct {
	Recipient User         `json:"recipient"`
	Message   ReplyMessage `json:"message"`
}

type ReplyMessage struct {
	Attachment *Attachment `json:"attachment,omitempty"`
}

type Attachment struct {
	Type    string                 `json:"type"`
	Payload GenericTemplatePayload `json:"payload"`
}

type TemplatePayload struct {
	TemplateType string    `json:"template_type"`
	Elements     []Element `json:"elements"`
}

type GenericTemplatePayload struct {
	TemplateType string    `json:"template_type"`
	Elements     []Element `json:"elements,omitempty"`
}

type Element struct {
	Title         string   `json:"title"`
	Subtitle      string   `json:"subtitle,omitempty"`
	ImageURL      string   `json:"image_url,omitempty"`
	DefaultAction *Action  `json:"default_action,omitempty"`
	Buttons       []Button `json:"buttons,omitempty"`
}

type Button struct {
	Type    string `json:"type"`
	URL     string `json:"url,omitempty"`
	Title   string `json:"title"`
	Payload string `json:"payload,omitempty"`
}

type Action struct {
	Type               string `json:"type"`
	URL                string `json:"url"`
	MessageExtensions  bool   `json:"messenger_extensions,omitempty"`
	WebviewHeightRatio string `json:"webview_height_ratio,omitempty"`
	FallbackURL        string `json:"fallback_url,omitempty"`
}

// ===== Postback 按鈕的 request payload =====
type PostbackPayload struct {
	Title   string `json:"title"`
	Payload string `json:"payload"`
	Mid     string `json:"mid"`
}
