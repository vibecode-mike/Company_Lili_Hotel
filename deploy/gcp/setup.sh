#!/bin/bash
# ============================================================
# GCP VM 一鍵初始化腳本
# 用法: sudo bash setup.sh
# 前提: Ubuntu 22.04+, 已有 Python 3.13
# ============================================================
set -e

# --- 配置 ---
APP_DIR="/data2/lili_hotel"
VENV_DIR="$APP_DIR/venv"
REPO_URL="https://github.com/vibecode-mike/Company_Lili_Hotel.git"
PYTHON_BIN=$(which python3.13 2>/dev/null || which python3)

echo "=========================================="
echo "  力麗飯店 CRM - GCP VM 初始化"
echo "=========================================="
echo "Python: $PYTHON_BIN ($($PYTHON_BIN --version))"
echo ""

# --- 1. 系統依賴 ---
echo "[1/8] 安裝系統依賴..."
apt-get update -qq
apt-get install -y -qq \
    nginx mysql-server \
    build-essential libffi-dev libjpeg-dev zlib1g-dev \
    git curl > /dev/null

# Node.js 22 (如果沒有)
if ! command -v node &> /dev/null; then
    echo "  安裝 Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null
    apt-get install -y -qq nodejs > /dev/null
fi
echo "  Node: $(node --version), npm: $(npm --version)"

# --- 2. Clone repo ---
echo "[2/8] Clone repo..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  Repo 已存在，git pull..."
    cd "$APP_DIR" && git pull origin main
else
    mkdir -p "$(dirname $APP_DIR)"
    git clone "$REPO_URL" "$APP_DIR"
fi

# --- 3. Python venv ---
echo "[3/8] 建立 Python venv..."
$PYTHON_BIN -m venv "$VENV_DIR"
$VENV_DIR/bin/pip install --upgrade pip -q
$VENV_DIR/bin/pip install -r "$APP_DIR/backend/requirements.txt" -q
$VENV_DIR/bin/pip install flask==3.0.0 flask-cors==6.0.1 flask-basicauth==0.2.0 pytz xlrd xlwt opencc-python-reimplemented -q
echo "  venv Python: $($VENV_DIR/bin/python --version)"

# --- 4. Frontend build ---
echo "[4/8] Frontend build..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build
echo "  Build 完成: $(ls -d $APP_DIR/frontend/build 2>/dev/null && echo 'OK' || echo 'FAIL')"

# --- 5. MySQL ---
echo "[5/8] 設定 MySQL..."
systemctl start mysql 2>/dev/null || true
mysql -u root -e "CREATE DATABASE IF NOT EXISTS lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
echo "  Database: lili_hotel"

# --- 6. .env 檔案 ---
echo "[6/8] 設定 .env..."
GCP_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || echo "YOUR_GCP_IP")

# Backend .env
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env" 2>/dev/null || true
    echo ""
    echo "  ⚠️  請編輯 $APP_DIR/backend/.env"
    echo "     設定 DATABASE_URL, LINE_CHANNEL_ACCESS_TOKEN, OPENAI_API_KEY 等"
    echo "     CORS_ORIGINS 加入 http://$GCP_IP"
fi

# LINE App .env
if [ ! -f "$APP_DIR/line_app/.env" ]; then
    cat > "$APP_DIR/line_app/.env" <<ENVEOF
LINE_CHANNEL_ACCESS_TOKEN=__FILL__
LINE_CHANNEL_SECRET=__FILL__
BACKEND_API_URL=http://localhost:8700
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/lili_hotel
PUBLIC_BASE_URL=http://$GCP_IP
ENVEOF
    echo "  ⚠️  請編輯 $APP_DIR/line_app/.env"
fi

# Frontend .env.production (空 VITE_API_BASE_URL = nginx proxy)
cat > "$APP_DIR/frontend/.env.production" <<ENVEOF
VITE_API_BASE_URL=
ENVEOF

# --- 7. Nginx ---
echo "[7/8] 設定 Nginx..."

# CRM 後台
cat > /etc/nginx/sites-available/lili-crm <<'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;

    add_header X-Robots-Tag "noindex, nofollow" always;

    # SSE（禁用緩衝）
    location /api/v1/sse/ {
        proxy_pass http://127.0.0.1:8700;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # API
    location /api/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 600;
            return 204;
        }
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        proxy_pass http://127.0.0.1:8700;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上傳檔案
    location /uploads/ {
        proxy_pass http://127.0.0.1:8700;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 前端靜態檔（nginx 直接 serve build/）
    location / {
        root /data2/lili_hotel/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

# LINE webhook
cat > /etc/nginx/sites-available/lili-linebot <<'NGINXEOF'
server {
    listen 3080;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# 啟用站點
rm -f /etc/nginx/sites-enabled/default 2>/dev/null
ln -sf /etc/nginx/sites-available/lili-crm /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/lili-linebot /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo "  Nginx OK"

# --- 8. Systemd ---
echo "[8/8] 設定 Systemd services..."

cat > /etc/systemd/system/lili_backend.service <<'SVCEOF'
[Unit]
Description=Lili Hotel Backend (FastAPI uvicorn)
After=network.target mysql.service

[Service]
Type=exec
WorkingDirectory=/data2/lili_hotel/backend
ExecStart=/data2/lili_hotel/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8700
Restart=always
RestartSec=5
StandardOutput=append:/data2/lili_hotel/backend.log
StandardError=append:/data2/lili_hotel/backend.log

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/systemd/system/mike_app.service <<'SVCEOF'
[Unit]
Description=LINE App (Flask)
After=network.target

[Service]
ExecStart=/data2/lili_hotel/venv/bin/python /data2/lili_hotel/line_app/app.py
WorkingDirectory=/data2/lili_hotel/line_app
Environment="FLASK_ENV=production"
Environment="PYTHONUNBUFFERED=1"
Restart=always
RestartSec=5
StandardOutput=append:/var/log/mike_app.log
StandardError=append:/var/log/mike_app.err

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable lili_backend mike_app
systemctl start lili_backend mike_app

echo ""
echo "=========================================="
echo "  初始化完成！"
echo "=========================================="
echo ""
echo "  CRM 後台: http://$GCP_IP"
echo "  API 文件: http://$GCP_IP/api/v1/docs"
echo "  LINE Bot: http://$GCP_IP:3080"
echo ""
echo "  ⚠️  待辦："
echo "  1. 編輯 $APP_DIR/backend/.env（API keys）"
echo "  2. 編輯 $APP_DIR/line_app/.env（LINE tokens）"
echo "  3. 執行 DB migration: cd $APP_DIR/backend && $VENV_DIR/bin/alembic upgrade head"
echo "  4. LINE webhook URL 設定 HTTPS（需域名或 Cloudflare Tunnel）"
echo "  5. 重啟: systemctl restart lili_backend mike_app"
echo ""
