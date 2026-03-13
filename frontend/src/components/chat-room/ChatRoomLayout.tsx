/**
 * 聊天室布局容器
 * - 左側：會員資料卡（完全可編輯的表單 + 標籤 + 備註）
 * - 右側：聊天區域（藍色背景 + 對話氣泡 + 輸入框）
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ChatRoomLayoutProps, ChatMessage, ChatPlatform } from "./types";
import type { Member } from "../../types/member";
import { useSSE, useWebSocket } from "../../hooks/useWebSocket";
import MemberAvatar from "./MemberAvatar";
import MemberInfoPanelComplete from "./MemberInfoPanelComplete";
import MemberTagEditModal from "../MemberTagEditModal";
import ButtonEditAvatar from "../../imports/ButtonEdit-8025-230";
import svgPathsInfo from "../../imports/svg-k0rlkn3s4y";
import svgPaths from "../../imports/svg-bzzivawqvx";
import { useToast } from "../ToastProvider";
import { useAuth } from "../auth/AuthContext";
import MemberNoteEditor from "../shared/MemberNoteEditor";
import { useMembers } from "../../contexts/MembersContext";
import Container from "../../imports/Container-8548-103";
import { apiFetch, apiGet, apiPost, apiPut } from "../../utils/apiClient";
import { getJwtToken } from "../../utils/token";
// 新組件導入 (Figma v1087)
import { ChatBubble } from "./ChatBubble";
import { ResponseModeIndicator } from "./ResponseModeIndicator";
import { PlatformSwitcher } from "./PlatformSwitcher";

// Chat messages constants
const PAGE_SIZE = 6; // 每次載入 6 條訊息（3 對問答）

// 格式化日期為中文格式（2025/11/27（四））
const formatDateWithWeekday = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = weekdays[date.getDay()];
  return `${year}/${month}/${day}（${weekday}）`;
};

const TIMESTAMP_KEYS = [
  "timestamp",
  "created_at",
  "createdAt",
  "sent_at",
  "sentAt",
  "created_at_iso",
  "createdAtIso",
] as const;

function extractMessageTimestamp(message: ChatMessage): string | undefined {
  const msg = message as Record<string, unknown>;
  for (const key of TIMESTAMP_KEYS) {
    if (typeof msg[key] === "string") {
      return msg[key] as string;
    }
  }
  return undefined;
}

function findLatestMessageTimestamp(
  messages: ChatMessage[],
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const ts = extractMessageTimestamp(messages[i]);
    if (ts) return ts;
  }
  return undefined;
}

/**
 * Merge new messages into an existing sorted (oldest-first) array,
 * deduplicating by `id` and keeping chronological order by timestamp.
 */
function mergeNewMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const existingIds = new Set(existing.map((m) => m.id));
  const unique = incoming.filter((m) => !existingIds.has(m.id));
  if (unique.length === 0) return existing;

  const merged = [...existing, ...unique];
  merged.sort((a, b) =>
    (extractMessageTimestamp(a) || "").localeCompare(
      extractMessageTimestamp(b) || "",
    ),
  );
  return merged;
}

// 內嵌組件已移至獨立檔案:
// - UserAvatar, OfficialAvatar, MessageBubble → ChatBubble.tsx

// FB 訊息轉換函式：將外部 FB API 格式轉換為 ChatMessage 格式
function transformFbMessages(
  fbData: Array<{
    direction?: string;
    message?: string | object;
    time?: number;
  }>,
): ChatMessage[] {
  const messages: ChatMessage[] = fbData.map((item, idx) => {
    const directionRaw = (item.direction || "outgoing").toLowerCase();
    const isIncoming = ["ingoing", "incoming"].includes(directionRaw);
    const timestamp = item.time || 0;

    // 解析訊息內容（支援 Template 格式）
    let text: string;
    if (typeof item.message === "object" && item.message !== null) {
      const attachment = (item.message as any)?.attachment;
      if (attachment?.type === "template") {
        const elements = attachment.payload?.elements || [];
        text =
          elements
            .map((el: any) => `${el.title || ""} - ${el.subtitle || ""}`)
            .join("\n") || "[模板訊息]";
      } else {
        text = JSON.stringify(item.message);
      }
    } else {
      text = String(item.message || "");
    }

    const dt = timestamp ? new Date(timestamp * 1000) : new Date();
    return {
      id: `fb_${idx}_${timestamp}`,
      type: isIncoming ? "user" : "official",
      text,
      time: dt.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: dt.toISOString(),
      isRead: true,
      source: isIncoming ? undefined : "external",
    } as ChatMessage;
  });

  // 按時間正序排列（舊→新）
  messages.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
  return messages;
}

