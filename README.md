# RX LifeOS

**Your everyday operating system.**

RX LifeOS is a modular quality-of-life application. **Find It** and the **Phase 2: Buy Later MVP** are operationally validated against the remote Supabase development project. Find It supports private location hierarchies and current-location recall; Buy Later supports deliberate purchase reconsideration. Both use Supabase Auth and PostgreSQL.

Current modules:

- **Find It** — know where everything is. The first MVP is implemented.
- **Buy Later** — save it now, decide later. Its manual save, reconsider, resolve, and history loop is operationally validated.

## Local development

Use Node.js 24 and npm. Node.js 22.12 or a compatible newer even-numbered release is also supported by the current toolchain.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. A connected Supabase project is required to use authentication and private Find It data. Without environment values, the application still builds and displays setup guidance rather than exposing or inventing local data.

## Supabase setup

1. Create or select a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the Project URL and publishable key from the project's Connect dialog:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

These values identify the public Data API client; authorization is enforced by authenticated sessions and Row Level Security. No service-role key is used by the application.

3. Apply the ordered migrations in [`supabase/migrations`](supabase/migrations). With the Supabase CLI:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref your-project-ref
npx supabase@latest db push
```

Alternatively, apply the migration through the Supabase SQL editor while establishing the project. Keep later schema changes in new migration files.

4. In Supabase Auth, enable email/password authentication, set the Site URL for the environment, and allow its `/auth/confirm` redirect. For confirmation-email SSR, configure the confirmation link as:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

5. Start the application:

```bash
npm run dev
```

For local intake testing, an authenticated user can open a URL such as:

```text
/buy-later/import?url=https%3A%2F%2Fexample.com%2Fproduct
```

The route resolves an editable item name in this order: an explicit shared title, best-effort server-side page title metadata, then conservative local parsing of a descriptive URL pathname. URL-slug fallback makes no additional network request. The intake does not extract prices or other product data and never saves without explicit confirmation.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Phase 1 validation status:

- **Automatically validated:** lint, TypeScript type checking, unit/domain tests, and the production build.
- **Manually validated against the remote Supabase development project:** email/password sign-up and sign-in, authenticated Find It access, root and nested location hierarchy CRUD exercised in the tested workflow, item CRUD and movement exercised in the tested workflow, deterministic partial search, complete location paths, non-empty location deletion protection, and cross-user data isolation through RLS.
- **Not yet executed:** the repository's [pgTAP database test suite](supabase/tests/find_it_rls.test.sql).

Phase 2 validation status:

- **Migration synchronized:** `20260907170000_create_buy_later.sql` is applied to the linked remote Supabase development project, and local and remote migration histories match.
- **Manually validated:** manual item saving, optional URL/price/currency/note, Waiting and Due states, rescheduling through “I still want it,” Purchased, Dismissed, History, separate permanent deletion, and cross-user isolation through RLS.
- **Real-device validated:** reconsideration presets and the custom date control work on an iPhone over the allowed LAN development origin.
- **Not yet executed:** the local-oriented [Buy Later pgTAP suite](supabase/tests/buy_later_rls.test.sql).

The pgTAP suite targets a Supabase CLI local database with the current Supabase testing helpers, including the `tests` schema:

```bash
npx supabase@latest test db
```

It has not been described as passing. It remains available for a future local Supabase/PostgreSQL test environment; the remote development database was not modified solely to install its local-oriented test harness.

## Architecture

RX LifeOS is a Next.js and TypeScript modular monolith:

- `src/app` composes routes and the application shell.
- `src/core` contains shared platform code, including authentication, the Supabase SSR boundary, and the small typed module registry.
- `src/modules/find-it` owns Find It validation, hierarchy rules, data access, mutations, and UI.
- `src/modules/buy-later` owns Buy Later validation, lifecycle rules, data access, mutations, and UI.
- `supabase/migrations` owns reproducible PostgreSQL schema and RLS changes.

Modules may depend on Core public interfaces but must not import each other's internals. PostgreSQL is the durable source of truth. All current Supabase access is server-side and user-scoped; the publishable key is never treated as authorization. AI remains deferred and is not application memory.

See [PRODUCT.md](docs/PRODUCT.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [MVP.md](docs/MVP.md), and [ROADMAP.md](docs/ROADMAP.md) for the authoritative product and architecture constraints.

## Deployment

RX LifeOS is prepared for a default Next.js deployment on Vercel. Vercel and Supabase environment setup, authentication URLs, migration application, PWA installation, smoke testing, and rollback guidance are documented in [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## PWA status

The application publishes RX LifeOS metadata, a standalone web app manifest, 192px and 512px install icons, an Apple touch icon, and conservative mobile safe-area support. The install icon uses the approved midnight and violet RX monogram identity.

RX LifeOS does not provide offline behavior, background synchronization, or a service worker. Installing it creates an app-like launcher for the HTTPS-hosted product; authenticated data continues to load from Supabase over the network.
