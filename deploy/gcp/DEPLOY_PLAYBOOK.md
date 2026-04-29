# 力麗飯店 CRM — GCP 部署 Playbook

從零開始把這個專案部署到 GCP VM 的完整流程。以 staging 為實作對象，prod 部署只需做「章節 6 環境差異」列出的替換。

---

## 0. 開始前

### 前置條件

- **GCP 專案**：`crm-platform-479508`（prod 時替換）
- **GCP VM**：Debian/Ubuntu 系、已裝 MySQL、nginx、miniconda Python 3.13
- **網域 + HTTPS**：certbot 已配完 `console.star-bit.io`（prod 時替換）
- **本機工具**：`gcloud` CLI（你自己登入的帳號要有 `resourcemanager.projectIamAdmin`）
- **DNS**：A record 指向 VM 的 Static IP
- **程式碼**：已 `git clone` 到 `/home/Company_Lili_Hotel/`

### 關鍵 ID / 名稱

| 項目 | Staging 值 |
|---|---|
| VM 名 | `gcp-vm-crm` |
| Zone | `us-central1-a` |
| VM SA | `847295927552-compute@developer.gserviceaccount.com` |
| Static IP | `35.239.121.53` |
| 網域 | `console.star-bit.io` |
| Secret 前綴 | `staging-` |
| App DB user | `lili_app` |
| DB name | `lili_hotel` |

### 部署順序概覽

```
Day 1 (止血) → Day 2a (秘密 + 身份) → Day 2c 後端硬化 → Alembic
     ↓
   攻擊面關 → 秘密不落地 → 拔掉 dev server → Schema 上版本
```

**擱置中**：Day 2c 前端切換（`npm run build` + nginx 改 `/` 到靜態檔）— 需協調 FB 整合方後再做。

---

## 1. Day 1 — 攻擊面止血

**目標**：關掉不該對 0.0.0.0/0 開的 port，只留 80/443 + IAP SSH。

### 1.1 前置驗證 — IAP SSH 必須先能用

**不能跳**。刪 `default-allow-ssh` 後如果 IAP 不通會被鎖在外面。

```bash
gcloud compute ssh gcp-vm-crm --zone=us-central1-a --tunnel-through-iap --command="echo IAP-OK"
```

預期看到 `IAP-OK`。失敗就先解 IAP，別繼續。

### 1.2 刪 firewall rules

```bash
gcloud compute firewall-rules delete frontend --quiet
gcloud compute firewall-rules delete allow-line-bot-3001 --quiet
gcloud compute firewall-rules delete allow-mysql --quiet
gcloud compute firewall-rules delete allow-tcp-3000 --quiet
gcloud compute firewall-rules delete default-allow-rdp --quiet
gcloud compute firewall-rules delete default-allow-ssh --quiet
```

（未必每個環境都有這 6 條，刪不到沒關係）

### 1.3 驗證攻擊面已關

```bash
# 從 VM 自己跑（GCP firewall 仍會作用於 VNIC）
curl --max-time 5 http://<VM_IP>:3001/   # 應 timeout
curl --max-time 5 http://<VM_IP>:5173/   # 應 timeout
curl -sI https://<domain>/               # 應 200
```

### 1.4 剩下的合法 firewall

```
allow-http-crm80       0.0.0.0/0   tcp:80
default-allow-http     0.0.0.0/0   tcp:80    （重複，可擇一刪）
default-allow-https    0.0.0.0/0   tcp:443
allow-iap-ssh          35.235.240.0/20  tcp:22
default-allow-icmp     0.0.0.0/0   icmp
default-allow-internal 10.128.0.0/9  all   (VPC internal)
```

### 1.5 Rollback（萬一 IAP 壞了要補回來）

```bash
gcloud compute firewall-rules create default-allow-ssh \
  --network=default --direction=INGRESS --priority=65534 \
  --source-ranges=0.0.0.0/0 --rules=tcp:22
```

---

## 2. Day 2a — Secret Manager + IAM + .env 重整

**目標**：秘密搬到 GCP Secret Manager、DB 改用 application-level user、VM SA 權限收斂。不重啟服務（0 downtime）。

### 2.1 VM Service Account IAM 調整（Cloud Shell）

在 Cloud Shell 執行（每行都是單行，**不要用反斜線續行**，Cloud Shell 會吃掉）：

```bash
gcloud projects add-iam-policy-binding crm-platform-479508 --member="serviceAccount:847295927552-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud projects remove-iam-policy-binding crm-platform-479508 --member="serviceAccount:847295927552-compute@developer.gserviceaccount.com" --role="roles/editor"
gcloud projects add-iam-policy-binding crm-platform-479508 --member="serviceAccount:847295927552-compute@developer.gserviceaccount.com" --role="roles/monitoring.metricWriter"
gcloud projects add-iam-policy-binding crm-platform-479508 --member="serviceAccount:847295927552-compute@developer.gserviceaccount.com" --role="roles/cloudtrace.agent"
```

