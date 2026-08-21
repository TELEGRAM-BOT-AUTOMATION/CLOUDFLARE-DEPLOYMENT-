# Security Model

## Webhook authentication

Require `X-Telegram-Bot-Api-Secret-Token` on every Telegram webhook request. Validate it before parsing or processing an update.

## Authorization

`OWNER_IDS`, `ADMIN_IDS`, and optional `ALLOWED_CHAT_IDS` are deployment configuration. Feature handlers requiring administrative control must call the central authorization functions rather than duplicating role parsing.

Join-request approval is policy-driven through `AUTO_APPROVE_JOIN_REQUESTS`; the joining user is never treated as an administrator merely because Telegram emitted a join-request update.

## State security

Do not use Workers KV for security-sensitive atomic operations. KV is eventually consistent and concurrent writes to a single key can overwrite one another. Durable Objects are used for coordination and strict rate limiting. citeturn241247search16

## Queue security

Queue payloads must contain only the minimum operational data required for delivery. Queue messages must not contain secrets or unnecessary conversation history.

## Logging

Log only operational metadata such as update type, update ID, chat ID, user ID, handler, outcome, and latency. Never log bot tokens, webhook secrets, message bodies, or complete support conversations.

## Secrets

Store Telegram tokens, webhook secrets, and health credentials as Cloudflare Worker secrets or protected CI variables. Rotate them using a controlled deployment process.
