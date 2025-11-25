# 會員管理聊天室頭像顯示實現調查

## 調查日期
2025-11-25

## 1. 當前頭像顯示實現概況

### 1.1 前端頭像組件層級
- **MemberAvatar.tsx** - 會員詳情頁面的編輯頭像組件
  - 位置：`src/components/chat-room/MemberAvatar.tsx`
  - 功能：顯示編輯頭像、上傳頭像、本地預覽
  - 當前狀態：本地狀態管理，未連接 Member.lineAvatar

- **ChatMessageList.tsx** - 聊天訊息列表中的頭像
  - 位置：`src/components/chat-room/ChatMessageList.tsx`
  - 功能：顯示用戶訊息和官方訊息的頭像
  - 用戶頭像：可選參數 `memberAvatar?: string`，顯示為灰色默認"U"
  - 官方頭像："OA" 徽章（固定白色圓形）

- **ChatRoomLayout.tsx** - 主聊天室佈局
  - 位置：`src/components/chat-room/ChatRoomLayout.tsx`
  - 功能：整合所有組件、聊天區域
  - 用戶頭像：`UserAvatar()` 顯示 "OA" 文本（白色圓形）
  - 官方頭像：`OfficialAvatar()` 使用 Container 組件
  - 訊息氣泡：通過 `MessageBubble` 組件控制佈局

- **MemberInfoPanel.tsx** - 會員信息面板（有問題的組件）
  - 位置：`src/components/chat-room/MemberInfoPanel.tsx`
  - 問題：使用 `member.avatar` 但 Member 類型中沒有此欄位
  - 應該使用：`member.lineAvatar`

### 1.2 數據流

**後端 → 前端 數據流**
```
API Response (member.line_avatar) 
  ↓
MembersContext.transformBackendMember()
  ↓
Member.lineAvatar (前端類型)
  ↓
各組件使用 member.lineAvatar
```

## 2. 數據結構分析

### 2.1 後端 Member 模型
文件：`backend/app/models/member.py`

```python
class Member(Base):
    # LINE 相關資訊
    line_uid = Column(String(100), unique=True)
    line_avatar = Column(String(500), comment="LINE 會員頭像 CDN URL")
    line_name = Column(String(100))
    
    # 基本資訊
    name = Column(String(32))
    # ... 其他欄位
```

**重要註釋**："LINE 會員頭像 CDN URL（儲存 LINE 提供的完整 URL，如 https://profile.line-scdn.net/xxxxx），若無頭像或 URL 失效則顯示預設頭像。URL 來源：會員加入時從 LINE Profile API 取得，儲存後不定期更新。前端顯示時直接載入此 URL"

### 2.2 後端 Schema
文件：`backend/app/schemas/member.py`

```python
class MemberListItem(BaseModel):
    id: int
    line_uid: Optional[str] = None
    line_name: Optional[str] = None
    line_avatar: Optional[str] = None  # ✅ 關鍵欄位
    name: Optional[str] = None
    # ... 其他欄位
```

### 2.3 前端 Member 類型
文件：`frontend/src/types/member.ts`

```typescript
export interface Member {
    id: string;
    username: string;        // LINE user name
    realName: string;
    tags: string[];
    memberTags?: string[];
    interactionTags?: string[];
    tagDetails?: TagInfo[];
    phone: string;
    email: string;
    gender?: string;
    birthday?: string;
    createTime: string;
    lastChatTime: string;
    lineUid?: string;
    lineAvatar?: string;      // ✅ LINE 頭像 URL
    join_source?: string;
    id_number?: string;
    residence?: string;
    passport_number?: string;
    internal_note?: string;
}
```

### 2.4 數據轉換邏輯
文件：`frontend/src/contexts/MembersContext.tsx`

```typescript
const transformBackendMember = (item: any): Member => {
  // ...
  return {
    // ...
    lineAvatar: item.line_avatar || '',  // ✅ 正確映射
    // ...
  };
};
```

## 3. 具體問題點