**為什麼拔 `editor`**：預設 Compute Engine SA 有 `roles/editor`（project 等級寫入）。VM 被入侵等於整個 project 被接管。拔掉後只留 Secret Manager read + log/metric write，災害面縮到 VM 本機。

### 2.2 VM OAuth scope 改 `cloud-platform`（需停機 1-2 分鐘）

**關鍵坑**：`gcloud set-service-account --scopes=` 是**替換**不是**追加**，要完整清單重打；且 `cloud-platform.read-only` 對 Secret Manager **不夠**（Google 要求 full `cloud-platform`）。

```bash
gcloud compute instances stop gcp-vm-crm --zone=us-central1-a
gcloud compute instances set-service-account gcp-vm-crm --zone=us-central1-a --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/trace.append,https://www.googleapis.com/auth/cloud-platform
gcloud compute instances start gcp-vm-crm --zone=us-central1-a
```

VM 重啟後 systemd 會自動拉起 nginx / mysql / lili-backend / lili-linebot。若有 `npm run dev`（Vite）等手動起的 process 不會回來，要另外拉。

### 2.3 建 MySQL 應用層用戶 `lili_app`

**為什麼**：應用層不該用 `root`。limit blast radius：SQL injection 最壞情況只能動 `lili_hotel` schema。

```bash
# SSH 進 VM 後
openssl rand -base64 32 | tr -d '=+/\n' | head -c 32   # 產 32 字元無特殊符號密碼，記下
# 然後：
mysql -u root -p <<EOF
CREATE USER 'lili_app'@'localhost' IDENTIFIED BY '<剛產的密碼>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES
  ON lili_hotel.* TO 'lili_app'@'localhost';
ALTER USER 'lili_app'@'localhost' WITH MAX_USER_CONNECTIONS 50;
FLUSH PRIVILEGES;
EOF
```

**DDL 權限**（CREATE/ALTER/DROP/INDEX）是給 Alembic 用的。不要吝嗇否則 migration 會炸。

**root 密碼輪換**另外獨立做，不要一起改（避免影響運行中的連線池）。

### 2.4 Secret Manager — 建 10 個 `staging-*` secrets

```bash
# 建容器
for name in secret-key db-user db-pass openai-api-key \
            line-channel-access-token line-channel-secret \
            pms-secret booking-api-key booking-callback-api-key \
            fb-firm-password; do
  gcloud secrets create staging-$name --replication-policy=automatic 2>&1 | tail -1
done

# 填值 — 用 stdin 不留 bash history
echo -n "$(openssl rand -hex 32)" | gcloud secrets versions add staging-secret-key --data-file=-
echo -n "lili_app" | gcloud secrets versions add staging-db-user --data-file=-
echo -n "<剛產的 DB 密碼>" | gcloud secrets versions add staging-db-pass --data-file=-
echo -n "<真 OpenAI key>" | gcloud secrets versions add staging-openai-api-key --data-file=-
# LINE tokens — 走 Plan A（見章節 8.1）
echo -n "PLACEHOLDER_SEE_DB" | gcloud secrets versions add staging-line-channel-access-token --data-file=-
echo -n "PLACEHOLDER_SEE_DB" | gcloud secrets versions add staging-line-channel-secret --data-file=-
echo -n "<PMS secret>" | gcloud secrets versions add staging-pms-secret --data-file=-
echo -n "<booking API key>" | gcloud secrets versions add staging-booking-api-key --data-file=-
echo -n "<booking callback key>" | gcloud secrets versions add staging-booking-callback-api-key --data-file=-
echo -n "<FB firm password>" | gcloud secrets versions add staging-fb-firm-password --data-file=-
```

**OpenAI key 沒拿到也要建一個 marker**（例如 `NEEDS_REAL_VALUE_ROTATE_ME`）— config.py 把 `OPENAI_API_KEY` 宣告為 `str = ""`，空字串也能啟動，但程式實際呼叫會 401。

### 2.5 驗證 VM SA 能讀 Secret Manager（重要）

**坑**：你 shell 的 gcloud auth ≠ systemd 服務的 gcloud auth。service 是用 VM 附掛的 SA（metadata server）。驗證方法：

```bash
# env -i 清空用戶 creds，強迫 gcloud 走 metadata
env -i PATH=/snap/bin:/usr/bin:/bin HOME=/tmp gcloud secrets versions access latest --secret=staging-secret-key | wc -c
# 應回 64（SECRET_KEY 是 64 字元 hex）
```

失敗代表 IAM 或 scope 沒設對，回去章節 2.1 / 2.2 檢查。

### 2.6 建 entrypoint wrapper `deploy/gcp/load-secrets.sh`

**路徑**：repo 內 `deploy/gcp/load-secrets.sh`（commit 進 git，內容無秘密）。

