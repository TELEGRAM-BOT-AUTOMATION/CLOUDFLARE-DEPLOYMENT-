# TeamMarySy Telegram Bot

Production-grade Cloudflare Workers foundation for a Telegram-native automation bot.

The authoritative architecture and deployment contract are:

- `docs/PRODUCTION-SOURCE-OF-TRUTH.md`
- `DEPLOYMENT.md`
- `SECURITY.md`
- `wrangler.jsonc`
- `.gitlab-ci.yml`
- `docs/COMMAND-MATRIX.md`

## Architecture

Telegram webhook traffic enters one Cloudflare Worker. Workers KV stores read-heavy and eventually-consistent metadata. SQLite-backed Durable Objects provide strong coordination for update idempotency, rate limiting, and job claims. Cloudflare Queues handle deferred/retryable outbound Telegram work. This split matches Cloudflare's current storage guidance: KV is eventually consistent, while Durable Objects are intended for coordination and consistent state. citeturn241247search0turn243569search1

## Current production guarantees

The runtime implements webhook secret validation, duplicate-update suppression, atomic user/chat rate limiting, bounded scheduled-job execution, Telegram 429/5xx retry/backoff, queue retries with a dead-letter queue, a protected health endpoint, and concurrency protection for support ticket creation.

The feature-domain handlers that remain UI shells are explicitly documented as incomplete. The repository does not treat navigation text as implementation completion.

## Local development

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run ci
npm run dev
```

## Required resources

Provision two KV namespaces and environment-specific outbound queues. Durable Objects are created automatically from the Wrangler configuration using SQLite-backed storage. Cloudflare recommends SQLite-backed Durable Objects for new namespaces. citeturn243569search1turn243569search5

## Secrets

Set:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
HEALTH_TOKEN
```

Set administrator and product configuration as protected deployment variables.

## Webhook

Use `scripts/set-webhook.sh` after deployment:

```bash
export TELEGRAM_BOT_TOKEN=...
export TELEGRAM_WEBHOOK_SECRET=...
export WORKER_URL=https://...
./scripts/set-webhook.sh
```

## CI/CD

GitLab is the only deployment pipeline defined by this repository. Default-branch commits deploy staging. Production deploys are manual, protected, tag-based, and serialized with `resource_group: production`.

## Testing

The existing test suite focuses on repository and pure-function checks. Production feature work must add integration coverage for bindings, Durable Objects, queues, webhook behavior, and Telegram API failure handling before the corresponding feature is declared complete. Cloudflare's current guidance recommends Workers Vitest integration for runtime-level tests. citeturn132975search2turn132975search5
