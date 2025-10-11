#!/bin/bash

echo "🚀 力麗飯店 CRM 後端系統啟動腳本"
echo ""

# 檢查 Python 版本
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python 版本: $python_version"

# 檢查是否已安裝依賴
if [ ! -d "venv" ]; then
    echo "📦 創建虛擬環境..."
    python3 -m venv venv
fi

echo "📦 激活虛擬環境..."
source venv/bin/activate

echo "📦 安裝/更新依賴..."
pip install -r requirements.txt

# 檢查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，從 .env.example 複製..."
    cp .env.example .env
    echo "⚠️  請編輯 .env 文件設置正確的配置！"
    exit 1
fi

# 檢查資料庫連接
echo "🔍 檢查資料庫連接..."
mysql -h 127.0.0.1 -P 3306 -u root -pl123456 -e "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ 無法連接到 MySQL 資料庫"
    echo "請確保 MySQL 服務正在運行，並且連接配置正確"
    exit 1
fi

# 檢查並創建資料庫
echo "🗄️  檢查資料庫 lili_hotel..."
mysql -h 127.0.0.1 -P 3306 -u root -pl123456 -e "CREATE DATABASE IF NOT EXISTS lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

# 初始化資料庫
echo "🔧 初始化資料庫表..."
python scripts/init_db.py

# 啟動服務
echo ""
echo "✨ 啟動 FastAPI 服務..."
echo "📍 API 文檔: http://localhost:8000/api/v1/docs"
echo "📍 健康檢查: http://localhost:8000/health"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
