# RX LifeOS Product Definition

## Identity

**Product:** RX LifeOS

**Repository:** LifeOS

**Working tagline:** “Your everyday operating system.” (provisional)

RX LifeOS is a modular quality-of-life application: one coherent personal utility ecosystem in which focused mini-apps share an identity, account, platform, design language, notifications, storage, and carefully selected services.

It exists because recurring personal tasks are often handled through scattered notes, screenshots, bookmarks, memory, and disconnected apps. RX LifeOS turns those recurring problems into reliable, low-friction workflows without becoming a crowded general-purpose dashboard.

## V1 release status

RX LifeOS V1 is **ready**, **production validated**, and validated in installed iPhone PWA workflows. The validation covers the shipped Find It and Buy Later loops, including iPhone-specific polish, but is not exhaustive across every device or browser.

V1 feature development is closed. The product is now in **Usage / Evidence Mode**: future work must be justified by recurring real-user friction, observed workflow repetition, production defects, or a clear reduction in user effort.

## Current product

### Product promise

RX LifeOS helps people remember useful facts and intentions about everyday life, then brings them back at the right moment. The first product loop is physical-object recall; the second is deliberate purchasing.

### Modular hub

RX LifeOS is one product with modules, not a bundle of unrelated tools. Users should encounter one account, one application shell, consistent privacy behavior, and a shared interaction language. Each module still owns its domain and must be useful independently.

### Shared Core

Core supplies capabilities that genuinely benefit more than one module:

- identity, authentication, profiles, and ownership context;
- permissions and user-data isolation;
- private file/image storage;
- notifications and shared settings;
- a small server-side AI gateway;
- common application shell, navigation, design system, and security primitives;
- lightweight activity/event primitives only when a concrete workflow needs them.

Core must not absorb module-specific business logic or become a speculative framework.

### Find It

Find It is a search engine for the physical objects in a user's home or office. A user records an item and its location, then later finds it through a fast search.

Locations form an arbitrary parent-child tree rather than fixed levels. This supports paths such as `Home → Office → Desk → Bottom Drawer` and `Home → Storage Room → Shelf 2 → Box 7` without hardcoded room, shelf, or container types.

The essential promise is: **“I saved where something is, and later RX LifeOS helped me find it.”**

Find It is the first implementation priority because it establishes the Core ownership model, hierarchical data, search, and most important product habit without relying on expensive automation.

Find It Alias-Aware Recall is complete and production validated. Item Edit supports owner-managed alias add/remove; deterministic partial search ranks canonical matches before alias-only matches, preserves the current full location path, and explains only the alias that matched. Normalization V1 preserves punctuation and Romanian diacritics rather than transliterating or unaccenting them. Aliases during initial item creation, alias editing-in-place, automatic alias suggestions, fuzzy/semantic search, AI-generated aliases, tags, and categories remain deferred.

### Buy Later

Buy Later collects purchase intentions that otherwise remain scattered among bookmarks, tabs, screenshots, messages, notes, email, and store wishlists. The MVP stores a product name, optional URL, optional current price and currency, optional note, date added, and a user-selected reconsideration date.

Its differentiator is deliberate waiting, not universal price tracking. When an item is due, RX LifeOS asks whether the user still wants it. The user can set another future date, mark it purchased, or dismiss it; resolved items remain understandable in history. The authenticated intake route can prefill a shared URL and resolve an editable name from an explicit title, best-effort title-only page metadata, or a conservative local URL slug. This narrow enrichment is not general scraping, product extraction, or price extraction. Buy Later has consented Web Push reminders: due items are assessed at the user's stored IANA timezone after approximately 09:00 local and sent through the installed PWA. Generic wording is the default; item names require explicit user opt-in. The MVP performs no automatic price tracking or AI calls.

The essential promise is: **“I saved something I may want to buy, RX LifeOS remembers it, and helps me decide later.”**

### Relationship between modules

Find It and Buy Later share Core but do not depend on each other's internal logic or storage implementation. Neither module is required for the other to function. Any future collaboration between them must use an explicit shared contract and preserve module ownership.

## Problems RX LifeOS solves

- Human memory is unreliable for infrequently used physical objects.
- Physical storage locations are hierarchical and personal, making rigid inventory tools awkward.
- Purchase intentions become fragmented across many services.
- Conventional wishlists encourage acquisition but rarely help users reconsider it.
- AI-heavy products can be costly, opaque, and unreliable when ordinary application logic would suffice.

## Product philosophy and principles

1. Solve real, recurring everyday problems.
2. Keep UX extremely simple and minimize manual entry.
3. Make every module useful without another module.
4. Use AI only where it meaningfully removes friction.
5. Keep application-controlled data as the source of truth.
6. Prefer deterministic behavior for retrieval, permissions, calculations, and notifications.
7. Build useful behavior before impressive demonstrations.
8. Remain web-first and PWA-first unless native capabilities provide a specific advantage.
9. Keep infrastructure and operating costs simple and proportionate to an MVP.
10. Make expansion reasonable without prebuilding hypothetical scale or a plugin platform.
11. Protect sensitive household information by default.
12. Maintain a cohesive consumer-product experience across all modules.

## AI philosophy

AI is an assistant at narrow interpretation boundaries, never the durable memory or authority of RX LifeOS.

Appropriate uses include image understanding, structured object extraction, query interpretation, normalization, aliases, classification, and approximate brand/model recognition. Server-side validation and, when relevant, user confirmation sit between generated output and persistence.

Normal database and application logic perform storage, retrieval, CRUD, authorization, notifications, and derived insights. Search should progress from exact matches through aliases, text search, and fuzzy matching before semantic/vector techniques or LLM-assisted fallback. The product must not send an entire user database to a model for simple retrieval.

## Brand and experience

All user-facing references use **RX LifeOS**. The product should be premium, modern, polished, clean, calm, primarily dark, mobile-first, and minimally cluttered. It should use excellent typography, strong information hierarchy, subtle depth, restrained motion, and high-quality micro-interactions.

RX LifeOS should remain recognizably part of the RX family while developing its own visual identity. Detailed visual design is intentionally not defined in this documentation phase.

## Current non-goals

- A generic personal productivity suite or internal admin dashboard.
- Native mobile applications without a concrete PWA limitation.
- Universal store scraping or a crawler platform.
- A dedicated vector database or AI-first search architecture.
- Cross-module recommendations in the initial MVPs.
- A generic module/plugin framework.
- Microservices or infrastructure designed for hypothetical scale.
- Keep It, Lend It, Maintain It, Supplies, or other additional modules.
- Social, public-sharing, marketplace, or commerce/checkout features.
- Final visual design in the product-definition phase.

## Future possibilities

The following are concepts, not current commitments:

- Photo-assisted Find It imports with reviewed object detection.
- More capable fuzzy, semantic, or natural-language retrieval if measured search failures justify it.
- Reliable merchant-specific or partner-based price observations.
- Cross-module intelligence, such as noting that a contemplated purchase resembles an item already owned.
- Additional modules such as Keep It, Lend It, Maintain It, and Supplies.
- Native functionality only where it creates a concrete product advantage.

Future work must earn its place through user value, feasibility, privacy, maintenance, and cost evidence.
