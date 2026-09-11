# RX LifeOS Architecture

## Status and intent

This document establishes the implemented V1 architecture and its safe extension boundaries. V1 is production validated, including real installed-iPhone PWA workflows, but that validation is not exhaustive across devices or browsers. Feature development is closed pending Usage / Evidence Mode evidence; decisions with meaningful cost, privacy, or scope impact remain explicitly open until evidence is available.

The local Supabase pgTAP suites remain unexecuted where Docker/Podman local Supabase is unavailable. This is non-blocking for V1: remote RLS and runtime validation was completed for shipped work.

## Architectural goals

- Deliver Find It first and Buy Later second with a small team and simple operations.
- Keep module business logic independent while sharing true platform capabilities.
- Make user data authoritative, secure, portable, and understandable.
- Spend AI and infrastructure budget only where it creates product value.
- Preserve a path for future modules without building a plugin system now.

## System shape

RX LifeOS should begin as a **modular monolith** in one Next.js/TypeScript application and one PostgreSQL database. Supabase is the preferred managed platform for PostgreSQL, Authentication, Storage, and Row Level Security where it fits. The application should remain compatible with Vercel-style deployment.

Logical boundaries:

```text
Browser / installed PWA
        |
        v
Next.js application
  ├── Core
  ├── Find It
  └── Buy Later
        |
        +── PostgreSQL / Auth / private object storage
        +── AI provider through server-side AI gateway
        +── scheduled invocation for due work
```

These are code and ownership boundaries inside one deployable system, not network services.

## Domain boundaries and responsibilities

### Core

Core may own:

- authentication integration and request identity;
- user profiles and the active ownership context;
- household/workspace membership and roles if the selected MVP ownership model needs them;
- authorization primitives and database policy conventions;
- private image/file storage interfaces;
- shared notification delivery and preference primitives;
- a narrow AI gateway and provider adapters;
- shared settings;
- common activity/event primitives backed by ordinary database records when required;
- application shell, navigation, shared UI primitives, and design tokens;
- observability, audit-safe metadata, and security utilities.

Core must not own item-location rules, wishlist decision rules, price-history rules, or other module-specific behavior.

### Find It

Find It owns:

- inventory items and their descriptive metadata;
- item aliases;
- generic hierarchical locations;
- current item-to-location assignment;
- item movement/history semantics when introduced;
- Find It search and ranking behavior;
- image import review workflow and detection records if/when introduced;
- module-specific routes, commands, queries, validation, and UI.

The location model is a generic adjacency tree: each location has an optional parent within the same ownership scope. Depth and labels are not hardcoded. The implementation must prevent cycles and cross-owner parent links.

### Buy Later

Buy Later owns:

- saved purchase intentions;
- product links and user-entered/extracted metadata;
- user-entered current price and future price observations when available;
- reconsideration timing and decision state;
- purchased/dismissed resolution and history behavior;
- Buy Later reminders and derived insights;
- future source-specific extraction/price observation adapters;
- module-specific routes, commands, queries, validation, and UI.

Buy Later must remain useful with manual product data and reconsideration reminders. Automatic price tracking is optional and must not shape the foundational architecture as though universal extraction were reliable.

## Dependency rules

Allowed dependency direction:

```text
app composition → Core public interfaces
app composition → module public interfaces
Find It         → Core public interfaces
Buy Later       → Core public interfaces
Core            → shared infrastructure adapters
```

Disallowed dependencies:

- Core importing module business logic.
- Find It importing Buy Later internals or tables through implementation-specific repositories.
- Buy Later importing Find It internals or tables through implementation-specific repositories.
- Client components importing privileged database clients, secrets, provider SDKs, or server-only modules.
- Domain rules depending directly on Gemini, Supabase, Vercel, or notification-vendor response types.

Future cross-module behavior should be composed at an application/Core boundary through explicit read contracts or a small persisted domain event. A message broker is not warranted. Direct SQL coupling across module-owned tables should not become an informal integration API.

## Server and client boundaries

### Client responsibilities

- render responsive, accessible interaction flows;
- manage ephemeral presentation state and optimistic feedback where safe;
- submit validated commands and display typed query results;
- perform no privileged data access and contain no service secrets;
- treat browser-provided or client-extracted metadata as untrusted input.

### Server responsibilities

- authenticate the caller and resolve ownership context;
- authorize every command and query;
- validate inputs and outputs at trust boundaries;
- execute domain rules and database transactions;
- create short-lived storage access URLs when needed;
- call AI and other private providers;
- schedule or process due work;
- return the minimum data needed by the client.

Prefer Next.js server capabilities and ordinary request/response operations. Introduce a separate backend service only after a concrete requirement cannot reasonably be met in the monolith.

## Data ownership and preliminary model

