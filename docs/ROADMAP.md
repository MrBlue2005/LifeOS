# RX LifeOS Roadmap

## Roadmap principles

- Complete and validate each core user loop before expanding it.
- Find It is the first fully implemented module; Buy Later follows.
- Phase placement is a scope boundary, not a calendar commitment.
- Every phase must preserve data ownership, module independence, and the rule that AI is not application memory.
- Later work requires evidence of user value and a proportionate review of privacy, security, reliability, maintenance, and cost.

## Phase 0 — Foundation

### Objective

Create the smallest secure platform foundation on which Find It can be built without committing RX LifeOS to unnecessary infrastructure or a premature visual system.

### Major deliverables

- Confirm the Next.js/React/TypeScript scaffold and repository conventions.
- Establish strict TypeScript, formatting, linting, testing, and environment validation.
- Preserve authentication and ownership as explicit Phase 1 entry decisions without implementing them prematurely.
- Record the PostgreSQL/Supabase direction and environment boundary without clients, schemas, migrations, or credentials.
- Establish the RX LifeOS application shell and initial mobile-first design tokens when UI work is authorized.
- Define server/client boundaries, validation patterns, secure secret handling, and minimal safe observability.
- Define private storage behavior before accepting images.
- Record architecture decisions and resolve only the open decisions required for Phase 1.

### Success condition

The RX LifeOS shell runs locally, exposes its two placeholder modules through a tested typed registry, and passes linting, strict type checking, unit tests, and a production build without external credentials.

### Explicit non-goals

- Implementing the Find It or Buy Later product loops.
- Implementing authentication, ownership, PostgreSQL/Supabase, migrations, or Row Level Security.
- Finalizing the complete visual design system.
- Configuring AI providers without a Phase 1 requirement.
- Building notifications beyond the smallest foundation actually needed.
- Microservices, queues, Redis, vector databases, plugin frameworks, or future modules.

## Phase 1 — Find It MVP

**Status:** Implemented and operationally validated against the remote Supabase development project. Email/password authentication, the authenticated save/find/edit/move workflow, deterministic search with full paths, safe non-empty location deletion, and cross-user RLS isolation passed manual validation. Phase 1.5 Find It UX polish and Phase 1.6 deployment/PWA readiness are complete. Automated lint, type checking, unit/domain tests, and the production build pass. The local-oriented pgTAP database suite has not yet been executed.

### Objective

Make the promise **“I saved where something is, and later RX LifeOS helped me find it”** dependable for real use.

### Major deliverables

- Generic owner-scoped parent-child location hierarchy.
- Location create, rename, move, and safe archive/delete behavior.
- Item create, view, edit, move, and archive/delete behavior.
- Current item placement and full-path display.
- Deterministic name search, followed by user aliases/simple text matching if needed.
- Mobile-first save, organize, search, and result flows.
- Clear empty, duplicate-name, missing-location, and not-found states.
- Authorization/RLS, hierarchy invariant, domain, and critical end-to-end tests.
- Product feedback focused on recall success, search failures, and manual-entry friction.

Optional only after the core loop is stable: a private non-AI photo attachment with defined retention and deletion behavior.

### Success condition

Target users repeatedly save items into arbitrary nested locations and later retrieve the correct current path quickly, with no cross-owner access and without an AI call for ordinary searches.

### Explicit non-goals

- Buy Later implementation.
- Required photo recognition or AI-generated inventory.
- Semantic/vector search or an LLM as inventory memory.
- Bulk scanning, OCR, barcode workflows, or advanced offline synchronization.
- Cross-module intelligence.
- Hardcoded home/room/shelf/container levels.
- Movement history, which remains deferred until user evidence shows it is needed.

## Phase 2 — Buy Later MVP

**Status:** Implemented and operationally validated against the linked remote Supabase development project, with migration history synchronized through `20260910190000_fix_buy_later_reminder_conflict_target.sql`. Manual save/edit/delete, optional URL and price/currency, Waiting and Due views, explicit rescheduling, purchased/dismissed outcomes, history, real-iPhone LAN reconsideration controls, and cross-user RLS isolation passed live validation. Phase 2.6 authenticated Share Intake, Phase 2.7 title-only metadata enrichment, and Phase 2.8 local URL slug fallback are complete, deployed, and production-validated through the iPhone Apple Shortcut flow. The intake resolves names in this order: explicit safe title → best-effort server-side metadata title → conservative local URL slug → manual entry. Phase 2.10 is complete: consented Web Push opt-in, privacy preference, manual test delivery, protected automatic eligibility and scheduling, and production delivery are live. The local-oriented Buy Later pgTAP suite has not yet been executed. No recurring fetching, price extraction, broad scraping, native share target, or AI were introduced.

**Phase 2.10B:** `20260908180000_add_buy_later_push_mutations.sql` is applied remotely. Explicit opt-in, a push-only service worker, browser PushManager registration, user-owned subscription persistence, timezone capture, privacy toggle, and user-level disable are implemented. Permission prompts only follow the Enable action.

**Phase 2.10C Checkpoint 1:** a server-only VAPID transport and a current-user manual test-send action are implemented and production-validated. Tests exercise generic/private payload construction, all-active-subscription selection, expired-subscription cleanup, and safe responses.

