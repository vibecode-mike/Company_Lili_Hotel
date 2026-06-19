# Token Migration Map — 舊硬寫值 → 新 token

> Generated: 2026-06-17
> Scope: `src/`（**排除** `src/imports/`、dead code `AccountLimitModal.tsx` / `ChannelSelector.tsx`、殘留備份 `PMSIntegration.tsx.bak` / `AIChatbotOverview.tsx.bak`）
> Token 定義位置：`src/styles/globals.css` 的 `:root` / `@theme inline`
> ⚠️ 本文件**只定義 token 與對照規則**，尚未修改任何元件 / 頁面。

## 圖例

| 標記 | 意義 |
|---|---|
| ✅ 零變化 | 新 token 與舊值「同 px」，遷移後視覺完全不變 |
| ⚠️ 需歸位 | 卡階梯值（非 4 倍數 / 與階梯差幾 px），遷移會有輕微視覺變化，**需逐一用眼睛確認** |
| 🗑 Figma 垃圾 | 溢位 / 子像素亂值，建議直接修正 |

次數統計已排除上述排除清單。「散落檔案」過多者只列前幾名 + 檔案總數。

---

## 1. Font

### 1.1 font-family → `--font-family-base: 'Noto Sans TC', sans-serif`

全站 `font-['…']` 收斂為單一定義。`html/body` 全域已設 `font-family: 'Noto Sans TC'`，
因此「Noto 系列」的 inline 宣告本來就是冗餘，移除後**零視覺變化**。

| 舊值 | 次數 | 收斂到 | 變化 | 散落檔案 |
|---|---|---|---|---|
| `font-['Noto_Sans_TC',sans-serif]` | 226 | `--font-family-base`（或直接移除 inline） | ✅ 零變化 | 17 檔 |
| `font-['Noto_Sans_TC:Regular',sans-serif]` | 170 | 同上 | ✅ 零變化（`:Regular` 為 Figma 標記，瀏覽器忽略） | 33 檔 |
| `font-['Noto_Sans_TC:Regular',_sans-serif]` | 31 | 同上 | ✅ 零變化 | 8 檔 |
| `font-['Noto_Sans_TC:Medium',sans-serif]` | 3 | 同上（粗細交給 `font-weight`，勿用字體名表達） | ✅ 零變化 | 3 檔 |
| `font-['Inter',sans-serif]` | 19 | `--font-family-base` | ⚠️ **改字體**（Inter→Noto） | 5 檔 |
| `font-['Inter:Regular'…]`（含 JP 變體） | 8+ | `--font-family-base` | ⚠️ **改字體** | 6 檔 |
| `font-['PingFang_TC',sans-serif]` | 5 | `--font-family-base` | ⚠️ **改字體**（PingFang→Noto） | 1 檔 |

> **重點**：Noto 四種寫法 = 純冗餘，安全收斂。`Inter` / `PingFang` 是**不同字體**，
> 若依「全站統一 Noto」的目標收斂，這幾處會真的換字（多為數字 / 拉丁字 / 備援字體），列入 §6 眼睛確認清單。

### 1.2 font-size → Tailwind 字級（同時新增 `--font-size-*` 供 inline 用）

Tailwind 預設字級與本案主力值完全吻合：`text-xs`=12 / `text-sm`=14 / `text-base`=16 / `text-lg`=18 / `text-xl`=20 / `text-2xl`=24。

| 舊值 | 次數 | 收斂到 | 變化 |
|---|---|---|---|
| `text-[14px]` | 443 | `text-sm` / `--font-size-sm` | ✅ 零變化 |
| `text-[16px]` | 341 | `text-base` / `--font-size-base` | ✅ 零變化 |
| `text-[12px]` | 159 | `text-xs` / `--font-size-xs` | ✅ 零變化 |
| `text-[20px]` | 21 | `text-xl` | ✅ 零變化 |
| `text-[18px]` | 15 | `text-lg` | ✅ 零變化 |
| `text-[32px]` | 14 | `text-3xl` / `--font-size-3xl` | ✅ 零變化 |
| `text-[24px]` | 10 | `text-2xl` | ✅ 零變化 |
| `text-[13px]` | 11 | `text-sm`(14) | ⚠️ +1px |
| `text-[11px]` | 5 | `text-xs`(12) | ⚠️ +1px |
| `text-[19px]` | 3 | `text-xl`(20) | ⚠️ +1px |
| `text-[15px]` | 1 | `text-sm`(14) | ⚠️ −1px |
| `text-[28px]` | 1 | `text-3xl`(32) 或 `text-2xl`(24) | ⚠️ 建議 24（−4px，視覺較接近） |
| `text-[0.8rem]` (=12.8px) | 1 | `text-xs`(12) | ⚠️ −0.8px（Figma 子像素） |
| `text-[0px]` | 1 | 保留 / 檢視 | ⚠️ 多為隱藏文字 hack，**勿自動收斂** |