```bash
cat > /home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh <<'EOF'
#!/bin/bash
set -eo pipefail
get() { gcloud secrets versions access latest --secret="staging-$1"; }
export SECRET_KEY=$(get secret-key)
export DB_USER=$(get db-user)
export DB_PASS=$(get db-pass)
export OPENAI_API_KEY=$(get openai-api-key)
export LINE_CHANNEL_ACCESS_TOKEN=$(get line-channel-access-token)
export LINE_CHANNEL_SECRET=$(get line-channel-secret)
export PMS_SECRET=$(get pms-secret)
export BOOKING_API_KEY=$(get booking-api-key)
export BOOKING_CALLBACK_API_KEY=$(get booking-callback-api-key)
export FB_FIRM_PASSWORD=$(get fb-firm-password)
exec "$@"
EOF
chmod +x /home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh
```

Prod 版只要把腳本中 `staging-` 改成 `prod-`（或抽參數用 `${ENV_PREFIX}`）。

### 2.7 重寫 `backend/.env`（非敏感值，權限 600）

```bash
cp /home/Company_Lili_Hotel/backend/.env /home/Company_Lili_Hotel/backend/.env.bak.$(date +%s)

cat > /home/Company_Lili_Hotel/backend/.env <<'EOF'
# Staging — 非敏感設定（敏感值由 load-secrets.sh 注入）
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=lili_hotel
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
DEFAULT_ROOM_IMAGE_URL=https://console.star-bit.io/uploads/default_room.png
PUBLIC_BASE=https://console.star-bit.io
ALLOWED_ORIGINS=https://console.star-bit.io
ENVIRONMENT=staging
DEBUG=False
LINE_APP_URL=http://localhost:3001
PMS_API_URL=https://www.booking-wise0.com.tw/hotel_conn/jsonRPN.php
PMS_ACCOUNT=STARBIT
PMS_HOTELCODE=ZH01
PMS_BOOKING_BASE_URL=https://www.booking-wise0.com.tw/Zhida/hotel/checkout/reservation_cart.php/checkout
BOOKING_API_URL=https://www.booking-wise0.com.tw/hotel_conn/starbituse.php
BOOKING_HOTEL_CODE=zhida
BOOKING_HOTEL_ID=101
EOF
```

### 2.8 建 `line_app/.env`

```bash
cat > /home/Company_Lili_Hotel/line_app/.env <<'EOF'
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=lili_hotel
PUBLIC_BASE=https://console.star-bit.io
PUBLIC_ASSET_BASE=https://console.star-bit.io
LIFF_ID=
LIFF_ID_OPEN=
DEFAULT_LIFF_ID=
AUTO_BACKFILL_FRIENDS=1
BACKEND_API_URL=http://localhost:8700
EOF
```

### 2.9 .env 權限 600

```bash
chmod 600 /home/Company_Lili_Hotel/backend/.env /home/Company_Lili_Hotel/line_app/.env
chown creative_design:creative_design /home/Company_Lili_Hotel/backend/.env /home/Company_Lili_Hotel/line_app/.env
```

### 2.10 改 systemd unit（但不 restart）

**兩個 unit 的改動要點**：
- `ExecStart` 前面包一層 `/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh`
- `PATH` 加 `/snap/bin`（gcloud 所在）
- `lili-linebot.service` 的 `EnvironmentFile` 要指 `line_app/.env`（原本錯指 backend 的）

```bash
sudo cp /etc/systemd/system/lili-backend.service /etc/systemd/system/lili-backend.service.bak.$(date +%s)
sudo cp /etc/systemd/system/lili-linebot.service /etc/systemd/system/lili-linebot.service.bak.$(date +%s)

sudo tee /etc/systemd/system/lili-backend.service > /dev/null <<'EOF'
[Unit]
Description=Lili Hotel CRM Backend (FastAPI)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=creative_design
Group=creative_design
WorkingDirectory=/home/Company_Lili_Hotel/backend
EnvironmentFile=/home/Company_Lili_Hotel/backend/.env
Environment=PATH=/snap/bin:/home/creative_design/miniconda3/bin:/usr/local/bin:/usr/bin
ExecStart=/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/uvicorn app.main:app --host 0.0.0.0 --port 8700
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# linebot 先保留 werkzeug（Day 2c 再換 gunicorn）
sudo tee /etc/systemd/system/lili-linebot.service > /dev/null <<'EOF'
[Unit]
Description=Lili Hotel LINE Bot (Flask)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=creative_design
Group=creative_design
WorkingDirectory=/home/Company_Lili_Hotel/line_app
EnvironmentFile=/home/Company_Lili_Hotel/line_app/.env
Environment=PATH=/snap/bin:/home/creative_design/miniconda3/bin:/usr/local/bin:/usr/bin
ExecStart=/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/python3 app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
# ⚠️ 這一步不 restart — Day 2c 完整版重啟會一次套用所有變更
```

### 2.11 .gitignore 補強

```
*.env.bak
.env.bak.*
.env.bak
```

避免 `.env.bak.<timestamp>` 誤 commit 洩密。

### 2.12 驗證（乾跑）

```bash
sudo -u creative_design env -i PATH=/snap/bin:/usr/bin:/bin HOME=/home/creative_design \
  /home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh env | \
  grep -cE '^(SECRET_KEY|DB_USER|DB_PASS|OPENAI_API_KEY|LINE_CHANNEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET|PMS_SECRET|BOOKING_API_KEY|BOOKING_CALLBACK_API_KEY|FB_FIRM_PASSWORD)='
# 預期輸出 10
```

