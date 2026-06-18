# 字體遷移清單 — Inter / PingFang → Noto（待辦 B）

> Generated: 2026-06-18
> 來源：`token-migration-map.md` §1.1 + §6a，加上實際 grep 校正。
> 目標：全站統一 `--font-family-base`（= `'Noto Sans TC', sans-serif`，已定義於 `globals.css :root`）。
> 原則：`html/body` 全域已設 Noto Sans TC，所以**直接移除 `font-['Inter…']` 這個 arbitrary class，讓元素繼承全域 Noto** 即達標（family-only，weight 另由 `font-normal` 控制，移除不影響粗細）。
>
> **狀態：dev 已全數完成（2026-06-18），`npm run build` 通過，scope 內零 `Inter`/`PingFang` 殘留。待 staging 眼睛確認（尤其 ⚠️ JP 訊息預覽）。**

---

## 與 map / progress 的差異校正

1. **PingFang 不在範圍內**：唯一的 `font-['PingFang_TC',…]` 在 `src/imports/MemberDetailContainer.tsx`（已排除的 Figma 死碼），**不處理**。
2. **`common/styles.ts` 漏列於 progress §3**：補上。其中 `FONTS.inter` / `FONTS.notoSansJP` **定義了但全站零引用**（只有 `FONTS.notoSans` 被用），屬死常數 → 直接刪除這兩個 key。
3. **`globals.css` 有一條真實 Inter CSS 規則**：`.booking-url-text`（訂房 URL 按鈕文字）→ 改 `'Noto Sans TC', sans-serif`。

---

## 清單（9 個元件檔 + styles.ts + globals.css）

每改完一檔打勾。`⚠️ JP` = 含 `'Noto_Sans_JP'` 備援、屬訊息預覽的日文示意字，移除後改由 Noto Sans TC 描繪 CJK，**列入 staging 眼睛確認**。

- [x] **1. `components/chat-room/ChatMessageList.tsx`** — L29 ×1（`Inter:Regular`）
- [x] **2. `components/CreateAutoReplyInteractive.tsx`** — L728 ×1（OA 標籤，`Inter:Regular`）
- [x] **3. `components/MessageDetailDrawer.tsx`** — L446/465/473/481 ×4（`Inter:Regular`）
- [x] **4. `components/FacilitiesContent.tsx`** — L392 ×1（表格 cell，`Inter`）
- [x] **5. `components/message-creation/PreviewPanel.tsx`** — L81/90/99/116 ×4 ⚠️ JP（L81/90/116 含 JP 備援）
- [x] **6. `components/common/PreviewContainers.tsx`** — L74/89/102/115/131 ×5 ⚠️ JP（L89/102/131 含 JP 備援）
- [x] **7. `components/BasicSettingsEmpty.tsx`** — L84/89/144/149/183/188/219/224 ×8（`Inter`）
- [x] **8. `components/BasicSettingsList.tsx`** — L246 ×1（`Inter`）
- [x] **9. `components/PMSIntegration.tsx`** — L428/433/438/444 ×4（表格 cell，`Inter`）
- [x] **10. `components/common/styles.ts`** — 刪除死常數 `FONTS.inter`（L49）、`FONTS.notoSansJP`（L50）
- [x] **11. `styles/globals.css`** — L430 `.booking-url-text` 的 `font-family: 'Inter'` → `'Noto Sans TC', sans-serif`

> 合計 className 處：1+1+4+1+4+5+8+1+4 = **29 處**（對齊 map 的 19 + 8+）。

---

## 改法範例

className（移除 family，其餘 class 不動）：
```diff
- <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#383838] text-[12px]">
+ <p className="font-normal leading-[18px] text-[#383838] text-[12px]">
```
含 JP 備援同樣整段移除：
```diff
- font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif]
+ （移除，繼承全域 Noto Sans TC）
```
styles.ts：
```diff
  export const FONTS = {
    notoSans: "font-['Noto_Sans_TC:Regular',sans-serif]",
-   inter: "font-['Inter:Regular',sans-serif]",
-   notoSansJP: "font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif]",
  } as const;
```
globals.css：
```diff
  .booking-url-text {
    font-size: 12px;
    color: #565656;
-   font-family: 'Inter', sans-serif;
+   font-family: 'Noto Sans TC', sans-serif;
```

---

## 驗收

1. `grep -rn "font-\['Inter\|'Inter'" src --include=*.tsx --include=*.ts --include=*.css | grep -v src/imports/` → 應為空。
2. `npm run build` 通過。
3. dev（crmpoc）逐頁看：基本設定空/列、會員/訊息詳情、設施、PMS、訊息預覽（含 ⚠️ JP 處）、自動回覆 OA 標籤、聊天訊息、訂房 URL 按鈕。
4. push main → CI 綠 → staging 再看一輪。
