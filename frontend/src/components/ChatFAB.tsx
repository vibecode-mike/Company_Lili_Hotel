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
  const isSelected = count > 0;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: isSelected ? "none" : "0px 1px 4px 0px rgba(56,56,56,0.18)",
        border: isSelected ? "3.1px solid #242424" : "3.1px solid transparent",
        padding: 8,
        // 動態寬度：75% 讓下一張卡片剛好露出 1/3
        width: "calc(75% - 6px)",
        minWidth: "calc(75% - 6px)",
        maxWidth: "calc(75% - 6px)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flexShrink: 0,
        boxSizing: "border-box",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 116,
          borderRadius: 10,
          overflow: "hidden",
          background: "#f0f0f0",
          flexShrink: 0,
        }}
      >
        {card.image_url && (
          <img
            src={card.image_url}
            alt={card.room_type_name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
      </div>

      {/* Info Block — 垂直堆疊 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
        {/* 房型名稱 */}
        <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500, fontSize: 16, color: "#383838", lineHeight: 1.5, width: "100%" }}>
          {card.room_type_name}
        </div>
        {/* 房價 / 剩餘間數 — 同一行 */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500, fontSize: 16, color: "#6e6e6e", lineHeight: 1.5, whiteSpace: "nowrap" }}>
            {card.price_label}
          </div>
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500, fontSize: 16, color: "#6e6e6e", lineHeight: 1.5 }}>/</div>
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 400, fontSize: 16, color: "#6e6e6e", lineHeight: 1.5, whiteSpace: "nowrap" }}>
            {card.available_count !== null && card.available_count !== undefined
              ? `剩餘 ${card.available_count} 間`
              : "待確認"}
          </div>
        </div>
      </div>

      {/* Quantity Stepper */}
      <div style={{ background: "#f8fafc", borderRadius: 8, padding: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || count === 0}
          style={{ width: 32, height: 32, background: "none", border: "none", padding: 0, cursor: disabled || count === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 16H24" stroke={disabled || count === 0 ? "#d1d5db" : "#383838"} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: "center", fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 400, fontSize: 16, color: "#383838", lineHeight: 1.5 }}>
          {count}
        </div>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || count >= maxCount}
          style={{ width: 32, height: 32, background: "none", border: "none", padding: 0, cursor: disabled || count >= maxCount ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 8V24M8 16H24" stroke={disabled || count >= maxCount ? "#d1d5db" : "#383838"} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RoomCardsMessage({
  msg,
  browserKey,
  disabled,
  onConfirm,
  onCancel,
}: {
  msg: Extract<ChatMessage, { type: "room_cards" }>;
  browserKey: string;
  disabled: boolean;
  onConfirm: (fields: MemberFormField[], privacyNote: string) => void;
  onCancel: () => void;
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
    if (totalSelected === 0) return;
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
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, width: "100%", flexShrink: 0 }}>
      {BOT_AVATAR}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {/* Bot text bubble */}
        <div
          style={{
            padding: "4px 8px",
            borderRadius: "18px 18px 18px 4px",
            background: "#fff",
            color: "#383838",
            fontSize: 14,
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 500,
            lineHeight: "22.4px",
          }}
        >
          {msg.text}
        </div>

        {/* Date info */}
        {msg.bookingContext.checkin_date && msg.bookingContext.checkout_date && (
          <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Noto Sans TC', sans-serif", paddingLeft: 2 }}>
            入住 {msg.bookingContext.checkin_date} → 退房 {msg.bookingContext.checkout_date}
          </div>
        )}

        {/* Cards — horizontal scroll，負 margin 補陰影空間 */}
        <div style={{ margin: "0 -6px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "6px 6px 8px",
            scrollbarWidth: "none",
          }}
        >
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
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: "#b71c1c", fontFamily: "'Noto Sans TC', sans-serif" }}>
            {error}
          </div>
        )}

        {/* Footer buttons — hidden when disabled */}
        {!disabled && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                minHeight: 48,
                background: "#f5f5f5",
                border: "none",
                borderRadius: 16,
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 400,
                fontSize: 16,
                color: "#383838",
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={totalSelected === 0 || loading}
              style={{
                flex: 1,
                minHeight: 48,
                background: totalSelected > 0 && !loading ? "#242424" : "#c8c8c8",
                border: "none",
                borderRadius: 16,
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 400,
                fontSize: 16,
                color: "#fff",
                cursor: totalSelected > 0 && !loading ? "pointer" : "default",
                lineHeight: 1.5,
                transition: "background 0.2s",
              }}
            >
              {loading ? "確認中…" : "確認訂房"}
            </button>
          </div>
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
        member_name:
          values["guest_name"] ??
          values["member_name"] ??
          values["name"] ??
          "",
        member_phone:
          values["guest_phone"] ??
          values["member_phone"] ??
          values["phone"] ??
          "",
        member_email:
          values["guest_email"] ??
          values["member_email"] ??
          values["email"] ??
          "",
      });
      onSubmit(res.reservation_id, res.cart_url);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "送出失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const PLACEHOLDER_MAP: Record<string, string> = {
    guest_name: "輸入姓名",
    guest_phone: "輸入聯絡電話",
    guest_email: "輸入 Email",
    member_name: "輸入姓名",
    name: "輸入姓名",
    member_phone: "輸入聯絡電話",
    phone: "輸入聯絡電話",
    member_email: "輸入 Email",
    email: "輸入 Email",
  };

  const hasAnyValue = Object.values(values).some((v) => v.trim() !== "");

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
              borderRadius: 18,
              padding: 12,
              boxShadow: "0px 1px 4px rgba(56,56,56,0.18)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
              justifyContent: "center",
              minWidth: 260,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
              }}
            >
              {msg.fields.map((field) => (
                <div
                  key={field.field_name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontFamily: "'Noto Sans TC', sans-serif",
                        fontWeight: 400,
                        color: "#383838",
                        lineHeight: 1.5,
                      }}
                    >
                      {field.label}
                    </span>
                    {field.is_required && (
                      <span
                        style={{
                          fontSize: 16,
                          fontFamily: "'Noto Sans TC', sans-serif",
                          fontWeight: 400,
                          color: "#f44336",
                          lineHeight: 1.5,
                        }}
                      >
                        *
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      width: "100%",
                    }}
                  >
                    <input
                      type={field.input_type}
                      value={values[field.field_name] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.field_name]: e.target.value,
                        }))
                      }
                      placeholder={
                        PLACEHOLDER_MAP[field.field_name] ??
                        `輸入${field.label}`
                      }
                      style={{
                        border: errors[field.field_name]
                          ? "1.4px solid #f44336"
                          : "none",
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 16,
                        fontFamily: "'Noto Sans TC', sans-serif",
                        fontWeight: 400,
                        color: "#383838",
                        outline: "none",
                        background: "#f6f9fd",
                        width: "100%",
                        boxSizing: "border-box",
                        minHeight: 48,
                        lineHeight: 1.5,
                      }}
                    />
                    {errors[field.field_name] && (
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "'Noto Sans TC', sans-serif",
                          fontWeight: 400,
                          color: "#f44336",
                          lineHeight: 1.5,
                        }}
                      >
                        {errors[field.field_name]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {submitError && (
              <div
                style={{
                  fontSize: 12,
                  color: "#f44336",
                  fontFamily: "'Noto Sans TC', sans-serif",
                  width: "100%",
                }}
              >
                {submitError}
              </div>
            )}
            <div
              style={{
                fontSize: 14,
                color: "#6e6e6e",
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 400,
                lineHeight: 1.5,
                width: "100%",
              }}
            >
              {msg.privacyNote}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !hasAnyValue}
              style={{
                background: "#242424",
                opacity: loading || !hasAnyValue ? 0.6 : 1,
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "8px 12px",
                fontSize: 16,
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 400,
                cursor:
                  loading || !hasAnyValue ? "default" : "pointer",
                width: "100%",
                minHeight: 48,
                minWidth: 72,
                lineHeight: 1.5,
                textAlign: "center",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "送出中…" : "確認送出"}
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // 自動撐高 textarea，超過 max-height 才顯示 scrollbar
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [chatInput]);

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

  const handleRoomCancel = useCallback(
    (msgId: string) => {
      setCompletedIds((prev) => new Set([...prev, msgId]));
    },
    [],
  );

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
            bottom: 92,
            right: 20,
            width: 360,
            height: "calc(100vh - 92px - 12px)",
            minHeight: 350,
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
                    onCancel={() => handleRoomCancel(msg.id)}
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
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !inputDisabled && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isInteractivePhase ? "請先完成上方操作" : "輸入訊息"}
              disabled={inputDisabled}
              className="chat-widget-textarea"
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
                resize: "none",
                overflowY: "auto",
                maxHeight: 110,
                lineHeight: "22.4px",
                display: "block",
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
                background: chatInput.trim() && !inputDisabled ? "#0f6beb" : "#e5f1ff",
                border: "none",
                cursor: chatInput.trim() && !inputDisabled ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
              aria-label="送出"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 9H16M16 9L10 3M16 9L10 15"
                  stroke={chatInput.trim() && !inputDisabled ? "#ffffff" : "#0F6BEB"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
          bottom: 20,
          right: 20,
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