**Phase 2.10C Checkpoint 2:** complete and production-validated. The service-only atomic claim function, protected Node.js scheduler route, bounded per-device Web Push delivery, and sent/failed/revoked recording are live. `20260910170000_add_buy_later_reminder_claims.sql`, `20260910180000_fix_buy_later_reminder_claim_ambiguity.sql`, and `20260910190000_fix_buy_later_reminder_conflict_target.sql` are applied remotely. Supabase Cron runs at `5 * * * *` through `pg_net`, with stable-origin and scheduler-secret values held in Vault; no credential appears in a migration. Eligibility is stored-timezone local date/time at or after 09:00, with a rollout-date gate that suppresses old-item backlog. Production validation covered a real scheduler-to-iPhone delivery and an immediate duplicate-free second invocation.

**Future notification work:** configurable reminder times, retry policy, notification history UI, advanced preferences, cross-device subscription-management UI, notification analytics, native push/app integrations, and scaling or pagination beyond the current 1,000-user, three-items-per-user, 250-push MVP bounds remain deferred.

### Objective

Make the promise **“I saved something I may want to buy, RX LifeOS remembers it, and helps me decide later”** useful without depending on universal automatic price tracking.

### Major deliverables

- Purchase-intention create, view, edit, permanent-delete, and history flows.
- Optional URL, current price/currency, and notes in the initial save flow.
- Automatic date-added and an explicit/default reconsideration date.
- Due reconsideration experience with reschedule, purchased, and dismissed transitions.
- In-app due-state presentation; add an external reminder channel only if validated and operationally justified.
- Deterministic insights such as waiting time and supported archived-value totals.
- Optional manual price observations and comparisons beyond the current saved price.
- Optional store, target price, priority, category, and product image/reference metadata after the core decision flow is stable.
- Ownership, state-transition, scheduling, idempotency, and critical end-to-end tests.
- Further limited metadata capture beyond the implemented title-only intake, only when user-reviewable and source-compliant.

### Success condition

Target users consolidate real purchase intentions and complete scheduled reconsiderations, including deferring and confidently archiving items, while the module remains valuable when no price is fetched automatically.

### Explicit non-goals

- Universal scraping or a crawler platform.
- Guaranteed support for arbitrary merchants.
- Automatic price tracking as an MVP dependency.
- AI calls for routine checks, calculations, or reminders.
- Checkout, purchasing, affiliate monetization, budgeting, or financial integrations.
- Find It/Buy Later recommendations.

## Phase 3 — Cross-module Intelligence

### Objective

Evaluate and, only if validated, introduce narrowly useful collaboration between independently successful modules.

### Major deliverables

- User research validating a specific cross-module problem, such as avoiding a purchase because a similar owned item already exists.
- An explicit Core-level contract that does not expose either module's internals.
- Conservative matching with transparent evidence, uncertainty, and user control.
- Privacy boundaries, opt-in/disable behavior where appropriate, and cost limits.
- Measurement of usefulness, false positives, latency, and AI usage.

### Success condition

A validated cross-module prompt helps users make better decisions often enough to justify its complexity, while each module remains independently operable and owns its data and rules.

### Explicit non-goals

- Merging Find It and Buy Later schemas or business logic.
- Unrestricted data sharing between modules.
- Sending a user's full inventory and wishlist to an LLM.
- A generic event platform, recommendation engine, or vector infrastructure without demonstrated need.
- Adding new modules merely to showcase cross-module behavior.

## Phase 4 — Future Modules / Advanced Capabilities

### Objective

Expand RX LifeOS only after the first modules demonstrate retention and reveal specific recurring problems worth solving.

### Major deliverables

Potential investigations—not commitments—include:

- **Keep It:** define the distinct recurring problem before any build work.
- **Lend It:** track lending and return reminders if users demonstrate a need.
- **Maintain It:** track maintenance schedules and history for owned things.
- **Supplies:** help monitor consumables and replenishment without becoming a generic shopping platform.
- Advanced Find It capture, including reviewed photo recognition, OCR, or barcode input.
- Search enhancements, including fuzzy, semantic, or LLM-assisted interpretation only where measured failures justify them.
- Carefully scoped Buy Later price observations through merchant, affiliate, third-party, browser-side, or user-assisted approaches that pass reliability, legal/Terms of Service, privacy, maintenance, and cost review.
- Native capabilities only where the PWA cannot deliver a validated experience.

Each candidate module receives its own product definition, MVP boundary, architecture review, and success metric before implementation.

### Success condition

At least one validated capability or module extends the ecosystem with a repeatable user benefit while preserving RX LifeOS simplicity, trust, modularity, and sustainable cost.

### Explicit non-goals

- Implementing all named concepts.
- Building a generic plugin marketplace or module framework in anticipation of demand.
- Expanding into unrelated productivity features.
- Adding microservices, queues, vector databases, or scraping fleets because the product has grown in feature count alone.
- Using AI where stored data and deterministic logic provide a reliable answer.

## Advancement gates

Before advancing a phase, review:

1. Whether the current phase's success condition is met with real usage or credible validation.
2. Whether unresolved privacy, security, deletion, or ownership decisions block safe operation.
3. Whether the next capability has a concrete product requirement rather than only demo appeal.
4. Whether operating cost and maintenance remain proportionate.
5. Whether `PRODUCT.md`, `ARCHITECTURE.md`, `MVP.md`, this roadmap, and `AGENTS.md` remain aligned.
