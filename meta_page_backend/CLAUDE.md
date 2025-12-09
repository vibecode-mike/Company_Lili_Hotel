# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Go backend service for Meta (Facebook) Page API integration. Handles page posts, comments, messaging, and webhook events for chatbot functionality.

**Tech Stack**: Go 1.25.4, Gin web framework, logrus

**Server Port**: 11204

## Common Commands

```bash
# Run the server
go run main.go

# Build
go build -o meta

# Run with Docker
docker build -t meta-backend .
docker run -p 11204:11204 meta-backend
```

## Required Environment Variables

Create `.env` file with:
```
API_VERSION=v24.0
page_id=<facebook_page_id>
page_access_token=<page_access_token>
```

## Architecture

```
meta_page_backend/
├── main.go                 # Entry point, initializes Gin router on :11204
├── routers/
│   ├── router.go           # Gin engine setup with CORS middleware
│   ├── router_user.go      # API route definitions
│   └── api/
│       ├── struct.go       # Response template (Defaultreturntemplate)
│       └── v1/             # Route handlers (page.go, user.go)
├── app/
│   ├── controllers/        # Business logic
│   │   ├── page/           # Meta Page API operations
│   │   └── user/           # User profile operations
│   └── models/
│       ├── webhook/        # Webhook payload structs
│       ├── message/        # Message structs
│       └── logs/           # Error logging (logrus)
├── pkg/
│   ├── e/                  # Error codes (code.go) and messages (msg.go)
│   └── request/            # HTTP client for Meta Graph API
└── message_template/       # Predefined message templates for chatbot
```

## API Endpoints

All routes under `/api/v1`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meta_hook` | Meta webhook verification |
| POST | `/meta_hook` | Receive webhook events |
| GET | `/meta_page/feed` | Get page posts |
| GET | `/meta_page/comment` | Get post comments |
| POST | `/meta_page/comment` | Post a comment |
| DELETE | `/meta_page/comment` | Delete a comment |
| POST | `/meta_page/message` | Send a message |
| GET | `/meta_user/profile` | Get user profile |

## Key Patterns

**Response Format**: All API responses use `api.Defaultreturntemplate(c, code, data)` which returns:
```json
{"status": <code>, "msg": "<message>", "data": <payload>}
```

**Error Codes**: Defined in `pkg/e/code.go`, messages in `pkg/e/msg.go`. Use `e.GetMsg(code)` to get message.

**Meta API Requests**: Use `pkg/request` functions:
- `SendMetaGetRequest(url)`
- `SendMetaPostRequest(url, payload)`
- `SendMetaDeleteRequest(url)`

**Error Logging**: Uses logrus with JSON format, outputs to stdout.

**Webhook Handling**: `HandleMetaPageWebhook` in `app/controllers/page/page.go` processes incoming messages and postback buttons. Uses `message_template` for predefined responses.

## CI/CD

Drone CI pipeline (`.drone.yml`):
- `develop` branch → Harbor registry
- `master` branch → AWS ECR (production)