### 2.13 Rollback（萬一）

```bash
# 還原 .env
cp /home/Company_Lili_Hotel/backend/.env.bak.<ts> /home/Company_Lili_Hotel/backend/.env
# 還原 systemd unit
sudo cp /etc/systemd/system/lili-backend.service.bak.<ts> /etc/systemd/system/lili-backend.service
sudo cp /etc/systemd/system/lili-linebot.service.bak.<ts> /etc/systemd/system/lili-linebot.service
sudo systemctl daemon-reload
```

---

## 3. Day 2c — 完整版（後端硬化 + 前端切靜態）

**目標**：backend 和 linebot 改 production-grade（listen 127.0.0.1、gunicorn、nginx 多 location）+ 前端切靜態 build + 拔 Vite dev。**兩個階段、兩次小 downtime**。

> **歷史**：原本分成「3a 後端硬化（不碰前端）」和「3b 前端切換（待 FB 部門 ready）」。後者於 2026-04-28 完成（精簡版方案 C：FB firm_login 改後端代理，前端 bundle 不再有密碼）。本章節已合併為完整版。

### 3.1 安裝 gunicorn 到 miniconda

```bash
/home/creative_design/miniconda3/bin/pip install gunicorn
```

### 3.2 建 uploads 目錄

```bash
mkdir -p /home/Company_Lili_Hotel/backend/public/uploads
chown creative_design:creative_design /home/Company_Lili_Hotel/backend/public/uploads
```

### 3.3 改寫 nginx config

**坑**：`/etc/nginx/sites-enabled/*` 是 glob，備份檔名 `.bak.<ts>` 也會被 include 導致 `conflicting server name` warning。備份要放**其他目錄**。

```bash
sudo mkdir -p /etc/nginx/backups
sudo cp /etc/nginx/sites-enabled/lili-hotel /etc/nginx/backups/lili-hotel.bak.$(date +%s)

sudo tee /etc/nginx/sites-enabled/lili-hotel > /dev/null <<'EOF'
server {
    server_name console.star-bit.io;
    client_max_body_size 20M;

    # /api/v1/sse/ 必須在 /api/ 前面（nginx prefix match 最長優先）
    location /api/v1/sse/ {
        proxy_pass http://127.0.0.1:8700;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        chunked_transfer_encoding off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8700;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /callback/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /liff/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /home/Company_Lili_Hotel/backend/public/uploads/;
    }

    # 前端 hashed assets（檔名含 content hash，可永久 cache）
    location /assets/ {
        root /home/Company_Lili_Hotel/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 前端（靜態 build，SPA fallback 到 index.html）
    location / {
        root /home/Company_Lili_Hotel/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/console.star-bit.io/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/console.star-bit.io/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = console.star-bit.io) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name console.star-bit.io;
    return 404; # managed by Certbot
}
EOF

sudo nginx -t
```

**保留 certbot 的 `# managed by Certbot` comment markers**，不然下次 `certbot renew` 會認不出 SSL 區塊。

### 3.4 改 systemd unit（最終版）

```bash
sudo tee /etc/systemd/system/lili-backend.service > /dev/null <<'EOF'
[Unit]
Description=Lili Hotel CRM Backend (FastAPI)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=creative_design
Group=creative_design
WorkingDirectory=/home/Company_Lili_Hotel/backend
EnvironmentFile=/home/Company_Lili_Hotel/backend/.env
Environment=PATH=/snap/bin:/home/creative_design/miniconda3/bin:/usr/local/bin:/usr/bin
ExecStart=/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/uvicorn app.main:app --host 127.0.0.1 --port 8700 --workers 2 --proxy-headers --forwarded-allow-ips=127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/lili-linebot.service > /dev/null <<'EOF'
[Unit]
Description=Lili Hotel LINE Bot (Flask via gunicorn)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=creative_design
Group=creative_design
WorkingDirectory=/home/Company_Lili_Hotel/line_app
EnvironmentFile=/home/Company_Lili_Hotel/line_app/.env
Environment=PATH=/snap/bin:/home/creative_design/miniconda3/bin:/usr/local/bin:/usr/bin
ExecStart=/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/gunicorn -w 2 -b 127.0.0.1:3001 app:app --access-logfile - --error-logfile -
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### 3.5 套用（downtime 視窗）

```bash
sudo systemctl daemon-reload
sudo systemctl restart lili-backend lili-linebot
sudo systemctl reload nginx
```

### 3.6 驗證

```bash
# 等服務起來（load-secrets.sh 要打 10 次 gcloud API，約 10-15 秒）
sleep 15

