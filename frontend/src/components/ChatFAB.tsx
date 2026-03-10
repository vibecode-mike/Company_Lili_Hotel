import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  sendChatbotMessage,
  confirmChatbotRooms,
  saveChatbotBooking,
  type RoomCard,
  type BookingContext,
} from "../utils/chatbotApi";
import chatfabLogo from "../assets/chatfab-logo.svg";
import chatfabOaIcon from "../assets/chatfab-oa-icon.svg";
import chatfabSend from "../assets/chatfab-send.svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MemberFormField = {
  field_name: string;
  label: string;
  is_required: boolean;
  input_type: "text" | "tel" | "email";
  validation_pattern?: string | null;
  error_message?: string | null;
};

type ChatMessage =
  | { id: string; role: "user"; type: "text"; text: string }
  | { id: string; role: "bot"; type: "text"; text: string }
  | {
      id: string;
      role: "bot";
      type: "room_cards";
      text: string;
      cards: RoomCard[];
      bookingContext: BookingContext;
    }
  | {
      id: string;
      role: "bot";
      type: "member_form";
      text: string;
      fields: MemberFormField[];
      privacyNote: string;
    }
  | {
      id: string;
      role: "bot";
      type: "booking_result";
      reservationId: string;
      cartUrl?: string | null;
    };

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

const BOT_AVATAR = (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: "62.222px",
      background: "#dbebff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      alignSelf: "flex-end",
    }}
  >
    <img src={chatfabOaIcon} alt="" style={{ width: 18.8, height: 18.8 }} />
  </div>
);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TextBubble({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        justifyContent: isUser ? "flex-end" : "flex-start",
        width: "100%",
        flexShrink: 0,
      }}
    >
      {!isUser && BOT_AVATAR}
      <div
        style={{
          maxWidth: 246,
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "#dbedff" : "#f8fafc",
          color: "#383838",
          fontSize: 14,
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 400,
          lineHeight: "22.4px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function CounterButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "1.5px solid",
        borderColor: disabled ? "#e5e7eb" : "#0f6beb",
        background: "#fff",
        color: disabled ? "#9ca3af" : "#0f6beb",
        fontSize: 16,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        flexShrink: 0,
        padding: 0,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

function RoomCardItem({
  card,
  count,
  onIncrease,
  onDecrease,
  disabled,
}: {
  card: RoomCard;
  count: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled: boolean;
}) {
  const maxCount = card.available_count ?? 9;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
        overflow: "hidden",
        border: count > 0 ? "1.5px solid #0f6beb" : "1.5px solid #e5e7eb",
        transition: "border-color 0.2s",
      }}
    >
      {card.image_url && (
        <img
          src={card.image_url}
          alt={card.room_type_name}
          style={{
            width: "100%",
            height: 88,
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: "#383838",
            marginBottom: 2,
          }}
        >
          {card.room_type_name}
        </div>
        {card.features && (
          <div
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 11,
              color: "#6e6e6e",
              marginBottom: 6,
            }}
          >
            {card.features}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#0f6beb",
              }}
            >
              {card.price_label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                fontFamily: "'Noto Sans TC', sans-serif",
              }}
            >
              {card.source === "faq_static" ? "一般參考房價" : "即時房價"}
            </div>
            {card.available_count !== null &&
              card.available_count !== undefined && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6e6e6e",
                    fontFamily: "'Noto Sans TC', sans-serif",
                  }}
                >
                  剩餘 {card.available_count} 間
                </div>
              )}
          </div>
          {!disabled ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CounterButton
                onClick={onDecrease}
                disabled={count === 0}
                label="−"
              />
              <span
                style={{
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#383838",
                  minWidth: 16,
                  textAlign: "center",
                }}
              >
                {count}
              </span>
              <CounterButton
                onClick={onIncrease}
                disabled={count >= maxCount}
                label="+"
              />
            </div>
          ) : (
            count > 0 && (
              <span
                style={{
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontSize: 13,
                  color: "#383838",
                  fontWeight: 600,
                }}
              >
                × {count}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function RoomCardsMessage({
  msg,
  browserKey,
  disabled,
  onConfirm,
}: {
  msg: Extract<ChatMessage, { type: "room_cards" }>;
  browserKey: string;
  disabled: boolean;
  onConfirm: (fields: MemberFormField[], privacyNote: string) => void;
}) {
  const [selections, setSelections] = useState<Record<string, number>>(() =>
    Object.fromEntries(msg.cards.map((c) => [c.room_type_code, 0])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSelected = Object.values(selections).reduce((s, v) => s + v, 0);

  const changeCount = (code: string, delta: number) => {
    setSelections((prev) => {
      const card = msg.cards.find((c) => c.room_type_code === code);
      const max = card?.available_count ?? 9;
      const next = Math.max(0, Math.min(max, (prev[code] ?? 0) + delta));
      return { ...prev, [code]: next };
    });
  };

  const handleConfirm = async () => {
    const rooms = Object.entries(selections)
      .filter(([, count]) => count > 0)
      .map(([code, count]) => {
        const card = msg.cards.find((c) => c.room_type_code === code);
        return {
          room_type_code: code,
          room_count: count,
          room_type_name: card?.room_type_name,
          source: card?.source,
        };
      });
    if (rooms.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await confirmChatbotRooms({ browser_key: browserKey, rooms });
      onConfirm(res.member_form.fields, res.member_form.privacy_note);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "操作失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 4,
        width: "100%",
        flexShrink: 0,
      }}
    >
      {BOT_AVATAR}
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "18px 18px 18px 4px",
            background: "#f8fafc",
            color: "#383838",
            fontSize: 14,
            fontFamily: "'Noto Sans TC', sans-serif",
            lineHeight: "22.4px",
          }}
        >
          {msg.text}
        </div>
        {msg.bookingContext.checkin_date &&
          msg.bookingContext.checkout_date && (
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                fontFamily: "'Noto Sans TC', sans-serif",
                paddingLeft: 2,
              }}
            >
              入住 {msg.bookingContext.checkin_date} → 退房{" "}
              {msg.bookingContext.checkout_date}
            </div>
          )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {msg.cards.map((card) => (
            <RoomCardItem
              key={card.room_type_code}
              card={card}
              count={selections[card.room_type_code] ?? 0}
              onIncrease={() => changeCount(card.room_type_code, 1)}
              onDecrease={() => changeCount(card.room_type_code, -1)}
              disabled={disabled}
            />
          ))}
        </div>
        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#b71c1c",
              fontFamily: "'Noto Sans TC', sans-serif",
            }}
          >
            {error}
          </div>
        )}
        {!disabled && totalSelected > 0 && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: loading ? "#9ca3af" : "#0f6beb",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 0",
              fontSize: 14,
              fontFamily: "'Noto Sans TC', sans-serif",
              cursor: loading ? "default" : "pointer",
              fontWeight: 600,
              width: "100%",
              transition: "background 0.2s",
            }}
          >
            {loading ? "確認中…" : "確認選擇"}
          </button>
        )}
      </div>
    </div>
  );
}