PostgreSQL is the durable source of truth. For the Find It MVP, each location and item belongs directly to one authenticated Supabase user. Household/workspace ownership is intentionally deferred; the use of explicit UUID ownership columns and same-owner relationship constraints leaves room for a deliberate future migration without introducing speculative ownership abstractions now.

Preliminary domain concepts—not migration-ready schemas—are:

| Boundary | Concepts |
|---|---|
| Core | User profile, ownership scope, membership/role, notification preference/delivery, file reference, shared setting |
| Find It | Item, item alias, location, current placement, movement record, image/import review |
| Buy Later | Purchase intention, product source/link, price observation, reconsideration schedule, decision/archive record |

Rules:

- Database identifiers, ownership, timestamps, and relationships are authoritative.
- AI confidence and suggestions are metadata, never proof or authorization.
- Store durable file references rather than temporary signed URLs.
- Prefer explicit lifecycle states over inferring state from nullable fields.
- Add audit/history records only for a defined product or recovery need; movement history is expected for Find It but need not block its first useful flow.
- Use transactions for tree changes, item moves, decisions, and other multi-record invariants.

### Find It MVP schema

`public.find_it_locations` stores `id`, `user_id`, `name`, nullable `parent_id`, and timestamps. A composite `(user_id, parent_id)` foreign key ensures a parent belongs to the same user. A trigger prevents cycles, with a per-user transaction advisory lock to make concurrent hierarchy moves safe. Sibling names are unique case-insensitively. Deletion is restricted while child locations or items exist.

`public.find_it_items` stores `id`, `user_id`, `name`, optional `description`, required `location_id`, and timestamps. Its composite `(user_id, location_id)` foreign key requires the current location to belong to the same user. Items use explicit permanent deletion in this MVP; movement history and archives are not stored.

Both tables derive `user_id` from `auth.uid()` by default, validate field lengths in PostgreSQL, update timestamps through triggers, and have indexes for ownership and relationships.

## Search architecture

Find It search should advance only as observed needs justify it:

1. normalized exact name match;
2. alias match;
3. PostgreSQL text search and sensible partial matching;
4. fuzzy matching using a PostgreSQL capability if required;
5. semantic/vector search only after measured evidence of insufficiency;
6. LLM-assisted interpretation only for genuinely ambiguous queries.

After an item is identified, location retrieval is a normal authorized database query. Do not send the user's inventory wholesale to an LLM.

Find It Alias-Aware Recall is complete and production validated. The repository search uses escaped, case-insensitive partial `ILIKE` matching on canonical item names and owner-scoped normalized aliases. Canonical matches rank before alias-only matches; each group orders by `updated_at DESC, id ASC`, and the combined result set is capped at 50 items. Alias rows are fetched separately, their matching items are fetched in one batch, and duplicate item IDs collapse in application code. If multiple aliases match one item, the first database-ordered normalized alias (then alias-row ID) is retained as match metadata; alias-only result rows display that one matched alias while canonical matches do not add redundant metadata. The server loads the authenticated user's location rows and derives each result's complete current path with bounded application-side parent traversal. Alias display values are trimmed and whitespace-collapsed; application validation applies NFC and lowercase normalization while preserving punctuation and diacritics. No transliteration or unaccent matching is claimed. An item's edit screen supports owner-scoped alias add/remove in a separate form, so unsaved canonical-item edits are not submitted or discarded by alias changes. Aliases are validated against the current saved canonical name; item renames and moves do not rewrite existing aliases. Alias creation during initial item creation, alias editing-in-place, and automatic suggestions remain deferred. No path cache, full-text index, fuzzy matching, vectors, or AI is present.

## AI gateway

AI calls are server-side and pass through a small application-level gateway. Feature code should request a capability such as “extract inventory candidates from image” or “interpret ambiguous item query,” receive an application-owned structured result, and remain insulated from provider SDK types.

The boundary should provide:

- application-owned input/output types;
- runtime schema validation;
- provider timeout and error translation;
- minimal usage/cost telemetry without sensitive content;
- configurable model/provider selection at the adapter boundary;
- explicit confidence/uncertainty fields where useful.

Gemini is the initial candidate provider, not a domain dependency. Do not build a provider marketplace or elaborate orchestration layer.

For image import, detected objects remain draft suggestions. The user can confirm, edit, remove, or reject them before permanent item records are created.

## Notifications

Notifications should be represented as module-owned intent plus a shared Core delivery mechanism:

- a module determines **what** is due and why;
- Core applies user preferences and handles **how** it is delivered;
- delivery attempts use stable identifiers to avoid duplicates;
- handlers are idempotent and safe to retry.

Start with the smallest channel that supports the chosen PWA/user experience. In-app reminders may precede web push or email. Do not add a queue or broker for initial scheduled volume.

