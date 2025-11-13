# 釐清問題

重新設定 LINE OA 時，「清除現有設定」的範圍為何？僅清除 API 憑證，還是連同會員、訊息、標籤等資料一併清除？

# 定位

Feature：spec/features/重新設定_LINE_OA.feature Rule 關於解除後導向（約第19-26行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅清除 LineOAConfig 與 LoginConfig 設定資料，保留會員與訊息 |
| B | 清除所有 LINE OA 相關資料（含會員、訊息、標籤），完全重置 |
| C | 提供選項讓管理員選擇：僅清除設定 或 完全清除所有資料 |
| Short | 其他範圍（<=5字）|

# 影響範圍

影響資料保留策略、重新設定流程複雜度、資料遺失風險、使用者期待，以及資料備份需求。

# 優先級

High

---

# 用戶決策

**決策日期：** 2025-11-12

**決策內容：** B - 清除所有 LINE OA 相關資料（含會員、訊息、標籤），完全重置

**用戶原話：** "B"

# 規格整合

## 新增內容

### spec/features/重新設定_LINE_OA.feature

#### 新增 Rule：重新設定時清除所有 LINE OA 相關資料（第 28-61 行）

```gherkin
Rule: 重新設定時清除所有 LINE OA 相關資料，完全重置系統

  Example: 清除所有設定資料
    Given 管理員確認重新設定 LINE OA
    When 系統執行資料清除
    Then 系統清除以下設定資料
      | 資料表名稱     | 說明                          |
      | LineOAConfig   | LINE Messaging API 設定       |
      | LoginConfig    | LINE Login API 設定           |

  Example: 清除所有業務資料
    Given 管理員確認重新設定 LINE OA
    When 系統執行資料清除
    Then 系統清除以下業務資料
      | 資料表名稱        | 說明                     |
      | Member            | 會員資料                 |
      | Campaign          | 群發訊息資料             |
      | Template          | 訊息模板                 |
      | AutoResponse      | 自動回應設定             |
      | Tag               | 標籤（會員標籤、互動標籤）|
      | MemberTag         | 會員標籤關聯             |
      | InteractionTag    | 互動標籤關聯             |
      | MessageRecord     | 訊息紀錄                 |
      | TagTriggerLog     | 標籤觸發紀錄             |
    And 系統回到初始狀態，如同首次使用

  Example: 完全重置後重新設定
    Given 系統已清除所有 LINE OA 相關資料
    When 管理員進入基本設定頁面
    Then 所有設定欄位為空
    And 會員列表為空
    And 群發訊息列表為空
    And 標籤列表為空
    And 系統提示「請重新設定 LINE OA 基本資料」
```

## 實作說明

### 資料清除範圍

#### 設定資料（必須清除）
1. **LineOAConfig** - LINE Messaging API 設定
   - channel_id
   - channel_secret
   - channel_access_token
   - webhook_url
   - line_official_account_id

2. **LoginConfig** - LINE Login API 設定
   - channel_id
   - channel_secret
   - callback_url

#### 業務資料（必須清除）
3. **Member** - 會員資料
   - 所有會員基本資料
   - 會員互動紀錄
   - 會員標籤關聯

4. **Campaign** - 群發訊息資料
   - 所有群發訊息活動
   - 訊息發送紀錄
   - 發送狀態與統計

5. **Template** - 訊息模板
   - 所有自訂模板
   - 模板內容與設定

6. **AutoResponse** - 自動回應設定
   - 關鍵字自動回應
   - 自動回應規則

7. **Tag** - 標籤資料
   - 會員標籤（MemberTag）
   - 互動標籤（InteractionTag）

8. **MemberTag** - 會員標籤關聯
   - 會員與標籤的對應關係

9. **InteractionTag** - 互動標籤關聯
   - 互動行為與標籤的對應關係

10. **MessageRecord** - 訊息紀錄
    - 所有訊息往來紀錄
    - 對話歷史

