# Repository Guidelines

## Project Structure & Module Organization
This monorepo hosts the FastAPI backend plus the Vite/React console. Backend logic lives in `backend/app` (routers in `api/v1`, services, SQLAlchemy models) with Alembic migrations in `backend/migrations` and helper scripts in `backend/scripts`. Frontend implementation sits in `frontend/src`, with built bundles in `frontend/build`. LINE automation helpers stay in `line_app/` and `linebot_message/`, while Playwright specs live under `tests/e2e`. Consult `backend/PROJECT_SUMMARY.md` or `TAG_SYSTEM_GUIDE.md` before editing.

## Build, Test, and Development Commands
Install Python deps via `cd backend && pip install -r requirements.txt`, then launch the API with `uvicorn app.main:app --reload --port 8000`. Apply schema changes using `cd backend && alembic upgrade head`. Frontend setup is `cd frontend && npm install`; start the UI with `npm run dev` and compile production bundles with `npm run build`. Run seeding or LINE sync scripts via `python backend/<script>.py` from the repo root so relative imports resolve.

## Coding Style & Naming Conventions
Python code follows Black defaults (4-space indent, 120 columns) plus `isort` and `flake8`; lint `backend/app` before opening a PR. Name Pydantic models `<Entity>Schema` and keep router modules snake_case mirroring their URL segment. React/TypeScript files use PascalCase components, camelCase hooks/utilities, and colocated styles. Favor descriptive folders (`member`, `campaigns`, `analytics`) so paths map cleanly to API resources.

## Testing Guidelines
Unit and service tests live beside modules in `backend/tests` and should be run with `cd backend && pytest`. Aim for ≥85% coverage on touched modules and verify async paths via `pytest --cov=app --cov-report=term-missing`. UI journeys are protected by Playwright specs (`tests/e2e/survey-creation-flow.spec.ts`); execute them after building the frontend with `npx playwright test tests/e2e`. Keep fixtures and screenshots inside `tests/e2e` so CI artifacts stay predictable.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes (`fix:`, `chore:`, `feat:`, `docs:`) plus short imperative blurbs (e.g., `fix: optimize timestamp refresh`). Keep commits scoped to one concern and link issues in the body when relevant. Pull requests should describe the problem, solution, and validation steps (commands, screenshots). Call out database or schema impacts explicitly and request both backend and frontend reviewers when a change spans stacks.

## Security & Configuration Tips
Never commit `.env` or credential files; copy `backend/.env.example` and fill secrets locally. Required keys include `DATABASE_URL`, `SECRET_KEY`, LINE channel tokens, `OPENAI_API_KEY`, and `VITE_API_BASE_URL` for the UI. Redact PII or LINE IDs in shared logs, rotate leaked keys immediately, and keep migrations reversible with rollback notes in the PR description.
