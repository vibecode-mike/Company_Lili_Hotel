# Clarify & Translation Notes – Spec + .clarify

This note links the latest `01/spec/` deliverables with decisions captured under `01/.clarify/` so the product/engineering team can see which ambiguities are already resolved, which rules were tightened, and where translations or terminology should stay consistent.

## Source references
- Specs: `01/spec/api_line_message_interface.md`, `01/spec/erm.dbml`, `01/spec/features/*.feature`
- Clarifications: `01/.clarify/resolved/data/*.md`, `01/.clarify/resolved/features/*.md`

## Resolved clarifications

| Topic | Decision | Where reflected |
| --- | --- | --- |
| AutoResponseMessage `sequence_order` | Hard limit 1–5 matching UI restriction; enforce via DB check + backend validation. | `spec/erm.dbml` (`AutoResponseMessage` note), `spec/features/auto_response.feature` |
| ComponentInteractionLog `total_clicks` | Remains 32-bit int (max ~2.1B). No bigint migration; just monitor abnormal spikes. | `spec/erm.dbml` (`ComponentInteractionLog` note) |
| LineFriend profile refresh | Added `profile_updated_at` and 90-day refresh cadence (follow event immediate fetch). | `spec/erm.dbml` (`LineFriend` note) |
| LineFriend ↔ Member sync | FollowEvent upserts both tables; admin edits to shared fields propagate back. | `spec/erm.dbml` (`Member`, `LineFriend` notes) |
| LineFriend retention | No auto-delete/archive; rely on `is_following` flag forever. | `spec/erm.dbml` (`LineFriend` data retention note) |
| MessageTemplate `notification_message` & `preview_message` | Both required, passed to LINE push; front/back-end validations aligned. | `spec/erm.dbml`, `spec/features/message_template.feature` |
| TemplateButton order after delete | Always resequence to contiguous values starting at 1; update `button_count`. | `spec/erm.dbml`, `spec/features/message_template.feature` |
| Reconfigure LINE OA | UI never exposes wipe/reset; only allows replacing credentials once OA fully configured. | `spec/features/重新設定_LINE_OA.feature`, `.clarify/resolved/features/…` |
| Batch send throttling & retries | Token-bucket at 15 req/s + 3 auto retries (1s/2s/4s) for 429/5xx/network errors, results now expose attempts & last_status_code. | `spec/api_line_message_interface.md`, `.clarify/resolved/data/BatchSend_rate_limit與重試策略.md` |
| TagRule execution | Manual-only in v0; no schedulers/workers. `last_executed_at` records button-trigger time and audit logs capture operator + impacted members. | `spec/erm.dbml`, `.clarify/resolved/data/TagRule_執行策略與自動化需求.md` |
| MessageDelivery retention | Main table keeps 90 days; daily 02:00 job batches INSERT…SELECT into `MessageDeliveryArchive`, logs counts/time, then deletes originals. | `spec/erm.dbml`, `.clarify/resolved/data/MessageDelivery_資料保留策略與清理機制.md` |
| Auto-response trigger collision | Single inbound event responds once using priority keyword > time-window > welcome; within same tier pick oldest rule, log skipped ones. | `spec/features/auto_response.feature`, `.clarify/resolved/data/AutoResponse_trigger_collision策略.md` |

## Items to watch / pending follow-up
- _None currently_. Add new bullets when additional ambiguities appear.

## Terminology & translation cues
- Keep the bilingual labeling patterns from specs (e.g., “通知訊息 / notification_message”) when building UI copy or API docs so Taiwan-based stakeholders recognize the fields.
- For admin UX narratives, reuse Gherkin phrasings (歡迎訊息、指定時間觸發、標籤規則) to avoid drift between requirement docs and product strings.
- When referencing clarifications in future tickets, cite the `.clarify/resolved/...` filename to help others trace the historical rationale.

## Recommended next clarifications
- _Unassigned_. Populate when the next batch of discovery questions surfaces.
