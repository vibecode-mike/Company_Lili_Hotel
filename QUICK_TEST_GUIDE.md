# 🚀 GPT 計時器功能 - 快速測試指南

## 1️⃣ 最基本測試（2 分鐘）

### 開始測試
1. 打開瀏覽器：http://localhost:5173
2. 登入系統
3. 進入任一會員聊天室

### 測試步驟
```
點擊輸入框 → 看到橘色「手動模式」標籤 → ✅ 通過
發送訊息 → 標籤仍顯示 → ✅ 通過
切換會員 → 標籤消失 → ✅ 通過
```

---

## 2️⃣ 多分頁測試（3 分鐘）

### 測試步驟
```
1. 複製當前分頁（Ctrl+Shift+D）
2. 在分頁 A 點擊輸入框
3. 檢查分頁 B 是否同步出現標籤 → ✅ 通過
```

---

## 3️⃣ 快速驗證 10 分鐘自動恢復（1 分鐘設置）

### 修改測試時長（臨時）

**檔案：** `frontend/src/components/chat-room/ChatRoomLayout.tsx`

**位置：** 第 154 行

**修改前：**
```typescript
const MANUAL_MODE_DURATION = 10 * 60 * 1000; // 10 分鐘
```

**修改後（測試用）：**
```typescript
const MANUAL_MODE_DURATION = 10 * 1000; // 10 秒
```

**測試：**
```
點擊輸入框 → 等待 10 秒 → 標籤消失 → ✅ 通過
```

**完成後記得改回來！**

---

## 4️⃣ API 驗證（2 分鐘）

### 按 F12 打開開發者工具

**步驟：**
1. 切換到 **Network** 面板
2. 勾選 **Preserve log**
3. 過濾器輸入：`members`
4. 點擊輸入框

**應該看到：**
```
PUT /api/v1/members/{id}
Payload: {"gpt_enabled": false}
Status: 200 ✅
```

---

## 🎯 一鍵檢查清單

- [ ] 點擊輸入框 → 顯示標籤
- [ ] 發送訊息 → 保持標籤
- [ ] 切換會員 → 清除標籤
- [ ] 多分頁同步 → 同步顯示
- [ ] API 請求 → 200 OK

**全部通過 = 功能正常！** ✨

---

## ⚡ 快速清除測試狀態

如需重置，在 **Console** 執行：
```javascript
localStorage.clear();
location.reload();
```

---

## 📱 測試環境

- **前端：** http://localhost:5173
- **後端：** http://127.0.0.1:8700
- **文件：**
  - 詳細測試：`/data2/lili_hotel/test_gpt_timer.md`
  - 檢查清單：`/data2/lili_hotel/TESTING_CHECKLIST.md`

---

## 🐛 如果遇到問題

1. **標籤不顯示** → 檢查 Console 錯誤
2. **API 失敗** → 檢查登入狀態
3. **多分頁不同步** → 確認相同 URL

**詳細排查：** 參考 `TESTING_CHECKLIST.md`

---

祝測試順利！有問題隨時詢問。🎉