## Storage architecture

- Store files in private buckets partitioned and authorized by ownership scope.
- Persist stable object paths and metadata in PostgreSQL; issue short-lived signed URLs only after authorization.
- Validate upload type and size, use unpredictable object keys, and strip or deliberately handle image metadata where privacy requires it.
- Define thumbnail/transcoding needs only when real upload and display constraints are known.
- Establish deletion propagation, retention, and orphan cleanup before production image storage.
- AI processing should receive only the required asset for the required duration, subject to documented provider privacy terms.

## Authentication and authorization

Supabase Auth is the implemented identity provider. The MVP supports email/password sign-up, email confirmation, sign-in, and sign-out. The Next.js 16 proxy and server client use `@supabase/ssr` cookie adapters; server authorization uses verified `auth.getClaims()` results rather than trusting cookie session data.

Authorization must verify both the requested record and its ownership scope. Client-supplied owner IDs are not trusted. Service-role credentials, if required, remain server-only and are used narrowly; ordinary user operations should preserve user-scoped database enforcement.

All ordinary application data access and mutations use server-side, publishable-key clients carrying the user's cookie session. The automatic Buy Later scheduler alone uses the server-only service-role key for its service-only claim and delivery boundary; it is never accepted from a client request or exposed to client code. Direct browser Supabase data access is not needed in this MVP. Password recovery and social providers remain deferred.

## Security model

Primary risks include disclosure of home interiors, precise object/document locations, purchase behavior, and cross-tenant data.

Baseline controls:

- deny-by-default authorization and Row Level Security;
- server-only secrets and AI calls;
- private storage with authorized, expiring access;
- runtime validation of requests, extraction results, and AI output;
- CSRF/origin protections appropriate to chosen Next.js mutation mechanisms;
- rate and size limits on uploads and expensive endpoints;
- sanitized logs and observability without sensitive payloads;
- explicit account/data deletion and image retention behavior;
- dependency and security review proportional to exposure;
- tests proving that one ownership scope cannot access another.

A lightweight threat model should be completed before any public or household-sharing release.

## Scheduled and background work

Use the smallest secure Supabase-native scheduled mechanism (for example, Supabase Cron / pg_cron where supported) to select due database rows and process them in small idempotent batches. Protect scheduled execution, record attempt/outcome state, and prevent duplicate reminders with stable keys or database constraints.

Do not introduce a persistent queue initially. Re-evaluate only if execution limits, volume, retry requirements, or provider latency create demonstrated failures.

Price observation, if later introduced, must use source-specific lawful mechanisms and conservative scheduling. It must not call AI for every check or become a universal crawler.

## Preliminary directory structure

This structure is illustrative and should be adapted to the actual scaffold when implementation begins:

```text
src/
  app/                       # Next.js routes and composition
  core/
    auth/
    ownership/
    notifications/
    storage/
    ai/
    settings/
    security/
  modules/
    find-it/
      domain/
      application/
      infrastructure/
      ui/
    buy-later/
      domain/
      application/
      infrastructure/
      ui/
  shared/                    # Small, domain-neutral utilities/UI only
tests/
docs/
```

Public module entry points should expose only necessary commands, queries, and UI composition. Directory layers should not be created empty merely to match this diagram.

### Phase 0 implementation boundary

Phase 0 uses the App Router for composition, small shared shell components under `src/core/components`, and one typed registry under `src/core/modules`. Find It and Buy Later each expose only a public module definition from their module root. Domain, application, infrastructure, database, authentication, storage, notification, and AI directories will be introduced only when they gain a real caller in a later phase.

### Phase 1 implementation boundary

Core provides email/password authentication and cookie-based Supabase SSR infrastructure. Find It owns its validation, hierarchy utilities, server actions, user-scoped queries, and route UI. PostgreSQL constraints and RLS remain the final authorization/integrity boundary even though server actions also derive and filter by the verified user ID.

Phase 1 has been manually validated against the remote Supabase development project: authentication, authenticated location hierarchy CRUD, item CRUD and movement, deterministic search, complete path retrieval, safe non-empty location deletion blocking, and cross-user visibility isolation all succeeded in the tested workflow. Repository lint, type checking, unit/domain tests, and production builds are automatically validated. The pgTAP suite remains unexecuted because it depends on a local Supabase/PostgreSQL environment and Supabase testing helpers; those helpers were intentionally not added to the remote development database solely for test execution.

### Phase 2 implementation boundary

Buy Later owns one `buy_later_items` table and its routes, validation, exact decimal-string price handling, lifecycle rules, server actions, user-scoped queries, and UI. An item begins as `considering`; it may be rescheduled to a future date while remaining active or transition once to `purchased` or `dismissed`. Resolution time is stored explicitly, and resolved records form the history view. The schema enforces owner identity, field limits, price/currency pairing, lifecycle consistency, and RLS in addition to application checks.

