#!/usr/bin/env bash
set -euo pipefail
: "${WORKER_URL:?WORKER_URL is required}"
HEALTH_ARGS=()
if [[ -n "${HEALTH_TOKEN:-}" ]]; then HEALTH_ARGS=(-H "Authorization: Bearer ${HEALTH_TOKEN}"); fi
curl --fail --silent --show-error "${WORKER_URL%/}/health" "${HEALTH_ARGS[@]}" | jq
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  curl --fail --silent --show-error "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq
fi
