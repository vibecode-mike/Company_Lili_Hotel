# 🚀 快速開始指南

## 一鍵啟動

```bash
cd /data2/lili_hotel/backend
./start.sh
```

## 手動啟動步驟

### 1. 檢查環境

```bash
# Python 版本（需要 3.11+）
python3 --version

# MySQL 服務狀態
systemctl status mysql
# 或
mysql -h 127.0.0.1 -P 3306 -u root -pl123456 -e "SELECT 1"
```

### 2. 安裝依賴

```bash
# 創建虛擬環境
python3 -m venv venv

# 激活虛擬環境
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 3. 配置環境變量

編輯 `.env` 文件，必須配置：

```bash
# LINE API（必須）
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret

# OpenAI API（必須）
OPENAI_API_KEY=your-key
```

### 4. 初始化資料庫

```bash
# 創建資料庫
mysql -h 127.0.0.1 -P 3306 -u root -pl123456 -e "CREATE DATABASE IF NOT EXISTS lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 初始化表和默認數據
python scripts/init_db.py
```

### 5. 啟動服務

```bash
# 開發模式（自動重載）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生產模式
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

## 驗證安裝

### 1. 健康檢查

```bash
curl http://localhost:8000/health
```

預期響應：
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development"
}
```

### 2. 訪問 API 文檔

瀏覽器打開：http://localhost:8000/api/v1/docs

### 3. 測試登入

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

預期響應包含 `access_token`

## 常用命令

### 資料庫遷移

```bash
# 創建遷移
alembic revision --autogenerate -m "描述變更"

# 執行遷移
alembic upgrade head

# 回滾
alembic downgrade -1
```

### 代碼格式化

```bash
# 格式化代碼
black app/

# 排序導入
isort app/

# 檢查代碼
flake8 app/
```

### 運行測試

```bash
pytest
pytest --cov=app
```

## 默認賬號

- **用戶名**: admin
- **密碼**: admin123
- **角色**: 管理員

⚠️ **首次登入後請立即修改密碼！**

## 端口說明

- **8000**: API 服務端口
- **3306**: MySQL 資料庫端口

## 目錄說明

```
backend/
├── app/              # 應用主目錄
├── migrations/       # 資料庫遷移文件
├── scripts/          # 工具腳本
├── tests/            # 測試文件
├── .env              # 環境變量
├── start.sh          # 啟動腳本
└── README.md         # 詳細文檔
```

## 故障排查

### 1. 資料庫連接失敗

```bash
# 檢查 MySQL 服務
systemctl status mysql

# 測試連接
mysql -h 127.0.0.1 -P 3306 -u root -pl123456
```

### 2. 端口被占用

```bash
# 查看端口占用
lsof -i :8000

# 殺死進程
kill -9 <PID>
```

### 3. 依賴安裝失敗

```bash
# 升級 pip
pip install --upgrade pip

# 清除緩存
pip cache purge

# 重新安裝
pip install -r requirements.txt
```

## 下一步

1. ✅ 查看 [README.md](README.md) 了解完整功能
2. ✅ 查看 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) 了解項目詳情
3. ✅ 訪問 API 文檔測試接口
4. ✅ 配置 LINE 和 OpenAI API 密鑰
5. ✅ 開始開發或集成前端

## 技術支持

- 📖 文檔: README.md
- 🔗 API: http://localhost:8000/api/v1/docs
- 🏥 健康: http://localhost:8000/health

---

**祝開發順利！** 🎉
