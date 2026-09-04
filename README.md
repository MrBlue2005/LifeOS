# RX LifeOS

**Your everyday operating system.**

RX LifeOS is a modular quality-of-life application. It is currently in **Phase 0: Foundation**: the application shell and module boundaries exist, while product features and external services remain intentionally unimplemented.

Current modules:

- **Find It** — know where everything is. This will be the first implemented module.
- **Buy Later** — save it now, decide later. This follows the Find It MVP.

## Local development

Use Node.js 24 and npm. Node.js 22.12 or a compatible newer even-numbered release is also supported by the current toolchain.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

No environment variables are required in Phase 0. `.env.example` records expected future Supabase and server-side Gemini variables without configuring either integration.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Architecture

RX LifeOS is a Next.js and TypeScript modular monolith:

- `src/app` composes routes and the application shell.
- `src/core` contains shared platform code, including the small typed module registry.
- `src/modules/find-it` and `src/modules/buy-later` expose public module definitions only in Phase 0.

Modules may depend on Core public interfaces but must not import each other's internals. The database will become durable application memory in a later phase; AI will remain an optional server-side assistant rather than a source of truth.

See [PRODUCT.md](docs/PRODUCT.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [MVP.md](docs/MVP.md), and [ROADMAP.md](docs/ROADMAP.md) for the authoritative product and architecture constraints.

## PWA status

The application publishes RX LifeOS metadata and a web app manifest with standalone, dark-shell defaults. A service worker, offline synchronization, and final install icons are intentionally absent. Approved production icon assets are required before claiming complete installability across target browsers.
