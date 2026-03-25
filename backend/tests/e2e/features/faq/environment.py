"""
Behave environment hooks for FAQ E2E tests.
Target: /data2/lili_hotel/backend/app/ (FastAPI + async SQLAlchemy + MySQL)
API: http://localhost:8700 (backend must be running)
DB: Direct sync MySQL connection for test data setup/teardown.
"""
from __future__ import annotations

import os
import sys
from types import SimpleNamespace

import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus

# Ensure backend app is importable
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Load .env from backend root
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

API_BASE = "http://localhost:8700/api/v1"

# Test user credentials (must exist in the DB)
TEST_USER = "admin@lilihotel.com"
TEST_PASS = "StarBit!23"


def _build_sync_db_url() -> str:
    """Build sync MySQL connection URL from env or defaults."""
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "3306")
    name = os.getenv("DB_NAME", "lili_hotel")
    user = os.getenv("DB_USER", "root")
    pwd = os.getenv("DB_PASS", "")
    return f"mysql+pymysql://{user}:{quote_plus(pwd)}@{host}:{port}/{name}"


def before_all(context):
    """Global init: verify backend is reachable, set up DB engine."""
    context.api_base = API_BASE

    # Verify backend is reachable
    try:
        requests.get(f"{API_BASE}/faq/categories", timeout=5)
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            f"Cannot reach backend at {API_BASE}. "
            "Please start backend: uvicorn app.main:app --port 8700"
        )

    # Create sync DB engine for direct data setup
    sync_url = _build_sync_db_url()
    context.engine = create_engine(sync_url, echo=False, isolation_level="READ COMMITTED")
    context.SessionLocal = sessionmaker(bind=context.engine)


def before_scenario(context, scenario):
    """Reset state before each scenario."""
    context.last_response = None
    context.last_error = None
    context.query_result = None
    context.ids = {}
    context.memo = {}
    context.repos = SimpleNamespace()
    context.services = SimpleNamespace()

    # Open a DB session for data setup
    context.db_session = context.SessionLocal()

    # Clean FAQ test data (reverse dependency order)
    _clean_faq_data(context.db_session)

    # Login to get auth token
    context.auth_token = _login(context.api_base)
    context.auth_headers = {"Authorization": f"Bearer {context.auth_token}"}


def after_scenario(context, scenario):
    """Clean up after each scenario."""
    if hasattr(context, "db_session") and context.db_session:
        try:
            _clean_faq_data(context.db_session)
        except Exception:
            context.db_session.rollback()
        finally:
            context.db_session.close()


def _clean_faq_data(session):
    """Remove all FAQ test data to ensure isolation."""
    try:
        session.execute(text("DELETE FROM faq_rule_tags"))
        session.execute(text("DELETE FROM faq_rules"))
        session.execute(text("DELETE FROM faq_category_fields"))
        session.execute(text("DELETE FROM faq_pms_connections"))
        session.execute(text("DELETE FROM faq_categories"))
        session.execute(text("DELETE FROM ai_token_usages"))
        session.execute(text("DELETE FROM faq_module_auths"))
        session.execute(text("DELETE FROM industries"))
        session.commit()
    except Exception:
        session.rollback()
        raise


def _login(api_base: str) -> str:
    """Login and return access token."""
    resp = requests.post(
        f"{api_base}/auth/login",
        data={"username": TEST_USER, "password": TEST_PASS},
        timeout=10,
    )
    if resp.status_code != 200:
        raise RuntimeError(
            f"Login failed ({resp.status_code}): {resp.text}. "
            f"Ensure test user '{TEST_USER}' exists in DB."
        )
    return resp.json()["access_token"]
