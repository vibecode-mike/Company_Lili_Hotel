# Discovery Notes – LINE CRM Spec

This document distills the materials under `01/spec/` (API contract, ERM, and feature files) to clarify the scope, dependencies, and remaining questions before implementation.

## Source Inputs
- `01/spec/api_line_message_interface.md`: FastAPI contract for pushing single/batch LINE Flex messages, including validation, logging, and error handling strategies.
- `01/spec/erm.dbml`: v0.2.1 ER model covering CRM (Member/LineFriend), messaging, tagging, campaigns, and auth tables with indexing/retention notes.
- `01/spec/features/*.feature`: Gherkin specs for Auto Response, Message Template Builder, Tag Rule Management, and LINE OA reconfiguration.

## Domain Snapshot
- **Channel & Identity**: `LineFriend` tracks every OA follower (never deleted) with follow/unfollow timestamps and linkage to `Member` records (CRM profile) via `line_uid`. `MemberTag`, `TagRule`, and `InteractionTag` capture segmentation signals.
- **Messaging Stack**: Content lives in `MessageTemplate`, `TemplateCarouselItem`, `TemplateButton`, and is sent through `Message`, `MessageDelivery`, and `MessageRecord`. Auto-response content is normalized through `AutoResponse`, `AutoResponseMessage`, and `AutoResponseKeyword`.
- **Execution Surfaces**: 
  - `line_app/app.py` exposes `/api/line/send-message` and `/api/line/send-batch-message`, mapping `notification_message` → LINE `altText` and persisting request/response data for analytics.
  - Admin UI modules: auto-response manager, visual template builder, manual tag-rule executor, and LINE OA settings page.

## Feature Highlights

### 1. Messaging API Contract
- Single send requires `line_uid` (must start with `U`, length 33), `notification_message`, `preview_message`, and a valid Flex payload; batch send accepts `line_uids` (1–500) and loops through the single-send logic.
- `notification_message` doubles as the LINE `altText`; `preview_message` is retained for CRM analytics only, so both must be persisted.
- Errors differentiate validation (422), LINE API failures (relay status/code), and internal faults (500) with structured logging.
- Batch responses return per-UID success/failure metadata, now enriched with `attempts`, `last_status_code`, and `last_error` so ops can see retry history.
- Throttling & retries: each `line_app` instance enforces a 15 req/s (≈900 req/min) token bucket to stay under LINE’s limit; 429/5xx/network errors trigger up to three retries with 1s/2s/4s backoff per UID. Clients must split pushes beyond 500 recipients into multiple calls.

### 2. Auto Response Engine
- Trigger types: **welcome** (follow event), **keyword** (exact match, case-insensitive, up to 20 keywords per rule, OR logic), and **time-based** windows (date + time range, supports cross-midnight comparisons).
- Response payloads: text-only, 1–5 messages per rule, 5,000 characters max per message, stored via `AutoResponseMessage.sequence_order` with drag-to-reorder behavior; deletions resequence records and update `response_count`.
- Keyword governance: managed in `AutoResponseKeyword`, enforcing uniqueness per rule, trimming whitespace-only entries, tracking `trigger_count` and `last_triggered_at`, and respecting per-keyword enable/disable flags without deleting history.
- Runtime logging: system records which keyword fired, member info, and timestamps for analytics; disabled rules or keywords simply skip matching but retain statistics.
- Time-window logic explicitly handles same-day vs. cross-day intervals (`time_range_start`/`end`) and ensures date-range gating (campaign periods, after-hours auto-replies).
- Collision handling: one inbound event yields at most one auto response using priority **keyword > time-window > welcome**; if multiple rules exist within the same tier, the oldest rule wins and the skipped candidates are logged for analysis.

### 3. Visual Message Template Builder
- Front-end-only editing experience (v0): users fill structured fields (text ≤2000 chars, cropped images ≤1 MB, title, description, amount as non-negative integer, required notification/preview strings); the UI generates `flex_message_json`, while the backend validates/stores it.
- Buttons support only the “open URL” action type; drafts may omit URLs, but sending enforces presence per button. Buttons and carousel cards auto-resequence after deletions to keep contiguous indices.
- Carousel constraints: enabled only for 2–9 cards; single-image templates default to non-carousel mode.
- Interaction tags can be assigned per button (comma-separated for multi-tag cases) and should flow into `InteractionTag`/`ComponentInteractionLog` for downstream analytics.
- Saving a template persists all structured fields plus the generated Flex JSON into `MessageTemplate`; later sends should couple template metadata with message delivery tracking tables.

### 4. Tag Rule Management
- `TagRule` records define conditions (e.g., `ConsumptionRecord` totals) but **never auto-run**; creation, enabling, or member data changes do not trigger execution. Admins must press “run rule”, which timestamps `last_executed_at`, reports affected member counts, and logs history.
- Deleting a rule only removes the `TagRule` record; previously assigned `MemberTag` entries remain.
- UI affordances: search by name keyword, sort by created/updated timestamps, surface execution history, and expose explicit status cues (“created, not executed”, “enabled”).
- Failure handling is manual: if a scheduled/manual run fails (DB outage, conflicting logic), the system records the error and asks admins to resolve and rerun—no automated retries or conflict detection beyond a warning banner.

### 5. LINE OA Reconfiguration
- The settings page never exposes “wipe & rebind”; admins can only replace Messaging/Login API credentials, preserving all CRM data.
- The “reconfigure” button appears only after the OA is fully set up; otherwise it remains hidden.
- Clicking the button opens a confirmation modal (“確定要解除與 @LINE 的連結嗎？請聯繫系統服務商。”) to stress that vendor support is required.

## Constraints & Dependencies
- **Data consistency**: `LineFriend` ↔ `Member` relationships hinge on `line_uid` synchronization (questionnaire completion or manual imports). Auto-responses and send APIs must tolerate unlinked friends.
- **Sequence integrity**: Both `AutoResponseMessage.sequence_order` and carousel/button ordering rely on server-side resequencing after CRUD operations to avoid gaps.
- **Validation parity**: Front-end builders perform length/format checks, but backend APIs (message send, template save, rule execute) must mirror them to prevent inconsistent states.
- **Observability**: Specs call for detailed logging—success logs capture notification/preview pairs, batch summaries show counts plus per-UID retry data, and keyword triggers record member/time context for analytics dashboards.
- **Retention discipline**: `MessageDelivery` keeps only 90 days online; a daily 02:00 job moves older rows into `MessageDeliveryArchive`, so downstream analytics need to read from the archive for long-range history.

## Open Questions & Follow-ups
1. **Template lifecycle**: Are there status states beyond “draft” vs “ready to send” (e.g., versioning, approval workflows)? How do template edits propagate to already scheduled messages?
2. **Batch queue UX**: With throttling and per-UID retries, do admins need a progress UI, cancellation capability, or alerting when batches take longer than expected?
3. **OA credential rotation**: After reconfiguration, do we need to invalidate cached Channel Access Tokens in running services or notify downstream systems (e.g., `line_app` deployment) automatically?

Answering the questions above (or updating the specs) will ensure implementation teams share the same expectations when they begin coding against `01/spec/`.
