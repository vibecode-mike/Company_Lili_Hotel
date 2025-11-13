# API 端點調整狀態報告

## ✅ 已完成項目

### 1. 新建 API 端點
- ✅ `/api/v1/pms_integrations` - PMS 系統整合 API
  - POST /pms_integrations - 創建 PMS 記錄
  - GET /pms_integrations - 列表查詢
  - GET /pms_integrations/{id} - 詳情查詢  
  - PUT /pms_integrations/{id} - 更新記錄
  - DELETE /pms_integrations/{id} - 刪除記錄
  - POST /pms_integrations/match - 執行匹配

- ✅ `/api/v1/consumption_records` - 消費紀錄 API
  - POST /consumption_records - 創建消費記錄
  - GET /consumption_records - 列表查詢  
  - GET /consumption_records/{id} - 詳情查詢
  - PUT /consumption_records/{id} - 更新記錄
  - DELETE /consumption_records/{id} - 刪除記錄
  - GET /consumption_records/member/{id}/summary - 會員消費統計

- ✅ `/api/v1/campaigns_new` - 活動管理 API（新語意）
  - POST /campaigns_new - 創建活動
  - GET /campaigns_new - 列表查詢
  - GET /campaigns_new/{id} - 詳情查詢
  - PUT /campaigns_new/{id} - 更新活動
  - DELETE /campaigns_new/{id} - 刪除活動

### 2. 文檔更新
- ✅ 在 campaigns.py 添加語意變更說明
- ✅ 更新 __init__.py 路由註冊
- ✅ 添加 v0.2 資料庫重構說明

### 3. 路由註冊
- ✅ 註冊 pms_integrations 路由
- ✅ 註冊 consumption_records 路由
- ✅ 註冊 campaigns_new 路由

## ⚠️ 需要後續處理

### 1. members.py API 更新
**問題**：members.py 中大量使用已移除的 `MemberTagRelation` 模型

**影響範圍**：
- 標籤篩選查詢（第 59-61 行）
- 會員標籤關聯查詢（第 97-115 行）  
- 標籤列表查詢（第 154-201 行）
- 添加/刪除標籤功能（第 317-351 行）

**修復方案**：
新的 MemberTag 設計為單表，直接包含 member_id 和 tag_name，需要：
1. 移除所有 `.join(MemberTagRelation)` 查詢
2. 直接查詢 `MemberTag.member_id == member_id`
3. 更新標籤添加邏輯（不再需要創建關聯記錄）
4. 更新標籤刪除邏輯（直接刪除 MemberTag 記錄）

**預計工作量**：約 20 處代碼修改

### 2. campaigns.py 語意調整
**當前狀態**：向後兼容，保持現有功能

**建議後續優化**：
1. 將 campaigns.py 重命名為 broadcast_messages.py
2. 更新模型引用從 Campaign → Message
3. 調整字段映射以使用新的 Message 表結構
4. 創建 /messages 端點作為新標準 API

### 3. tags.py API 更新
類似 members.py，可能也需要更新標籤相關查詢邏輯

## 📋 資料庫表對應關係

### 原設計 vs 新設計
| 功能 | 原表名 | 新表名 | 說明 |
|------|--------|--------|------|
| 群發訊息 | campaigns | messages | 語意變更 |
| 活動管理 | - | campaigns | 新功能 |
| 會員標籤關聯 | member_tag_relations | member_tags | 合併為單表 |
| PMS 整合 | - | pms_integrations | 新功能 |
| 消費紀錄 | - | consumption_records | 新功能 |
| 互動記錄 | - | member_interaction_records | 新功能 |
| 一對一訊息 | - | message_records | 新功能 |

## 🔧 下一步行動

### 優先級 P0（阻塞性）
1. 修復 members.py 中的 MemberTagRelation 引用，讓服務能夠啟動
2. 修復 tags.py 中可能的相同問題

### 優先級 P1（重要但不阻塞）
3. 調整 line_app/app.py 中的 SQL 查詢（campaigns → messages）
4. 測試所有 API 端點

### 優先級 P2（優化）
5. 將 campaigns API 完整遷移到 Message 模型
6. 創建標準的 /messages API 端點
7. 完善 API 文檔

## 📝 技術債務
- members.py 和 tags.py 中的舊標籤系統邏輯
- campaigns.py 仍使用舊模型名稱
- 缺少單元測試覆蓋新 API
