# TeamMarySy Telegram Bot — Production Source of Truth

This repository is the authoritative implementation and deployment contract for the TeamMarySy Telegram bot. The code, Wrangler configuration, CI pipeline, runbooks, and tests must agree. Documentation must not describe a feature as operational unless its implementation and tests exist in this repository.

## 1. Runtime architecture

The production runtime is one Cloudflare Worker with four execution paths:

1. `fetch()` — Telegram webhook and authenticated health endpoint.
2. `scheduled()` — bounded maintenance and scheduled-job claiming.
3. `queue()` — asynchronous Telegram delivery from Cloudflare Queues.
4. Durable Object classes — strong coordination for idempotency, rate limiting, and job claims.

Cloudflare Workers KV is intentionally retained for configuration and eventually-consistent operational metadata. It is not used as a lock, atomic counter, transaction mechanism, or queue. Cloudflare documents KV as eventually consistent and recommends Durable Objects when atomic operations or stronger consistency are required. citeturn241247search0turn241247search16turn243569search1

Cloudflare Queues is the asynchronous delivery layer. Queue delivery is at-least-once, so every task must have an idempotency key and handlers must be safe to retry. The queue has retries and a dead-letter queue configured in Wrangler. citeturn241247search1turn241247search14

## 2. State ownership

KV owns:

- deployment/runtime configuration that is not secret;
- feature configuration;
- short-lived workflow metadata;
- ticket metadata;
- scheduled-job metadata.

Durable Objects own coordination:

- webhook update idempotency claims;
- strict rate-limit counters;
- job execution leases;
- future transactional coordination needs.

Queues own asynchronous delivery:

- agent notifications;
- support attachments;
- scheduled/broadcast sends as those features are implemented.

Secrets are never stored in KV or source control. Cloudflare Worker secrets hold the bot token and webhook secret.

## 3. Webhook contract

Telegram posts JSON updates to `/` with `X-Telegram-Bot-Api-Secret-Token` set to the deployment's webhook secret.

The Worker:

1. rejects non-POST traffic;
2. validates JSON content type;
3. validates the webhook secret before dispatch;
4. validates `update_id` and supported update structure;
5. claims the update through a Durable Object;
6. rejects duplicate/in-flight replays without repeating side effects;
7. applies strict per-user and per-chat rate limits through Durable Objects;
8. routes the update;
9. marks the update completed only after successful feature processing.

A failed processing attempt releases the idempotency claim so Telegram can retry. This is intentionally different from marking a failed update as permanently completed.

## 4. Outbound work

Do not put slow or retryable bulk work directly in the webhook path. Use `ctx.waitUntil()` to enqueue work to `OUTBOUND_QUEUE`, then let the queue consumer call Telegram.

The queue is configured with retries and a dead-letter queue. Because delivery is at-least-once, outbound operations require deterministic idempotency keys. citeturn241247search1turn241247search2

## 5. Scheduling

Cron runs every five minutes. It lists bounded pages of due jobs from KV and claims each job through a per-job Durable Object lease before executing it.

KV job locks are prohibited. A `lockedUntil` field may be retained as observability metadata, but it is not the correctness mechanism.

## 6. Health endpoint

`GET /health` returns a small JSON readiness response. If `HEALTH_TOKEN` is configured, the request must include `Authorization: Bearer <HEALTH_TOKEN>`.

The endpoint must not expose bot tokens, KV IDs, Durable Object IDs, chat lists, or administrator IDs.

## 7. Current feature maturity

Production infrastructure currently supports these operational capabilities:

- `/start` and `/panel` navigation;
- webhook authentication and authorization;
- strict rate limiting;
- webhook idempotency;
- support ticket creation/reuse with a concurrency guard;
- asynchronous support-agent notification and support-image delivery;
- configurable automatic join-request approval policy;
- scheduled-job execution infrastructure;
- Telegram API retry/backoff for 429 and 5xx responses;
- structured operational logging without message-body logging.

The following feature domains remain product implementation work and must not be represented as complete until their commands, persistence, callbacks, failure modes, and tests are implemented:

- content lifecycle;
- buttons/workflow editor;
- automation rules;
- schedule management UI;
- broadcast authoring and audience management;
- approvals workflow;
- knowledge management;
- task management;
- poll management.

The repository may contain navigation handlers for those domains, but navigation is not feature completion. See `docs/COMMAND-MATRIX.md` for the exact product status.

## 8. Deployment authority

The deployment source of truth is `wrangler.jsonc` plus the CI pipeline. The repository intentionally contains placeholders for Cloudflare resource IDs. Production resource IDs and secrets are injected by the deployment environment and are not committed.

The repository uses GitLab CI. The pipeline must validate, test, build, deploy staging on the default branch, smoke test staging, and expose production as a protected/manual deployment from a tag.

Cloudflare Worker versions are immutable deployment artifacts; rollback is performed by promoting a known-good Worker version rather than editing production code in the dashboard. citeturn241247search13

## 9. Change policy

Any change to one of the following requires the corresponding source-of-truth files to be updated in the same change:

- environment variables → `wrangler.jsonc`, `.dev.vars.example`, deployment docs;
- Durable Object classes → `src/durable-objects/*`, Wrangler DO bindings/migrations, tests;
- queue consumers/producers → `src/queue/*`, Wrangler queue bindings, runbook/tests;
- command behavior → router, feature handler, tests, command matrix;
- security assumptions → `SECURITY.md` and deployment docs.

No dashboard-only configuration is considered durable architecture unless it is documented as an external secret or Cloudflare resource ID.
