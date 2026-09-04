# RX LifeOS — Repository Instructions

## Product identity

- The official user-facing product name is **RX LifeOS**.
- Use **RX LifeOS** in product documentation, UI copy, metadata, titles, and future PWA naming.
- `LifeOS` may be used for repository, package, and directory names.
- The working tagline is **“Your everyday operating system.”** It is provisional.
- RX LifeOS belongs to the broader RX family but must have its own cohesive design system. Do not copy another RX product's interface.

## Product direction

RX LifeOS is a mobile-first, web/PWA-first quality-of-life product made of focused modules on one shared platform. It should feel premium, modern, calm, polished, primarily dark, and consumer-oriented, with minimal clutter, excellent hierarchy, subtle depth, and restrained motion.

Build useful recurring behavior before impressive demos. Keep flows extremely simple, minimize manual entry, control infrastructure and API costs, and avoid feature creep. Add future capabilities only in response to a concrete product need.

Current implementation order:

1. Shared foundation
2. **Find It** as the first fully implemented module
3. **Buy Later**

Keep It, Lend It, Maintain It, Supplies, and cross-module intelligence are future concepts, not current scope.

## Architecture rules

- Build a **modular monolith**, not microservices and not a generic plugin framework.
- Keep shared platform concerns in **Core**: authentication, user/profile and ownership context, permissions, notifications, file/image storage, the AI gateway, shared settings, activity/event primitives, application shell/navigation, design system, and security primitives.
- Keep module-specific business rules and data access inside the owning module.
- Find It must not import Buy Later internals, and Buy Later must not import Find It internals.
- Cross-module behavior must use a deliberately defined Core contract, service, or lightweight event boundary. Do not add such infrastructure before a real use case exists.
- Prefer Next.js, React, and TypeScript; PostgreSQL with Supabase is the current platform direction; deployments should remain Vercel-compatible. These are documented defaults, not permission to configure them prematurely.
- Do not add microservices, Redis, message brokers, dedicated vector databases, complex queues, separate Python/FastAPI services, Kubernetes, or major abstraction layers without a concrete, documented justification.
- Do not add a major dependency until existing platform capabilities have been evaluated and the dependency's product value, maintenance burden, security impact, and cost are justified.

## AI and data rules

**AI is not the memory of RX LifeOS. The application-controlled database is the source of truth.**

- Persist objects, locations, relationships, ownership, metadata, aliases, timestamps, movement history, image references, purchase intentions, decisions, and other durable product state in the database.
- Use deterministic application logic for CRUD, permissions, routing, retrieval, filtering, notifications, calculations, and other operations that do not require AI.
- Use AI only when it removes meaningful friction: image understanding, structured extraction, natural-language interpretation, normalization, classification, aliases, or approximate brand/model assistance.
- Never send a user's entire dataset to an LLM to answer a simple query.
- Prefer exact, alias, text, and fuzzy search before semantic/vector search or LLM fallback.
- Put AI providers behind a small server-side application gateway. Module code must not spread provider SDK types or response formats throughout the codebase.
- Validate AI-produced structured output server-side before showing it as trusted or persisting it.
- Require user confirmation/editing of image-detected inventory before permanent persistence.
- Do not expose AI or other service secrets to client code.

## Security and privacy

Treat home photos, object locations, documents, household membership, and purchase behavior as sensitive user data.

- Deny cross-user access by default and enforce ownership at both application and database-policy layers.
- Use authenticated private storage and short-lived signed access where appropriate.
- Apply least privilege, Row Level Security where Supabase/PostgreSQL is used, strict input validation, and server-only secret handling.
- Define deletion and retention behavior before storing sensitive images in production.
- Minimize the personal data and image data sent to AI providers; document provider retention/privacy assumptions before launch.
- Do not log secrets, signed URLs, raw sensitive content, or unnecessary personal data.

## TypeScript and code quality

- Keep TypeScript strict; avoid `any`, unsafe casts, and unchecked external data.
- Validate all trust boundaries, including request payloads, database-derived untyped data, scraped/extracted content, and AI output.
- Favor clear domain names and small, explicit interfaces over speculative generic abstractions.
- Keep server-only code unmistakably separated from client code. Never import server secrets or privileged clients into client bundles.
- Keep business rules testable outside UI components and provider SDKs.
- Preserve module boundaries in imports and tests.
- Handle errors deliberately and expose safe, useful user-facing states.

## Testing and validation

- Match validation effort to risk. At minimum, run formatting, linting, type checks, and relevant automated tests once those tools exist.
- Add unit tests for deterministic domain rules, integration tests for persistence/authorization boundaries, and focused end-to-end tests for critical user journeys.
- Test tenant/user isolation and Row Level Security policies before production.
- Test migrations forward and, where practical, rollback/recovery behavior before applying them to shared environments.
- For AI features, test schema rejection, low-confidence and malformed output, user correction, provider failure, and cost controls. Do not assert exact prose from a model.
- For scheduled work, test idempotency, retries, duplicate delivery prevention, and timezone behavior.

## Change workflow

Before changing architecture or implementation:

1. Inspect the current repository, nearby documentation, configuration, and tests.
2. Identify and preserve intentional behavior and user-authored changes.
3. Prefer the smallest change that satisfies the current product requirement.
4. Verify the change at the appropriate level.
5. Update `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/MVP.md`, and `docs/ROADMAP.md` when a major product or architectural decision changes.

Do not silently convert an open, high-impact decision into an implementation commitment. Document choices that materially affect architecture, cost, security, privacy, or scope, and obtain a decision when implementation actually depends on them.

