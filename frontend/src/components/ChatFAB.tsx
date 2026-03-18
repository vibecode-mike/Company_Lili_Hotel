import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { useToast } from "./ToastProvider";
import { useAuth } from "./auth/AuthContext";
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
// Drag-to-scroll hook for horizontal card lists
// ---------------------------------------------------------------------------

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    const el = ref.current;
    if (!el) return;
    state.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }, []);

  const onMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    state.current.isDown = false;
    el.style.cursor = "grab";
    el.style.removeProperty("user-select");
  }, []);

  const onMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!state.current.isDown) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = state.current.scrollLeft - (x - state.current.startX);
  }, []);

  return { ref, onMouseDown, onMouseUp, onMouseLeave: onMouseUp, onMouseMove };
}

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
            {card.source === "pms" ? card.price_label : `NT$${card.price.toLocaleString()}`}
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
  const dragScroll = useDragScroll();

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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", flexShrink: 0 }}>
      {/* Top row: avatar + text bubble */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
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
        </div>
      </div>

      {/* Cards — horizontal scroll, placed OUTSIDE the text row to avoid vertical scroll interference */}
      <div
        ref={dragScroll.ref}
        onMouseDown={dragScroll.onMouseDown}
        onMouseUp={dragScroll.onMouseUp}
        onMouseLeave={dragScroll.onMouseLeave}
        onMouseMove={dragScroll.onMouseMove}
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          padding: "6px 0 8px",
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
          cursor: "grab",
          width: "100%",
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
      onSubmit(
        String(res.reservation_id ?? ""),
        typeof res.cart_url === "string" ? res.cart_url : null,
      );
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
// Tooltip that clamps to viewport with 8px edge margin
// ---------------------------------------------------------------------------

function PublishTooltip({ btnRef, label }: { btnRef: React.RefObject<HTMLButtonElement | null>; label: string }) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const btn = btnRef.current;
    const tip = tipRef.current;
    if (!btn || !tip) return;
    const btnRect = btn.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const MARGIN = 8;

    // Ideal: centered below the button
    let left = btnRect.left + btnRect.width / 2 - tipRect.width / 2;
    let top = btnRect.bottom + 4;

    // Clamp horizontal
    if (left < MARGIN) left = MARGIN;
    if (left + tipRect.width > window.innerWidth - MARGIN) left = window.innerWidth - MARGIN - tipRect.width;

    // Clamp vertical — if it overflows bottom, flip above the button
    if (top + tipRect.height > window.innerHeight - MARGIN) {
      top = btnRect.top - tipRect.height - 4;
    }
    if (top < MARGIN) top = MARGIN;

    setPos({ left, top });
  });

  return (
    <div
      ref={tipRef}
      style={{
        position: "fixed",
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        background: "#383838",
        color: "#fff",
        fontSize: 12,
        fontFamily: "'Noto Sans TC', sans-serif",
        fontWeight: 400,
        lineHeight: 1.5,
        borderRadius: 8,
        padding: "4px 8px",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 9999,
        opacity: pos ? 1 : 0,
      }}
    >
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatFAB
// ---------------------------------------------------------------------------

export default function ChatFAB() {
  const [chatOpen, setChatOpen] = useState(() => sessionStorage.getItem("chatfab-open") === "1");
  const { showToast } = useToast();
  const { user } = useAuth();
  const canPublish = user?.faq_can_publish === true || user?.role === "admin";
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [publishTooltipVisible, setPublishTooltipVisible] = useState(false);
  const publishBtnRef = useRef<HTMLButtonElement>(null);
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
    sessionStorage.setItem("chatfab-open", chatOpen ? "1" : "0");
  }, [chatOpen]);

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
        test_mode: true,
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

            {/* 重新對話 button */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setMessages([{ id: "init", role: "bot", type: "text", text: "您好！有什麼可以幫助您的嗎？" }]);
                  setChatInput("");
                  setCompletedIds(new Set());
                  setBannerDismissed(false);
                }}
                onMouseEnter={(e) => { (e.currentTarget.nextElementSibling as HTMLElement).style.opacity = "1"; e.currentTarget.style.background = "#f5f5f5"; }}
                onMouseLeave={(e) => { (e.currentTarget.nextElementSibling as HTMLElement).style.opacity = "0"; e.currentTarget.style.background = "transparent"; }}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0, transition: "background 0.15s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M7.5 15C5.40625 15 3.63281 14.2734 2.17969 12.8203C0.726562 11.3672 0 9.59375 0 7.5C0 5.40625 0.726562 3.63281 2.17969 2.17969C3.63281 0.726562 5.40625 0 7.5 0C8.57812 0 9.60938 0.222812 10.5938 0.668437C11.5781 1.11344 12.4219 1.75 13.125 2.57812V0.9375C13.125 0.671875 13.215 0.449063 13.395 0.269063C13.5744 0.0896877 13.7969 0 14.0625 0C14.3281 0 14.5506 0.0896877 14.73 0.269063C14.91 0.449063 15 0.671875 15 0.9375V5.625C15 5.89062 14.91 6.11312 14.73 6.2925C14.5506 6.4725 14.3281 6.5625 14.0625 6.5625H9.375C9.10938 6.5625 8.88688 6.4725 8.7075 6.2925C8.5275 6.11312 8.4375 5.89062 8.4375 5.625C8.4375 5.35938 8.5275 5.13656 8.7075 4.95656C8.88688 4.77719 9.10938 4.6875 9.375 4.6875H12.375C11.875 3.8125 11.1916 3.125 10.3247 2.625C9.45719 2.125 8.51563 1.875 7.5 1.875C5.9375 1.875 4.60937 2.42188 3.51562 3.51562C2.42188 4.60937 1.875 5.9375 1.875 7.5C1.875 9.0625 2.42188 10.3906 3.51562 11.4844C4.60937 12.5781 5.9375 13.125 7.5 13.125C8.57812 13.125 9.57437 12.8397 10.4887 12.2691C11.4025 11.6991 12.0859 10.9375 12.5391 9.98437C12.6172 9.8125 12.7463 9.66812 12.9263 9.55125C13.1056 9.43375 13.2891 9.375 13.4766 9.375C13.8359 9.375 14.1056 9.5 14.2856 9.75C14.465 10 14.4844 10.2813 14.3437 10.5938C13.75 11.9219 12.8359 12.9881 11.6016 13.7925C10.3672 14.5975 9 15 7.5 15Z" fill="#6E6E6E" />
                </svg>
              </button>
              <div style={{
                position: "absolute", left: "50%", transform: "translateX(-50%)", top: "calc(100% + 4px)",
                background: "#383838", color: "#fff", fontSize: 12, fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 400, lineHeight: 1.5, borderRadius: 8, padding: "4px 8px",
                whiteSpace: "nowrap", pointerEvents: "none", opacity: 0, transition: "opacity 0.15s", zIndex: 10,
              }}>
                重新對話
              </div>
            </div>

            {/* 發佈 button */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                ref={publishBtnRef}
                type="button"
                onClick={canPublish ? async () => {
                  try {
                    const token = localStorage.getItem("auth_token");
                    const res = await fetch("/api/v1/faq/publish", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                    });
                    if (!res.ok) throw new Error();
                    showToast("發佈成功", "success");
                  } catch {
                    showToast("發佈失敗", "error");
                  }
                } : undefined}
                onMouseEnter={() => { setPublishTooltipVisible(true); }}
                onMouseLeave={() => { setPublishTooltipVisible(false); }}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none",
                  background: "transparent",
                  cursor: canPublish ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0, transition: "background 0.15s",
                  opacity: canPublish ? 1 : 0.5,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16.0083" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M5.77959 3.21118C4.08742 5.11072 2.92613 7.83976 2.81829 8.0969L0.943637 7.29229C0.404465 7.06003 0.271746 6.35496 0.686493 5.94022L3.18327 3.44344C3.57314 3.05357 4.13719 2.87938 4.68466 2.98721L5.77959 3.21118ZM7.01554 11.6388C7.26439 11.8877 7.62937 11.9541 7.94457 11.8047C8.90679 11.3568 10.9722 10.3034 12.3077 8.96787C16.1151 5.16049 16.1483 2.05818 15.9243 0.730988C15.8662 0.39919 15.6008 0.133752 15.269 0.0756876C13.9418 -0.148276 10.8395 -0.115096 7.03213 3.69228C5.69664 5.02777 4.65148 7.09321 4.19526 8.05543C4.04595 8.37063 4.1206 8.74391 4.36116 8.98446L7.01554 11.6388ZM12.7971 10.2287C10.8976 11.9209 8.16854 13.0822 7.91139 13.19L8.716 15.0647C8.94826 15.6038 9.65333 15.7366 10.0681 15.3218L12.5649 12.825C12.9547 12.4352 13.1289 11.8711 13.0211 11.3236L12.7971 10.2287ZM5.57222 12.3854C5.73812 13.2647 5.44779 14.0776 4.89203 14.6333C4.25332 15.272 2.27083 15.7448 0.985112 15.9937C0.41276 16.1015 -0.0932317 15.5955 0.0146026 15.0232C0.263451 13.7375 0.727968 11.755 1.37497 11.1163C1.93074 10.5605 2.74364 10.2702 3.62291 10.4361C4.59341 10.6186 5.38973 11.4149 5.57222 12.3854ZM8.93997 5.40934C8.93997 4.49689 9.68651 3.75035 10.599 3.75035C11.5114 3.75035 12.2579 4.49689 12.2579 5.40934C12.2579 6.32178 11.5114 7.06833 10.599 7.06833C9.68651 7.06833 8.93997 6.32178 8.93997 5.40934Z" fill="#0F6BEB" />
                </svg>
              </button>
            </div>
          </div>

          {/* Permission banner (non-admin only) */}
          {!canPublish && !bannerDismissed && (
            <div
              style={{
                background: "#dbedff",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                alignContent: "center",
                gap: 4,
                padding: "2px 8px",
                flexShrink: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  flex: 1,
                  minWidth: 0,
                  minHeight: 1,
                }}
              >
                {/* Lock outlined icon — Google Material Symbols "lock" outlined, scaled to Figma 20×20 node 1472:3752 */}
                <svg width="20" height="20" viewBox="-227 -1177 1414 1414" style={{ flexShrink: 0 }}>
                  <path
                    d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"
                    fill="#0F6BEB"
                  />
                </svg>
                <span
                  style={{
                    color: "#0f6beb",
                    fontSize: 12,
                    fontFamily: "'Noto Sans TC', sans-serif",
                    fontWeight: 400,
                    lineHeight: "22.4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  完成測試後，發佈需由系統管理員執行
                </span>
              </div>
              {/* Close button */}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5.714,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M9.625 1.375L1.375 9.625" stroke="#0F6BEB" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1.375 1.375L9.625 9.625" stroke="#0F6BEB" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

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

      {/* Publish tooltip — rendered via portal to escape overflow:hidden */}
      {publishTooltipVisible && publishBtnRef.current && (
        <PublishTooltip btnRef={publishBtnRef} label={canPublish ? "發佈" : "僅系統管理員可發佈"} />
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setChatOpen((v) => {
            if (v) {
              // 關閉時結束對話：清除聊天紀錄
              setMessages([{ id: "init", role: "bot", type: "text", text: "您好！有什麼可以幫助您的嗎？" }]);
              setChatInput("");
              setCompletedIds(new Set());
              setBannerDismissed(false);
            }
            return !v;
          });
        }}
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
