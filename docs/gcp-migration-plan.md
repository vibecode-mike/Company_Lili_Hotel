# GCP 遷移計畫 — 力麗飯店 CRM 系統

## 目標

將現有系統從本機伺服器遷移至 GCP，以最低成本為優先，架構不變。

## 架構：單台 GCE VM

| 項目 | 規格 | 月費估算 |
|------|------|---------|
| GCE VM | e2-medium (2 vCPU, 4GB RAM) | ~$25 USD |
| 磁碟 | 50GB SSD | ~$5 USD |
| 靜態 IP | 1 個 | 免費（掛載到 VM 時） |
| **總計** | | **~$30 USD/月** |

### 系統架構（與現有相同）

```
GCE VM (Ubuntu 22.04)
├── Nginx (port 80/443)
│   ├── / → frontend 靜態檔（npm run build 產出）
│   ├── /api → backend (FastAPI :8700)
│   └── /callback → line_app (Flask :3001)
├── MySQL 8.0（本機安裝）
├── Backend — FastAPI + uvicorn (:8700)
├── LINE App — Flask (:3001)
└── SSL — Let's Encrypt (certbot)
```

---

## Phase 1：GCP 準備

- [ ] 1.1 建立 GCP 專案，啟用 Compute Engine API
- [ ] 1.2 建立 GCE VM
  - 機型：`e2-medium`（2 vCPU, 4GB RAM）
  - 系統：Ubuntu 22.04 LTS
  - 磁碟：50GB SSD
  - 區域：`asia-east1`（台灣彰化）
- [ ] 1.3 設定防火牆規則
  - 允許 TCP: 80, 443（HTTP/HTTPS）
  - 允許 TCP: 22（SSH）
  - 3001 不需對外開放（nginx proxy）
- [ ] 1.4 綁定靜態外部 IP

## Phase 2：環境安裝

- [ ] 2.1 系統更新 + 基礎套件
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y build-essential git curl wget software-properties-common
  ```
- [ ] 2.2 安裝 Python 3.11
  ```bash
  sudo add-apt-repository ppa:deadsnakes/ppa -y
  sudo apt install -y python3.11 python3.11-venv python3.11-dev
  ```
- [ ] 2.3 安裝 Node.js 22
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- [ ] 2.4 安裝 MySQL 8.0
  ```bash
  sudo apt install -y mysql-server
  sudo mysql_secure_installation
  ```
- [ ] 2.5 建立資料庫和使用者
  ```sql
  CREATE DATABASE lili_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'lili'@'localhost' IDENTIFIED BY '<密碼>';
  GRANT ALL PRIVILEGES ON lili_hotel.* TO 'lili'@'localhost';
  FLUSH PRIVILEGES;
  ```
- [ ] 2.6 安裝 Nginx
  ```bash
  sudo apt install -y nginx
  ```
- [ ] 2.7 安裝 Certbot（SSL）
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  ```

## Phase 3：資料遷移

- [ ] 3.1 舊機匯出資料庫
  ```bash
  # 在舊機執行
  mysqldump -u root lili_hotel > lili_hotel_dump.sql
  ```
- [ ] 3.2 傳輸到新 VM
  ```bash
  scp lili_hotel_dump.sql user@<GCE_IP>:~/
  ```
- [ ] 3.3 新 VM 匯入資料庫
  ```bash
  mysql -u lili -p lili_hotel < ~/lili_hotel_dump.sql
  ```
- [ ] 3.4 驗證資料筆數
  ```bash
  mysql -u lili -p -e "SELECT COUNT(*) FROM lili_hotel.members;"
  ```

## Phase 4：部署程式碼

- [ ] 4.1 Clone 專案
  ```bash
  cd /data2
  git clone https://github.com/vibecode-mike/Company_Lili_Hotel.git lili_hotel
  cd lili_hotel
  git checkout multichannel
  ```
- [ ] 4.2 Backend 設定
  ```bash
  cd /data2/lili_hotel
  python3.11 -m venv venv
  source venv/bin/activate
  pip install -r backend/requirements.txt
  ```
- [ ] 4.3 複製並修改 .env
  ```bash
  # 從舊機複製
  scp user@<舊機IP>:/data2/lili_hotel/backend/.env /data2/lili_hotel/backend/.env
  scp user@<舊機IP>:/data2/lili_hotel/line_app/.env /data2/lili_hotel/line_app/.env

  # 修改 DATABASE_URL 為本機 MySQL
  # DATABASE_URL=mysql+aiomysql://lili:<密碼>@localhost:3306/lili_hotel
  ```
- [ ] 4.4 執行 Migration
  ```bash
  cd /data2/lili_hotel/backend
  alembic upgrade head
  ```
- [ ] 4.5 Frontend 打包
  ```bash
  cd /data2/lili_hotel/frontend
  npm install
  npm run build
  # 產出在 /data2/lili_hotel/frontend/build/
  ```
