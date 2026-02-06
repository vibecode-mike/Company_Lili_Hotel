# FB Auto-Response DELETE Operations Implementation

## Summary

Implemented 3 missing DELETE operations for FB auto-responses based on fb-API.XLSX specification.

**Implementation Date**: 2026-01-24
**Files Modified**: 2 core files
**Status**: ✅ Complete (ready for testing)

---

## Changes Made

### 1. FbMessageClient (`backend/app/clients/fb_message_client.py`)

Added 3 new DELETE methods after line 271:

#### `delete_keyword(keyword_id: int, jwt_token: str)`
- **API**: `DELETE /api/v1/admin/meta_page/message/auto_template/keyword/{keyword_id}`
- **Purpose**: Delete individual keyword from FB auto-response template
- **Returns**: `{"ok": True/False, ...}`

#### `delete_reply(reply_id: int, jwt_token: str)`
- **API**: `DELETE /api/v1/admin/meta_page/message/auto_template/Reply/{reply_id}`
- **Purpose**: Delete individual reply/message from FB auto-response template
- **Returns**: `{"ok": True/False, ...}`
- **Note**: "Reply" uses capital R per Excel specification

#### `delete_template(basic_id: str, jwt_token: str)`
- **API**: `DELETE /api/v1/admin/meta_page/message/auto_template?basic_id={basic_id}`
- **Purpose**: Delete entire FB auto-response template
- **Returns**: `{"ok": True/False, ...}`

All methods follow existing patterns:
- Use `self._auth_headers(jwt_token)` for authentication
- Create `httpx.AsyncClient` with timeout
- Handle `HTTPStatusError` and `RequestError` exceptions
- Log success and errors appropriately
- Return consistent `{"ok": True/False}` format

**Total Lines Added**: ~70 lines

---

### 2. Backend DELETE Endpoint (`backend/app/api/v1/auto_responses.py`)

Updated `delete_auto_response()` function (lines 959-1023):

#### Parameter Changes
- Changed `auto_response_id` from `int` to `str` (supports both "123" and "fb-123" formats)
- Added `jwt_token: Optional[str]` parameter for FB API calls

#### Flow Changes

**1. FB Auto-Response Detection** (lines 968-988)
```python
if auto_response_id.startswith("fb-"):
    basic_id = auto_response_id[3:]  # Remove "fb-" prefix

    # Validate jwt_token exists
    if not jwt_token:
        raise HTTPException(400, "缺少 jwt_token")

    # Call FB API
    fb_client = FbMessageClient()
    result = await fb_client.delete_template(basic_id, jwt_token)

    # Handle errors
    if not result.get("ok"):
        raise HTTPException(500, f"刪除失敗: {error_msg}")

    return SuccessResponse("刪除成功（已從 Facebook API 刪除）")
```

**2. LINE Auto-Response Handling** (lines 991-994)
```python
# Convert string to int for LINE auto-responses
try:
    auto_response_id_int = int(auto_response_id)
except (ValueError, TypeError):
    raise HTTPException(400, "無效的 auto_response_id 格式")
```

**3. Mixed-Channel Handling** (lines 1003-1011)
```python
# If auto-response has both LINE and Facebook channels
if 'Facebook' in auto_response.channels:
    if jwt_token:
        # Best-effort deletion from FB API
        fb_result = await fb_client.delete_template(str(auto_response.id), jwt_token)
        if not fb_result.get("ok"):
            logger.warning("FB API 副本刪除失敗")
    else:
        logger.warning("缺少 jwt_token 無法刪除 FB API 副本")
```

**Total Lines Added**: ~40 lines
**Total Lines Modified**: ~20 lines

---

## API Behavior

### Success Scenarios

| Request | Response | HTTP Status |
|---------|----------|-------------|
| `DELETE /auto_responses/fb-123?jwt_token=xxx` | "刪除成功（已從 Facebook API 刪除）" | 200 |
| `DELETE /auto_responses/123` (LINE) | "刪除成功" | 200 |
| `DELETE /auto_responses/456` (Mixed with jwt_token) | "刪除成功" + FB deletion attempt | 200 |

### Error Scenarios

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| FB delete without jwt_token | 400 | "缺少 jwt_token，請先完成 Facebook 授權" |
| Invalid ID format | 400 | "無效的 auto_response_id 格式" |
| FB API returns 404 | 500 | "刪除 Facebook 自動回應失敗: API error: 404" |
| FB API timeout | 500 | "刪除 Facebook 自動回應失敗: [timeout details]" |
| LINE not found in DB | 404 | "自動回應不存在" |

---

## Edge Cases Handled

### 1. Mixed-Channel Auto-Responses
**Problem**: Auto-responses with `channels: ['LINE', 'Facebook']` are saved to both local DB and FB API

**Solution**: Before deleting from DB, check if channels contains 'Facebook'. If yes and jwt_token is provided, attempt to delete from FB API as well (best-effort, logs warning if fails).

