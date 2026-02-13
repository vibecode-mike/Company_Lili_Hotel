# Security Audit & Remediation Plan - 力麗飯店 CRM

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all security vulnerabilities found in the production deployment audit, prioritized by severity.

**Architecture:** FastAPI backend (port 8700) + Flask LINE webhook (port 3001) + Vite React frontend (port 5173), Nginx reverse proxy (port 80), MySQL 8.0, JWT auth, domain crmpoc.star-bit.io

**Tech Stack:** Python/FastAPI, Python/Flask, TypeScript/React, MySQL, Nginx, OpenSSH

---

# Audit Summary

## 1. Audit Overview

| # | Category | Severity | Result | Summary |
|:--|:---------|:--------:|:------:|:--------|
| 1 | Infrastructure (CVE) | CRITICAL | FAIL | OpenSSH 8.9p1 vulnerable to CVE-2024-6387; SSH exposed on 0.0.0.0:22; no firewall; no fail2ban |
| 2 | Credential Protection | CRITICAL | FAIL | Hardcoded DB creds in config.py/alembic.ini; FB password in frontend source; admin passwords in scripts; .gitignore missing patterns |
| 3 | Password Strength | CRITICAL | FAIL | DB root password `123456`; JWT secret is dev placeholder; admin accounts use `admin123`/`123456`; FB service account `123456` |
| 4 | CORS Configuration | HIGH | FAIL | `ALLOWED_ORIGINS=*` with `allow_credentials=True` in FastAPI backend |
| 5 | SQL Injection | HIGH | WARN | Backend uses SQLAlchemy ORM (safe); Flask line_app uses f-string column interpolation (moderate risk) and DB name interpolation |
| 6 | Session/Cookie Security | MEDIUM | FAIL | JWT stored in localStorage (XSS vulnerable); no HttpOnly cookies; no SameSite |
| 7 | Dependency Security | MEDIUM | SKIP | No pip-audit / npm audit configured; needs scanning |
| 8 | Environment Detection | MEDIUM | FAIL | `DEBUG=True` hardcoded; API docs/Swagger always exposed; no production env logic |
| 9 | Session Fixation | MEDIUM | PASS | Stateless JWT - no session fixation risk by design |
| 10 | HTTP Security Headers | INFO | FAIL | No X-Frame-Options, X-Content-Type-Options, HSTS, CSP headers |
| 11 | Auth Bypass | CRITICAL | FAIL | 8+ API endpoints have authentication commented out (`# 暫時移除認證`) |

**Verdict: DEPLOYMENT BLOCKED - 6 Critical/High issues must be resolved first.**

---

# Detailed Findings & Remediation Tasks

---

## CRITICAL - Task 1: Patch OpenSSH CVE-2024-6387

**Severity:** CRITICAL (Remote Code Execution)

**Finding:**
- `ssh -V` returns `OpenSSH_8.9p1 Ubuntu-3ubuntu0.13` - within vulnerable range 8.5p1~9.7p1
- SSH listening on `0.0.0.0:22` (all interfaces)
- `iptables -L INPUT` shows `policy ACCEPT` with zero rules (no firewall)
- `fail2ban` is not installed/configured

**Impact:** Unauthenticated remote code execution via race condition in signal handler.

**Remediation:**

### Step 1: Update OpenSSH

```bash
sudo apt update && sudo apt install --only-upgrade openssh-server
ssh -V  # Verify patched version
```

Expected: Version > 9.7p1 or Ubuntu patch `8.9p1-3ubuntu0.14+`

### Step 2: Configure fail2ban

```bash
sudo apt install fail2ban
```

Create `/etc/fail2ban/jail.local`:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
```

```bash
sudo systemctl enable fail2ban && sudo systemctl start fail2ban
sudo fail2ban-client status sshd  # Verify
```

### Step 3: Restrict SSH access via firewall

```bash
# Only allow SSH from known admin IPs (replace with actual IPs)
sudo ufw allow from <ADMIN_IP_1> to any port 22
sudo ufw allow from <ADMIN_IP_2> to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Step 4: Harden sshd_config

Add to `/etc/ssh/sshd_config`:
```
LoginGraceTime 20
MaxStartups 10:30:60
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart sshd
```