The Phase 2 MVP migration is applied to the linked remote Supabase development project, with local and remote migration histories synchronized through `20260910190000_fix_buy_later_reminder_conflict_target.sql`. The complete save, wait, reconsider, reschedule, purchase, dismiss, history, and separate permanent-delete lifecycle has been manually validated live, including cross-user RLS isolation. Reconsideration presets and custom dates were also validated on a real iPhone over LAN development access. Phase 2.10A remote validation covered notification preferences, subscriptions, idempotent delivery claims, and their RLS boundaries. Phase 2.10B adds a push-only worker and authenticated narrow RPC mutations that never reveal stored subscription capability data. Phase 2.10C is live: a server-only VAPID transport, service-role subscription reads confined to notification delivery, safe same-origin payloads, manual test delivery, and 404/410 subscription deactivation support the protected automatic scheduler. Supabase Cron runs at minute `:05` through `pg_net`, reads the stable Vercel scheduler URL and bearer secret only from Vault, and invokes the Node.js route. The route validates its server-only secret, atomically claims bounded per-device rows before sending, records terminal outcomes, and never accepts a client target or payload. It selects at most 1,000 users, three items per user, and 250 pushes per invocation; it applies stored IANA timezone local date/time at or after approximately 09:00 and a rollout-date gate prevents old overdue backlog. A delivery identity is one item, reconsideration date, subscription, and channel; multiple active subscriptions, including reinstalled PWA subscriptions on one physical device, remain independent identities. Failed claims have no automatic retry; definitive 404/410 provider responses deactivate stale subscriptions. Generic wording is default, item-name wording requires opt-in, and deep links are constrained to Buy Later item routes. Production validation covered scheduler authorization, service-role and normal-role claim boundaries, idempotency, eligibility, and a real automatic iPhone delivery. There is no custom time, retry queue, email, notification history UI, badge, analytics, digest, cross-device subscription-management UI, recurring URL fetching, broad scraping, price tracking, AI, image storage, or cross-module coupling.

### Buy Later intake contract

`/buy-later/import` is the stable authenticated intake route for external purchase references. It accepts optional `url`, `title`, and `text` query parameters, validates them into existing Buy Later fields, and renders the standard Add Item form for explicit user review and submission. An explicit title always wins. For a validated URL without a title, the authenticated server may make a short, size-limited, best-effort HTML request and use only `og:title`, the document `<title>`, or `twitter:title`; every result remains editable and loading the route never persists data. When no metadata title is available, a separate local-only helper may derive a restrained title from a plausible descriptive URL pathname; it never makes another request and contains no merchant-specific rules. Each URL and redirect is checked against scheme, credentials, hostname, port, DNS, and private/reserved address rules before a request. Failure silently falls back to the ordinary manual form. No price, description, image, structured product data, AI inference, JavaScript execution, or recursive crawl is involved. This contract can later serve a native iOS Share Extension, Android or Web Share Target integrations where supported, and browser or shortcut integrations. No manifest `share_target` is declared because installed iOS PWAs do not currently provide a reliable Web Share Target path.

## Open decisions

These decisions should be made before the related implementation, not guessed now:

1. **Future notification capability:** configurable schedule, retries, history, cross-device subscription management, analytics, email, native push/app integration, and scaling beyond the current MVP bounds require separate evidence and design decisions.
2. **Image policy:** maximum size, EXIF handling, retention after AI analysis, deletion timing, and acceptable Gemini/provider data terms.
3. **Search threshold:** what measured failure rate justifies fuzzy, semantic, or LLM-assisted search.
4. **Buy Later extraction:** narrow authenticated title enrichment is implemented: explicit title, then best-effort server-side title metadata, then local URL-slug fallback. Broader product extraction remains deferred pending a source-compliance, privacy, maintenance, and user-value decision; the existing SSRF and request-limit boundary remains mandatory for any future server-side fetch.
5. **Price tracking:** supported merchants/methods, legal and Terms of Service review, reliability target, and cost ceiling before any automation.
6. **Deployment regions and data residency:** driven by target users and privacy obligations.
7. **Deletion/export requirements:** exact account, module-data, image, and derived-record lifecycle before production launch.
8. **Find It evolution:** whether observed use justifies movement history or non-AI photo attachments after the manual save/find loop is validated. Alias management is implemented; initial-create aliases, alias editing-in-place, fuzzy/semantic search, AI-generated aliases, tags/categories, and cross-module matching remain deferred.

## Rejected for the current architecture

Microservices, Redis, message brokers, complex queues, dedicated vector databases, separate Python/FastAPI services, Kubernetes, universal scraping infrastructure, and a generic plugin system have no current requirement and should not be introduced.