11. **TagTriggerLog** - 標籤觸發紀錄
    - 標籤觸發歷史
    - 觸發統計資料

#### 保留資料（不清除）
- **Admin** - 管理員帳號資料（保留，以便重新設定）
- **SystemAuthorization** - 系統授權資料（保留）
- **LoginSession** - 登入會話（保留當前登入狀態）

### 後端實作（FastAPI）

#### 1. 資料清除服務

```python
from sqlalchemy.orm import Session
from typing import List

class LineOAResetService:
    """LINE OA 重新設定服務"""

    def __init__(self, db: Session, admin_id: int):
        self.db = db
        self.admin_id = admin_id

    def reset_line_oa(self) -> dict:
        """
        完全重置 LINE OA 相關資料

        Returns:
            dict: 清除結果統計
        """
        result = {
            "cleared_tables": [],
            "total_records_deleted": 0
        }

        try:
            # 開始交易
            self.db.begin()

            # 1. 清除設定資料
            config_count = self._clear_config_data()
            result["total_records_deleted"] += config_count

            # 2. 清除業務資料
            business_count = self._clear_business_data()
            result["total_records_deleted"] += business_count

            # 提交交易
            self.db.commit()

            return result

        except Exception as e:
            # 發生錯誤時回滾
            self.db.rollback()
            raise Exception(f"重新設定失敗: {str(e)}")

    def _clear_config_data(self) -> int:
        """清除設定資料"""
        count = 0

        # 清除 LineOAConfig
        count += self.db.query(LineOAConfig)\
            .filter(LineOAConfig.admin_id == self.admin_id)\
            .delete()

        # 清除 LoginConfig
        count += self.db.query(LoginConfig)\
            .filter(LoginConfig.admin_id == self.admin_id)\
            .delete()

        return count

    def _clear_business_data(self) -> int:
        """清除業務資料"""
        count = 0

        # 注意：需要依照外鍵依賴順序刪除

        # 1. 先刪除關聯表
        count += self.db.query(TagTriggerLog)\
            .filter(TagTriggerLog.admin_id == self.admin_id)\
            .delete()

        count += self.db.query(MemberTag)\
            .filter(MemberTag.admin_id == self.admin_id)\
            .delete()

        count += self.db.query(InteractionTag)\
            .filter(InteractionTag.admin_id == self.admin_id)\
            .delete()

        # 2. 刪除訊息相關
        count += self.db.query(MessageRecord)\
            .filter(MessageRecord.admin_id == self.admin_id)\
            .delete()

        count += self.db.query(Campaign)\
            .filter(Campaign.admin_id == self.admin_id)\
            .delete()

        count += self.db.query(Template)\
            .filter(Template.admin_id == self.admin_id)\
            .delete()

        # 3. 刪除標籤
        count += self.db.query(Tag)\
            .filter(Tag.admin_id == self.admin_id)\
            .delete()

        # 4. 刪除自動回應
        count += self.db.query(AutoResponse)\
            .filter(AutoResponse.admin_id == self.admin_id)\
            .delete()

        # 5. 最後刪除會員（因為其他表可能參照）
        count += self.db.query(Member)\
            .filter(Member.admin_id == self.admin_id)\
            .delete()

        return count
```

