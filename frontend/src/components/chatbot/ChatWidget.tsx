import { useEffect, useMemo, useState } from "react";
import type { InputHTMLAttributes } from "react";

import {
  confirmChatbotRoom,
  createChatbotBookingUrl,
  createChatbotMember,
  getChatbotRooms,
  type RoomCard,
  resetChatbotSession,
  sendChatbotMessage,
} from "../../utils/chatbotApi";

interface ChatLine {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface BookingDraft {
  checkinDate: string;
  checkoutDate: string;
  adults: string;
  children: string;
}

interface GuestDraft {
  guest_name: string;
  guest_phone: string;
  guest_email: string;
}

interface SelectedRoomDraft {
  room_type_code: string;
  room_type_name: string;
  room_count: number;
  source: "pms" | "faq_static";
}

const BROWSER_KEY_STORAGE = "ai_chatbot_widget_browser_key";

function createBrowserKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `browser_${Date.now()}`;
}

function readBrowserKey(): string {
  const existing = window.localStorage.getItem(BROWSER_KEY_STORAGE);
  if (existing) {
    return existing;
  }
  const next = createBrowserKey();
  window.localStorage.setItem(BROWSER_KEY_STORAGE, next);
  return next;
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="text-[12px] leading-[1.4] text-[#64748b] font-medium">
      {label}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-[12px] border border-[#d7e0ef] bg-white px-[12px] py-[9px] text-[13px] text-[#0f172a] outline-none transition focus:border-[#0f6beb] focus:ring-2 focus:ring-[#dbeafe] ${props.className ?? ""}`}
    />
  );
}

interface ChatWidgetProps {
  defaultOpen?: boolean;
}