ss -tlnp | grep -E ':(8700|3001|5173)\s'
# 預期：
# 127.0.0.1:8700 uvicorn
# 127.0.0.1:3001 gunicorn
# 0.0.0.0:5173   vite (保留中)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8700/api/v1/docs     # 200
curl -sS -o /dev/null -w "%{http_code}\n" https://console.star-bit.io/           # 200 (Vite)
curl -sS -o /dev/null -w "%{http_code}\n" https://console.star-bit.io/api/v1/docs  # 200 (直接 proxy 到 backend)
```

### 3.7 Rollback

```bash
sudo cp /etc/systemd/system/lili-backend.service.bak.<ts> /etc/systemd/system/lili-backend.service
sudo cp /etc/systemd/system/lili-linebot.service.bak.<ts> /etc/systemd/system/lili-linebot.service
sudo cp /etc/nginx/backups/lili-hotel.bak.<ts> /etc/nginx/sites-enabled/lili-hotel
sudo systemctl daemon-reload
sudo systemctl restart lili-backend lili-linebot
sudo systemctl reload nginx
```

---

## 4. Alembic 重接 — DB schema 版本化

**目標**：讓這台 VM 的 DB 能接上 repo 裡的 Alembic migration 歷史，補上遺漏的 migration。

### 4.1 修 `alembic.ini` 讓它讀 `.env`

```bash
sed -i 's|^sqlalchemy.url = .*|sqlalchemy.url =|' /home/Company_Lili_Hotel/backend/alembic.ini
```

清空後，`migrations/env.py` 會 fallback 到 `settings.DATABASE_URL`（從 `.env` + load-secrets.sh 組成）。

### 4.2 確認 DB 目前在哪個 migration 版本

```bash
cd /home/Company_Lili_Hotel/backend
/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/alembic current
# 回空 = 還沒 stamp 過
```

**DB 如果是 `create_all()` 建的，schema 會對應到某個 migration 狀態**。判斷方法：看 model 有/沒某欄位 vs migration 檔的 upgrade() 內容，找出 DB schema 吻合的那支 migration。

本 staging 案例：DB 正好停在 `4009e0d8db4f`（missing 後續 3 支 migration）。

### 4.3 stamp + upgrade head

```bash
cd /home/Company_Lili_Hotel/backend
# 告訴 Alembic DB 目前狀態
/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/alembic stamp <找到的版本>

# 跑該版本之後所有 migration
/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/alembic upgrade head

# 驗證
/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh /home/creative_design/miniconda3/bin/alembic current
# 應回 <head revision> (head)
```

### 4.4 往後的 schema 變更流程

```
開發者在 dev 環境：
1. 改 model
2. alembic revision --autogenerate -m "xxx"
3. alembic upgrade head (套用到 dev DB)
4. 在 dev 測試
5. commit migration 檔 + push

Staging / prod 部署：
git pull
alembic upgrade head   # 自動套新 migration
systemctl restart lili-backend lili-linebot
```

### 4.5 Rollback

```bash
alembic downgrade <舊版本>
# 或全部倒回
mysql -u root -e "DROP TABLE alembic_version;" lili_hotel
# 然後手動還原 schema 變動
```

---

## 5. 完整驗證

### 5.1 ports

```bash
ss -tlnp | grep -E ':(8700|3001|5173|3306|443|80)\s'
```

**預期**：
- `0.0.0.0:80` nginx
- `0.0.0.0:443` nginx
- `127.0.0.1:3001` gunicorn (linebot)
- `127.0.0.1:3306` mysqld
- `127.0.0.1:8700` uvicorn (backend)
- `0.0.0.0:5173` vite (暫留)

### 5.2 endpoints

```bash
curl -sI https://<domain>/                      # 200 (Vite)
curl -sI https://<domain>/api/v1/docs            # 200 (backend)
curl -sI https://<domain>/callback/              # 404 (linebot，路徑是動態的)
timeout 3 curl -sI https://<domain>/api/v1/sse/chat/1   # 連線保持（SSE）
```

### 5.3 services

```bash
systemctl is-active lili-backend lili-linebot nginx mysql
# 全部 active
```

### 5.4 logs（確認沒 traceback）

```bash
journalctl -u lili-backend -n 50 --no-pager
journalctl -u lili-linebot -n 50 --no-pager
```

預期看到 `Application startup complete`、`Listening at: http://127.0.0.1:3001` 等。

---

## 6. 環境差異：staging → prod

複製這份 playbook 部署 prod 時，做以下替換：

| 項目 | staging | prod |
|---|---|---|
| Secret 前綴 | `staging-*` | `prod-*` |
| VM 名 | `gcp-vm-crm` | 新 prod VM 名 |
| 網域 | `console.star-bit.io` | `console-prod.star-bit.io`（範例） |
| `backend/.env` 的 `PUBLIC_BASE` / `ALLOWED_ORIGINS` | staging 域名 | prod 域名 |
| `backend/.env` 的 `ENVIRONMENT` | `staging` | `production` |
| `line_app/.env` 的 `PUBLIC_BASE` / `PUBLIC_ASSET_BASE` | staging 域名 | prod 域名 |
| DB name | 可同 `lili_hotel`（分 VM 分 DB）或 `lili_hotel_prod` | 視設計 |
| LINE Developers Console webhook URL | 改 staging 域名 | 改 prod 域名 |

