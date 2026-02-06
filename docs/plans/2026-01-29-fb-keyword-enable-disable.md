# FB 關鍵字啟用/停用功能實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 FB 關鍵字的 PATCH API，支援 `enabled` 狀態切換，讓重複標籤可以「點擊更新為最新版本」

**Architecture:**
1. Backend: 在 `admin_meta_page.py` 新增 PATCH endpoint，調用 FB API 更新關鍵字狀態
2. Frontend: 修改 `AutoRepliesContext.tsx` 新增 `activateFbDuplicateKeyword()` 函數
3. Frontend: 修改 `AutoReply.tsx` 在點擊 FB 重複標籤時調用新 API

**Tech Stack:** FastAPI, React, TypeScript, FB Message Client

---

## Task 1: Backend - 新增 FB 關鍵字 PATCH Endpoint

**Files:**
- Modify: `backend/app/api/v1/admin_meta_page.py`
- Modify: `backend/app/clients/fb_message_client.py` (如需新增方法)

**Step 1: 檢查 FB Client 是否有更新關鍵字的方法**

Run: `grep -n "keyword" backend/app/clients/fb_message_client.py`
Expected: 找到 `delete_keyword` 方法，可能需要新增 `update_keyword` 方法

**Step 2: 在 admin_meta_page.py 新增 PATCH endpoint**

```python
from pydantic import BaseModel

class KeywordUpdateRequest(BaseModel):
    keyword_id: int
    enabled: bool


@router.patch("/keyword", response_model=SuccessResponse)
async def update_fb_keyword(
    request: KeywordUpdateRequest,
    jwt_token: str | None = Query(None, description="Meta JWT Token"),
):
    """更新 FB 關鍵字狀態（啟用/停用）"""
    jwt_token = _require_jwt_token(jwt_token)
    fb_client = FbMessageClient()
    result = await fb_client.update_keyword(
        keyword_id=request.keyword_id,
        enabled=request.enabled,
        jwt_token=jwt_token
    )

    if not result.get("ok"):
        error_msg = result.get("error", "更新 FB 關鍵字失敗")
        logger.error(f"FB keyword update failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    return SuccessResponse(message="更新成功")
```

**Step 3: 在 fb_message_client.py 新增 update_keyword 方法（如果不存在）**

```python
async def update_keyword(
    self,
    keyword_id: int,
    enabled: bool,
    jwt_token: str
) -> dict:
    """更新 FB 關鍵字狀態"""
    url = f"{self.base_url}/api/v1/admin/meta_page/message/auto_template/keyword"
    payload = {
        "keyword_id": keyword_id,
        "enabled": enabled
    }
    headers = {"Authorization": f"Bearer {jwt_token}"}

    async with aiohttp.ClientSession() as session:
        async with session.patch(url, json=payload, headers=headers) as resp:
            if resp.status == 200:
                return {"ok": True}
            else:
                error_text = await resp.text()
                return {"ok": False, "error": error_text}
```

**Step 4: 測試 API**

Run: `curl -X PATCH "http://localhost:8000/api/v1/admin/meta_page/message/auto_template/keyword?jwt_token=TEST" -H "Content-Type: application/json" -d '{"keyword_id": 169, "enabled": false}'`
Expected: `{"message": "更新成功"}` 或 FB API 錯誤訊息

**Step 5: Commit**

```bash
git add backend/app/api/v1/admin_meta_page.py backend/app/clients/fb_message_client.py
git commit -m "feat(backend): add FB keyword PATCH endpoint for enable/disable"
```

---

## Task 2: Frontend - Context 新增 activateFbDuplicateKeyword 函數

**Files:**
- Modify: `frontend/src/contexts/AutoRepliesContext.tsx`

**Step 1: 在 AutoRepliesContextType interface 新增函數簽名**

```typescript
// 在 interface AutoRepliesContextType 中新增
activateFbDuplicateKeyword: (keywordId: number) => Promise<void>;
```

**Step 2: 實作 activateFbDuplicateKeyword 函數**

```typescript
const activateFbDuplicateKeyword = useCallback(async (keywordId: number) => {
  const jwtToken = getJwtToken();
  if (!jwtToken) {
    const error = new Error('FB 授權已過期，請重新登入');
    toast.error(error.message);
    throw error;
  }

  try {
    const url = `/api/v1/admin/meta_page/message/auto_template/keyword?jwt_token=${encodeURIComponent(jwtToken)}`;
    const response = await apiPatch(url, {
      keyword_id: keywordId,
      enabled: true  // 啟用此關鍵字（使其成為生效版本）
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.detail || errData?.message || '更新 FB 關鍵字失敗');
    }

    await fetchAutoReplies();
    toast.success('標籤已更新');
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新 FB 關鍵字失敗';
    console.error('激活 FB 重複關鍵字錯誤:', err);
    toast.error(message);
    throw err;
  }
}, [fetchAutoReplies]);
```

**Step 3: 在 value 和 useMemo deps 中加入 activateFbDuplicateKeyword**

```typescript
const value = useMemo<AutoRepliesContextType>(() => ({
  // ... 其他屬性
  activateFbDuplicateKeyword,
}), [
  // ... 其他 deps
  activateFbDuplicateKeyword,
]);
```

**Step 4: Commit**