### 1.3 line-height → `leading-normal`（同時新增 `--line-height-base: 1.5`）

| 舊值 | 次數 | 收斂到 | 變化 |
|---|---|---|---|
| `leading-[1.5]` | 417 | `leading-normal` / `--line-height-base` | ✅ 零變化 |
| `leading-[1.6]` | 2 | `leading-normal`(1.5) | ⚠️ −0.1（AutoReply.tsx） |
| `leading-[Npx]`（20/16/24/21/28/18/14/36/27px…） | ~430 | 凡 `= 1.5×字級` → `leading-normal` ✅；其餘 → `leading-normal` ⚠️ | 見下註 |
| `leading-[28.5px]` | 3 | `leading-normal` | ⚠️ 子像素（PreviewPanel / PreviewContainers） |
| `leading-[0]` | 42 | **維持原樣** | ⚠️ 單行 / icon 列的刻意壓行高，**勿收斂**（MemberInfoPanelComplete×18、MessageDetailDrawer×10…） |

> **px 行高判讀**：`text-[14px] leading-[21px]`(=1.5)、`text-[16px] leading-[24px]`(=1.5) 等 → 換 `leading-normal` 零變化；
> 但 `text-[14px] leading-[20px]`(=1.43)、`text-[12px] leading-[16px]`(=1.33) 等比例 ≠ 1.5，換 `leading-normal` 會略微鬆開行距 → 列入眼睛確認。

### 1.4 font-weight（既有 token，僅需統一寫法，**不新增**）

`--font-weight-medium:500` / `--font-weight-normal:400` 已存在。`font-normal`(409) / `font-medium`(76) / `font-bold`(13) / `font-semibold`(7) 維持 Tailwind 具名即可，零變化。inline 的 `400`/`500` 改引 token。

---

## 2. Radius

> ⚠️ **圓角階梯數字以 `globals.css @theme` 為唯一真相**（程式 live、不會過時）。本表僅為施工期 arbitrary→token 對照；如有出入，**一律以 `globals.css` 為準**。

新階梯沿用既有 `--radius`(10px) 基準 calc 推導。階梯經 `ba389a6a` 定案：**sm/lg 退役併入 md/xl、新增 2xs**。**主力值 8/12/16/20/4 落在階梯上零變化；但 6/10 已隨 sm/lg 退役而移出階梯 → `6→8`、`10→12` 皆為「歸位 +2px」，非零變化**。下表為 `globals.css @theme` 現況快照（calc 基準 `--radius`=10px）：

| token | px | calc | 沿革 |
|---|---|---|---|
| `--radius-2xs` | 2 | `var(--radius) - 8px` | 🆕 新增（`ba389a6a`）|
| `--radius-xs` | 4 | `var(--radius) - 6px` | 維持 |
| `--radius-sm` | 8 | `var(--radius) - 2px` | ⚠️ 退役→併 md（原 6px）|
| `--radius-md` | 8 | `var(--radius) - 2px` | 維持 |
| `--radius-lg` | 12 | `var(--radius) + 2px` | ⚠️ 退役→併 xl（原 10px）|
| `--radius-xl` | 12 | `var(--radius) + 2px` | 維持（原 14px→12）|
| `--radius-2xl` | 16 | `var(--radius) + 6px` | 🆕 新增 |
| `--radius-3xl` | 20 | `var(--radius) + 10px` | 🆕 新增 |

### 2.1 對照表