- [ ] 4.6 複製知識庫檔案
  ```bash
  scp -r user@<舊機IP>:/data2/lili_hotel/backend/kb /data2/lili_hotel/backend/kb
  ```

## Phase 5：設定 Systemd 服務

- [ ] 5.1 Backend 服務 `/etc/systemd/system/lili_backend.service`
  ```ini
  [Unit]
  Description=Lili Hotel Backend (FastAPI)
  After=network.target mysql.service

  [Service]
  User=root
  WorkingDirectory=/data2/lili_hotel/backend
  Environment=PATH=/data2/lili_hotel/venv/bin
  ExecStart=/data2/lili_hotel/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8700
  Restart=always
  RestartSec=5

  [Install]
  WantedBy=multi-user.target
  ```
- [ ] 5.2 LINE App 服務 `/etc/systemd/system/lili_lineapp.service`
  ```ini
  [Unit]
  Description=Lili Hotel LINE App (Flask)
  After=network.target mysql.service

  [Service]
  User=root
  WorkingDirectory=/data2/lili_hotel
  ExecStart=/data2/lili_hotel/venv/bin/python line_app/app.py
  Restart=always
  RestartSec=5

  [Install]
  WantedBy=multi-user.target
  ```
- [ ] 5.3 啟用服務
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable lili_backend lili_lineapp
  sudo systemctl start lili_backend lili_lineapp
  ```
- [ ] 5.4 確認服務運行
  ```bash
  sudo systemctl status lili_backend lili_lineapp
  curl http://localhost:8700/api/v1/docs
  curl http://localhost:3001/
  ```

## Phase 6：Nginx + SSL

- [ ] 6.1 Nginx 設定 `/etc/nginx/sites-available/lili_hotel`
  ```nginx
  server {
      listen 80;
      server_name crmpoc.star-bit.io;

      # Frontend 靜態檔
      location / {
          root /data2/lili_hotel/frontend/build;
          try_files $uri $uri/ /index.html;
      }

      # Backend API
      location /api/ {
          proxy_pass http://127.0.0.1:8700;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }

      # SSE（聊天即時通知）
      location /api/v1/sse/ {
          proxy_pass http://127.0.0.1:8700;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_http_version 1.1;
          proxy_set_header Connection "";
          proxy_buffering off;
          proxy_cache off;
          proxy_read_timeout 86400s;
      }

      # LINE Webhook
      location /callback {
          proxy_pass http://127.0.0.1:3001;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```
- [ ] 6.2 啟用 Nginx 設定
  ```bash
  sudo ln -s /etc/nginx/sites-available/lili_hotel /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx
  ```
- [ ] 6.3 申請 SSL 憑證
  ```bash
  sudo certbot --nginx -d crmpoc.star-bit.io
  ```

## Phase 7：DNS + LINE 設定

- [ ] 7.1 更新 DNS A 記錄
  - `crmpoc.star-bit.io` → 新 GCE 靜態 IP
  - `linebot.star-bit.io` → 新 GCE 靜態 IP（如果不同 domain）
- [ ] 7.2 等待 DNS 生效（通常 5-30 分鐘）
- [ ] 7.3 確認 LINE Developers Console
  - Webhook URL 使用 domain 則不需修改
  - 如果有寫死 IP，需更新為新 IP

## Phase 8：驗證

- [ ] 8.1 CRM 後台登入正常
- [ ] 8.2 會員列表載入正常
- [ ] 8.3 會員聊天室正常（含 SSE 即時通知）
- [ ] 8.4 AI Chatbot 測試頁面正常（含房卡顯示）
- [ ] 8.5 LINE 收發訊息正常
- [ ] 8.6 LINE 房卡 Flex Message 正常
- [ ] 8.7 自動回應功能正常
- [ ] 8.8 群發訊息功能正常

## Phase 9：收尾

- [ ] 9.1 設定自動備份（MySQL + crontab）
  ```bash
  # /etc/cron.daily/backup-mysql
  mysqldump -u lili -p<密碼> lili_hotel | gzip > /backup/lili_hotel_$(date +%Y%m%d).sql.gz
  find /backup -name "*.sql.gz" -mtime +7 -delete
  ```
- [ ] 9.2 設定 swap（4GB RAM 可能不夠）
  ```bash
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
- [ ] 9.3 確認舊機可以停機
- [ ] 9.4 舊機保留 7 天後關閉

---

## 預估時間

| Phase | 預估 |
|-------|------|
| 1-2 GCP + 環境 | 1-2 小時 |
| 3 資料遷移 | 30 分鐘 |
| 4-5 部署 + Systemd | 1-2 小時 |
| 6 Nginx + SSL | 30 分鐘 |
| 7 DNS | 5-30 分鐘 |
| 8 驗證 | 1 小時 |
| **合計** | **4-6 小時** |
