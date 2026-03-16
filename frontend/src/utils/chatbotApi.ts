import { apiGet, apiPost } from "./apiClient";

export interface RoomCard {
  room_type_code: string;
  room_type_name: string;
  price: number;
  price_label: string;
  available_count: number | null;
  max_occupancy: number;
  image_url?: string | null;
  features?: string;
  source: "pms" | "faq_static" | "faq_kb";
}

export interface BookingContext {
  checkin_date?: string | null;
  checkout_date?: string | null;
  adults?: number | null;
}

export interface ChatbotMessageResponse {
  session_id: string;
  intent_state: "detecting" | "confirmed" | "none";
  reply_type: "text" | "room_cards" | "member_form" | "booking_confirm";
  reply: string;
  room_cards: RoomCard[];
  missing_fields: string[];
  turn_count: number;
  booking_context: BookingContext;
}

export interface ChatbotRoomsResponse {
  source: "pms" | "faq_static" | "faq_kb";
  rooms: RoomCard[];
}

export interface ConfirmRoomResponse {
  reply_type: "member_form";
  session_id: string;
  selected_room_type: string;
  selected_room_count: number;
  member_form: {
    fields: Array<{
      field_name: string;
      label: string;
      is_required: boolean;
      input_type: "text" | "tel" | "email";
      validation_pattern?: string | null;
      error_message?: string | null;
    }>;
    privacy_note: string;
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      detail = data?.detail ?? data?.message ?? detail;
    } catch {
      // ignore json parse failure
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function sendChatbotMessage(payload: {
  browser_key: string;
  message: string;
  hotel_id?: number | null;
  test_mode?: boolean;
}): Promise<ChatbotMessageResponse> {
  const response = await apiPost("/api/v1/chatbot/message", payload, {
    skipAuth: true,
  });
  return parseResponse<ChatbotMessageResponse>(response);
}

export async function getChatbotRooms(params: {
  browser_key: string;
  checkin_date: string;
  checkout_date: string;
  adults: number;
  children?: number;
}): Promise<ChatbotRoomsResponse> {
  const search = new URLSearchParams({
    browser_key: params.browser_key,
    checkin_date: params.checkin_date,
    checkout_date: params.checkout_date,
    adults: String(params.adults),
    children: String(params.children ?? 0),
  });
  const response = await apiGet(`/api/v1/chatbot/rooms?${search.toString()}`, {
    skipAuth: true,
  });
  return parseResponse<ChatbotRoomsResponse>(response);
}

export async function confirmChatbotRoom(payload: {
  browser_key: string;
  room_type_code: string;
  room_count: number;
  room_type_name?: string;
  source?: "pms" | "faq_static" | "faq_kb";
}): Promise<ConfirmRoomResponse> {
  const response = await apiPost("/api/v1/chatbot/confirm-room", payload, {
    skipAuth: true,
  });
  return parseResponse<ConfirmRoomResponse>(response);
}

export async function confirmChatbotRooms(payload: {
  browser_key: string;
  rooms: {
    room_type_code: string;
    room_count: number;
    room_type_name?: string;
    source?: "pms" | "faq_static" | "faq_kb";
  }[];
}): Promise<ConfirmRoomResponse> {
  const response = await apiPost("/api/v1/chatbot/confirm-room", payload, {
    skipAuth: true,
  });
  return parseResponse<ConfirmRoomResponse>(response);
}

export interface BookingSaveResponse {
  ok: boolean;
  reservation_id: string;
  cart_url?: string | null;
  saved: {
    crm_member_id?: number | null;
    selected_rooms: object[];
    room_type_code?: string | null;
    db_saved: boolean;
  };
}

export async function saveChatbotBooking(payload: {
  browser_key: string;
  member_name?: string;
  member_phone?: string;
  member_email?: string;
  checkin_date?: string;
  checkout_date?: string;
}): Promise<BookingSaveResponse> {
  const response = await apiPost("/api/v1/chatbot/booking-save", payload, {
    skipAuth: true,
  });
  return parseResponse<BookingSaveResponse>(response);
}

export async function resetChatbotSession(
  browser_key: string,
): Promise<{ ok: boolean; session_id: string }> {
  const response = await apiPost(
    "/api/v1/chatbot/session/reset",
    { browser_key },
    { skipAuth: true },
  );
  return parseResponse<{ ok: boolean; session_id: string }>(response);
}