```bash
git add frontend/src/contexts/AutoRepliesContext.tsx
git commit -m "feat(frontend): add activateFbDuplicateKeyword for FB duplicate tag update"
```

---

## Task 3: Frontend - AutoReply.tsx 整合 FB 重複標籤點擊

**Files:**
- Modify: `frontend/src/components/AutoReply.tsx`

**Step 1: 從 context 解構新函數**

```typescript
const {
  autoReplies, isLoading, error,
  toggleAutoReply,
  activateDuplicateKeyword,
  activateFbDuplicateKeyword,  // 新增
  fetchAutoReplies
} = useAutoReplies();
```

**Step 2: 修改 handleDuplicateKeywordClick 判斷 FB vs LINE**

```typescript
// 修改 selectedKeyword 狀態的型別
const [selectedKeyword, setSelectedKeyword] = useState<{
  id: number;
  keyword: string;
  isFb: boolean;  // 新增：標記是否為 FB 關鍵字
} | null>(null);

// 修改 handleDuplicateKeywordClick
const handleDuplicateKeywordClick = (keywordId: number, keyword: string, autoReplyId: string) => {
  const isFb = autoReplyId.startsWith('fb-');
  setSelectedKeyword({ id: keywordId, keyword, isFb });
  setShowDuplicateDialog(true);
};
```

**Step 3: 修改 handleConfirmActivate 根據類型調用不同 API**

```typescript
const handleConfirmActivate = async () => {
  if (!selectedKeyword) return;
  setIsActivating(true);
  try {
    if (selectedKeyword.isFb) {
      await activateFbDuplicateKeyword(selectedKeyword.id);
    } else {
      await activateDuplicateKeyword(selectedKeyword.id);
    }
    setShowDuplicateDialog(false);
    setTimeout(() => setSelectedKeyword(null), 200);
  } catch {
    // 錯誤已在 context 中處理
  } finally {
    setIsActivating(false);
  }
};
```

**Step 4: 修改 AutoReplyTableStyled 的 onDuplicateKeywordClick callback 傳入 autoReplyId**

需要修改 `AutoReplyTableStyled.tsx` 的 props 和呼叫方式。

**Step 5: Commit**

```bash
git add frontend/src/components/AutoReply.tsx
git commit -m "feat(frontend): integrate FB duplicate keyword activation in AutoReply"
```

---

## Task 4: Frontend - AutoReplyTableStyled.tsx 傳遞 autoReplyId

**Files:**
- Modify: `frontend/src/components/AutoReplyTableStyled.tsx`

**Step 1: 修改 onDuplicateKeywordClick prop 型別**

```typescript
// 舊：
onDuplicateKeywordClick?: (keywordId: number, keyword: string) => void;

// 新：
onDuplicateKeywordClick?: (keywordId: number, keyword: string, autoReplyId: string) => void;
```

**Step 2: 修改呼叫處傳入 row.id**

找到 `onDuplicateKeywordClick` 的呼叫處，加入 `row.id` 參數：

```typescript
onClick={(e) => {
  e.stopPropagation();
  if (kw.id && onDuplicateKeywordClick) {
    onDuplicateKeywordClick(kw.id, kw.keyword, row.id);  // 加入 row.id
  }
}}
```

**Step 3: Commit**

```bash
git add frontend/src/components/AutoReplyTableStyled.tsx
git commit -m "feat(frontend): pass autoReplyId in duplicate keyword click callback"
```

---

## Task 5: 整合測試

**Step 1: 啟動 backend 和 frontend**

Run: `cd backend && uvicorn app.main:app --reload`
Run: `cd frontend && npm run dev`

**Step 2: 測試場景**

1. 建立兩個 FB 自動回應，使用相同關鍵字
2. 確認列表中顯示紅色重複標籤
3. 點擊重複標籤，確認彈出確認對話框
4. 點擊「確認更新」，確認調用 FB PATCH API
5. 確認列表自動刷新，重複標記正確更新

**Step 3: Final Commit**

```bash
git add -A
git commit -m "feat: FB duplicate keyword activation support

- Add PATCH /api/v1/admin/meta_page/message/auto_template/keyword endpoint
- Add activateFbDuplicateKeyword in AutoRepliesContext
- Integrate FB keyword activation in AutoReply list view
- Pass autoReplyId to distinguish LINE vs FB keywords"
```

---

## 檔案修改摘要

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `backend/app/api/v1/admin_meta_page.py` | 修改 | 新增 PATCH endpoint |
| `backend/app/clients/fb_message_client.py` | 修改 | 新增 update_keyword 方法 |
| `frontend/src/contexts/AutoRepliesContext.tsx` | 修改 | 新增 activateFbDuplicateKeyword |
| `frontend/src/components/AutoReply.tsx` | 修改 | 整合 FB 重複標籤點擊 |
| `frontend/src/components/AutoReplyTableStyled.tsx` | 修改 | 傳遞 autoReplyId |

## API 規格

**Endpoint:** `PATCH /api/v1/admin/meta_page/message/auto_template/keyword`

**Query Parameters:**
- `jwt_token` (required): Meta JWT Token

**Request Body:**
```json
{
  "keyword_id": 169,
  "enabled": true
}
```

**Response:**
```json
{
  "message": "更新成功"
}
```
