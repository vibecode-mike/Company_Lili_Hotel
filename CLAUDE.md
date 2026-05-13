# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

力麗飯店 LINE OA CRM 系統 - 多渠道會員管理與行銷平台，整合 LINE、Facebook Messenger 和 Webchat。

## Common Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8700

# Database migrations
alembic upgrade head                    # Apply migrations
alembic revision -m "desc"              # Create empty migration (手寫，禁用 autogenerate)
alembic check 2>&1 | tail -10           # 檢查是否有新增的 drift
alembic downgrade -1                    # Rollback

# Linting
black app/
isort app/
flake8 app/

# Testing
pytest
pytest --cov=app --cov-report=term-missing
```

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
```

### LINE App (Flask)
```bash
cd line_app
python app.py    # Starts on port 3001
```

### E2E Tests (Playwright)
```bash
npx playwright test tests/e2e
```

## Architecture

```
lili_hotel/
├── backend/                 # FastAPI backend (port 8700)
│   ├── app/
│   │   ├── api/v1/         # REST endpoints (auth, members, campaigns, tags, etc.)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas (<Entity>Schema naming)
│   │   ├── services/       # Business logic layer
│   │   ├── adapters/       # External service adapters (PMS, etc.)
│   │   └── websocket_manager.py  # Real-time chat SSE (replaced WebSocket)
│   └── migrations/         # Alembic migrations
│
├── frontend/               # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/     # UI components (PascalCase)
│   │   ├── contexts/       # React Context providers
│   │   ├── hooks/          # Custom hooks (camelCase)
│   │   ├── imports/        # Figma-generated components
│   │   ├── pages/          # Route pages
│   │   └── types/          # TypeScript definitions
│   └── build/              # Production bundles
│
├── line_app/               # LINE webhook handler (Flask, port 3001)
│   ├── app.py              # Main Flask app & webhook routes
│   └── manage_*.py         # LINE API management scripts
│
└── tests/e2e/              # Playwright E2E specs
```

## Key API Endpoints

- **Auth**: `/api/v1/auth/login`, `/api/v1/auth/me`
- **Members**: `/api/v1/members` (CRUD, tags, notes)
- **Campaigns**: `/api/v1/campaigns` (create, send, schedule)
- **Tags**: `/api/v1/tags` (member tags, interaction tags)
- **Auto-responses**: `/api/v1/auto-responses`
- **Chat**: `/api/v1/chat/messages`, SSE at `/api/v1/sse/chat/{thread_id}`
- **Analytics**: `/api/v1/analytics/overview`

API docs: http://localhost:8700/api/v1/docs

## Multi-Channel Architecture

The system supports LINE, Facebook, and Webchat through:
- `Member` model has `line_uid`, `fb_customer_id`, `webchat_uid` fields
- `ConversationThread` model tracks `platform` (line/facebook/webchat)
- `message_service.py` handles routing messages to appropriate channel APIs
- Facebook Messenger uses external API (`FB_API_URL`) for message sending and member sync

## Code Conventions

- **Python**: Black formatting, 120 columns, isort imports
- **Pydantic**: Name models `<Entity>Schema`
- **React/TS**: PascalCase components, camelCase hooks/utils
- **Commits**: Conventional Commits (`fix:`, `feat:`, `chore:`, `docs:`)

## Environment Variables

Backend `.env`:
- `DATABASE_URL` - MySQL connection string
- `SECRET_KEY` - JWT secret
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `FB_API_URL` - Facebook external API URL