**Files:**
- `/etc/ssh/sshd_config`
- `/etc/fail2ban/jail.local`

---

## CRITICAL - Task 2: Remove Hardcoded Credentials

**Severity:** CRITICAL

**Finding:**

| Location | Type | Value |
|:---------|:-----|:------|
| `backend/app/config.py:27` | DB URL default | `mysql+aiomysql://root:l123456@127.0.0.1:3306/lili_hotel` |
| `backend/alembic.ini:61` | DB URL | `mysql+aiomysql://root:123456@192.168.50.123:3306/lili_hotel` |
| `backend/.env.example:2` | DB URL example | Contains real credentials instead of placeholders |
| `backend/scripts/init_db.py:50-51` | Admin passwords | `admin123`, `123456` |
| `backend/create_admin.py:43-45` | Admin passwords | `admin123`, `123456` |
| `frontend/src/components/auth/AuthContext.tsx:57-58` | FB fallback creds | `tycg-admin` / `123456` |
| `frontend/src/components/BasicSettings.tsx:76,80` | FB fallback creds | `tycg-admin` / `123456` |
| `frontend/.env.development:8-9` | FB creds | `tycg-admin` / `123456` |
| `frontend/.env.production:8-9` | FB creds | `tycg-admin` / `123456` |
| `docs/ARCHITECTURE_COMPARISON.md` | Creds in docs | `tycg-admin` / `123456` |
| `docs/SOLUTION_B_IMPLEMENTATION.md` | Creds in docs | `tycg-admin` / `123456` |

**Remediation:**

### Step 1: Fix backend/app/config.py - remove default DB URL

```python
# BEFORE (line 27):
DATABASE_URL: str = "mysql+aiomysql://root:l123456@127.0.0.1:3306/lili_hotel"

# AFTER:
DATABASE_URL: str  # Required - must be set in .env
```

### Step 2: Fix backend/alembic.ini - use env var

```ini
# BEFORE (line 61):
sqlalchemy.url = mysql+aiomysql://root:123456@192.168.50.123:3306/lili_hotel

# AFTER:
sqlalchemy.url = %(DATABASE_URL)s
```

In `backend/alembic/env.py`, ensure:
```python
from app.config import settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

### Step 3: Fix backend/.env.example

```env
# BEFORE:
DATABASE_URL=mysql+aiomysql://root:l123456@127.0.0.1:3306/lili_hotel

# AFTER:
DATABASE_URL=mysql+aiomysql://USER:PASSWORD@HOST:3306/DB_NAME
SECRET_KEY=CHANGE_ME_TO_RANDOM_64_CHAR_STRING
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_SECRET
FB_FIRM_PASSWORD=CHANGE_ME
```

### Step 4: Fix init scripts - read passwords from env

**File: `backend/scripts/init_db.py`**

```python
# BEFORE:
await ensure_user(session, "admin", "admin@lilihotel.com", "admin123")
await ensure_user(session, "tycg-admin", "tycg-admin@lilihotel.com", "123456")

# AFTER:
import os
admin_password = os.getenv("ADMIN_DEFAULT_PASSWORD")
if not admin_password:
    raise RuntimeError("ADMIN_DEFAULT_PASSWORD env var is required")
await ensure_user(session, "admin", "admin@lilihotel.com", admin_password)
# Remove tycg-admin creation from init script
```

Same fix for `backend/create_admin.py`.

### Step 5: Fix frontend - remove fallback credentials

**File: `frontend/src/components/auth/AuthContext.tsx:57-58`**

```typescript
// BEFORE:
const fbFirmAccount = import.meta.env.VITE_FB_FIRM_ACCOUNT?.trim() || 'tycg-admin';
const fbFirmPassword = import.meta.env.VITE_FB_FIRM_PASSWORD?.trim() || '123456';