export default function ChatWidget({ defaultOpen = false }: ChatWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [browserKey, setBrowserKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [roomCards, setRoomCards] = useState<RoomCard[]>([]);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoomDraft | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({
    checkinDate: "",
    checkoutDate: "",
    adults: "",
    children: "0",
  });
  const [guestDraft, setGuestDraft] = useState<GuestDraft>({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
  });
  const [bookingRecordId, setBookingRecordId] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [memberResult, setMemberResult] = useState<{
    member_id: number;
    is_new_member: boolean;
    tags_applied: string[];
  } | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setBrowserKey(readBrowserKey());
  }, []);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  const canQueryRooms = useMemo(() => {
    return Boolean(
      bookingDraft.checkinDate &&
        bookingDraft.checkoutDate &&
        Number(bookingDraft.adults) > 0,
    );
  }, [bookingDraft]);

  const canCreateBooking = useMemo(() => {
    return Boolean(
      selectedRoom &&
        bookingDraft.checkinDate &&
        bookingDraft.checkoutDate &&
        Number(bookingDraft.adults) > 0 &&
        guestDraft.guest_name.trim() &&
        guestDraft.guest_phone.trim() &&
        guestDraft.guest_email.trim(),
    );
  }, [bookingDraft, guestDraft, selectedRoom]);

  const pushLine = (role: ChatLine["role"], content: string) => {
    setChatLines((prev) => [
      ...prev,
      { id: `${role}_${Date.now()}_${prev.length}`, role, content },
    ]);
  };

  const syncBookingContext = (context?: {
    checkin_date?: string | null;
    checkout_date?: string | null;
    adults?: number | null;
  }) => {
    if (!context) {
      return;
    }
    setBookingDraft((prev) => ({
      ...prev,
      checkinDate: context.checkin_date || prev.checkinDate,
      checkoutDate: context.checkout_date || prev.checkoutDate,
      adults:
        context.adults !== null && context.adults !== undefined
          ? String(context.adults)
          : prev.adults,
    }));
  };

  const resetLocalState = () => {
    setSessionId("");
    setMessageInput("");
    setChatLines([]);
    setRoomCards([]);
    setRoomCounts({});
    setSelectedRoom(null);
    setBookingDraft({
      checkinDate: "",
      checkoutDate: "",
      adults: "",
      children: "0",
    });
    setGuestDraft({
      guest_name: "",
      guest_phone: "",
      guest_email: "",
    });
    setBookingRecordId("");
    setBookingUrl("");
    setMemberResult(null);
    setMissingFields([]);
    setLoadingAction("");
    setError("");
  };

  const handleSendMessage = async () => {
    const message = messageInput.trim();
    if (!message || !browserKey) {
      return;
    }
    setError("");
    setLoadingAction("message");
    pushLine("user", message);
    try {
      const response = await sendChatbotMessage({
        browser_key: browserKey,
        message,
      });
      setSessionId(response.session_id);
      setMissingFields(response.missing_fields);
      setRoomCards(response.room_cards);
      setRoomCounts(
        response.room_cards.reduce<Record<string, number>>((acc, card) => {
          acc[card.room_type_code] = acc[card.room_type_code] ?? 1;
          return acc;
        }, {}),
      );
      syncBookingContext(response.booking_context);
      if (response.booking_url) {
        setBookingUrl(response.booking_url);
      }
      pushLine("assistant", response.reply);
      setMessageInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "訊息送出失敗");
    } finally {
      setLoadingAction("");
    }
  };

  const handleQueryRooms = async () => {
    if (!canQueryRooms || !browserKey) {
      return;
    }
    setError("");
    setLoadingAction("rooms");
    try {
      const response = await getChatbotRooms({
        browser_key: browserKey,
        checkin_date: bookingDraft.checkinDate,
        checkout_date: bookingDraft.checkoutDate,
        adults: Number(bookingDraft.adults),
        children: Number(bookingDraft.children || "0"),
      });
      setRoomCards(response.rooms);
      setRoomCounts(
        response.rooms.reduce<Record<string, number>>((acc, card) => {
          acc[card.room_type_code] = roomCounts[card.room_type_code] ?? 1;
          return acc;
        }, {}),
      );
      pushLine("system", "已重新查詢房況。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "查詢房況失敗");
    } finally {
      setLoadingAction("");
    }
  };

  const handleConfirmRoom = async (card: RoomCard) => {
    if (!browserKey) {
      return;
    }
    setError("");
    setLoadingAction(`confirm_${card.room_type_code}`);
    try {
      const count = Math.max(1, roomCounts[card.room_type_code] ?? 1);
      const response = await confirmChatbotRoom({
        browser_key: browserKey,
        room_type_code: card.room_type_code,
        room_count: count,
        room_type_name: card.room_type_name,
        source: card.source,
      });
      setSessionId(response.session_id);
      setSelectedRoom({
        room_type_code: card.room_type_code,
        room_type_name: card.room_type_name,
        room_count: count,
        source: card.source,
      });
      pushLine("assistant", "已收到房型選擇，請填寫旅客資料。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "確認房型失敗");
    } finally {
      setLoadingAction("");
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedRoom || !canCreateBooking || !browserKey) {
      return;
    }
    setError("");
    setLoadingAction("booking");
    try {
      const response = await createChatbotBookingUrl({
        browser_key: browserKey,
        room_type_code: selectedRoom.room_type_code,
        room_count: selectedRoom.room_count,
        checkin_date: bookingDraft.checkinDate,
        checkout_date: bookingDraft.checkoutDate,
        adults: Number(bookingDraft.adults),
        children: Number(bookingDraft.children || "0"),
        guest_name: guestDraft.guest_name.trim(),
        guest_phone: guestDraft.guest_phone.trim(),
        guest_email: guestDraft.guest_email.trim(),
      });
      setBookingRecordId(response.booking_record_id);
      setBookingUrl(response.booking_url);
      pushLine("system", "已建立 booking URL。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立 booking URL 失敗");
    } finally {
      setLoadingAction("");
    }
  };

  const handleCreateMember = async () => {
    if (!bookingRecordId || !browserKey) {
      return;
    }
    setError("");
    setLoadingAction("member");
    try {
      const response = await createChatbotMember({
        browser_key: browserKey,
        name: guestDraft.guest_name.trim(),
        phone: guestDraft.guest_phone.trim(),
        email: guestDraft.guest_email.trim(),
        booking_record_id: bookingRecordId,
      });
      setMemberResult(response);
      pushLine("system", `會員同步完成，member_id=${response.member_id}。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步會員失敗");
    } finally {
      setLoadingAction("");
    }
  };

  const handleResetSession = async () => {
    if (!browserKey) {
      return;
    }
    setError("");
    setLoadingAction("reset");
    try {
      const response = await resetChatbotSession(browserKey);
      resetLocalState();
      setSessionId(response.session_id);
      pushLine("system", "Session 已重置。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置 session 失敗");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="fixed bottom-[24px] right-[24px] z-[80]">
      {open ? (
        <div className="w-[380px] max-w-[calc(100vw-32px)] rounded-[24px] border border-[#cfe0fb] bg-white shadow-[0_24px_80px_rgba(15,107,235,0.24)] overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#0f6beb_0%,#2ea1ff_100%)] px-[16px] py-[14px] text-white">
            <div className="flex items-center justify-between gap-[12px]">
              <div>
                <div className="text-[16px] font-medium">AI Chatbot 測試</div>
                <div className="mt-[2px] text-[12px] text-white/80">
                  browser_key: {browserKey || "載入中"}
                </div>
                {sessionId ? (
                  <div className="text-[12px] text-white/80">session_id: {sessionId}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="rounded-[10px] bg-white/10 px-[10px] py-[6px] text-[12px] hover:bg-white/20"
                >
                  {loadingAction === "reset" ? "重置中" : "Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] bg-white/10 px-[10px] py-[6px] text-[12px] hover:bg-white/20"
                >
                  收合
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto bg-[#f8fbff] p-[14px]">
            <div className="space-y-[10px]">
              {chatLines.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-[#bfd4f6] bg-white px-[14px] py-[16px] text-[13px] leading-[1.7] text-[#64748b]">
                  輸入訂房訊息開始測試，例如「我要訂房，4/20 入住 4/21 退房，2 位大人」。
                </div>
              ) : (
                chatLines.map((line) => (
                  <div
                    key={line.id}
                    className={`rounded-[16px] px-[12px] py-[10px] text-[13px] leading-[1.7] ${
                      line.role === "user"
                        ? "ml-[42px] bg-[#0f6beb] text-white"
                        : line.role === "assistant"
                          ? "mr-[42px] border border-[#d9e4f6] bg-white text-[#0f172a]"
                          : "mr-[20px] border border-[#cfe0fb] bg-[#eef6ff] text-[#1d4ed8]"
                    }`}
                  >
                    {line.content}
                  </div>
                ))
              )}
            </div>

            <div className="mt-[14px] rounded-[18px] border border-[#d9e4f6] bg-white p-[12px]">
              <FieldLabel label="訊息輸入" />
              <textarea
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="輸入聊天內容"
                className="mt-[6px] min-h-[90px] w-full rounded-[12px] border border-[#d7e0ef] px-[12px] py-[10px] text-[13px] leading-[1.6] text-[#0f172a] outline-none transition focus:border-[#0f6beb] focus:ring-2 focus:ring-[#dbeafe]"
              />
              <div className="mt-[10px] flex items-center justify-between gap-[8px]">
                <div className="text-[12px] leading-[1.5] text-[#64748b]">
                  {missingFields.length ? `missing: ${missingFields.join(", ")}` : "missing: 無"}
                </div>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || loadingAction === "message"}
                  className="rounded-[12px] bg-[#0f6beb] px-[14px] py-[8px] text-[13px] font-medium text-white transition hover:bg-[#0b5ac7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAction === "message" ? "送出中..." : "送出"}
                </button>
              </div>
            </div>

            <div className="mt-[14px] rounded-[18px] border border-[#d9e4f6] bg-white p-[12px]">
              <div className="flex items-center justify-between gap-[8px]">
                <div className="text-[13px] font-medium text-[#0f172a]">訂房草稿</div>
                <button
                  type="button"
                  onClick={handleQueryRooms}
                  disabled={!canQueryRooms || loadingAction === "rooms"}
                  className="rounded-[10px] bg-[#edf4ff] px-[10px] py-[6px] text-[12px] text-[#0f6beb] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAction === "rooms" ? "查詢中..." : "重查房況"}
                </button>
              </div>

              <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
                <div>
                  <FieldLabel label="入住日期" />
                  <Input
                    type="date"
                    value={bookingDraft.checkinDate}
                    onChange={(event) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        checkinDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel label="退房日期" />
                  <Input
                    type="date"
                    value={bookingDraft.checkoutDate}
                    onChange={(event) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        checkoutDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel label="大人數" />
                  <Input
                    type="number"
                    min={1}
                    value={bookingDraft.adults}
                    onChange={(event) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        adults: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel label="小孩數" />
                  <Input
                    type="number"
                    min={0}
                    value={bookingDraft.children}
                    onChange={(event) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        children: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {roomCards.length > 0 ? (
              <div className="mt-[14px] space-y-[10px]">
                {roomCards.map((card) => (
                  <div
                    key={card.room_type_code}
                    className={`rounded-[18px] border p-[12px] ${
                      selectedRoom?.room_type_code === card.room_type_code
                        ? "border-[#0f6beb] bg-[#eef6ff]"
                        : "border-[#d9e4f6] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-[8px]">
                      <div>
                        <div className="text-[14px] font-medium text-[#0f172a]">
                          {card.room_type_name}
                        </div>
                        <div className="mt-[2px] text-[12px] text-[#64748b]">
                          {card.room_type_code} · {card.price_label} · 剩 {card.available_count ?? "?"} 間
                        </div>
                      </div>
                      <div className="text-[16px] font-medium text-[#0f6beb]">
                        NT$ {card.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-[10px] flex items-end gap-[10px]">
                      <div className="w-[92px]">
                        <FieldLabel label="房數" />
                        <Input
                          type="number"
                          min={1}
                          max={9}
                          value={String(roomCounts[card.room_type_code] ?? 1)}
                          onChange={(event) =>
                            setRoomCounts((prev) => ({
                              ...prev,
                              [card.room_type_code]: Math.max(1, Number(event.target.value || "1")),
                            }))
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmRoom(card)}
                        disabled={loadingAction === `confirm_${card.room_type_code}`}
                        className="rounded-[12px] bg-[#0f6beb] px-[14px] py-[8px] text-[13px] font-medium text-white transition hover:bg-[#0b5ac7] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingAction === `confirm_${card.room_type_code}` ? "確認中..." : "選房"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {selectedRoom ? (
              <div className="mt-[14px] rounded-[18px] border border-[#d9e4f6] bg-white p-[12px]">
                <div className="text-[13px] font-medium text-[#0f172a]">
                  旅客資料
                </div>
                <div className="mt-[8px] text-[12px] text-[#64748b]">
                  已選房型：{selectedRoom.room_type_name} / {selectedRoom.room_count} 間
                </div>
                <div className="mt-[10px] grid grid-cols-1 gap-[10px]">
                  <div>
                    <FieldLabel label="姓名" />
                    <Input
                      value={guestDraft.guest_name}
                      onChange={(event) =>
                        setGuestDraft((prev) => ({
                          ...prev,
                          guest_name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel label="電話" />
                    <Input
                      value={guestDraft.guest_phone}
                      onChange={(event) =>
                        setGuestDraft((prev) => ({
                          ...prev,
                          guest_phone: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel label="Email" />
                    <Input
                      type="email"
                      value={guestDraft.guest_email}
                      onChange={(event) =>
                        setGuestDraft((prev) => ({
                          ...prev,
                          guest_email: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-[12px] flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    onClick={handleCreateBooking}
                    disabled={!canCreateBooking || loadingAction === "booking"}
                    className="rounded-[12px] bg-[#0f6beb] px-[14px] py-[8px] text-[13px] font-medium text-white transition hover:bg-[#0b5ac7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingAction === "booking" ? "建立中..." : "建立 Booking URL"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateMember}
                    disabled={!bookingRecordId || loadingAction === "member"}
                    className="rounded-[12px] bg-[#edf4ff] px-[14px] py-[8px] text-[13px] font-medium text-[#0f6beb] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingAction === "member" ? "同步中..." : "同步 Member"}
                  </button>
                </div>
                {bookingRecordId ? (
                  <div className="mt-[10px] rounded-[14px] bg-[#f8fbff] px-[12px] py-[10px] text-[12px] leading-[1.6] text-[#334155]">
                    <div>booking_record_id: {bookingRecordId}</div>
                    <div className="break-all">
                      booking_url:{" "}
                      {bookingUrl ? (
                        <a
                          href={bookingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0f6beb] underline"
                        >
                          {bookingUrl}
                        </a>
                      ) : (
                        "尚未建立"
                      )}
                    </div>
                    {memberResult ? (
                      <div>
                        member_id: {memberResult.member_id} / is_new_member:{" "}
                        {memberResult.is_new_member ? "true" : "false"}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="mt-[14px] rounded-[16px] border border-[#fecaca] bg-[#fff1f2] px-[12px] py-[10px] text-[12px] leading-[1.6] text-[#b91c1c]">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="ml-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f6beb_0%,#2ea1ff_100%)] text-white shadow-[0_18px_45px_rgba(15,107,235,0.35)] transition hover:scale-[1.03]"
      >
        <span className="text-[24px] leading-none">{open ? "×" : "聊"}</span>
      </button>
    </div>
  );
}
