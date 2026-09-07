# RX LifeOS deployment and PWA readiness

## Deployment shape

RX LifeOS deploys as one Next.js application on Vercel. It uses Supabase Auth and PostgreSQL through the existing server-side, cookie-based clients. Authenticated requests use the Supabase publishable key and remain constrained by Row Level Security; the application does not require or accept a service-role key.

Vercel's normal Next.js defaults are sufficient. Do not add a custom output directory, custom server, Docker image, or `vercel.json` unless a future requirement demonstrates a need.

## Environment strategy

Local development continues to use `.env.local` and the existing development Supabase project.

The recommended environment split is:

- **Local:** the existing development Supabase project.
- **Vercel Preview:** the development project may be reused for private previews, with the limitations below.
- **Vercel Production:** a dedicated production Supabase project is recommended before public or multi-user use.

A private personal deployment may temporarily use the existing development project. This mixes preview/development and production identities and data, so it should be an explicit temporary choice rather than the long-term production arrangement.

Configure these variables in Vercel Project Settings. They are the only application environment variables currently required:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Use values from the selected Supabase project's Connect dialog. Despite the `NEXT_PUBLIC_` prefix, the publishable key is not authorization; authenticated sessions and RLS enforce access. Never configure a service-role key in this application.

Recommended scopes:

| Vercel scope | Supabase project |
|---|---|
| Production | Dedicated production project, ideally |
| Preview | Development project, if preview access is needed |
| Development | Optional in Vercel; local work uses `.env.local` |

Environment changes apply only to new deployments, so redeploy after changing a value.

## Import into Vercel

1. In Vercel, select **Add New → Project** and import the GitHub repository.
2. Keep the production branch set to `main` and the repository root as the Root Directory.
3. Confirm that Vercel detects **Next.js**. Keep the default install command, `npm run build`, and the default output settings.
4. Select a supported Node.js 24.x runtime. The repository also supports Node.js 22.12 or newer compatible even-numbered releases.
5. Add both required Supabase variables to the intended scopes without pasting them into source files.
6. Create the deployment. Vercel supplies HTTPS automatically for its domain and configured custom domains.
7. After attaching a final production domain, update the Supabase Auth URL configuration before validating sign-up and confirmation.

No Vercel CLI installation or account linking is required for this workflow.

## Supabase production preparation

If using a dedicated production project:

1. Create the project manually and retain its project reference privately.
2. Enable email/password authentication and decide whether email confirmation remains required.
3. Apply `supabase/migrations/20260904170000_create_find_it.sql` to that project. Either use the Supabase SQL Editor or deliberately link the CLI to the production project and run `npx supabase@latest db push`.
4. If the CLI was previously linked to development, verify the displayed target project before pushing and relink it to development afterward if that is the normal local workflow.
5. Confirm that both Find It tables exist, RLS is enabled, and the migration history is recorded before allowing real data.

Do not copy development rows into production merely to test deployment. The pgTAP suite remains local-environment-oriented and has not been executed.

## Supabase Auth URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- Set **Site URL** to the exact production origin, for example `https://lifeos.example.com`.
- Add the exact production confirmation URL, for example `https://lifeos.example.com/auth/confirm`.
- Retain `http://localhost:3000/auth/confirm` for the development project or when local confirmation against the same project is deliberately required.

Keep the confirmation-email link template as:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

The confirmation route constructs its result relative to the request origin, and internal `next` redirects accept only safe application-relative paths. No production domain is hardcoded in application code.

Supabase permits wildcard redirect URLs for Vercel previews, but RX LifeOS does not currently send preview-specific `emailRedirectTo` values. Confirmed users can sign in on a preview that has valid environment variables, while a new confirmation email follows the project's single Site URL. Keep production confirmation on the stable production domain. Do not add a broad preview wildcard unless preview-specific confirmation is deliberately implemented and the trust granted to every matching preview deployment is accepted.

When one Supabase project is shared temporarily, its single Site URL cannot simultaneously represent localhost, every preview, and production. Prefer production as the confirmation destination once real deployment begins; use a separate development project for uninterrupted local sign-up testing.

## PWA and iPhone installation

The application includes:

- a standalone manifest at `/manifest.webmanifest`;
- stable RX LifeOS name, short name, start URL, scope, and dark theme colors;
- 192px and 512px PNG icons, including maskable use of the 512px asset;
- a 180px Apple touch icon and Apple standalone metadata;
- safe-area inset handling and dynamic viewport-height support.

HTTPS from Vercel satisfies the secure-origin requirement. A custom service worker is intentionally absent because current installability does not require one and RX LifeOS has no approved offline behavior. Private authenticated data is therefore not intentionally cached for offline use.

On iPhone, open the production URL in Safari, use **Share → Add to Home Screen**, confirm the RX LifeOS title, and launch it from the new icon. Browser and iOS versions vary; installation is a launcher/standalone experience, not an offline guarantee. An active network connection is required for authentication and Find It data.

## Post-deploy smoke test

Use disposable records where mutations are necessary, and remove them only after verifying deletion safety:

1. Confirm the production home page loads over HTTPS.
2. Open `/manifest.webmanifest` and confirm it returns the RX LifeOS manifest.
3. Open `/icon-192x192.png`, `/icon-512x512.png`, and `/apple-touch-icon.png` and confirm all assets load.
4. Confirm **Create account** is reachable.
5. Create a test account and confirm that the email link returns to `/auth/confirm` on the production origin.
6. Confirm email/password sign-in works.
7. Confirm authenticated `/find-it` loads.
8. Confirm the location hierarchy loads.
9. Create a disposable root and nested location.
10. Create a disposable item in the nested location.
11. Search with a partial item name and confirm the full path appears.
12. Move the item and confirm its displayed path changes.
13. Confirm deletion of a non-empty location is blocked.
14. Sign out and confirm protected Find It access redirects to sign-in.
15. With a second test user, confirm the first user's locations and items are invisible.
16. Check Home, Locations, Add Item, and Edit Item at a phone viewport without horizontal overflow.
17. Use the browser's supported install or Add to Home Screen flow.
18. Launch from the installed icon and confirm standalone presentation and safe-area spacing.
19. Check the browser console and Vercel runtime logs for unexpected errors without recording private item data.

## Rollback and redeploy

For an application-only regression, use Vercel's deployment history to promote or roll back to the last known-good deployment, then fix forward on `main`. Environment-variable corrections require a new deployment.

Database changes are independent of a Vercel rollback. Never assume rolling back the application reverses a migration. Back up production data and plan a forward migration before any future schema change.

## Known limitations

- Deployment has not yet been performed or smoke-tested on a real production domain.
- The install icon uses the approved midnight and violet RX LifeOS identity.
- There is no offline cache, background sync, push notification support, or custom install prompt.
- Preview sign-up confirmation returns to the Supabase project's Site URL rather than a changing preview domain.
- A dedicated production Supabase project must still be created manually if environment separation is required.
- The local-oriented pgTAP database suite remains unexecuted.
