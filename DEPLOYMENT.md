# Production Deployment Runbook

This runbook is the operational source of truth for deploying TeamMarySy Bot.

## Prerequisites

Node.js 22+, npm, Wrangler 4+, a Cloudflare account, a Telegram bot token, and a production/staging Telegram bot pair.

Create two KV namespaces and two environment-specific queue sets. The Wrangler file references placeholder resource IDs that must be replaced in the protected CI environment or in a deployment-specific config branch.

New Durable Objects should use SQLite-backed storage. Cloudflare currently recommends SQLite-backed Durable Objects for new coordination workloads. citeturn243569search1turn243569search5

## Secrets

Production secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `HEALTH_TOKEN` (recommended)

Production variables:

- `OWNER_IDS`
- `ADMIN_IDS`
- `ALLOWED_CHAT_IDS` when the bot is restricted
- URLs and support settings
- feature flags

Never commit secret values.

## Provisioning

Create KV namespaces:

```bash
npx wrangler kv namespace create TEAMMARYSY_STATE --env staging
npx wrangler kv namespace create TEAMMARYSY_STATE --env production
```

Create queues:

```bash
npx wrangler queues create teammarysy-outbound-staging
npx wrangler queues create teammarysy-outbound-staging-dlq
npx wrangler queues create teammarysy-outbound
npx wrangler queues create teammarysy-outbound-dlq
```

The exact namespace IDs are inserted into the environment-specific Wrangler configuration before deployment. Queue configuration is committed in `wrangler.jsonc`. Wrangler supports queue consumers with retries, dead-letter queues, concurrency limits, and retry delays. citeturn132975search10turn132975search13

## First deployment

Install dependencies and validate:

```bash
npm ci
npm run format:check
npm run lint
npm test
npm run typecheck
```

Deploy staging:

```bash
npm run deploy:staging
```

Verify:

```bash
curl -fsS "$STAGING_WORKER_URL/health"
curl -fsS "$STAGING_WORKER_URL/health" -H "Authorization: Bearer $HEALTH_TOKEN"
```

Set the Telegram staging webhook using the staging bot token and Worker URL. Verify with `getWebhookInfo` and then test `/start`, `/panel`, `/support`, and a callback button.

Deploy production only through the protected GitLab tag workflow.

## Webhook configuration

Use Telegram's `setWebhook` with the same secret stored in `TELEGRAM_WEBHOOK_SECRET`.

```bash
curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WORKER_URL}&secret_token=${TELEGRAM_WEBHOOK_SECRET}"
curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

Do not use IP allowlists as the primary webhook control. The secret-token header is the canonical application-layer check.

## Rollback

Rollback by deploying a previously validated Worker version. Do not patch production code in the dashboard and do not change secrets to work around a bad build.

Before rollback, verify whether the release changed Durable Object schemas or job payloads. Worker versions track code/config/bindings, but storage state is not versioned with the Worker deployment. citeturn241247search13

## Incident checks

Check in this order:

1. Cloudflare Worker logs for webhook/queue errors.
2. Telegram `getWebhookInfo` for `last_error_message`, pending updates, and URL.
3. Queue backlog and DLQ depth.
4. Durable Object coordination errors.
5. KV job metadata and due-job counts.
6. Telegram API 429/5xx frequency.

Never log or paste bot tokens, webhook secrets, full message bodies, or user conversation history into incident channels.