**`load-secrets.sh` 可以設計成讀 `$ENV_PREFIX`**（staging / prod），systemd unit 傳不同 env 進去即可共用腳本。

**絕不共用的 secrets**：`staging-*` 和 `prod-*` 的值要完全分開（SECRET_KEY、DB_PASS、FB 密碼等），不要從 staging 複製。

---

## 7. 常見陷阱

| 陷阱 | 怎麼避免 |
|---|---|
| Cloud Shell 的反斜線續行 `\` 被吃掉 | 每條 gcloud 指令**寫成單行長字串**，不用續行 |
| `gcloud set-service-account --scopes=X` 是替換不是追加 | 完整清單重打；本文件章節 2.2 有完整 scope list |
| `cloud-platform.read-only` scope 讀不了 Secret Manager | 用 full `cloud-platform` |
| IAM role 有給但 scope 沒給 → PERMISSION_DENIED | 兩者都要對。`env -i HOME=/tmp gcloud ...` 驗證 |
| nginx `sites-enabled/*` 會 include 備份檔 | 備份放 `/etc/nginx/backups/` 不要放 `sites-enabled/` 裡 |
| certbot 的 `# managed by Certbot` comment 被刪 | 下次 renew 認不出區塊，手動加回或 `certbot --nginx` 重配 |
| VM 重啟後 `npm run dev` 不會自動回來 | 手動啟動 `nohup npm run dev --host 0.0.0.0 --port 5173 > /tmp/vite-dev.log 2>&1 &`（**擱置解除後應改為 build + nginx static**） |
| Alembic upgrade 從 base 跑 → 撞已存在的表 | 先 `alembic stamp <對應版本>` 再 upgrade |
| systemd `EnvironmentFile=` 不執行 shell 腳本 | 秘密要用 ExecStart wrapper (load-secrets.sh) 注入 |
| `echo "secret" \| ...` 會留 bash history | 用 `gcloud secrets versions add --data-file=-` 然後貼 + Ctrl+D |
| Workflow 加 `set -e` 後，原本「靜默失敗」的步驟突然變成爆炸 | 加 `set -e` 前要先逐步審視 script，確認每行都會在新環境正常 exit 0；尤其 `alembic upgrade head` 連不到 DB 會卡到 timeout |
| `gcloud compute firewall-rules create` 用 `--allow` 不是 `--rules` | `--allow=tcp:22` 才對；`--rules` 是別的命令的參數 |
| `systemctl reload nginx` 偶爾沒立即生效 | 改用 `nginx -s reload` 直接送 SIGHUP 給 master process，比 systemd wrapper 快 |
| `alembic stamp <ver>` + DB 是 `create_all()` 建的 → 中間 migration 被跳過 | stamp 假設「DB schema = 該版本 migration 的累積結果」，但 create_all() 是從**當前 model** 建。任一 migration 加了 column 但 model 沒同步 → 那欄位永遠不存在，stamp 完跑 upgrade head 也跳過。**症狀**：跑 SQL 撞 `Unknown column`。**修法**：手動 ALTER TABLE 補欄位 |
| 前端 build 路徑跟 nginx alias 不一致 | backend `config.py` 寫死 `project_root/backend/public/<UPLOAD_DIR>`，所以 nginx alias 必須是 `/home/.../backend/public/uploads/`，不是 `/home/.../backend/uploads/` |
| Vite dev 對未知路徑回 SPA fallback (200) | bot 掃 `/.env` 會看到 200，但**內容是 React index.html**，不是真 .env。**不算洩漏**，但容易誤判 |

---

## 8. 已知項目

### 8.1 LINE tokens 走 Plan A（Secret Manager 只放 marker）

**現況**：`integrations/line_api.py` 和 `booking_callback.py` 直接讀 `settings.LINE_CHANNEL_*`。這違反 multi-tenant 設計（LINE channel tokens 應從 DB `line_channels` 表讀）。

**短期 workaround**：Secret Manager 的 `staging-line-channel-access-token` / `staging-line-channel-secret` 填 `PLACEHOLDER_SEE_DB`。`config.py` 把這兩個宣告為 required，要有值否則啟動失敗；給 marker 滿足啟動，實際多租戶功能走 DB。副作用：`integrations/line_api.py` 初始化的 default Configuration 是假的，那兩個檔案的呼叫會 401（可接受，實際 LINE API 呼叫應該走 multi-tenant 路徑）。

**長期**：refactor 掉 `settings.LINE_CHANNEL_*` 的使用，降 required 為 optional。

### 8.2 FB 整合的後端代理 firm_login（精簡版方案 C，2026-04-28 完成）

**現況**：
- Backend `/api/v1/admin/fb-firm-login` 由後端用 `settings.FB_FIRM_PASSWORD` 代打 `api-youth-tycg/firm_login`
- 前端（`BasicSettings.tsx`）改打自家 backend，不再帶 credential
- `frontend/.env.production` 已拿掉 `VITE_FB_FIRM_PASSWORD`
- Bundle 完全沒有 `123456` / `tycg-admin`

**為什麼可以做了（不用等對方）**：對方部門已確認 `firm_login` API 不會變動，所以這個代理不會白寫。

**仍由前端直打 api-youth-tycg 的端點**（這些 endpoint 都帶 JWT，不再帶密碼，可接受）：
- `/api/v1/admin/meta_page/*`（FB Page 操作）
- `/api/v1/admin/meta_page/message/*`（訊息）
- `/api/v1/admin/meta_page/customer/*`（客戶 / tag）

**未來如要也走後端代理**，照同樣 pattern：在 backend 加 endpoint、frontend 改打 backend、拔掉前端原本的 fbApiBaseUrl。但目前不急（沒密碼洩漏）。

### 8.3 已知 code bugs（非 deploy 問題）

✅ **已修復（commit `6875788c`，2026-04-24）**：`admin_meta_user.py:168` 的 `member.channel_id` → `member.line_channel_id`

✅ **已修復（commit `a5ccc7a6`，2026-04-22）**：`/api/v1/analytics/time-slot-insights` route 已實作於 `analytics.py:489`

### 8.4 Schema drift — Member model 未跟上 migration

**現況**：Migration `fa40436b732e_add_is_following_to_members_and_sync_.py` 加了 `members.is_following` 欄位、`line_app/app.py` 群發 SQL 也用，**但 `Member` model 沒同步定義這個欄位**。

**衝擊**：
- `create_all()` 建出的 DB 沒這欄位（因為 model 不知道）
- 跑 `alembic upgrade head` 時若 stamp 過了 fa40436b732e，這支 migration 被跳過 → DB 永遠缺欄位
- 結果：群發 SQL 撞 `Unknown column 'is_following'`

**workaround（已套用 staging）**：手動 `ALTER TABLE members ADD COLUMN is_following ...`

**長期修**：把 `is_following = Column(Boolean, default=True, ...)` 加進 `backend/app/models/member.py` Member class。同時搜整個 `migrations/versions/` 還有沒有類似漏掉的欄位。

---

## 9. 待辦

| 項目 | 優先級 | 說明 |
|---|---|---|
| Member model 補 `is_following`（+全面 drift audit） | 🔴 高 | 見 8.4。建議跑 `alembic check` 或 autogenerate diff，找出全部 model 漏定義的欄位 |
| MySQL timezone | 🟡 中 | UTC → Asia/Taipei（`SET GLOBAL time_zone='+08:00'` + mysqld.cnf）。**注意**：dev 早先用「前端 +8 hr」workaround 對齊台灣時間；如改 DB timezone 要同步審視程式碼，避免雙重偏移 |
| LINE webhook URL 對齊（staging 子網域） | 🟡 中 | dev / staging / prod 規劃為三個子網域，需個別產生 LINE channel + webhook。需先確認對方 channel_id 是否已 staging 專用 |
| systemd unit + nginx config 入 repo | 🟡 中 | 目前只存 `/etc/`，新環境無法照抄。應做成 template 存 `deploy/gcp/` |
| MySQL root 密碼輪換 | 🟢 低 | 應用已改用 `lili_app`，root 可獨立輪換 |
| CI/CD 升級到 self-hosted runner 或 IAP+WIF | 🟢 低 | 見章節 11；現用傳統 SSH 對 staging 夠，prod 上線前再升級 |
| 舊 DB 資料遷移 | 🟢 低 | **使用者已決定不遷移**，staging 從零開始（2026-04-28 確認） |
| 其他 FB endpoints 後端代理化 | 🟢 低 | 見 8.2。目前其他 FB 呼叫帶 JWT 不帶密碼，可接受 |

---

## 10. 檔案結構

```
/home/Company_Lili_Hotel/
├── deploy/gcp/
│   ├── load-secrets.sh          # entrypoint wrapper，commit 進 git（不含秘密值）
│   └── DEPLOY_PLAYBOOK.md       # 本文件
├── backend/
│   ├── .env                     # 非敏感設定，chmod 600，gitignore
│   ├── alembic.ini              # sqlalchemy.url 清空，讀 .env
│   └── public/uploads/          # 上傳檔案實體位置（backend 寫入；nginx alias 讀取），gitignore
└── line_app/
    └── .env                     # 非敏感設定，chmod 600，gitignore

/etc/systemd/system/
├── lili-backend.service         # ExecStart 包 load-secrets.sh
└── lili-linebot.service         # ExecStart 包 load-secrets.sh

/etc/nginx/
├── sites-enabled/lili-hotel     # 多 location 配置
└── backups/                     # nginx config 歷史備份（不放 sites-enabled 避免 include）

GCP Secret Manager (staging-*):
├── staging-secret-key           # JWT HS256 金鑰
├── staging-db-user              # lili_app
├── staging-db-pass              # 32 字元隨機
├── staging-openai-api-key       # sk-proj-...
├── staging-line-channel-access-token    # PLACEHOLDER_SEE_DB (Plan A)
├── staging-line-channel-secret          # PLACEHOLDER_SEE_DB (Plan A)
├── staging-pms-secret
├── staging-booking-api-key
├── staging-booking-callback-api-key
└── staging-fb-firm-password
```

---

## 11. CI/CD 設定

### 11.1 當前方案：傳統 SSH（appleboy/ssh-action）

`.github/workflows/deploy.yml` 在 push 到 `main` 時觸發 `deploy-staging` job：

```
GitHub Actions runner (在 AWS)
  → 透過 SSH (port 22) 連 VM
  → cd /home/Company_Lili_Hotel
  → cp frontend/.env.production /tmp/...   (備份本地 override)
  → git stash + git pull origin main + git stash pop
  → cp /tmp/... back                         (還原本地 override)
  → cd backend && pip install -r requirements.txt -q
  → load-secrets.sh alembic upgrade head     ← 必須包 load-secrets.sh
  → cd frontend && npm install && npm run build
  → sudo systemctl restart lili-backend lili-linebot
  → curl /health 自我檢查
```

`prod` 分支 push 觸發 `deploy-prod` job，邏輯一致但 secrets 用 `PROD_*` 前綴。

### 11.2 GitHub Actions secrets（repo 級）

**在 GitHub Settings → Secrets and variables → Actions**：

| Secret 名 | 內容 | 用途 |
|---|---|---|
| `VM_HOST` | staging VM 的 public IP 或 DNS | SSH 連線目標 |
| `VM_USER` | `creative_design`（建議） | SSH 帳號 |
| `SSH_PRIVATE_KEY` | OpenSSH 私鑰，搭配 VM 上 `~/.ssh/authorized_keys` 的對應公鑰 | SSH 認證 |
| `PROD_VM_HOST` | prod VM 的 public IP 或 DNS | 同上，prod 用 |
| `PROD_VM_USER` | prod 上的 deploy user | |
| `PROD_SSH_PRIVATE_KEY` | prod 用私鑰 | |

### 11.3 前置條件

- VM port 22 對 0.0.0.0/0 開放（章節 1.5 的 rollback 範例就是再開這個 rule）
- VM 上裝了 fail2ban 擋 SSH 暴力破解（`apt install fail2ban`）
- `creative_design` user 有 NOPASSWD sudo 權限（讓 CI 能 `sudo systemctl restart`）
- `creative_design` 的 `~/.ssh/authorized_keys` 含 `SSH_PRIVATE_KEY` 的對應公鑰
- `deploy/gcp/load-secrets.sh` 存在且可執行（章節 2.6）

### 11.4 安全 trade-off

開放 port 22 給全公網是這個方案的**主要代價**：
- 每天會被 bot 掃 SSH brute force（log 看得到）
- 靠 fail2ban + key-only auth + 強密碼/passphrase 防護
- 適合 **staging（流量低、單人使用）**

**Prod 上線前**強烈建議升級到：
- **方案 A**：Self-hosted runner（在 VM 上裝 GitHub Actions runner，runner 主動連 GitHub，不用開 port 22）
- **方案 B**：Workload Identity Federation + IAP tunnel（GitHub 用 OIDC 認證成 GCP SA，走 IAP 連 VM）

（兩個方案的詳細評估、流程比較見內部文件 / Slack 討論記錄）

### 11.5 Rollback / 緊急停 CI

**完全停掉 CI**：把 deploy.yml 改名為 deploy.yml.disabled，或編輯 `on: push:` 段移除 `main`：

```yaml
on:
  push:
    branches: [prod]   # 把 main 拿掉
```

push 後 GitHub 不會再觸發 staging deploy。

**只關特定 push**：commit message 加 `[skip ci]` 字串，GitHub Actions 預設會跳過。

**回到手動部署**：把 port 22 對外關閉（刪 `default-allow-ssh`），CI 會 SSH timeout 失敗。手動進 VM 跑 `git pull + alembic upgrade + systemctl restart`。

### 11.6 常見 CI 失敗排查

| 症狀 | 看哪 | 可能原因 |
|---|---|---|
| `dial tcp ***:22: i/o timeout`（37s 後失敗） | Run log | port 22 沒開、firewall 擋住 |
| `Permission denied (publickey)` | Run log | SSH key 不匹配 / authorized_keys 沒這把 key |
| `alembic upgrade head` 噴 ValidationError | Run log 較深處 | workflow 沒包 load-secrets.sh / DB_USER 拿不到 |
| `npm run build` 失敗 | Run log | 前端 syntax error / 依賴衝突 / Node 版本不對 |
| `sudo: a password is required` | Run log | NOPASSWD 沒設好；`/etc/sudoers.d/` 補 |
| Health check 失敗（Backend FAIL） | Run log + VM `journalctl -u lili-backend` | backend 啟動爆，看 traceback |

---

_最後更新：2026-04-28_
_涵蓋：Day 1（firewall 止血）、Day 2a（Secret Manager + IAM + .env）、Day 2c 完整版（gunicorn + listen 127.0.0.1 + nginx + 前端切靜態 + Vite dev 拔除 + FB firm_login 後端代理）、Alembic 重接、CI/CD 復活_