// AFTER:
const fbFirmAccount = import.meta.env.VITE_FB_FIRM_ACCOUNT?.trim();
const fbFirmPassword = import.meta.env.VITE_FB_FIRM_PASSWORD?.trim();
if (!fbFirmAccount || !fbFirmPassword) {
  console.error('VITE_FB_FIRM_ACCOUNT and VITE_FB_FIRM_PASSWORD must be set');
}
```

Same fix for `frontend/src/components/BasicSettings.tsx`.

### Step 6: Remove credentials from documentation

Replace actual credentials in:
- `docs/ARCHITECTURE_COMPARISON.md`
- `docs/SOLUTION_B_IMPLEMENTATION.md`

With placeholders like `{YOUR_ACCOUNT}` / `{YOUR_PASSWORD}`.

### Step 7: Update .gitignore

Add to `.gitignore`:
```
*.pem
*.key
credentials.json
*.p12
*.pfx
```

**Files:**
- `backend/app/config.py`
- `backend/alembic.ini`
- `backend/.env.example`
- `backend/scripts/init_db.py`
- `backend/create_admin.py`
- `frontend/src/components/auth/AuthContext.tsx`
- `frontend/src/components/BasicSettings.tsx`
- `frontend/.env.development`
- `frontend/.env.production`
- `docs/ARCHITECTURE_COMPARISON.md`
- `docs/SOLUTION_B_IMPLEMENTATION.md`
- `.gitignore`

---

## CRITICAL - Task 3: Strengthen Passwords & Secrets

**Severity:** CRITICAL

**Finding:**
- DB root password: `123456` (6 chars, digits only)
- JWT SECRET_KEY: `lili-hotel-secret-key-change-in-production-2025` (dev placeholder)
- Admin account: `admin123` (8 chars, trivially guessable)
- FB service account: `123456`

**Remediation:**

### Step 1: Generate strong SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

Update `backend/.env`:
```env
SECRET_KEY=<generated_64_char_random_string>
```

### Step 2: Change MySQL root password

```sql
ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '<new_strong_password_16+_chars>';
FLUSH PRIVILEGES;
```

Update `backend/.env` DATABASE_URL with new password.

Requirements: >= 16 chars, mixed case + digits + symbols.

### Step 3: Change admin account passwords

```bash
cd backend
python3 -c "
from app.core.security import get_password_hash
import secrets
pw = secrets.token_urlsafe(16)
print(f'Password: {pw}')
print(f'Hash: {get_password_hash(pw)}')
"
```

Update admin passwords in the database directly.

### Step 4: Change FB service account password

Update `backend/.env`:
```env
FB_FIRM_PASSWORD=<new_strong_password>
```

Update corresponding external FB API service.

**Files:**
- `backend/.env` (SECRET_KEY, DATABASE_URL, FB_FIRM_PASSWORD)
- MySQL database (root password, admin user passwords)

---

## CRITICAL - Task 4: Re-enable Authentication on All Endpoints

**Severity:** CRITICAL

**Finding:** 8+ API endpoints have authentication commented out with `# 暫時移除認證，開發階段使用`:

| File | Line | Endpoint |
|:-----|:-----|:---------|
| `backend/app/api/v1/members.py` | 50 | `GET /members` (list all) |
| `backend/app/api/v1/members.py` | 253 | `GET /members/count` |
| `backend/app/api/v1/members.py` | 504 | `PUT /members/{id}/interaction-tags` |
| `backend/app/api/v1/members.py` | 543 | `POST /members/{id}/tags/batch-update` |
| `backend/app/api/v1/members.py` | 762 | `POST /members/{id}/interaction-tags/add` |
| `backend/app/api/v1/tags.py` | (3 locations) | Tag management endpoints |

**Impact:** Any unauthenticated user can read/modify all member data, PII exposure.

**Remediation:**

### Step 1: Uncomment all authentication guards

In each file, find lines like:
```python
# current_user: User = Depends(get_current_user),  # 暫時移除認證，開發階段使用
```

Replace with:
```python
current_user: User = Depends(get_current_user),
```

### Step 2: Verify all endpoints require auth

```bash
grep -rn "# current_user.*Depends.*get_current_user" backend/app/api/v1/ --include="*.py"
```

Expected: Zero results.

