# RX LifeOS MVP Scope

## Scope rule

RX LifeOS will establish a small shared foundation, make **Find It** fully useful first, and then deliver **Buy Later**. “MVP” means the smallest dependable product loop a real user can repeat—not a demonstration of every future capability.

Priority labels:

- **MUST HAVE:** required to make the module's promise true and safely usable.
- **SHOULD HAVE:** high-value follow-up once the core loop is stable; may ship within an MVP iteration but cannot delay proving the core loop.
- **LATER:** intentionally excluded from the initial MVP boundary.

## Shared foundation

### MUST HAVE

- One RX LifeOS application shell and official branding.
- Authenticated access and strict per-owner data isolation.
- A documented, consistently enforced ownership model.
- Mobile-first responsive behavior and basic accessibility.
- Server-side validation, safe error handling, and private secret management.
- Minimal settings needed by the active module.
- Basic operational visibility that excludes sensitive content.

### SHOULD HAVE

- Installable PWA essentials if they do not delay the Find It loop.
- A reusable private file-storage boundary before any image feature ships.
- A shared notification foundation before Buy Later reminders need external delivery.

### LATER

- A generalized module marketplace or plugin system.
- Rich shared activity feeds.
- Advanced cross-module orchestration.
- Native applications without a demonstrated PWA limitation.

## Find It MVP — first implementation priority

**Implementation and validation status:** The Phase 1 code implements the MUST HAVE save/find/edit loop with user-only ownership, email/password Supabase Auth, current placement only, case-insensitive partial name search, generic hierarchical locations, blocked non-empty location deletion, and explicit item hard-delete. Phase 1.5 Find It UX polish and Phase 1.6 deployment/PWA readiness are complete. The loop has been manually validated against the remote Supabase development project, including cross-user RLS isolation. Lint, type checking, unit/domain tests, and the production build pass automatically. The local-oriented pgTAP database suite has not yet been executed.

### Core success story

**“I saved where something is, and later RX LifeOS helped me find it.”**

### MUST HAVE

- Create, rename, move, and delete/archive locations in a generic parent-child hierarchy.
- Prevent location cycles and cross-owner relationships.
- Create an item with a name and assign it to one location.
- View an item's current full location path.
- Edit an item, change its location, and archive/delete it with clear behavior.
- Search the user's active items by normalized name using deterministic database/application logic.
- Display fast, clear results with the current location path.
- Enforce authentication and ownership on every item and location operation.
- Handle empty, duplicate-name, missing-location, and not-found states clearly.
- Include focused tests for hierarchy invariants, ownership isolation, item placement, and the save-then-find journey.

This boundary permits a small optional text note only if it does not complicate the central flow. Arbitrary fixed levels such as home/room/shelf/drawer are forbidden.

### SHOULD HAVE

- User-managed aliases for common alternate names.
- Simple partial/text matching after exact and alias matching.
- A lightweight recent-items or recent-search convenience.
- Movement history if user testing shows that knowing a previous location is important to trust.
- A polished reassignment flow when changing or removing locations that contain items or child locations.
- Optional single-photo attachment without AI, after private storage and deletion behavior are ready.

### LATER

- Photo-based multi-object detection and review.
- AI-generated aliases, categories, brands, or model guesses.
- Fuzzy matching beyond demonstrated need.
- Semantic/vector search.
- LLM-assisted ambiguous-query interpretation.
- Bulk imports, barcode scanning, OCR, offline synchronization, or advanced sharing.
- Cross-module “you already own this” intelligence.

### Explicitly not part of the Find It MVP

- Treating an LLM as inventory memory or querying it for ordinary retrieval.
- Automatic persistence of AI-detected objects without user confirmation.
- A vector database.
- A predefined room/shelf/container schema.
- Complex household permissions unless household sharing is explicitly selected as a launch requirement.

Photo recognition is not required to prove the Find It MVP. It may enter only after the manual save/find loop is dependable, private image handling is defined, structured output is validated, and users review every suggestion before persistence.

## Buy Later MVP — follows Find It