export default function ChatRoomLayout({
  member: initialMember,
  memberId,
  chatSessionApiBase = "/api/v1",
  onPlatformChange,
  initialPlatform,
}: ChatRoomLayoutProps) {
  const { fetchMemberById, getDisplayMemberById } = useMembers();
  const [member, setMember] = useState<Member | undefined>(initialMember);
  const [isLoadingMember, setIsLoadingMember] = useState(false);

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [messageInput, setMessageInput] = useState("");
  const [isComposing, setIsComposing] = useState(false); // IME composition state
  const [isSending, setIsSending] = useState(false); // Sending message state
  const [visibleDate, setVisibleDate] = useState<string>(""); // 當前可見訊息的日期
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [memberTags, setMemberTags] = useState<string[]>(
    member?.memberTags || [],
  ); // ✅ 使用真實會員標籤
  const [interactionTags, setInteractionTags] = useState<string[]>(
    member?.interactionTags || [],
  ); // ✅ 使用真實互動標籤

  // 平台切換狀態 (Figma v1087)
  const [currentPlatform, setCurrentPlatform] = useState<ChatPlatform>(
    initialPlatform || "LINE",
  );
  const [threadsMap, setThreadsMap] = useState<Record<string, string>>({});
  const [availablePlatforms, setAvailablePlatforms] = useState<ChatPlatform[]>([]);

  // FB 外部 API 設定
  const fbApiBaseUrl = useMemo(
    () =>
      (
        import.meta.env.VITE_FB_API_URL?.trim() ||
        "https://api-youth-tycg.star-bit.io"
      ).replace(/\/+$/, ""),
    [],
  );
  const [fbPageId, setFbPageId] = useState<string | null>(null);

  // 載入 chat-session：平台與 thread 映射
  const loadChatSession = useCallback(async () => {
    const targetId = member?.id?.toString() || memberId;
    if (!targetId) return;
    try {
      const query =
        initialPlatform === "Facebook"
          ? `?platform=${encodeURIComponent(initialPlatform)}`
          : "";
      const resp = await apiGet(
        `${chatSessionApiBase}/members/${targetId}/chat-session${query}`,
      );
      const result = await resp.json();
      if (result.code === 200 && result.data) {
        const { available_platforms, default_platform, threads } = result.data;
        const platforms = (
          Array.isArray(available_platforms) ? available_platforms : Object.keys(threads || {})
        ) as ChatPlatform[];
        const finalPlatforms = (
          platforms.length ? platforms : ["LINE"]
        ) as ChatPlatform[];
        setAvailablePlatforms(finalPlatforms);
        setThreadsMap(threads || {});
        const nextPlatform =
          (default_platform as ChatPlatform) || finalPlatforms[0] || "LINE";
        setCurrentPlatform(nextPlatform);
        onPlatformChange?.(nextPlatform);
      }
    } catch (e) {
      console.error("載入 chat-session 失敗", e);
    }
  }, [
    member?.id,
    memberId,
    onPlatformChange,
    chatSessionApiBase,
    initialPlatform,
  ]);

  // GPT 計時器狀態
  const [isGptManualMode, setIsGptManualMode] = useState(false);
  const gptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MANUAL_MODE_DURATION = 10 * 60 * 1000; // 10 分鐘
  const [note, setNote] = useState(member?.internal_note || "");

  // Avatar interaction states
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarPressed, setIsAvatarPressed] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialScrolled = useRef(false); // 追蹤是否已完成初次滾動

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { logout } = useAuth();

  // GPT 計時器：共用工具函式
  const getGptApiUrl = useCallback(() => {
    const platformParam =
      currentPlatform === "Facebook" ? "?platform=Facebook" : "";
    return `/api/v1/members/${member?.id}${platformParam}`;
  }, [member?.id, currentPlatform]);

  const clearGptTimer = useCallback(() => {
    if (gptTimerRef.current) {
      clearTimeout(gptTimerRef.current);
      gptTimerRef.current = null;
    }
  }, []);

  const clearGptLocalStorage = useCallback((memberId: number | string) => {
    localStorage.removeItem(`gpt_fallback_${memberId}`);
    localStorage.removeItem(`gpt_timer_${memberId}`);
  }, []);

  // GPT 計時器函式：恢復自動模式（必須在 useEffect 之前定義）
  const restoreGptMode = useCallback(async () => {
    if (!member?.id) return;

    const apiUrl = getGptApiUrl();
    console.log("🔄 [GPT Timer] 恢復自動模式", {
      member_id: member.id,
      platform: currentPlatform,
      url: apiUrl,
    });

    try {
      const response = await apiPut(apiUrl, { gpt_enabled: true });
      console.log("📥 [GPT Timer] API 回應狀態 (恢復):", response.status);

      // 404 表示會員不存在於 DB，改用 localStorage
      if (response.status === 404) {
        console.log(
          "📦 [GPT Timer] 會員不存在於 DB，使用 localStorage fallback (恢復)",
        );
        clearGptLocalStorage(member.id);
        setIsGptManualMode(false);
        clearGptTimer();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [GPT Timer] API 錯誤 (恢復):", errorData);
        throw new Error(`API 錯誤: ${response.status}`);
      }

      console.log("✅ [GPT Timer] GPT 自動模式已恢復");
      localStorage.removeItem(`gpt_timer_${member.id}`);
      setIsGptManualMode(false);
      clearGptTimer();
    } catch (error) {
      console.error("❌ [GPT Timer] 恢復 GPT 自動模式失敗:", error);
    }
  }, [
    member?.id,
    currentPlatform,
    getGptApiUrl,
    clearGptLocalStorage,
    clearGptTimer,
  ]);

  // GPT 計時器函式：啟動手動模式
  const startGptTimer = useCallback(async () => {
    if (!member?.id) return;

    const apiUrl = getGptApiUrl();
    console.log("🔄 [GPT Timer] 啟動手動模式", {
      member_id: member.id,
      platform: currentPlatform,
      url: apiUrl,
    });

    clearGptTimer();

    // 內部函式：設定手動模式 UI 和計時器
    const activateManualMode = () => {
      setIsGptManualMode(true);
      gptTimerRef.current = setTimeout(restoreGptMode, MANUAL_MODE_DURATION);
      console.log(
        "⏱️ [GPT Timer] 計時器已啟動，將在",
        MANUAL_MODE_DURATION / 1000,
        "秒後恢復",
      );
    };

    const saveTimerState = () => {
      localStorage.setItem(
        `gpt_timer_${member.id}`,
        JSON.stringify({
          memberId: member.id,
          isManualMode: true,
          startTime: Date.now(),
        }),
      );
    };

    try {
      const response = await apiPut(apiUrl, { gpt_enabled: false });
      console.log("📥 [GPT Timer] API 回應狀態:", response.status);

      // 404 表示會員不存在於 DB，改用 localStorage fallback
      if (response.status === 404) {
        console.log(
          "📦 [GPT Timer] 會員不存在於 DB，使用 localStorage fallback",
        );
        localStorage.setItem(
          `gpt_fallback_${member.id}`,
          JSON.stringify({
            memberId: member.id,
            platform: currentPlatform,
            gpt_enabled: false,
            startTime: Date.now(),
            expiresAt: Date.now() + MANUAL_MODE_DURATION,
          }),
        );
        saveTimerState();
        activateManualMode();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [GPT Timer] API 錯誤:", errorData);
        throw new Error(`API 錯誤: ${response.status}`);
      }

      console.log("✅ [GPT Timer] 手動模式已啟動 (DB)");
      saveTimerState();
      activateManualMode();
    } catch (error) {
      console.error("❌ [GPT Timer] 啟動 GPT 手動模式失敗:", error);
      showToast?.("操作失敗,請重試", "error");
    }
  }, [
    member?.id,
    currentPlatform,
    MANUAL_MODE_DURATION,
    getGptApiUrl,
    clearGptTimer,
    restoreGptMode,
    showToast,
  ]);

  const memberLastInteractionRaw = member
    ? (member as any).last_interaction_at
    : null;

  const latestChatTimestamp = useMemo(() => {
    const messageTimestamp = findLatestMessageTimestamp(messages);
    if (messageTimestamp) return messageTimestamp;
    return member?.lastChatTime || memberLastInteractionRaw || null;
  }, [messages, member?.lastChatTime, memberLastInteractionRaw]);

  const displayMember = useMemo(() => {
    if (!member) return undefined;
    const overrides: Partial<Member> = {};
    if (currentPlatform === "LINE") {
      overrides.avatar = member.lineAvatar || member.line_avatar;
      overrides.username = member.line_display_name || member.username;
    } else if (currentPlatform === "Facebook") {
      overrides.avatar = (member as any).fb_avatar;
      overrides.username = (member as any).fb_customer_name || member.username;
    } else if (currentPlatform === "Webchat") {
      overrides.avatar = (member as any).webchat_avatar;
      overrides.username = (member as any).webchat_name || member.username;
    }
    return { ...member, ...overrides };
  }, [member, currentPlatform]);

  const panelMember = useMemo(() => {
    if (!displayMember) return undefined;
    if (
      !latestChatTimestamp ||
      latestChatTimestamp === displayMember.lastChatTime
    ) {
      return displayMember;
    }
    return { ...displayMember, lastChatTime: latestChatTimestamp };
  }, [displayMember, latestChatTimestamp]);

  // 獲取渠道名稱（粉專名/頻道名）- 根據會員的 join_source 決定
  const panelChannelName = useMemo(() => {
    const targetId = member?.id?.toString() || memberId;
    if (!targetId) return null;

    const memberAny = member as Record<string, unknown> | undefined;
    const joinSource = String(memberAny?.join_source || "").toLowerCase();
    const fbCustomerId = memberAny?.fb_customer_id || memberAny?.channelUid;
    const isFacebook = joinSource === "facebook" || joinSource === "fb";

    // Facebook 會員：顯示 FB 粉專名稱
    if (isFacebook && fbCustomerId) {
      return getDisplayMemberById(`fb-${fbCustomerId}`)?.channelName ?? null;
    }

    // LINE 會員：顯示 LINE 頻道名稱
    if (joinSource === "line" || !joinSource) {
      return getDisplayMemberById(`line-${targetId}`)?.channelName ?? null;
    }

    return null;
  }, [member, memberId, getDisplayMemberById]);

  // Fetch full member details when component mounts
  useEffect(() => {
    const targetId = initialMember?.id || memberId;
    if (!targetId) return;

    const loadMemberDetail = async () => {
      setIsLoadingMember(true);
      const fullMember = await fetchMemberById(
        targetId,
        initialPlatform === "Facebook" ? initialPlatform : undefined,
      );
      if (fullMember) {
        setMember(fullMember);
      }
      setIsLoadingMember(false);
    };

    loadMemberDetail();
  }, [initialMember?.id, memberId, fetchMemberById]);

  // 初始載入 chat session (platforms, threads)
  useEffect(() => {
    loadChatSession();
  }, [loadChatSession]);

  // FB 渠道：取得 active channel 的 page_id
  useEffect(() => {
    if (currentPlatform === "Facebook") {
      apiGet("/api/v1/fb_channels")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const active = Array.isArray(data)
            ? data.find((ch: { is_active?: boolean }) => ch.is_active)
            : null;
          setFbPageId(active?.page_id || null);
        })
        .catch(() => setFbPageId(null));
    }
  }, [currentPlatform]);

  useEffect(() => {
    if (onPlatformChange) {
      onPlatformChange(currentPlatform);
    }
  }, [currentPlatform, onPlatformChange]);

  // Sync member data for related UI pieces when member changes
  useEffect(() => {
    if (member) {
      setNote(member.internal_note || "");
      setMemberTags(member.memberTags || []);
      setInteractionTags(member.interactionTags || []);
    }
  }, [member]);

  // 先計算 threadId，再用於 SSE 與推播過濾
  const currentThreadId = threadsMap[currentPlatform];

  // SSE 監聽新訊息（thread 維度）
  const handleNewMessage = useCallback(
    (sseMessage: any) => {
      console.log("[SSE] 收到訊息:", JSON.stringify(sseMessage, null, 2));
      console.log("[SSE] currentThreadId:", currentThreadId);

      // 規則發佈通知 — 插入系統提示訊息
      if (sseMessage.type === "rule_updated" && sseMessage.data) {
        const systemMsg = {
          id: `rule-updated-${Date.now()}`,
          role: "system",
          content: `📢 ${sseMessage.data.message || "規則已更新"}（${sseMessage.data.published_count || 0} 筆）`,
          timestamp: new Date().toISOString(),
          thread_id: currentThreadId,
        };
        setMessages((prev) => [...prev, systemMsg]);
        return;
      }

      if (sseMessage.type === "new_message" && sseMessage.data) {
        const incomingThread =
          sseMessage.data.thread_id || sseMessage.data.threadId;
        console.log(
          "[SSE] incomingThread:",
          incomingThread,
          "比對結果:",
          incomingThread === currentThreadId,
        );

        if (
          currentThreadId &&
          incomingThread &&
          incomingThread !== currentThreadId
        ) {
          console.log("[SSE] thread 不匹配，忽略");
          return;
        }

        // 將新訊息按時間戳插入正確位置（messages 維持「舊 -> 新」排序）
        setMessages((prev) => mergeNewMessages(prev, [sseMessage.data]));

        // 同步更新會員的最後聊天時間
        if (member) {
          setMember({
            ...member,
            lastChatTime: sseMessage.data.timestamp || new Date().toISOString(),
          });
        }
      }
    },
    [member, currentThreadId],
  );

  // Load chat messages from API
  // 支援兩種情況：1) member?.id 存在  2) 只有 memberId
  // FB 渠道：直接呼叫外部 FB API
  const loadChatMessages = useCallback(
    async (
      pageNum: number = 1,
      append: boolean = false,
      options?: { silent?: boolean },
    ) => {
      const targetId = member?.id?.toString() || memberId;
      if (!targetId) return;

      const silent = options?.silent ?? false;
      if (!silent) {
        setIsLoading(true);
      }
      try {
        let newMessages: ChatMessage[] = [];
        let has_more = false;

        // FB 渠道：直接呼叫外部 FB API（使用 jwt_token，不經過 apiClient）
        if (currentPlatform === "Facebook") {
          const jwtToken = getJwtToken();
          // FB 會員的 customer_id 從 member.channelUid 或 memberId 取得
          const customerId =
            (member as any)?.channelUid ||
            (member as any)?.fb_customer_id ||
            memberId;

          if (!jwtToken || !fbPageId || !customerId) {
            console.error("FB 聊天紀錄載入失敗：缺少必要參數", {
              jwtToken: !!jwtToken,
              fbPageId,
              customerId,
            });
            return;
          }

          const fbResponse = await fetch(
            `${fbApiBaseUrl}/api/v1/admin/meta_page/message/history?customer_id=${customerId}&page_id=${fbPageId}`,
            { headers: { Authorization: `Bearer ${jwtToken}` } },
          );
          const fbResult = await fbResponse.json();

          if (fbResult.status === 200 && fbResult.data) {
            newMessages = transformFbMessages(fbResult.data);
            has_more = false; // 外部 API 一次返回全部訊息
          } else {
            console.error("FB API 回應錯誤:", fbResult);
            return;
          }
        } else {
          // LINE/Webchat：透過後端 API（使用 apiGet 自動處理 token 和 401 重試）
          const url = `/api/v1/members/${targetId}/chat-messages?page=${pageNum}&page_size=${PAGE_SIZE}&platform=${currentPlatform}`;

          const response = await apiGet(url);

          const result = await response.json();

          if (result.code === 200 && result.data) {
            newMessages = result.data.messages;
            has_more = result.data.has_more;
          } else {
            console.error("API 回應格式錯誤:", result);
            return;
          }
        }

        // 處理訊息列表
        if (append) {
          // append=true 表示載入更早訊息（往上翻頁），需「前插」以維持舊→新排序
          setMessages((prev) => {
            const existingIds = new Set(prev.map((msg) => msg.id));
            const uniqueNewMessages = newMessages.filter(
              (msg: ChatMessage) => !existingIds.has(msg.id),
            );
            return [...uniqueNewMessages, ...prev];
          });
        } else {
          setMessages(newMessages);
        }

        setHasMore(has_more);
        setPage(pageNum);
      } catch (error) {
        console.error("載入聊天訊息失敗:", error);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [
      member?.id,
      (member as any)?.channelUid,
      (member as any)?.fb_customer_id,
      memberId,
      currentPlatform,
      fbApiBaseUrl,
      fbPageId,
    ],
  );

  // FB 即時訊息：thread_id 用 fb_customer_id 作為 SSE 監聽的 key
  const fbCustomerId =
    (member as any)?.fb_customer_id || (member as any)?.channelUid || undefined;
  const fbThreadId =
    currentPlatform === "Facebook" && fbCustomerId
      ? `fb_${fbCustomerId}`
      : undefined;

  // LINE 用 SSE（因外部代理 HTTP/2 不支援 WebSocket Upgrade）
  // Facebook/Webchat 用 WebSocket
  const lineThreadId = currentPlatform === "LINE" ? currentThreadId : undefined;
  const wsThreadId =
    currentPlatform === "Facebook"
      ? fbThreadId
      : currentPlatform === "Webchat"
        ? currentThreadId
        : undefined;

  const { isConnected: sseConnected } = useSSE(lineThreadId, handleNewMessage);
  const { isConnected: wsConnected } = useWebSocket(
    wsThreadId,
    handleNewMessage,
  );
  const isRealtimeConnected = sseConnected || wsConnected;

  // Facebook WebSocket 代理：後端連外部 WS，透過 SSE 推送
  useEffect(() => {
    if (currentPlatform !== "Facebook" || !fbCustomerId || !fbPageId) return;

    const jwtToken = getJwtToken();
    if (!jwtToken) return;

    const customerId = String(fbCustomerId);
    apiPost("/api/v1/fb-ws-proxy/start", {
      fb_customer_id: customerId,
      page_id: fbPageId,
      jwt_token: jwtToken,
      thread_id: `fb_${customerId}`,
    }).catch((e) => console.error("[FB Proxy] Failed to start:", e));

    return () => {
      apiPost("/api/v1/fb-ws-proxy/stop", {
        fb_customer_id: customerId,
        page_id: fbPageId,
      }).catch(() => {});
    };
  }, [currentPlatform, fbCustomerId, fbPageId]);

  // Polling fallback：當 SSE 無法連線時，自動輪詢新訊息
  useEffect(() => {
    // 僅在 SSE 未連線 & LINE/Webchat 平台時啟用 polling
    if (isRealtimeConnected || currentPlatform === "Facebook") return;
    const targetId = member?.id?.toString() || memberId;
    if (!targetId) return;

    const poll = async () => {
      try {
        const url = `/api/v1/members/${targetId}/chat-messages?page=1&page_size=${PAGE_SIZE}&platform=${currentPlatform}`;
        const response = await apiGet(url);
        const result = await response.json();
        if (result.code === 200 && result.data?.messages) {
          const fetched: ChatMessage[] = result.data.messages;
          setMessages((prev) => mergeNewMessages(prev, fetched));
        }
      } catch {
        // polling 失敗不顯示錯誤
      }
    };

    const intervalId = setInterval(poll, 3000);
    return () => clearInterval(intervalId);
  }, [isRealtimeConnected, currentPlatform, member?.id, memberId]);

  // 平台切換時重置訊息狀態並重新載入
  useEffect(() => {
    // Facebook 平台需要等待 fbPageId 獲取完成
    if (currentPlatform === "Facebook" && !fbPageId) {
      return;
    }
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setVisibleDate("");
    loadChatMessages(1, false);
  }, [currentPlatform, loadChatMessages, fbPageId]);

  // 初始載入訊息後設定 visibleDate（顯示最新訊息的日期）
  useEffect(() => {
    const container = chatContainerRef.current;
    const isNearBottom =
      !container ||
      container.scrollHeight - container.scrollTop - container.clientHeight <
        24;

    if (messages.length > 0) {
      // 停在底部時，visibleDate 應隨最新訊息更新；不在底部則交給 scroll handler 決定顯示哪一天
      if (!visibleDate || isNearBottom) {
        const lastMessage = messages[messages.length - 1];
        const timestampFromMessage = extractMessageTimestamp(lastMessage);
        if (timestampFromMessage) {
          const next = formatDateWithWeekday(timestampFromMessage);
          if (next && next !== visibleDate) {
            setVisibleDate(next);
          }
          return;
        }
      }
    }

    if (!visibleDate && latestChatTimestamp) {
      const next = formatDateWithWeekday(latestChatTimestamp);
      if (next && next !== visibleDate) {
        setVisibleDate(next);
      }
    }
  }, [messages, latestChatTimestamp, visibleDate]);

  // Handle scroll for infinite scrolling and visible date update
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;

      // 更新當前可見訊息的日期（找最後一個可見訊息）
      const messageElements = container.querySelectorAll("[data-timestamp]");
      const containerRect = container.getBoundingClientRect();
      const dateHeaderHeight = 60; // 日期標籤高度 + padding

      let lastVisibleTimestamp: string | null = null;

      for (const el of messageElements) {
        const rect = el.getBoundingClientRect();
        // 訊息在可見區域內（底部高於頂部 + header，頂部低於底部）
        if (
          rect.bottom > containerRect.top + dateHeaderHeight &&
          rect.top < containerRect.bottom
        ) {
          const timestamp = el.getAttribute("data-timestamp");
          if (timestamp) {
            lastVisibleTimestamp = timestamp;
          }
        }
      }

      if (lastVisibleTimestamp) {
        const newDate = formatDateWithWeekday(lastVisibleTimestamp);
        if (newDate && newDate !== visibleDate) {
          setVisibleDate(newDate);
        }
      }

      // 接近頂部（< 50px）+ 還有更多訊息 + 不在載入中
      if (container.scrollTop < 50 && hasMore && !isLoading) {
        const prevScrollHeight = container.scrollHeight;

        const loadMore = async () => {
          await loadChatMessages(page + 1, true);
          // 保持滾動位置（避免跳動）
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        };

        loadMore();
      }
    },
    [hasMore, isLoading, page, loadChatMessages, visibleDate],
  );

  // Auto-scroll to bottom on initial load (只執行一次)
  // Note: Initial message loading is handled by the platform switch effect above
  useEffect(() => {
    if (
      messages.length > 0 &&
      chatContainerRef.current &&
      page === 1 &&
      !hasInitialScrolled.current
    ) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
          hasInitialScrolled.current = true; // 標記已完成初次滾動
        }
      });
    }
  }, [messages, page]);

  // 切換會員或平台時重置初次滾動標記
  useEffect(() => {
    hasInitialScrolled.current = false;
  }, [member?.id, memberId, currentPlatform]);

  // 當內容不夠滾動但還有更多訊息時，自動載入更多
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !hasMore || isLoading) return;

    // 檢查是否可以滾動（內容高度 > 容器高度）
    const canScroll = container.scrollHeight > container.clientHeight;

    if (!canScroll && messages.length > 0) {
      loadChatMessages(page + 1, true);
    }
  }, [messages, hasMore, isLoading, page, loadChatMessages]);

  // Note: 不要在 messages 每次變動就強制滾到底部，否則會破壞「向上載入更早訊息」的滾動位置保持。

  // GPT 計時器 useEffect：多分頁同步
  useEffect(() => {
    if (!member?.id) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `gpt_timer_${member.id}`) {
        if (event.newValue) {
          // 其他分頁啟動了計時器
          setIsGptManualMode(true);
        } else {
          // 其他分頁清除了計時器
          setIsGptManualMode(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [member?.id]);

  // GPT 計時器初始化：清除殘留狀態並從資料庫同步
  useEffect(() => {
    if (!member?.id) return;

    const timerKey = `gpt_timer_${member.id}`;
    const storedTimer = localStorage.getItem(timerKey);

    // 清除頁面重新整理時的殘留狀態
    if (storedTimer) {
      localStorage.removeItem(timerKey);
      if (gptTimerRef.current) {
        clearTimeout(gptTimerRef.current);
        gptTimerRef.current = null;
      }
    }

    // 從資料庫同步 GPT 模式狀態
    if (member.gpt_enabled !== undefined) {
      const shouldBeManualMode = !member.gpt_enabled;
      if (shouldBeManualMode !== isGptManualMode) {
        setIsGptManualMode(shouldBeManualMode);
        if (shouldBeManualMode) {
          startGptTimer();
        }
      }
    }
  }, [member?.id, member?.gpt_enabled]);

  // GPT 計時器清理：會員切換或組件卸載時
  useEffect(() => {
    return () => {
      if (member?.id && isGptManualMode) {
        restoreGptMode();
      }
      if (gptTimerRef.current) {
        clearTimeout(gptTimerRef.current);
      }
    };
  }, [member?.id, isGptManualMode, restoreGptMode]);

  const handleSendMessage = async () => {
    const trimmedText = messageInput.trim();
    if (!trimmedText || !member?.id || isSending) return;
    const platform = currentPlatform || "LINE";

    setIsSending(true);

    try {
      let response: Response;

      if (platform === "Facebook") {
        // Facebook：透過 WebSocket 代理發送
        const customerId =
          (member as any)?.fb_customer_id || (member as any)?.channelUid;
        if (!customerId || !fbPageId) {
          alert("缺少 Facebook 會員資訊");
          setIsSending(false);
          return;
        }

        response = await apiPost("/api/v1/fb-ws-proxy/send", {
          fb_customer_id: String(customerId),
          page_id: fbPageId,
          text: trimmedText,
        });

        // WebSocket 代理不可用時，fallback 到 HTTP
        if (response.status === 503) {
          console.warn("[FB Send] WS proxy 不可用，fallback 到 HTTP");
          const jwtToken = getJwtToken();
          if (!jwtToken) {
            alert("請先完成 Facebook 授權");
            setIsSending(false);
            return;
          }
          response = await apiPost(`/api/v1/members/${member.id}/chat/send`, {
            text: trimmedText,
            platform: "Facebook",
            jwt_token: jwtToken,
            fb_customer_id: String(customerId),
          });
        }
      } else {
        // LINE / Webchat：原有流程
        response = await apiPost(`/api/v1/members/${member.id}/chat/send`, {
          text: trimmedText,
          platform,
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "發送失敗");
      }

      const result = await response.json();

      if (result.success) {
        // 清空輸入框
        setMessageInput("");

        // ⭐ 根據輸入框焦點狀態決定 GPT 模式
        // - 如果仍聚焦（用戶還在輸入框內）→ 重置計時器，繼續手動模式
        // - 如果已失焦（用戶離開輸入框）→ 立即恢復自動模式
        if (isGptManualMode) {
          const isStillFocused =
            messageTextareaRef.current === document.activeElement;
          if (isStillFocused) {
            startGptTimer(); // 仍聚焦 → 重置 10 分鐘計時器
          } else {
            restoreGptMode(); // 已失焦 → 恢復自動模式
          }
        }

        // SSE 未連線時：發送成功後重新載入聊天紀錄
        // SSE 已連線（含 FB 代理）：新訊息透過即時通道推送
        if (!isRealtimeConnected) {
          await loadChatMessages(1, false, { silent: true });
        }

        // 滾動到底部
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 100);
      } else {
        throw new Error(result.message || "發送失敗");
      }
    } catch (error) {
      console.error("發送訊息失敗:", error);
      showToast?.("發送訊息失敗，請重試", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleEditTags = () => {
    setIsTagModalOpen(true);
  };

  const handleSaveTags = async (
    newMemberTags: string[],
    newInteractionTags: string[],
  ): Promise<boolean> => {
    try {
      // Facebook 會員：使用外部 FB API
      if (currentPlatform === "Facebook") {
        const fbCustomerId = (member as any)?.fb_customer_id;
        if (!fbCustomerId) {
          showToast("找不到 Facebook 會員 ID", "error");
          return false;
        }

        const { updateFbTags } = await import("../../utils/fbTagApi");
        const result = await updateFbTags(
          fbCustomerId,
          memberTags,
          newMemberTags,
          interactionTags,
          newInteractionTags,
        );

        if (!result.success) {
          showToast(result.error || "FB 標籤更新失敗", "error");
          return false;
        }

        // 更新本地狀態
        setMemberTags(newMemberTags);
        setInteractionTags(newInteractionTags);

        // 嘗試刷新會員資料
        if (member?.id) {
          const refreshedMember = await fetchMemberById(member.id, "Facebook");
          if (refreshedMember) {
            setMember(refreshedMember);
            setMemberTags(refreshedMember.memberTags || []);
            setInteractionTags(refreshedMember.interactionTags || []);
          }
        }
        return true;
      }

      // LINE/Webchat 會員：使用內部 API
      const response = await apiPost(
        `/api/v1/members/${member?.id}/tags/batch-update`,
        {
          member_tags: newMemberTags,
          interaction_tags: newInteractionTags,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("標籤更新失敗:", errorData);
        showToast(errorData.detail || "標籤更新失敗", "error");
        return false;
      }

      // API 成功後刷新會員資料，確保列表/內頁/聊天室一致
      if (member?.id) {
        const refreshedMember = await fetchMemberById(member.id);
        if (refreshedMember) {
          setMember(refreshedMember);
          setMemberTags(refreshedMember.memberTags || []);
          setInteractionTags(refreshedMember.interactionTags || []);
          return true;
        }
      }

      // 若刷新失敗，至少更新本地狀態
      setMemberTags(newMemberTags);
      setInteractionTags(newInteractionTags);
      return true;
    } catch (error) {
      console.error("標籤更新錯誤:", error);
      showToast("標籤更新失敗，請稍後再試", "error");
      return false;
    }
  };

  // Avatar upload handlers
  const handleAvatarClick = () => {
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast("圖片大小不能超過 5MB", "error");
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          showToast("請選擇圖片檔案", "error");
          return;
        }

        // Simulate backend API call
        // await uploadAvatar(file);
        showToast("儲存成功", "success");
      } catch (error) {
        showToast("儲存失敗", "error");
      }
    }
  };

  return (
    <>
      {/* Main Layout: Two Columns (Figma 3.png: 左大右小) */}
      <div className="content-stretch flex gap-[24px] items-start relative w-full h-full">
        {/* Left Column: Member Info Card (完整資料 + 標籤 + 備註) */}
        <div className="content-stretch flex flex-col gap-[24px] items-center relative self-stretch flex-1">
          {/* Avatar + Username */}
          <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
            {/* Avatar */}
            <div
              className="relative flex items-center justify-center size-[180px] rounded-full bg-[#EDF2F8] cursor-pointer overflow-hidden transition-all duration-300 ease-in-out"
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => {
                setIsAvatarHovered(false);
                setIsAvatarPressed(false);
              }}
              onMouseDown={() => setIsAvatarPressed(true)}
              onMouseUp={() => setIsAvatarPressed(false)}
              onClick={handleAvatarClick}
            >
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />

              {/* Channel-specific Avatar or Default User Icon */}
              {displayMember?.avatar ? (
                <img
                  src={displayMember.avatar}
                  alt="會員頭像"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[158.824px] size-[158.824px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
                  <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
                    <div className="relative shrink-0 size-[74.118px]">
                      <div className="absolute left-[calc(50%-0.06px)] size-[49.412px] top-[calc(50%-0.06px)] translate-x-[-50%] translate-y-[-50%]">
                        <svg
                          className="block size-full"
                          fill="none"
                          preserveAspectRatio="none"
                          viewBox="0 0 50 50"
                        >
                          <g>
                            <path d={svgPaths.pd9dc180} fill="#383838" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hover/Pressed Overlay */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
                  isAvatarHovered ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  backgroundColor: isAvatarPressed
                    ? "rgba(56, 56, 56, 0.5)"
                    : "rgba(56, 56, 56, 0.3)",
                }}
              >
                <div
                  className={`flex items-center justify-center size-[60px] transition-transform duration-150 ease-in-out ${
                    isAvatarPressed
                      ? "scale-95"
                      : isAvatarHovered
                        ? "scale-[2]"
                        : "scale-100"
                  }`}
                >
                  <ButtonEditAvatar className="w-[60px] h-[60px]" />
                </div>
              </div>
            </div>
            {/* 姓名 - 與詳情頁一致顯示 username */}
            <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[#383838] text-[32px] text-center whitespace-nowrap">
              {displayMember?.username || displayMember?.realName || "-"}
            </p>
          </div>

          {/* Member Info Panel */}
          <div className="relative rounded-[20px] shrink-0 w-full">
            <div
              aria-hidden="true"
              className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]"
            />
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[28px] relative w-full">
                {panelMember ? (
                  <MemberInfoPanelComplete
                    member={panelMember}
                    memberTags={memberTags}
                    interactionTags={interactionTags}
                    onEditTags={handleEditTags}
                    channelName={panelChannelName}
                  />
                ) : (
                  <div className="w-full text-center text-[#6e6e6e] text-[16px]">
                    載入會員資料中...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Note Section */}
          <div className="content-stretch flex gap-[32px] items-start relative rounded-[20px] shrink-0 w-full">
            <MemberNoteEditor
              initialValue={note}
              onSave={async (newNote) => {
                if (!member?.id) {
                  showToast("找不到會員資料", "error");
                  throw new Error("找不到會員資料");
                }

                // 使用 apiPut 自動處理 token 和 401 重試
                const response = await apiPut(
                  `/api/v1/members/${member.id}/notes`,
                  { internal_note: newNote },
                );

                if (!response.ok) {
                  let errorMessage = "儲存失敗";
                  try {
                    const errorData = await response.json();
                    errorMessage =
                      errorData.detail || errorData.message || errorMessage;
                  } catch {
                    // ignore json parse errors
                  }
                  showToast(errorMessage, "error");
                  throw new Error(errorMessage);
                }

                // Update local state only after successful API call
                setNote(newNote);

                // Update member object with new note
                if (member) {
                  setMember({
                    ...member,
                    internal_note: newNote,
                  });
                }
              }}
              containerClassName="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0"
              innerClassName="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] pb-[72px] relative w-full"
              editButtonPosition="absolute bottom-[28px] right-[28px]"
              saveButtonPosition="absolute bottom-[20px] right-[20px]"
            />
          </div>
        </div>

        {/* Right Column: Chat Area - Figma 3.png 布局 */}
        <div
          className="content-stretch flex flex-col gap-0 items-start relative self-stretch flex-1 rounded-[20px] overflow-hidden"
          style={{ height: "900px" }}
        >
          {/* 頂部白色工具列 - 平台選擇器（左）+ 日期（中） */}
          <div className="w-full px-[16px] py-[12px] flex items-center justify-between rounded-t-[20px] bg-white">
            {/* 平台選擇器 + 刷新按鈕（左側） */}
            <div className="flex items-center gap-2">
              <PlatformSwitcher
                value={currentPlatform}
                availablePlatforms={availablePlatforms}
                onChange={(platform) => {
                  if (messageInput.trim()) {
                    if (!window.confirm("你有未發送的草稿，確定要切換渠道嗎？")) {
                      return;
                    }
                    setMessageInput("");
                  }
                  setCurrentPlatform(platform);
                }}
              />
              {/* 即時連線狀態指示 */}
              <span
                title={
                  isRealtimeConnected
                    ? "即時連線中"
                    : currentPlatform === "Facebook"
                      ? "Facebook 未連線"
                      : "輪詢模式（每 3 秒更新）"
                }
                className={`inline-block w-2 h-2 rounded-full ${isRealtimeConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
              />
              <button
                onClick={() => loadChatMessages(1, false)}
                disabled={isLoading}
                title="重新整理聊天紀錄"
                className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <svg
                  className={`w-5 h-5 text-gray-500 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            {/* 日期（中間） */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              {visibleDate && (
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px] text-center whitespace-nowrap">
                  {visibleDate}
                </p>
              )}
            </div>

            {/* 右側留空保持平衡 */}
            <div className="w-[100px]"></div>
          </div>

          {/* 聊天訊息區域 - 淺藍色背景 */}
          <div
            className="content-stretch flex flex-col gap-0 items-start relative w-full rounded-b-[20px] overflow-hidden"
            style={{
              backgroundColor: "#CDEAFD",
              height: "calc(100% - 48px)",
              minHeight: "400px",
            }}
          >
            {/* Messages Scroll Container - 可滾動區域 */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="box-border content-stretch flex flex-col gap-[12px] items-start overflow-y-auto p-[16px] relative w-full"
              style={{ height: "calc(100% - 180px)" }}
            >
              {/* Loading more messages indicator (top) */}
              {isLoading && page > 1 && (
                <div className="w-full text-center py-2 text-gray-400 text-sm">
                  載入更早訊息...
                </div>
              )}

              {/* No more messages indicator */}
              {!hasMore && messages.length > 0 && (
                <div className="w-full text-center py-2 text-gray-400 text-sm">
                  ─── 沒有更多訊息了 ───
                </div>
              )}

              {/* Initial loading indicator */}
              {isLoading && page === 1 && (
                <div className="w-full text-center py-4 text-gray-500">
                  載入中...
                </div>
              )}

              {/* Empty state */}
              {messages.length === 0 && !isLoading && (
                <div className="w-full text-center py-4 text-gray-500">
                  暫無對話記錄
                </div>
              )}

              {/* Messages list (使用 ChatBubble - Figma v1087) */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  data-timestamp={extractMessageTimestamp(message) || ""}
                  className="w-full"
                >
                  <ChatBubble
                    message={message}
                    memberAvatar={
                      currentPlatform === "LINE"
                        ? panelMember?.lineAvatar ||
                          (panelMember as any)?.avatar
                        : currentPlatform === "Facebook"
                          ? (panelMember as any)?.fb_avatar
                          : (panelMember as any)?.webchat_avatar
                    }
                    platform={currentPlatform}
                  />
                </div>
              ))}
            </div>

            {/* Input Area (Fixed at Bottom) */}
            <div className="relative rounded-[20px] shrink-0 w-full px-[24px] pb-[24px]">
              <div className="bg-white relative rounded-[20px] shrink-0">
                <div className="flex flex-row justify-end min-h-inherit size-full">
                  <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
                    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-[96px] min-w-px relative shrink-0">
                      {/* Text Input */}
                      <div className="basis-0 content-stretch flex flex-wrap gap-[10px] grow items-center justify-center min-h-[108px] min-w-px relative shrink-0 w-full">
                        <textarea
                          ref={messageTextareaRef}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onFocus={startGptTimer}
                          onBlur={restoreGptMode}
                          onKeyDown={(e) => {
                            // Prevent sending message during IME composition (Chinese, Japanese, Korean input)
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              !e.nativeEvent.isComposing &&
                              !isComposing
                            ) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={() => setIsComposing(false)}
                          placeholder="輸入訊息文字"
                          className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow h-full leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none resize-none [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/60 [&::-webkit-scrollbar-thumb]:rounded-full"
                        />
                      </div>

                      {/* 底部列：回覆模式指示 + 傳送按鈕 (同一列) - Figma v1087 */}
                      <div className="content-stretch flex gap-[12px] items-center justify-between relative shrink-0 w-full">
                        {/* 回覆模式指示 (左側) - 保留原有 GPT 計時器邏輯 */}
                        <ResponseModeIndicator
                          mode={isGptManualMode ? "manual" : "ai_auto"}
                        />

                        {/* 傳送按鈕 (右側) */}
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || isSending}
                          className="bg-[#242424] disabled:opacity-50 relative rounded-[16px] min-h-[48px] min-w-[72px] shrink-0 transition-opacity disabled:cursor-not-allowed"
                        >
                          <div className="flex flex-row items-center justify-center min-h-inherit min-w-inherit size-full">
                            <div className="box-border content-stretch flex items-center justify-center min-h-inherit min-w-inherit px-[12px] py-[8px] relative size-full">
                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
                                {isSending ? "發送中..." : "傳送"}
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Edit Modal */}
      <MemberTagEditModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        initialMemberTags={memberTags}
        initialInteractionTags={interactionTags}
        onSave={handleSaveTags}
      />
    </>
  );
}