### Step 3: Test endpoints return 401 without token

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8700/api/v1/members
# Expected: 401
```

**Files:**
- `backend/app/api/v1/members.py` (lines 50, 253, 504, 543, 762)
- `backend/app/api/v1/tags.py` (3 locations)

---

## CRITICAL - Task 5: Disable DEBUG Mode & API Docs in Production

**Severity:** CRITICAL

**Finding:**
- `backend/.env`: `DEBUG=True`, `ENVIRONMENT=development`
- API docs always exposed at `/api/v1/docs`, `/api/v1/redoc`, `/api/v1/openapi.json`
- Detailed error stack traces exposed

**Remediation:**

### Step 1: Update backend/.env for production

```env
ENVIRONMENT=production
DEBUG=False
```

### Step 2: Conditionally expose API docs

**File: `backend/app/main.py`**

```python
# BEFORE:
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# AFTER:
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
)
```

**Files:**
- `backend/.env`
- `backend/app/main.py`

---

## HIGH - Task 6: Fix CORS Configuration

**Severity:** HIGH

**Finding:**
- `backend/app/config.py:67`: `ALLOWED_ORIGINS: str = "*"`
- `backend/.env`: `ALLOWED_ORIGINS=*`
- `backend/app/main.py:33-40`: `allow_credentials=True` with wildcard origin

**Impact:** Any website can make authenticated cross-origin requests to the API.

**Remediation:**

### Step 1: Set explicit allowed origins

**File: `backend/.env`**

```env
# BEFORE:
ALLOWED_ORIGINS=*

# AFTER:
ALLOWED_ORIGINS=https://crmpoc.star-bit.io,http://localhost:5173
```

### Step 2: Fix config.py default

**File: `backend/app/config.py:67`**

```python
# BEFORE:
ALLOWED_ORIGINS: str = "*"

# AFTER:
ALLOWED_ORIGINS: str = ""  # Must be set in .env
```

### Step 3: Restrict CORS methods and headers

**File: `backend/app/main.py`**

```python
# BEFORE:
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AFTER:
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
```

**Files:**
- `backend/.env`
- `backend/app/config.py`
- `backend/app/main.py`

---

## HIGH - Task 7: Fix SQL Injection Risks in Flask Line App

**Severity:** HIGH

**Finding:**
Column name interpolation via f-strings in `line_app/app.py`:
- Lines 262-270: `{LINE_CHANNEL_ID_COL}` in SELECT
- Line 326: `{LINE_CHANNEL_ID_COL}` in WHERE
- Line 372: `{LINE_CHANNEL_ID_COL}` in UPDATE
- Line 1163: `{LINE_CHANNEL_ID_COL}` in SELECT
- Lines 1267-1279: `{AUTO_RESPONSE_KW_ID_COL}`, `{AUTO_RESPONSE_MSG_ID_COL}`, `{AUTO_RESPONSE_KW_TEXT_COL}` in JOINs
- Lines 2764-2929: `{MYSQL_DB}` database name interpolation (~15 locations)

**Risk Assessment:**
- Column names derived from `_table_has()` at startup (controlled, not user input) - **moderate risk**
- `MYSQL_DB` from env var - **low risk but bad practice**

**Remediation:**

### Step 1: Add column name validation at startup

**File: `line_app/app.py`** - after column name assignments:

```python
# After line 224:
VALID_COLUMN_NAMES = {"line_channel_id", "channel_id", "response_id", "auto_response_id", "keyword", "keyword_text"}
for col_name in [LINE_CHANNEL_ID_COL, AUTO_RESPONSE_MSG_ID_COL, AUTO_RESPONSE_KW_ID_COL, AUTO_RESPONSE_KW_TEXT_COL]:
    if col_name not in VALID_COLUMN_NAMES:
        raise RuntimeError(f"Invalid column name detected: {col_name}")
```

### Step 2: Validate MYSQL_DB at startup

```python
import re
if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', MYSQL_DB):
    raise RuntimeError(f"Invalid database name: {MYSQL_DB}")
```

**Files:**
- `line_app/app.py`

---

## MEDIUM - Task 8: Add HTTP Security Headers

**Severity:** MEDIUM

**Finding:** No security headers in responses (no middleware or Nginx config).

**Remediation:**

### Step 1: Add SecurityHeadersMiddleware to FastAPI

**File: `backend/app/main.py`**

Add after CORS middleware:

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

### Step 2: Add security headers to Nginx

Find and update Nginx config (typically `/etc/nginx/sites-available/default` or project-specific config):

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.line.me https://*.star-bit.io;" always;
```