| 舊值 | 次數 | 收斂到 | 變化 | 散落檔案 |
|---|---|---|---|---|
| `rounded-[8px]` | 182 | `rounded-md` | ✅ 零變化 | 73 檔（最廣）|
| `rounded-[16px]` | 128 | `rounded-2xl` | ✅ 零變化 | 廣布 |
| `rounded-[10px]` | 60 | `rounded-xl`(12) | ⚠️ **歸位 +2px**（lg 已退役，10 不在階梯）| 廣布（CarouselMessageEditor×14…）|
| `rounded-[12px]` | 42 | `rounded-xl` | ✅ 零變化 | 廣布 |
| `rounded-[4px]` | 21 | `rounded-xs` | ✅ 零變化 | 廣布 |
| `rounded-[20px]` | 20 | `rounded-3xl` | ✅ 零變化 | ChatRoomLayout×7、common/styles.ts×5… |
| `rounded-[6px]` | 4 | `rounded-md`(8) | ⚠️ **歸位 +2px**（sm 已退役，6 不在階梯）| StaffUsersManagement×2、FBConfigPanel、CarouselMessageEditor |
| `rounded-[14px]` / `rounded-t-[14px]` | 19 | `rounded-2xl`(16) | ⚠️ +2px（設計裁示：大面板配大圓角更服貼）| LineApiSettingsContent.tsx（全數集中於此）|
| `rounded-[15px]` | 4 | `rounded-2xl`(16) | ⚠️ +1px | PreviewContainers×3、CreateAutoReplyInteractive |
| `rounded-[2px]` | 4 | `rounded-xs`(4) | ⚠️ +2px | ui/chart×2、ui/tooltip、InsightsPanel |
| `rounded-[32px]` | 1 | `rounded-3xl`(20) 或 `rounded-full` | ⚠️ 視為膠囊鈕，建議 `rounded-full` | common/SecondaryButton.tsx |
| `rounded-[80px]` | 4 | `rounded-full` | 全為 `h-[8px]` 進度條→**零變化**（圓角夾到高度一半 4px）| MessageList×2 + AIChatbotOverview×2（皆已轉）|
| `rounded-[inherit]` | 7 | **維持原樣** | — 合法 Tailwind，勿動 | — |
| `rounded-[158.824px]` | 1 | `rounded-full` | 🗑 Figma 圓頭像亂值 | chat-room/ChatRoomLayout.tsx |
| `rounded-[3.35544e+07px]` | 1 | `rounded-full` | 🗑 Figma 溢位垃圾 | CreateAutoReplyInteractive.tsx |

> 既有具名用法：`rounded-md`(41) → **零變化**（仍 8px）。⚠️ `rounded-lg`(29) 隨 lg 退役 `10→12`、`rounded-sm`(15) 隨 sm 退役 `6→8`，皆 **+2px 且已於 `ba389a6a` 部署生效**（即現況，非待辦）。
> 唯一受影響的既有用法：`rounded-xl`(×5，14px→12px)，列入 §6。inline `borderRadius` 的 `3.40282e38px` / `33554400px` 同屬 🗑 → `9999px` / `rounded-full`。

---

## 3. Spacing

4-point grid，新增 `--space-*` 作為 canonical 參考；Tailwind 數字級距即同值（`gap-2`=8px、`px-3`=12px…），**遷移目標就是 Tailwind 數字工具類**。

| token | px | Tailwind | | token | px | Tailwind |
|---|---|---|---|---|---|---|
| `--space-0-5` | 2 | `*-0.5` | | `--space-6` | 24 | `*-6` |
| `--space-1` | 4 | `*-1` | | `--space-7` | 28 | `*-7` |
| `--space-1-5` | 6 | `*-1.5` | | `--space-8` | 32 | `*-8` |
| `--space-2` | 8 | `*-2` | | `--space-10` | 40 | `*-10` |
| `--space-3` | 12 | `*-3` | | `--space-12` | 48 | `*-12` |
| `--space-4` | 16 | `*-4` | | | | |
| `--space-5` | 20 | `*-5` | | | | |

### 3.1 ✅ 零變化（4 倍數 / Tailwind 半階梯，直接換數字工具類）

