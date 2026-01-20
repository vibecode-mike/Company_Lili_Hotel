# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

力麗飯店 LINE OA CRM 系統 - 多渠道會員管理與行銷平台，整合 LINE、Facebook Messenger 和 Webchat。

## Common Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head                    # Apply migrations
alembic revision --autogenerate -m "desc"  # Create migration
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
├── backend/                 # FastAPI backend (port 8000)
│   ├── app/
│   │   ├── api/v1/         # REST endpoints (auth, members, campaigns, tags, etc.)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas (<Entity>Schema naming)
│   │   ├── services/       # Business logic layer
│   │   ├── adapters/       # External service adapters (PMS, etc.)
│   │   └── websocket_manager.py  # Real-time chat WebSocket
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
- **Chat**: `/api/v1/chat/messages`, WebSocket at `/api/v1/ws/{conversation_id}`
- **Analytics**: `/api/v1/analytics/overview`

API docs: http://localhost:8000/api/v1/docs

## Multi-Channel Architecture

The system supports LINE, Facebook, and Webchat through:
- `Member` model has `line_user_id`, `fb_user_id`, `webchat_uid` fields
- `Conversation` model tracks `channel_type` (line/facebook/webchat)
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

## Database

MySQL 8.0 with SQLAlchemy 2.0 async. Key models:
- `Member`, `LineFriend`, `FacebookFriend`, `WebchatFriend`
- `Conversation`, `ConversationMessage`
- `Campaign`, `MessageDelivery`
- `Tag`, `MemberTag`, `InteractionTag`
- `AutoResponse`
