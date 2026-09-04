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

## Phase 2 — Buy Later MVP

### Objective

Make the promise **“I saved something I may want to buy, RX LifeOS remembers it, and helps me decide later”** useful without depending on universal automatic price tracking.

### Major deliverables

- Purchase-intention create, view, edit, archive/delete, and reopen flows.
- Optional URL and notes in the initial save flow.
- Automatic date-added and an explicit/default reconsideration date.
- Due reconsideration experience with Yes, No, and Ask me later transitions.
- In-app reminder delivery; add one external channel only if validated and operationally justified.
- Deterministic insights such as waiting time and supported archived-value totals.
- Optional manual price observations and comparisons.
- Optional store, price/currency, target price, priority, category, and product image/reference metadata after the core decision flow is stable.
- Ownership, state-transition, scheduling, idempotency, and critical end-to-end tests.
- Investigation of limited metadata capture that remains user-reviewable and source-compliant.

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
