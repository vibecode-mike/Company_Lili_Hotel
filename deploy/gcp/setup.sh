#!/bin/bash
# ============================================================
# GCP VM 一鍵初始化腳本
# 用法: sudo bash deploy/gcp/setup.sh
# 前提: Ubuntu 24.04, Miniconda3 已安裝在 /home/creative_design/miniconda3
# ============================================================
set -e

# --- 配置 ---
APP_USER="creative_design"
APP_DIR="/home/Company_Lili_Hotel"
CONDA_DIR="/home/$APP_USER/miniconda3"
PYTHON_BIN="$CONDA_DIR/bin/python3"
PIP_BIN="$CONDA_DIR/bin/pip"
REPO_URL="https://github.com/vibecode-mike/Company_Lili_Hotel.git"

echo "=========================================="
echo "  力麗飯店 CRM - GCP VM 初始化"
echo "=========================================="
echo "Python: $($PYTHON_BIN --version 2>&1)"
echo ""

# --- 1. 系統依賴 ---
echo "[1/7] 安裝系統依賴..."
apt-get update -qq
apt-get install -y -qq \
    nginx mysql-server \
    build-essential libffi-dev libjpeg-dev zlib1g-dev \
    git curl > /dev/null

# Node.js (如果沒有)
if ! command -v node &> /dev/null; then
    echo "  安裝 Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null
    apt-get install -y -qq nodejs > /dev/null
fi
echo "  Node: $(node --version), npm: $(npm --version)"

# --- 2. Clone repo ---
echo "[2/7] Clone repo..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  Repo 已存在，git pull..."
    cd "$APP_DIR" && sudo -u $APP_USER git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
    chown -R $APP_USER:$APP_USER "$APP_DIR"
fi

# --- 3. Python 依賴 ---
echo "[3/7] 安裝 Python 依賴..."
sudo -u $APP_USER $PIP_BIN install -r "$APP_DIR/backend/requirements.txt" -q
sudo -u $APP_USER $PIP_BIN install flask flask-cors flask-basicauth pytz xlrd xlwt opencc-python-reimplemented -q
echo "  pip packages installed"

# --- 4. Frontend build ---
echo "[4/7] Frontend build..."
cd "$APP_DIR/frontend"
sudo -u $APP_USER npm install --silent
sudo -u $APP_USER npm run build
echo "  Build: $(ls -d $APP_DIR/frontend/build 2>/dev/null && echo 'OK' || echo 'FAIL')"

# --- 5. MySQL ---
echo "[5/7] 設定 MySQL..."
systemctl start mysql 2>/dev/null || true
mysql -u root -e "CREATE DATABASE IF NOT EXISTS lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
echo "  Database: lili_hotel"

# --- 6. .env 檔案 ---
echo "[6/7] 設定 .env..."
GCP_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || echo "YOUR_GCP_IP")

# Backend .env
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env" 2>/dev/null || true
    echo ""
    echo "  !! 請編輯 $APP_DIR/backend/.env"
    echo "     設定 DATABASE_URL, LINE_CHANNEL_ACCESS_TOKEN, OPENAI_API_KEY 等"
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
    echo "  !! 請編輯 $APP_DIR/line_app/.env"
fi

# Frontend .env.production (空 VITE_API_BASE_URL = nginx proxy)
cat > "$APP_DIR/frontend/.env.production" <<ENVEOF
VITE_API_BASE_URL=
ENVEOF

# --- 7. Nginx ---
echo "[7/7] 設定 Nginx..."

cat > /etc/nginx/sites-available/lili-hotel <<'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;

    add_header X-Robots-Tag "noindex, nofollow" always;

    # SSE (禁用緩衝)
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

    # 前端靜態檔 (nginx 直接 serve build/)
    location / {
        root /home/Company_Lili_Hotel/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default 2>/dev/null
ln -sf /etc/nginx/sites-available/lili-hotel /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo "  Nginx OK"

echo ""
echo "=========================================="
echo "  初始化完成!"
echo "=========================================="
echo ""
echo "  CRM 後台: http://$GCP_IP"
echo "  API 文件: http://$GCP_IP/api/v1/docs"
echo ""
echo "  待辦:"
echo "  1. 編輯 $APP_DIR/backend/.env (API keys)"
echo "  2. 編輯 $APP_DIR/line_app/.env (LINE tokens)"
echo "  3. DB migration: cd $APP_DIR/backend && alembic upgrade head"
echo "  4. 啟動 backend: cd $APP_DIR/backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8700"
echo "  5. 啟動 LINE app: cd $APP_DIR/line_app && python app.py"
echo "  6. 之後 push main -> GitHub Actions 自動部署"
echo ""