**Implementation and validation status:** The Phase 2 MVP migration is applied to the linked remote Supabase development project, with local and remote history synchronized through `20260908170000_create_buy_later_notifications.sql`. Manual purchase-intention entry, optional URL/price/currency/note, Waiting and Due states, explicit rescheduling, purchased/dismissed outcomes, history, separate permanent deletion, and cross-user RLS isolation passed live validation. Reconsideration presets and custom dates also passed real-iPhone LAN validation. Phase 2.6 authenticated Share Intake, Phase 2.7 metadata title enrichment, and Phase 2.8 URL slug fallback are complete, deployed, and production-validated through the iPhone Apple Shortcut flow. Phase 2.10A persistence/security policy passed remote RLS smoke validation. The local-oriented Buy Later pgTAP suite has not yet been executed.

**Phase 2.10B implementation:** `20260908180000_add_buy_later_push_mutations.sql` is applied to the linked remote project. The Buy Later Home has explicit Web Push opt-in, a narrow push-only service worker, browser subscription registration, authenticated owner-scoped persistence, browser timezone capture, lock-screen item-name privacy control, and user-level disable. Permission is never requested on load. The public VAPID key is configured through `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`; its private counterpart is not in the application. Scheduled due detection, VAPID sending, delivery claims, and Supabase Cron remain unimplemented.

The authenticated intake route resolves a title from an explicit shared title first, then title-only best-effort metadata, then a conservative local URL-slug fallback, then manual entry. The production iPhone flow is: eMAG App → Apple Shortcut “Save To RX LifeOS” → `/buy-later/import?url=...` → editable URL and name prefill → explicit Save. The local fallback never adds a network request or merchant-specific scraper. The intake never extracts price or other product data, never calls AI, and never persists before the user reviews and submits the existing form. Unsupported or blocked pages still fall back to manual entry.

### Core success story

**“I saved something I may want to buy, RX LifeOS remembers it, and helps me decide later.”**

### MUST HAVE

- Save a purchase intention with product name, optional URL, optional current price/currency, and optional notes.
- Capture the date added automatically.
- Let the user choose or receive a sensible default reconsideration date.
- Show active saved items and item details.
- Surface due reconsiderations in-app.
- Support explicit transitions from **considering** to **purchased** or **dismissed**, plus an “I still want it” action that requires a new future reconsideration date.
- Keep purchased and dismissed decisions available in history.
- Edit considering or resolved intentions and permanently delete them with clear behavior.
- Enforce authentication and ownership on every operation.
- Include focused tests for due dates, decision transitions, ownership isolation, and the save-then-decide journey.

### SHOULD HAVE

- External reminder delivery through one justified channel, subject to consent and preference handling.
- Optional store, target price, priority, and category fields.
- Optional product image/reference after its privacy, storage, and deletion behavior is defined.
- Simple calculated insights such as days waited and the total entered value of items archived after “No.”
- Manual price observations and deterministic comparison with the saved/target price.
- Further metadata assistance beyond the implemented title-only intake, but only when reliable, user-reviewable, and not dependent on universal server-side scraping.
- Filtering/sorting by status, date, priority, or category if the list becomes hard to use.

### LATER

- Automatic recurring price checks.
- Merchant APIs, affiliate APIs, third-party price services, or source-specific extraction adapters.
- Native share extensions, browser integrations, Web Share Target support where available, and screenshot extraction. These may build on the implemented authenticated `/buy-later/import` intake contract. The current iPhone Apple Shortcut opens that URL; RX LifeOS does not implement a native share extension or Web Share Target.
- Price-drop notifications.
- AI-assisted normalization or classification.
- Purchase completion, checkout, affiliate monetization, budgeting, or financial-account integrations.
- Cross-module recommendations.

### Explicitly not part of the Buy Later MVP

- Universal scraping, a crawler platform, or a promise that arbitrary stores can be tracked.
- Automatic price tracking as a prerequisite for usefulness.
- AI calls during each scheduled check.
- Claims about money saved unless the necessary user-entered or observed data supports the calculation.
- Shopping recommendations or marketplace behavior.

## MVP validation gates

Find It is ready to validate when an authenticated user can create a nested location, save an item there, leave, return, search by name, and see the correct full path—with verified isolation from other users.

Buy Later is ready to validate when an authenticated user can save a purchase intention, see an in-app due prompt at the intended time, reschedule it or mark it purchased/dismissed, and later understand the resulting state—with no dependency on automatic price retrieval.

Capabilities move from SHOULD HAVE or LATER only when evidence shows they improve these loops enough to justify complexity, risk, privacy exposure, and operating cost.