### 3.1 MemberInfoPanel.tsx 中的錯誤（第 74 行）
```typescript
// ❌ 錯誤
<img 
  src={member.avatar}      // Member 類型中沒有 avatar 欄位
  alt={member.name}
  className="w-full h-full object-cover"
/>

// ✅ 應該是
<img 
  src={member.lineAvatar}  // 使用正確的欄位名
  alt={member.username || '會員頭像'}
  className="w-full h-full object-cover"
/>
```

### 3.2 多個組件中的頭像顯示不一致

#### ChatRoomLayout.tsx（行 544-546）
```typescript
// 正確使用 lineAvatar
{member?.lineAvatar ? (
  <img 
    src={member.lineAvatar}
    className="w-full h-full object-cover"
  />
```

#### MemberInfoPanel.tsx（行 74）
```typescript
// ❌ 錯誤使用 avatar
<img 
  src={member.avatar}  // 不存在的欄位
```

#### ChatMessageList.tsx（行 56-68）
```typescript
// 使用參數傳遞，但沒有自動從 Member 對象提取
{avatar ? (
  <img src={avatar} />
) : (
  <div>顯示默認 "U"</div>
)}
```

### 3.3 預設頭像策略不完整
- 當 `lineAvatar` 為空或 URL 失效時，沒有預設頭像
- ChatMessageList 中用戶頭像默認顯示灰色 "U"，但不一致

## 4. OA（官方帳號）頭像實現

### 4.1 在 ChatRoomLayout.tsx 中
```typescript
function UserAvatar() {
  return (
    <div className="bg-white ... size-[45px]">
      <p className="text-[12px] text-[#383838]">OA</p>
    </div>
  );
}

function OfficialAvatar() {
  return (
    <div className="relative shrink-0 size-[45px]">
      <Container />  // Figma 設計稿組件
    </div>
  );
}
```

### 4.2 在 ChatMessageList.tsx 中
```typescript
function OABadge() {
  return (
    <div className="bg-white ... size-[45px] flex items-center justify-center">
      <p className="text-[12px]">OA</p>
    </div>
  );
}
```

## 5. 需要修改的文件列表

### 高優先級（必須修復）
1. **`frontend/src/components/chat-room/MemberInfoPanel.tsx`**
   - 第 74 行：`member.avatar` → `member.lineAvatar`
   - 第 75 行：`member.name` → `member.username`

### 中優先級（改進一致性）
2. **`frontend/src/components/chat-room/ChatMessageList.tsx`**
   - 改進默認頭像顯示邏輯
   - 統一預設頭像策略

3. **`frontend/src/components/chat-room/ChatRoomLayout.tsx`**
   - 傳遞 `member.lineAvatar` 給 ChatMessageList
   - 統一用戶頭像顯示

4. **`frontend/src/components/chat-room/MemberAvatar.tsx`**
   - 考慮從 `member.lineAvatar` 初始化，而不是總是空

5. **`frontend/src/types/member.ts`**
   - 確認 Member 接口正確定義（已正確）

### 低優先級（文檔）
6. **`frontend/src/components/chat-room/types.ts`**
   - 更新 ChatMessageListProps 包含 memberAvatar

## 6. 總結：當前狀態 vs 預期狀態

| 組件 | 當前狀態 | 預期狀態 | 優先級 |
|------|---------|---------|--------|
| MemberInfoPanel | ❌ 錯誤欄位 avatar | ✅ 使用 lineAvatar | HIGH |
| ChatRoomLayout | ✅ 正確使用 lineAvatar | ✅ 已正確 | OK |
| ChatMessageList | ⚠️ 使用參數傳遞 | ✅ 從 member.lineAvatar | MEDIUM |
| MemberAvatar | ⚠️ 本地狀態 | ✅ 初始化自 lineAvatar | MEDIUM |
| 預設頭像 | ❌ 不一致 | ✅ 統一策略 | MEDIUM |

## 7. 推薦修改順序

1. 修復 MemberInfoPanel.tsx（第 74-75 行）- 2 分鐘
2. 改進 ChatMessageList 的默認頭像 - 5 分鐘
3. 統一 ChatRoomLayout 頭像傳遞 - 5 分鐘
4. MemberAvatar 從 lineAvatar 初始化 - 10 分鐘
5. 測試所有組件的頭像顯示 - 15 分鐘
