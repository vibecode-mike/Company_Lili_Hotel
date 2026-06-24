/**
 * 聊天訊息時間格式化
 *
 * 時間架構：後端一律回 UTC aware ISO（+00:00）的 timestamp；
 * 顯示時用「觀看者瀏覽器本地時區」格式化成「時段 HH:mm」（例：下午 03:30）。
 * 時段以本地小時（getHours()，回觀看者時區）判斷，不可用 UTC 小時，否則跨時區會分錯時段桶。
 *
 * 邏輯與後端原 format_chat_time 完全對齊（凌晨/上午/中午/下午/晚上），
 * 差別只在「時區改由觀看者瀏覽器決定」。
 */
export function formatChatTime(timestamp?: string | null): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";

  const hour = d.getHours(); // 本地小時（觀看者時區）
  const minute = d.getMinutes();

  let period: string;
  let displayHour: number;
  if (hour >= 0 && hour < 6) {
    period = "凌晨";
    displayHour = hour > 0 ? hour : 12;
  } else if (hour < 12) {
    period = "上午";
    displayHour = hour;
  } else if (hour < 14) {
    period = "中午";
    displayHour = hour === 12 ? 12 : hour - 12;
  } else if (hour < 18) {
    period = "下午";
    displayHour = hour - 12;
  } else {
    period = "晚上";
    displayHour = hour - 12;
  }

  return `${period} ${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
