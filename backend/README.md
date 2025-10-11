# 力麗飯店 LineOA CRM 後端系統

基於 FastAPI 開發的 LINE 官方帳號 CRM 管理系統後端。

## 技術棧

- **Python**: 3.11+
- **Web 框架**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+ (異步)
- **資料庫**: MySQL 8.0+
- **LINE API**: line-bot-sdk 3.6+
- **AI 服務**: OpenAI API

## 功能模組

1. **認證授權** - JWT Token 認證
2. **會員管理** - 會員 CRUD、標籤管理、備註
3. **活動推播** - 排程推播、目標受眾篩選
4. **消息模板** - 4 種模板類型（純文字、按鈕、圖片、輪播）
5. **標籤管理** - 會員標籤、互動標籤
6. **自動回應** - 歡迎訊息、關鍵字回覆、時間觸發
7. **消息記錄** - 對話記錄、訊息追蹤
8. **數據分析** - KPI 統計、活動成效、標籤分布

## 安裝與運行

### 1. 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置環境變量

複製 `.env.example` 為 `.env` 並填入實際配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件，設置以下變量：

- `DATABASE_URL`: MySQL 連接字符串
- `SECRET_KEY`: JWT 加密密鑰
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE 頻道訪問令牌
- `LINE_CHANNEL_SECRET`: LINE 頻道密鑰
- `OPENAI_API_KEY`: OpenAI API 密鑰

### 3. 初始化資料庫

```bash
# 創建資料庫
mysql -u root -p -e "CREATE DATABASE lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 運行遷移
alembic upgrade head
```

### 4. 啟動服務

```bash
# 開發模式（熱重載）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生產模式
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

服務將在 http://localhost:8000 啟動

### 5. 訪問 API 文檔

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## 資料庫遷移

```bash
# 創建新遷移
alembic revision --autogenerate -m "描述"

# 執行遷移
alembic upgrade head

# 回滾遷移
alembic downgrade -1
```

## API 端點

### 認證授權

- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/refresh` - 刷新 Token
- `GET /api/v1/auth/me` - 獲取當前用戶信息

### 會員管理

- `GET /api/v1/members` - 獲取會員列表
- `GET /api/v1/members/{id}` - 獲取會員詳情
- `POST /api/v1/members` - 新增會員
- `PUT /api/v1/members/{id}` - 更新會員
- `DELETE /api/v1/members/{id}` - 刪除會員
- `POST /api/v1/members/{id}/tags` - 添加標籤
- `DELETE /api/v1/members/{id}/tags/{tag_id}` - 移除標籤
- `PUT /api/v1/members/{id}/notes` - 更新備註

### 活動推播

- `GET /api/v1/campaigns` - 獲取活動列表
- `GET /api/v1/campaigns/{id}` - 獲取活動詳情
- `POST /api/v1/campaigns` - 創建活動
- `PUT /api/v1/campaigns/{id}` - 更新活動
- `DELETE /api/v1/campaigns/{id}` - 刪除活動
- `POST /api/v1/campaigns/{id}/send` - 發送活動

### 消息模板

- `GET /api/v1/templates` - 獲取模板列表
- `GET /api/v1/templates/{id}` - 獲取模板詳情
- `POST /api/v1/templates` - 創建模板
- `PUT /api/v1/templates/{id}` - 更新模板
- `DELETE /api/v1/templates/{id}` - 刪除模板

### 標籤管理

- `GET /api/v1/tags` - 獲取標籤列表
- `POST /api/v1/tags` - 創建標籤
- `PUT /api/v1/tags/{id}` - 更新標籤
- `DELETE /api/v1/tags/{id}` - 刪除標籤
- `GET /api/v1/tags/statistics` - 獲取標籤統計

### 自動回應

- `GET /api/v1/auto-responses` - 獲取自動回應列表
- `POST /api/v1/auto-responses` - 創建自動回應
- `PATCH /api/v1/auto-responses/{id}/toggle` - 切換啟用狀態

### 消息記錄

- `GET /api/v1/messages` - 獲取消息列表
- `GET /api/v1/messages/conversation/{member_id}` - 獲取對話記錄
- `POST /api/v1/messages` - 發送消息

### 數據分析

- `GET /api/v1/analytics/overview` - 獲取總覽數據
- `GET /api/v1/analytics/campaign-performance` - 獲取活動成效
- `GET /api/v1/analytics/tag-distribution` - 獲取標籤分布

## 項目結構

```
backend/
├── app/
│   ├── api/v1/          # API 路由
│   ├── core/            # 核心功能
│   ├── models/          # 資料庫模型
│   ├── schemas/         # Pydantic Schemas
│   ├── services/        # 業務邏輯
│   ├── integrations/    # 第三方集成
│   ├── workers/         # 後台任務
│   ├── utils/           # 工具函數
│   ├── config.py        # 配置管理
│   ├── database.py      # 資料庫連接
│   └── main.py          # 應用入口
├── migrations/          # 資料庫遷移
├── tests/               # 測試文件
├── .env.example         # 環境變量示例
├── requirements.txt     # Python 依賴
├── alembic.ini          # Alembic 配置
└── README.md
```

## 開發指南

### 代碼規範

```bash
# 格式化代碼
black app/

# 排序導入
isort app/

# 代碼檢查
flake8 app/
```

### 運行測試

```bash
# 運行所有測試
pytest

# 運行測試並生成覆蓋率報告
pytest --cov=app --cov-report=html
```

## 部署

### Docker 部署（推薦）

```bash
# 構建鏡像
docker build -t lili-hotel-backend .

# 運行容器
docker run -d -p 8000:8000 --env-file .env lili-hotel-backend
```

### 系統服務部署

1. 創建 systemd 服務文件 `/etc/systemd/system/lili-hotel.service`
2. 配置 Nginx 反向代理
3. 啟動服務：`systemctl start lili-hotel`

## 環境變量說明

| 變量名 | 說明 | 示例 |
|--------|------|------|
| DATABASE_URL | MySQL 連接 URL | mysql+aiomysql://user:pass@host:3306/db |
| SECRET_KEY | JWT 密鑰 | your-secret-key-here |
| LINE_CHANNEL_ACCESS_TOKEN | LINE 頻道令牌 | your-line-token |
| LINE_CHANNEL_SECRET | LINE 頻道密鑰 | your-line-secret |
| OPENAI_API_KEY | OpenAI API 密鑰 | sk-... |
| OPENAI_MODEL | OpenAI 模型 | gpt-4 |

## 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查 MySQL 服務是否運行
   - 確認資料庫連接字符串正確
   - 檢查防火牆設置

2. **LINE API 調用失敗**
   - 驗證 Channel Access Token 是否有效
   - 檢查 Channel Secret 是否正確
   - 確認 IP 白名單設置

3. **OpenAI API 錯誤**
   - 檢查 API Key 是否有效
   - 確認賬戶餘額充足
   - 驗證模型名稱正確

## 維護與監控

- **日誌文件**: `logs/app-{date}.log`
- **性能監控**: 使用 Prometheus + Grafana
- **錯誤追蹤**: 集成 Sentry（可選）

## 許可證

Copyright © 2025 力麗飯店