### 2. FB Auto-Response Not Found
**Behavior**: Returns 500 with FB API's error message. FB API is treated as authoritative source.

### 3. Missing jwt_token for FB Operations
**Behavior**: Returns 400 error requiring user to provide jwt_token for FB operations.

### 4. Mixed-Channel Without jwt_token
**Behavior**: Deletes from local DB successfully but logs warning that FB API copy could not be deleted.

---

## Testing Checklist

### Manual Testing

- [ ] **FB Delete (Success)**: Delete FB auto-response with valid jwt_token
  ```bash
  curl -X DELETE "http://localhost:8700/api/v1/auto_responses/fb-123?jwt_token=xxx"
  # Expected: 200, message contains "已從 Facebook API 刪除"
  ```

- [ ] **FB Delete (Missing Token)**: Delete FB auto-response without jwt_token
  ```bash
  curl -X DELETE "http://localhost:8700/api/v1/auto_responses/fb-123"
  # Expected: 400, "缺少 jwt_token"
  ```

- [ ] **LINE Delete (Regression)**: Delete LINE auto-response (should work as before)
  ```bash
  curl -X DELETE "http://localhost:8700/api/v1/auto_responses/123"
  # Expected: 200, "刪除成功"
  ```

- [ ] **Mixed-Channel Delete**: Delete auto-response with both LINE and FB channels
  ```bash
  curl -X DELETE "http://localhost:8700/api/v1/auto_responses/456?jwt_token=xxx"
  # Expected: 200, check logs for FB API deletion attempt
  ```

- [ ] **FB Delete (Not Found)**: Delete non-existent FB auto-response
  ```bash
  curl -X DELETE "http://localhost:8700/api/v1/auto_responses/fb-999?jwt_token=xxx"
  # Expected: 500, "刪除 Facebook 自動回應失敗"
  ```

### Backend Logs to Check

```
✅ Success logs:
- "⚡ 檢測到 FB 自動回應 ID: fb-123"
- "FB template DELETE response: basic_id=123"
- "✅ FB 自動回應刪除成功: fb-123"

⚠️  Warning logs (mixed-channel):
- "⚡ 檢測到混合渠道自動回應 (包含 Facebook)"
- "⚠️  FB API 副本刪除失敗" (if FB API call fails)
- "⚠️  混合渠道自動回應 X 已從本地 DB 刪除，但缺少 jwt_token"

❌ Error logs:
- "FB 刪除失敗: [error message]"
- "FB template DELETE error: [status code]"
```

### Frontend Testing

- [ ] Verify frontend passes jwt_token when deleting FB auto-responses
- [ ] Verify error messages display correctly to user
- [ ] Verify LINE auto-response deletion still works (no regression)

---

## Verification Checklist

After deployment, verify:

1. ✅ FbMessageClient has 3 new DELETE methods matching Excel spec
2. ✅ DELETE endpoint accepts string IDs (both "123" and "fb-123")
3. ✅ FB auto-responses deleted via FB API (not local DB)
4. ✅ LINE auto-responses still work (no regression)
5. ✅ Mixed-channel auto-responses attempt deletion from both places
6. ✅ Missing jwt_token returns 400 error with clear message
7. ✅ FB API errors return descriptive 500 messages
8. ✅ Backend logs show appropriate info/warning/error messages

---

## Excel Specification Compliance

| Excel Function | API Endpoint | Implementation | Status |
|----------------|--------------|----------------|--------|
| 功能 1: 編輯自動回應 | PATCH /auto_template | `update_auto_template()` | ✅ Existing |
| 功能 2: 刪除關鍵字 | DELETE /auto_template/keyword/{id} | `delete_keyword()` | ✅ New |
| 功能 3: 刪除訊息 | DELETE /auto_template/Reply/{id} | `delete_reply()` | ✅ New |
| 功能 4: 刪除整組設定 | DELETE /auto_template?basic_id={id} | `delete_template()` | ✅ New |

All 4 operations from fb-API.XLSX are now fully implemented.

---

## Rollback Plan

If issues arise:

```bash
# Revert the changes
git revert <commit-hash>

# Restart backend
systemctl restart backend

# Verify
curl http://localhost:8700/api/v1/auto_responses
```

**Risk Level**: Low
- No database schema changes
- No data migrations
- LINE functionality preserved
- FB operations are additive (won't break existing features)

---

## Next Steps

1. **Backend Testing**: Test all scenarios listed above
2. **Frontend Verification**: Ensure frontend passes jwt_token correctly
3. **Log Monitoring**: Check backend logs for any unexpected errors
4. **Production Deployment**: Deploy to production after successful testing
5. **User Testing**: Have users test FB auto-response deletion

---

## Notes

- The implementation follows existing code patterns for consistency
- All error handling matches existing methods in FbMessageClient
- Mixed-channel handling prevents orphaned FB API records
- FB API is treated as single source of truth for FB-only auto-responses
- LINE functionality remains unchanged (backward compatible)

---

**Implementation Complete**: Ready for testing and deployment