| 舊值 | 次數 → Tailwind | | 舊值 | 次數 → Tailwind |
|---|---|---|---|---|
| `px-[12px]` | 245 → `px-3` | | `gap-[4px]` | 194 → `gap-1` |
| `py-[8px]` | 112 → `py-2` | | `gap-[8px]` | 185 → `gap-2` |
| `px-[8px]` | 69 → `px-2` | | `gap-[12px]` | 92 → `gap-3` |
| `py-[16px]` | 68 → `py-4` | | `gap-[2px]` | 71 → `gap-0.5` |
| `py-[12px]` | 66 → `py-3` | | `gap-[16px]` | 41 → `gap-4` |
| `p-[8px]` | 40 → `p-2` | | `gap-[24px]` | 15 → `gap-6` |
| `px-[24px]` | 39 → `px-6` | | `gap-[6px]` | 13 → `gap-1.5` |
| `py-[4px]` | 34 → `py-1` | | `gap-[20px]` | 13 → `gap-5` |
| `px-[40px]` | 30 → `px-10` | | `gap-[28px]` | 9 → `gap-7` |
| `p-[4px]` | 29 → `p-1` | | `gap-[32px]` | 23 → `gap-8` |
| `p-[16px]` | 25 → `p-4` | | `mb-[16px]` | 20 → `mb-4` |
| `px-[16px]` | 24 → `px-4` | | `mb-[12px]` | 9 → `mb-3` |
| `px-[20px]` | 18 → `px-5` | | `mb-[24px]` | 8 → `mb-6` |
| `pb-[24px]` / `p-[20px]` | 12 → `pb-6`/`p-5` | | `mb-[8px]` / `mb-[32px]` / `mb-[20px]` | 4 → `mb-2`/`mb-8`/`mb-5` |
| `p-[24px]` | 11 → `p-6` | | `mt-[12px]` | 5 → `mt-3` |
| `p-[12px]` | 10 → `p-3` | | `py-[40px]` / `py-[20px]` | → `py-10`/`py-5` |
| `p-[32px]` / `p-[40px]` | 9/8 → `p-8`/`p-10` | | `py-[1px]` | 5 → `py-px` |
| `pt-[48px]` | 8 → `pt-12` | | `py-[2px]` | 4 → `py-0.5` |

> 其餘 4 倍數長尾（`pb-[40px]`/`pb-[16px]`/`p-[28px]`/`pt-[16px]`/`pl-[24px]`/`pl-[16px]`/`pl-[40px]`/`pl-[32px]`/`py-[6px]`/`pb-[80px]`/`pt-[24px]`/`pr-[40px]`/`mt-[8/24/16/4px]`/`mx-[24px]`/`ml-[24/16/8/4px]` …）一律對應同 px 的 Tailwind 工具類，**零變化**。

### 3.2 ⚠️ 需歸位（非 4 倍數 / Figma 子像素）

| 舊值 | 次數 | 歸位到 | 視覺差 | 散落檔案 |
|---|---|---|---|---|
| `gap-[10px]` | 27 | `gap-2`(8) | −2px | MemberInfoPanelComplete×6、TriggerTimeOptions×5、MessageList×3、AIChatbotOverview×3、FilterModal×2、CreateAutoReplyInteractive×2…（12 檔） |
| `py-[10px]` | 9 | `py-2`(8) | −2px | StaffUsersManagement×3、InsightsPanel×3、CarouselMessageEditor×3 |
| `p-[13px]` | 5 | `p-3`(12) | −1px | LineApiSettingsContent.tsx |
| `px-[13px]` | 4 | `px-3`(12) | −1px | CarouselMessageEditor×3、PreviewContainers |
| `py-[12.8px]` / `px-[12.8px]` | 各 2 | `*-3`(12) | −0.8px（Figma 子像素） | LineApiSettingsContent.tsx |
| `py-[16.8px]` / `px-[16.8px]` | 各 1 | `*-4`(16) | −0.8px（Figma 子像素） | LineApiSettingsContent.tsx |
| `p-[18px]` | 1 | `p-4`(16) | −2px | LineApiSettingsContent.tsx |
| `px-[25px]` | 1 | `px-6`(24) | −1px | flex-message/PreviewPanel.tsx |
| `pt-[11px]` | 2 | `pt-3`(12) | +1px | FBConfigPanel、CarouselMessageEditor |
| `pt-[7px]` | 1 | `pt-2`(8) | +1px | common/PreviewContainers.tsx |
| `mt-[30px]` | 1 | `mt-8`(32) | +2px | MessageCreation.tsx |
| `pl-[50px]` | 1 | `pl-12`(48) | −2px | CarouselMessageEditor.tsx |
| `gap-[5px]` | 1 | `gap-1`(4) | −1px | common/PreviewContainers.tsx |
| `p-[3px]` | 1 | `p-1`(4) | +1px | ui/tabs.tsx |

### 3.3 大版面位移（**不納入 spacing token**，建議另案）

