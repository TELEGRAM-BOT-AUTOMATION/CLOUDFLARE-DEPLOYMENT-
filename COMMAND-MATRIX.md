# Command Matrix

This file is authoritative for command availability. A command marked `navigation` must not be described as an implemented business workflow.

| Command | Status | Current behavior | Production completion condition |
|---|---|---|---|
| `/start` | implemented | welcome panel + configured URL/support buttons | protected by webhook/auth tests |
| `/panel` | implemented | unified navigation panel | feature callbacks must match enabled features |
| `/support` | implemented foundation | ticket create/reuse + queued agent/image delivery | add reply lifecycle, ownership, closure UI |
| `/community` | partial | admin entry point + configurable join-request policy | member management, permissions, join audit |
| `/content` | navigation | informational handler | content entity, drafts, preview, publish, archive, tests |
| `/buttons` | navigation | informational handler | persistent keyboard/action model |
| `/automation` | navigation | informational handler | rule model, event matching, scheduling, retry semantics |
| `/schedule` | navigation | informational handler + cron infrastructure | job CRUD, retention UI, timezone policy |
| `/broadcast` | navigation | admin informational handler | audience selection, queue batching, throttling, delivery audit |
| `/approvals` | navigation | admin informational handler | approval records, actor permissions, callbacks |
| `/knowledge` | navigation | informational handler | document/FAQ model and retrieval flow |
| `/tasks` | navigation | informational handler | task records, assignment, lifecycle, callbacks |
| `/polls` | navigation | informational handler | poll lifecycle and state persistence |

A command must move from `navigation` to `implemented` only when its business behavior, persistence, authorization, callback paths, retry semantics, and automated tests are present.
