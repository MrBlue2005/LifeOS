# RX LifeOS

**Your everyday operating system.**

RX LifeOS is a modular quality-of-life application. It is currently in **Phase 1: Find It MVP**. Find It supports private location hierarchies, physical items, deterministic search, and current-location recall through Supabase Auth and PostgreSQL.

Current modules:

- **Find It** — know where everything is. The first MVP is implemented.
- **Buy Later** — save it now, decide later. This follows the Find It MVP.

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

3. Apply [the Find It migration](supabase/migrations/20260904170000_create_find_it.sql). With the Supabase CLI:

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

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The repository also contains [pgTAP RLS tests](supabase/tests/find_it_rls.test.sql). Running them requires a Supabase CLI local database with the current Supabase test helpers installed:

```bash
npx supabase@latest test db
```

## Architecture

RX LifeOS is a Next.js and TypeScript modular monolith:

- `src/app` composes routes and the application shell.
- `src/core` contains shared platform code, including authentication, the Supabase SSR boundary, and the small typed module registry.
- `src/modules/find-it` owns Find It validation, hierarchy rules, data access, mutations, and UI.
- `src/modules/buy-later` remains a metadata-only placeholder.
- `supabase/migrations` owns reproducible PostgreSQL schema and RLS changes.

Modules may depend on Core public interfaces but must not import each other's internals. PostgreSQL is the durable source of truth. All current Supabase access is server-side and user-scoped; the publishable key is never treated as authorization. AI remains deferred and is not application memory.

See [PRODUCT.md](docs/PRODUCT.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [MVP.md](docs/MVP.md), and [ROADMAP.md](docs/ROADMAP.md) for the authoritative product and architecture constraints.

## PWA status

The application publishes RX LifeOS metadata and a web app manifest with standalone, dark-shell defaults. A service worker, offline synchronization, and final install icons are intentionally absent. Approved production icon assets are required before claiming complete installability across target browsers.