`ml-[330px]` / `ml-[280px]` / `ml-[250px]` / `ml-[72px]`（各 ~13 次，散落 Sidebar、MainLayout、各頁 ×10+ 檔）是**側欄寬度驅動的版面位移**，非間距語彙。
建議改用 `--sidebar-width` 之類的版面變數，**不收進 4-point spacing 階梯**，這裡只標記、不歸位。

---

## 4. 既有 token 落點（本次新增 / 調整）

| 類別 | 位置 | 動作 |
|---|---|---|
| `--space-*`（13 階） | `globals.css :root` | 🆕 新增 |
| `--font-family-base` | `globals.css :root` | 🆕 新增 |
| `--font-size-*`（7 階） | `globals.css :root` | 🆕 新增（`--font-size` 16px 既有，沿用） |
| `--line-height-base` | `globals.css :root` | 🆕 新增 |
| `--radius-xs/2xl/3xl` | `globals.css @theme` | 🆕 新增 |
| `--radius-xl` | `globals.css @theme` | 🔧 14px → 12px |
| `--radius-sm/md/lg`、`--radius`、`--font-weight-*` | `globals.css` | 維持不動 |

---

## 5. 一覽：零變化 vs 需確認

- **直接對應、零視覺變化**（可安心批次遷移）：
  - 全部 Noto 字體寫法 → `--font-family-base`
  - `text-[12/14/16/18/20/24/32px]` → `text-xs…3xl`
  - `leading-[1.5]` 與「= 1.5×字級」的 px 行高 → `leading-normal`
  - `rounded-[4/6/8/10/12/16/20px]` → `rounded-xs…3xl`
  - 所有 4 倍數 padding/margin/gap → Tailwind 數字工具類

- **需歸位、會輕微變化** → 見 §6（眼睛確認清單）。

---

## 6. 🔴 需逐一用眼睛確認的清單（會有視覺變化）

### 6a. 改字體（非 Noto → Noto）
- `font-['Inter',…]`（19，5 檔）、`font-['Inter:Regular',…]`（8+，6 檔）、`font-['PingFang_TC',…]`（5，1 檔）
  → 多為數字 / 拉丁字 / 備援字體，換 Noto 後字形會變。

### 6b. 圓角差 ±1~2px
- `rounded-[14px]`/`rounded-t-[14px]`（19，LineApiSettingsContent）→ **16px，+2px**（設計裁示：大面板配大圓角更服貼。先前誤寫 12px 已更正）
- `rounded-[15px]`（4，PreviewContainers 等）→ 16px，**+1px**
- `rounded-[2px]`（4，ui/chart·tooltip·InsightsPanel）→ 4px，**+2px**
- **既有 `rounded-xl`（×5）因 token 由 14→12px 一併變動，−2px**（這是唯一受影響的既有具名用法）
- `rounded-[32px]`（SecondaryButton）→ 建議 `rounded-full`（膠囊鈕）
- `rounded-[80px]`：⚠️ **不是膠囊鈕** —— MessageList×2 與 AIChatbotOverview×2 **都是 `h-[8px]` 用量進度條**，改 `rounded-full` **零變化**（圓角被瀏覽器夾到「高度一半 = 4px」，與 80px 渲染完全相同）。4 處皆已轉。

### 6c. 間距差 ±1~2px（清單見 §3.2）
- 最值得注意：`gap-[10px]`（27 次、12 檔，−2px）、`py-[10px]`（9 次，−2px）、`p-[13px]`/`px-[13px]`（−1px）、Figma 子像素 `*-[12.8px]`/`*-[16.8px]`。

### 6d. 行高
- `leading-[1.6]`（AutoReply ×2，−0.1）、`leading-[28.5px]`（子像素）、以及比例 ≠ 1.5 的 px 行高（如 `text-[14px] leading-[20px]`）→ 收 `leading-normal` 會略鬆行距。
- `leading-[0]`（42 處）**刻意壓行，建議維持原樣，勿收斂**。

### 6e. 字級差 ±1px
- `text-[13px]`(+1)、`text-[11px]`(+1)、`text-[19px]`(+1)、`text-[15px]`(−1)、`text-[28px]`、`text-[0.8rem]`(−0.8)。`text-[0px]` 為隱藏 hack，勿動。

### 6f. Figma 垃圾值（直接修正，非真實設計值）
- `rounded-[158.824px]`、`rounded-[3.35544e+07px]`、inline `borderRadius: 3.40282e38px` / `33554400px` → `rounded-full` / `9999px`。