Frontend:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_FB_API_URL` - Facebook external API URL

## Timezone Convention

- **MySQL server timezone = Asia/Taipei (UTC+8)**，`NOW()` 回傳臺灣時間
- **DB 中所有 naive datetime 都是臺灣時間**，不是 UTC
- 讀取 DB datetime 時：`dt.replace(tzinfo=TAIPEI_TZ)`，**不要**當 UTC 再轉換
- 外部 API 的 epoch timestamp（如 FB API）才是真正的 UTC，需用 `datetime.fromtimestamp(ts, tz=timezone.utc)`
- Base model 的 `_now_taipei()` 回傳不帶 tzinfo 的臺灣時間，與 MySQL `NOW()` 一致

## ⛔ 部署規則

- **預設推版只推到 `main` 分支**，不推到 `prod`
- **推到 `prod` 前必須詢問使用者兩次確認**（第一次：「確定要推到 prod 嗎？」；第二次：「再次確認，推到 prod 會觸發正式環境部署，確定嗎？」）
- 未經兩次確認，禁止執行 `git push origin prod` 或任何會觸發正式環境部署的操作

## ⛔ 禁止修改的架構規則

以下是歷史 bug 修復後確立的規則，**任何情況下都不可違反**：

1. **messages 表只能由 Backend (FastAPI) 建立記錄**
   - `line_app/app.py` 的 `push_campaign()` 收到 `campaign_id` 時，必須直接使用，禁止再呼叫 `_create_campaign_row()`
   - `_create_campaign_row()` 僅供獨立指令碼（無 Backend 參與）使用
   - 違反會導致：重複記錄、UTC 時間錯誤、sent 計數翻倍

2. **修改 `line_app/app.py` 的推播流程前，必須先讀懂 `push_campaign()` 和 `_create_campaign_row()` 的註解**

3. **DB 時間慣例：臺灣時間（Asia/Taipei, UTC+8）**
   - 詳見「Timezone Convention」章節
   - `line_app` 中禁止用 `utcnow()` 寫入 messages 表

## Database

MySQL 8.0 with SQLAlchemy 2.0 async. Key models:
- `Member` (unified multi-channel: line_uid, fb_customer_id, webchat_uid)
- `ConversationThread`, `ConversationMessage`
- `Campaign`, `Message`, `MessageDelivery`
- `MemberTag`, `InteractionTag`, `MemberInteractionTag`, `TagTriggerLog`
- `AutoResponse`, `AutoResponseKeyword`, `AutoResponseMessage`
- `FaqCategory`, `FaqRule`, `AiTokenUsage`
- `LineChannel`, `FbChannel`, `LineFriend`
- `MessageTemplate`
- `ChatbotSession`, `FaqPmsConnection`

## ⛔ 資料庫變更 SOP（DB Workflow）

**對象**：後端工程師（或其 Claude）。**觸發時機**：新增/修改/刪除欄位、新增/刪除表、改 index、改 FK。

GCP 部署端 CI 會在 `git pull` 後自動跑 `alembic upgrade head` + 重啟服務，**地端與 GCP 共用同一份 SOP**。

### 完整流程（4 步）

1. **改 model**（`backend/app/models/*.py`）
2. **手寫 migration**（**禁用** `--autogenerate`）
3. **dev 端跑** `alembic upgrade head` + `alembic check`
4. **commit + push origin main** → CI 自動：`git pull → alembic upgrade head → 重啟服務`

### Step 1：改 model

- 新增欄位 → 在 class 加 `Column(...)`
- 移除欄位 → 刪掉 `Column`
- 新增表 → 新建 model 檔 + 加進 `app/models/__init__.py`
- 移除表 → 刪 model 檔 + 從 `__init__.py` 移除
- 改 FK / index → 改 column 上的 `ForeignKey(...)` 或 `__table_args__`

### Step 2：手寫 migration（不用 autogenerate）

```bash
cd backend
alembic revision -m "<簡短說明>"
```

打開生成的空檔案，**手動**填 `upgrade()` / `downgrade()`。常用 op：

```python
op.add_column('table_name', sa.Column('col_name', sa.String(100), nullable=True, comment='說明'))
op.drop_column('table_name', 'col_name')

op.create_table('new_table', sa.Column('id', sa.BigInteger, primary_key=True), ...)
op.drop_table('table_name')

op.create_index('ix_table_col', 'table_name', ['col_name'])
op.drop_index('ix_table_col', table_name='table_name')

# FK：必須明確命名，禁靠 MySQL 自動編號
op.create_foreign_key(
    'fk_child_parent',           # 明確命名！
    'child_table', 'parent_table',
    ['fk_col'], ['id'],
    ondelete='SET NULL',         # 或 CASCADE / RESTRICT
)
op.drop_constraint('fk_child_parent', 'child_table', type_='foreignkey')
```

#### 收緊 NOT NULL / UNIQUE 之前必須先驗資料

```bash
mysql -e "SELECT COUNT(*) FROM <table> WHERE <col> IS NULL;"
```
不是 0 不能改成 NOT NULL — migration 會跑到一半炸掉 → CI 紅 → staging 沒重啟到新 code。

如果有現有 NULL 資料，先用 migration backfill：
```python
op.execute("UPDATE <table> SET <col> = 'default_value' WHERE <col> IS NULL")
op.alter_column('<table>', '<col>', nullable=False)
```

#### 加 FK 之前 backfill 孤兒值

```python
op.execute("""
    UPDATE child c LEFT JOIN parent p ON c.fk_col = p.id
    SET c.fk_col = NULL
    WHERE c.fk_col IS NOT NULL AND p.id IS NULL
""")
op.create_foreign_key(...)
```

#### Downgrade

對應 upgrade 寫反向操作。若還原會破壞資料（例：drop column 後資料就消失），寫個註解說明或 `pass` 都可以，但要意識到這支 migration 是 one-way。

### Step 3：dev 端驗證

```bash
alembic upgrade head           # 套用 migration
alembic check 2>&1 | tail -10  # 確認沒有新 drift
```

期望：
- `upgrade` 成功
- `check` 列的項目跟你改之前**數量相同**（你本次變動不該新增 drift）

> ⚠️ dev 上本來就有 ~86 項歷史 drift，只比較**數量**、不期望歸零。你的任務是「不要再增加 drift」，不是「修掉歷史 drift」。

### Step 4：commit + push

```bash
git add backend/app/models/<改的檔>.py \
        backend/migrations/versions/<新 migration>.py
git commit -m "<type>(<scope>): <一行說明>"
git push origin main
```

CI 自動：SSH 進 staging → `git pull` → `alembic upgrade head` → `npm build` → 重啟服務 → health check。

### 紅線（會造成日後麻煩，請避免）

| ❌ 不要做 | ✅ 改用 |
|---|---|
| `alembic revision --autogenerate` | 手寫 migration |
| `op.create_foreign_key(None, ...)` | 明確命名 `fk_<table>_<col>` |
| 硬寫 `tag_trigger_logs_ibfk_2` 這種 `ibfk_N` | 用 `information_schema` 動態查 |
| 收緊 NOT NULL 不驗資料 | 先 `SELECT COUNT(*) WHERE col IS NULL` |
| Model 改 comment 但忘了補 migration | model 跟 migration **一起 push** |
| migration 跑失敗就 `git revert` 直接推 | 在 dev 修好再推 |

### 環境前提（一次性設置，新環境才需要）

詳見 `deploy/gcp/DEPLOY_PLAYBOOK.md`：
- DB user 需有 `CREATE ROUTINE, ALTER ROUTINE, EXECUTE, TRIGGER` 權限（建 SP/trigger 用）
- MySQL `log_bin_trust_function_creators = 1`（建 trigger 用）
