# RX LifeOS Architecture

## Status and intent

This document proposes the initial architecture for RX LifeOS. It establishes boundaries and safe defaults; it is not an implementation specification. Decisions with meaningful cost, privacy, or scope impact remain explicitly open until evidence is available.

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
- observed and target prices when available;
- reconsideration timing and decision state;
- archive/reopen behavior;
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

PostgreSQL is the durable source of truth. Each domain record must be scoped to an owning principal. The exact principal is an open decision: it may initially be a user, or a household/workspace with memberships if sharing is required in the first release.

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

## Search architecture

Find It search should advance only as observed needs justify it:

1. normalized exact name match;
2. alias match;
3. PostgreSQL text search and sensible partial matching;
4. fuzzy matching using a PostgreSQL capability if required;
5. semantic/vector search only after measured evidence of insufficiency;
6. LLM-assisted interpretation only for genuinely ambiguous queries.

After an item is identified, location retrieval is a normal authorized database query. Do not send the user's inventory wholesale to an LLM.

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

Supabase Auth is the preferred initial identity provider. The server validates the authenticated session. PostgreSQL Row Level Security provides defense in depth and should enforce ownership boundaries even if application checks fail.

Authorization must verify both the requested record and its ownership scope. Client-supplied owner IDs are not trusted. Service-role credentials, if required, remain server-only and are used narrowly; ordinary user operations should preserve user-scoped database enforcement.

The initial sign-in methods, account recovery policy, and whether household sharing ships in the first MVP remain open.

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

Use simple scheduled invocations (for example, a Vercel-compatible cron endpoint) that select due database rows and process them in small idempotent batches. Protect scheduled endpoints, record attempt/outcome state, and prevent duplicate reminders with stable keys or database constraints.

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

## Open decisions

These decisions should be made before the related implementation, not guessed now:

1. **Ownership scope:** user-only Find It MVP versus household/workspace sharing from day one. This affects schema, RLS, invitations, and privacy.
2. **Authentication methods:** exact providers, recovery flows, and session policy.
3. **Initial notification channel:** in-app only, email, or web push; browser support and consent UX must be evaluated.
4. **Image policy:** maximum size, EXIF handling, retention after AI analysis, deletion timing, and acceptable Gemini/provider data terms.
5. **Find It history:** whether movement history is required in the first public MVP or can follow the basic save/find loop.
6. **Search threshold:** what measured failure rate justifies fuzzy, semantic, or LLM-assisted search.
7. **Buy Later extraction:** manual entry versus limited browser-side/metadata-assisted capture in its first release.
8. **Price tracking:** supported merchants/methods, legal and Terms of Service review, reliability target, and cost ceiling before any automation.
9. **Deployment regions and data residency:** driven by target users and privacy obligations.
10. **Deletion/export requirements:** exact account, module-data, image, and derived-record lifecycle before production launch.

## Rejected for the current architecture

Microservices, Redis, message brokers, complex queues, dedicated vector databases, separate Python/FastAPI services, Kubernetes, universal scraping infrastructure, and a generic plugin system have no current requirement and should not be introduced.