#### 2. API 端點

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/line-oa/reset")
async def reset_line_oa(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """
    重新設定 LINE OA（完全清除所有資料）

    需要二次確認，由前端處理確認邏輯
    """
    admin_id = current_admin["admin_id"]

    try:
        # 執行重新設定
        reset_service = LineOAResetService(db, admin_id)
        result = reset_service.reset_line_oa()

        return {
            "success": True,
            "message": "LINE OA 已完全重置",
            "deleted_records": result["total_records_deleted"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"重新設定失敗: {str(e)}"
        )
```

### 前端實作（React）

#### 1. 重新設定按鈕與確認對話框

```typescript
// components/ResetLineOAButton.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetLineOAButton: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setIsResetting(true);

    try {
      const response = await api.post('/line-oa/reset');

      if (response.data.success) {
        // 顯示成功訊息
        alert('LINE OA 已完全重置');

        // 導向基本設定頁面
        navigate('/settings/line-oa');
      }
    } catch (error) {
      console.error('重新設定失敗:', error);
      alert('重新設定失敗，請稍後再試');
    } finally {
      setIsResetting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="btn-danger"
      >
        重新設定 LINE OA
      </button>

      {showConfirm && (
        <div className="modal">
          <div className="modal-content">
            <h3>確認是否要重新設定？</h3>
            <p className="warning">
              確定要解除與 @LINE 的連結嗎？
              <br />
              解除後需要重新設定所有資料。
            </p>
            <p className="danger-text">
              ⚠️ 警告：此操作將清除所有會員、訊息、標籤等資料，且無法復原！
            </p>

            <div className="modal-actions">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isResetting}
              >
                取消
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="btn-danger"
              >
                {isResetting ? '清除中...' : '確認重新設定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResetLineOAButton;
```

### 安全性考量

#### 1. 二次確認機制
- **UI 層確認：** 點擊按鈕後彈出確認對話框
- **警告訊息：** 明確說明將清除所有資料且無法復原
- **確認按鈕：** 使用危險色（紅色）警示使用者

#### 2. 資料庫交易
- **原子性：** 使用資料庫交易確保全部成功或全部失敗
- **錯誤回滾：** 任何錯誤發生時回滾所有變更
- **鎖定機制：** 防止並發操作導致資料不一致

#### 3. 權限驗證
- **身份驗證：** 必須是已登入的管理員
- **操作日誌：** 記錄誰在何時執行了重新設定操作
- **審計追蹤：** 保存刪除前的統計資料（記錄數量）

### 資料備份建議（未來擴充）

#### 1. 重置前自動備份
```python
def backup_before_reset(self) -> str:
    """重置前備份資料"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backup_{self.admin_id}_{timestamp}.sql"

    # 匯出資料到備份檔案
    # 實作資料匯出邏輯...

    return backup_file
```

#### 2. 備份下載功能
```python
@router.get("/line-oa/backup")
async def download_backup(
    current_admin: dict = Depends(get_current_admin)
):
    """下載資料備份"""
    # 產生備份檔案並提供下載
    pass
```

### 優點
- **乾淨重置：** 完全清除舊資料，避免新舊資料混淆
- **簡單明確：** 不需要複雜的選項，流程清楚
- **問題排除：** 遇到資料問題時可完全重新開始

### 缺點
- **資料遺失：** 所有歷史資料永久遺失
- **無法復原：** 沒有備份機制時無法還原
- **使用者衝擊：** 可能誤操作導致重要資料遺失

### 風險緩解措施

1. **明確警告：** UI 上用紅色文字和⚠️圖示警告
2. **延遲執行：** 考慮加入「3秒倒數」再執行
3. **確認碼：** 要求輸入「DELETE」等確認文字
4. **操作限制：** 限制執行頻率（如24小時內只能執行一次）
5. **備份提示：** 建議使用者先手動備份重要資料

### 測試要點

1. **完整清除測試：** 驗證所有表的資料都被清除
2. **交易測試：** 驗證中途失敗時正確回滾
3. **外鍵測試：** 驗證刪除順序正確，不違反外鍵約束
4. **UI 確認測試：** 驗證確認對話框正確顯示和操作
5. **權限測試：** 驗證只有授權管理員能執行
6. **重置後狀態測試：** 驗證重置後系統回到初始狀態
7. **並發測試：** 驗證同時操作時的處理機制

# 歸檔資訊

- **歸檔時間：** 2025-11-12
- **處理狀態：** 已整合至規格
- **處理者：** Claude (SuperClaude Framework)