**Files:**
- `backend/app/main.py`
- Nginx configuration file

---

## MEDIUM - Task 9: Run Dependency Security Audit

**Severity:** MEDIUM

**Remediation:**

### Step 1: Audit Python dependencies

```bash
cd /data2/lili_hotel/backend
pip install pip-audit
pip-audit -r requirements.txt
```

### Step 2: Audit Node.js dependencies

```bash
cd /data2/lili_hotel/frontend
npm audit
npm audit fix  # Auto-fix where possible
```

### Step 3: Review and fix any Critical/High vulnerabilities

Document findings and create follow-up tasks for each CVE found.

**Files:**
- `backend/requirements.txt`
- `frontend/package.json`

---

## MEDIUM - Task 10: Fix Environment Detection Logic

**Severity:** MEDIUM

**Finding:**
- `backend/app/config.py:24`: `DEBUG: bool = True` (default True)
- No environment-based switching logic
- No startup logging of security-critical config values

**Remediation:**

### Step 1: Fix config.py defaults

**File: `backend/app/config.py`**

```python
# BEFORE:
DEBUG: bool = True

# AFTER:
DEBUG: bool = False  # Must explicitly enable in .env for development
ENVIRONMENT: str = "production"  # Default to production
```

### Step 2: Add startup security logging

**File: `backend/app/main.py`** - in startup event:

```python
@app.on_event("startup")
async def startup_log_security():
    import logging
    logger = logging.getLogger("security")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"DEBUG mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.allowed_origins_list}")
    logger.info(f"API docs enabled: {settings.DEBUG}")
    if settings.DEBUG:
        logger.warning("WARNING: Running in DEBUG mode - not suitable for production!")
    if settings.ALLOWED_ORIGINS == "*":
        logger.warning("WARNING: CORS allows all origins!")
```

**Files:**
- `backend/app/config.py`
- `backend/app/main.py`

---

# Execution Priority

| Priority | Task | Effort | Impact |
|:---------|:-----|:-------|:-------|
| P0 - Block | Task 4: Re-enable auth on endpoints | 30 min | Prevents PII leak |
| P0 - Block | Task 5: Disable DEBUG & API docs | 15 min | Prevents info disclosure |
| P0 - Block | Task 6: Fix CORS | 15 min | Prevents CSRF |
| P0 - Block | Task 2: Remove hardcoded creds | 1 hr | Prevents credential theft |
| P0 - Block | Task 3: Strengthen passwords | 30 min | Prevents brute force |
| P1 - Urgent | Task 1: Patch OpenSSH | 30 min | Prevents RCE (requires sudo) |
| P1 - Urgent | Task 7: Fix SQL risks | 30 min | Prevents injection |
| P2 - Soon | Task 8: Security headers | 30 min | Defense in depth |
| P2 - Soon | Task 9: Dependency audit | 30 min | Known CVE protection |
| P2 - Soon | Task 10: Environment detection | 15 min | Prevents accidental exposure |

**Total estimated effort: ~4.5 hours**

---

# Post-Remediation Verification Checklist

- [ ] `ssh -V` shows patched version or access restricted
- [ ] `grep -rn "admin123\|123456\|lili-hotel-secret" backend/` returns zero results
- [ ] `grep -rn "# current_user.*Depends.*get_current_user" backend/app/api/v1/` returns zero results
- [ ] `curl -s http://localhost:8700/api/v1/docs` returns 404 (not Swagger UI)
- [ ] `curl -s http://localhost:8700/api/v1/members` returns 401
- [ ] CORS header check: `curl -H "Origin: https://evil.com" -I http://localhost:8700/api/v1/auth/login` does NOT include `Access-Control-Allow-Origin: https://evil.com`
- [ ] `pip-audit` reports no Critical/High CVEs
- [ ] `npm audit` reports no Critical/High CVEs
- [ ] Response headers include X-Frame-Options, X-Content-Type-Options