function MemberFormMessage({
  msg,
  browserKey,
  disabled,
  onSubmit,
}: {
  msg: Extract<ChatMessage, { type: "member_form" }>;
  browserKey: string;
  disabled: boolean;
  onSubmit: (reservationId: string, cartUrl?: string | null) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(msg.fields.map((f) => [f.field_name, ""])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of msg.fields) {
      const val = (values[field.field_name] ?? "").trim();
      if (field.is_required && !val) {
        newErrors[field.field_name] = `${field.label}為必填`;
        continue;
      }
      if (val && field.input_type === "tel" && !/^\d{10}$/.test(val)) {
        newErrors[field.field_name] =
          field.error_message ??
          "哎呀，電話格式似乎不太對，請確認是 10 位數號碼喔！";
      }
      if (val && field.input_type === "email" && !val.includes("@")) {
        newErrors[field.field_name] = field.error_message ?? "Email 格式不正確";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await saveChatbotBooking({
        browser_key: browserKey,
        member_name: values["member_name"] ?? values["name"] ?? "",
        member_phone: values["member_phone"] ?? values["phone"] ?? "",
        member_email: values["member_email"] ?? values["email"] ?? "",
      });
      onSubmit(res.reservation_id, res.cart_url);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "送出失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 4,
        width: "100%",
        flexShrink: 0,
      }}
    >
      {BOT_AVATAR}
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "18px 18px 18px 4px",
            background: "#f8fafc",
            color: "#383838",
            fontSize: 14,
            fontFamily: "'Noto Sans TC', sans-serif",
            lineHeight: "22.4px",
          }}
        >
          {msg.text}
        </div>
        {!disabled && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "14px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            {msg.fields.map((field) => (
              <div
                key={field.field_name}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontFamily: "'Noto Sans TC', sans-serif",
                    color: "#6e6e6e",
                    fontWeight: 600,
                  }}
                >
                  {field.label}
                  {field.is_required && (
                    <span style={{ color: "#b71c1c", marginLeft: 2 }}>*</span>
                  )}
                </label>
                <input
                  type={field.input_type}
                  value={values[field.field_name] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.field_name]: e.target.value,
                    }))
                  }
                  placeholder={field.label}
                  style={{
                    border: errors[field.field_name]
                      ? "1.5px solid #b71c1c"
                      : "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                    fontFamily: "'Noto Sans TC', sans-serif",
                    color: "#383838",
                    outline: "none",
                    background: "#f8fafc",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                {errors[field.field_name] && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#b71c1c",
                      fontFamily: "'Noto Sans TC', sans-serif",
                    }}
                  >
                    {errors[field.field_name]}
                  </div>
                )}
              </div>
            ))}
            {submitError && (
              <div
                style={{
                  fontSize: 12,
                  color: "#b71c1c",
                  fontFamily: "'Noto Sans TC', sans-serif",
                }}
              >
                {submitError}
              </div>
            )}
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                fontFamily: "'Noto Sans TC', sans-serif",
                lineHeight: 1.5,
              }}
            >
              {msg.privacyNote}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: loading ? "#9ca3af" : "#0f6beb",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 0",
                fontSize: 14,
                fontFamily: "'Noto Sans TC', sans-serif",
                cursor: loading ? "default" : "pointer",
                fontWeight: 600,
                width: "100%",
                transition: "background 0.2s",
              }}
            >
              {loading ? "送出中…" : "確認並儲存"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingResultMessage({
  msg,
}: {
  msg: Extract<ChatMessage, { type: "booking_result" }>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 4,
        width: "100%",
        flexShrink: 0,
      }}
    >
      {BOT_AVATAR}
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: 12,
          padding: "14px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontFamily: "'Noto Sans TC', sans-serif",
            color: "#383838",
            fontWeight: 600,
          }}
        >
          ✅ 訂房資訊已儲存
        </div>
        <div
          style={{
            fontSize: 12,
            fontFamily: "'Noto Sans TC', sans-serif",
            color: "#6e6e6e",
          }}
        >
          預訂編號：
          <span style={{ color: "#383838", fontWeight: 600 }}>
            {msg.reservationId}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Noto Sans TC', sans-serif",
            color: "#9ca3af",
          }}
        >
          房價與訂房確認詳情請完成付款後確認。
        </div>
        {msg.cartUrl && (
          <a
            href={msg.cartUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              background: "#0f6beb",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 0",
              fontSize: 14,
              fontFamily: "'Noto Sans TC', sans-serif",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            立即前往付款 →
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatFAB
// ---------------------------------------------------------------------------

export default function ChatFAB() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "bot",
      type: "text",
      text: "您好！有什麼可以幫助您的嗎？",
    },
  ]);
  const [browserKey] = useState(() => `chatfab-${Date.now()}`);
  const [isLoading, setIsLoading] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastMsg = messages[messages.length - 1];
  const isInteractivePhase =
    (lastMsg?.type === "room_cards" || lastMsg?.type === "member_form") &&
    !completedIds.has(lastMsg.id);
  const inputDisabled = isLoading || isInteractivePhase;

  useEffect(() => {
    const handler = () => setChatOpen(true);
    window.addEventListener("open-chatfab", handler);
    return () => window.removeEventListener("open-chatfab", handler);
  }, []);

  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  const addBotMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [...prev, { ...msg, id } as ChatMessage]);
  }, []);

  const handleSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || inputDisabled) return;

    const userMsgId = `u-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", type: "text", text },
    ]);
    setChatInput("");
    setIsLoading(true);

    try {
      const res = await sendChatbotMessage({
        browser_key: browserKey,
        message: text,
      });

      if (res.reply_type === "room_cards" && res.room_cards.length > 0) {
        addBotMessage({
          role: "bot",
          type: "room_cards",
          text: res.reply,
          cards: res.room_cards,
          bookingContext: res.booking_context,
        });
      } else {
        addBotMessage({ role: "bot", type: "text", text: res.reply });
      }
    } catch {
      addBotMessage({
        role: "bot",
        type: "text",
        text: "抱歉，系統暫時無法回應，請稍後再試。",
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatInput, browserKey, inputDisabled, addBotMessage]);

  const handleRoomConfirm = useCallback(
    (msgId: string, fields: MemberFormField[], privacyNote: string) => {
      setCompletedIds((prev) => new Set([...prev, msgId]));
      addBotMessage({
        role: "bot",
        type: "member_form",
        text: "即將完成！接下來您只需要提供以下基本資料，我將為您建立您的預定資訊！",
        fields,
        privacyNote,
      });
    },
    [addBotMessage],
  );

  const handleFormSubmit = useCallback(
    (msgId: string, reservationId: string, cartUrl?: string | null) => {
      setCompletedIds((prev) => new Set([...prev, msgId]));
      addBotMessage({
        role: "bot",
        type: "booking_result",
        reservationId,
        cartUrl,
      });
    },
    [addBotMessage],
  );

  return createPortal(
    <>
      {/* Chat Window */}
      {chatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 112,
            right: 40,
            width: 360,
            height: 520,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            borderRadius: 20,
            boxShadow: "0px 8px 32px 0px rgba(56,56,56,0.18)",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#fff",
              borderBottom: "1px solid #ddd",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
            >
              <span
                style={{
                  color: "#383838",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "'Noto Sans TC', sans-serif",
                  lineHeight: "normal",
                  whiteSpace: "nowrap",
                }}
              >
                AI Chatbot
              </span>
              {/* 測試模式 badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <style>{`
                  @keyframes chatfab-breathe {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(0.72); }
                  }
                  .chatfab-dot-inner {
                    animation: chatfab-breathe 2s ease-in-out infinite;
                  }
                `}</style>
                <div
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 140,
                    background: "rgba(176,255,184,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="chatfab-dot-inner"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 70,
                      background: "#99ffa3",
                    }}
                  />
                </div>
                <span
                  style={{
                    color: "#6e6e6e",
                    fontSize: 12,
                    fontFamily: "'Noto Sans TC', sans-serif",
                    fontWeight: 400,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  測試模式
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 16px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "#fff",
            }}
          >
            {messages.map((msg) => {
              if (msg.type === "text") {
                return (
                  <TextBubble
                    key={msg.id}
                    text={msg.text}
                    isUser={msg.role === "user"}
                  />
                );
              }
              if (msg.type === "room_cards") {
                return (
                  <RoomCardsMessage
                    key={msg.id}
                    msg={msg}
                    browserKey={browserKey}
                    disabled={completedIds.has(msg.id)}
                    onConfirm={(fields, privacyNote) =>
                      handleRoomConfirm(msg.id, fields, privacyNote)
                    }
                  />
                );
              }
              if (msg.type === "member_form") {
                return (
                  <MemberFormMessage
                    key={msg.id}
                    msg={msg}
                    browserKey={browserKey}
                    disabled={completedIds.has(msg.id)}
                    onSubmit={(reservationId, cartUrl) =>
                      handleFormSubmit(msg.id, reservationId, cartUrl)
                    }
                  />
                );
              }
              if (msg.type === "booking_result") {
                return <BookingResultMessage key={msg.id} msg={msg} />;
              }
              return null;
            })}

            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "62.222px",
                    background: "#dbebff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={chatfabOaIcon}
                    alt=""
                    style={{ width: 18.8, height: 18.8 }}
                  />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "18px 18px 18px 4px",
                    background: "#f8fafc",
                    color: "#6e6e6e",
                    fontSize: 14,
                    fontFamily: "'Noto Sans TC', sans-serif",
                  }}
                >
                  回覆中…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "13px 16px 12px",
              borderTop: "1px solid #ddd",
              background: "#fff",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !inputDisabled && handleSend()
              }
              placeholder={isInteractivePhase ? "請先完成上方操作" : "輸入訊息"}
              disabled={inputDisabled}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 14,
                fontFamily: "'Noto Sans TC', sans-serif",
                outline: "none",
                color: "#383838",
                background: inputDisabled ? "#f0f0f0" : "#f8fafc",
                cursor: inputDisabled ? "not-allowed" : "text",
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!chatInput.trim() || inputDisabled}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "#e5f1ff",
                border: "none",
                cursor:
                  chatInput.trim() && !inputDisabled ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="送出"
            >
              <img
                src={chatfabSend}
                alt="送出"
                style={{ width: 18, height: 18 }}
              />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 40,
          right: 40,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: chatOpen ? "#0f6beb" : "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0px 4px 16px 0px rgba(15,107,235,0.28)",
          zIndex: 50,
          transition: "background 0.2s",
          overflow: "hidden",
        }}
        aria-label={chatOpen ? "關閉聊天" : "開啟聊天"}
      >
        {chatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <img
            src={chatfabLogo}
            alt="AI Chatbot"
            style={{
              width: 28,
              height: 26,
              objectFit: "contain",
              transform: "translateX(2px)",
            }}
          />
        )}
      </button>
    </>,
    document.body,
  );
}
