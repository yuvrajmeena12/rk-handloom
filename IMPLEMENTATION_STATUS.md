# Implementation status

Last updated 2026-10-24. "Verified" means it was actually run in this session; "Written, not exercised" means the code exists and compiles but was not run against a live backend.

## Checks that were actually run
| Check | Result |
|---|---|
| `tsc -b` (strict) | passes |
| `eslint .` | passes |
| `vitest run` | **46/46 pass**: 20 database/RLS tests (real migrations in PGlite), 26 unit tests |
| RLS test sensitivity | Loosening the public products policy made 3 tests fail; restored and re-passed |
| `npm run build` | passes |
| Browser smoke test (Chromium, **mocked** Supabase REST) | **30/30 pass**: home, catalogue search/filter/empty state, product page, WhatsApp/tel/directions links, draft/archived/unknown slugs show not-found, admin redirect when signed out, mobile layout without horizontal scroll, no console errors |

The browser test used a hand-written mock of the database API, so it verifies the UI and the queries it sends, **not** a real Supabase project.

## Features

### Implemented and verified
- Schema, constraints, indexes, RLS, publishing rules (draft-first, needs category + image), category archive guard, main-image promotion, atomic reorder/set-main functions: DB tests.
- Anonymous visitors cannot read drafts, archived products, products in hidden categories, their images, or `admin_users`; cannot write anything. Signed-in non-owners cannot write or self-promote: DB tests.
- Public site: homepage (manageable sections, empty state), catalogue (search, category filter, sort, pagination, skeleton/error/empty), category pages, product pages (gallery, structured specs, variants, optional price, related products), About, Contact, Privacy, Terms, 404: browser test.
- Phone / WhatsApp (URL-encoded prefilled message with name, SKU, URL) / directions links: unit + browser tests.
- Admin route protection (signed-out redirect): browser test.
- Validation, price display, slug, search sanitising, link safety, error messages: unit tests.

### Written, not exercised (needs your live Supabase project)
- Owner sign-in, sign-out, password reset, and the owner-vs-non-owner screen (`src/lib/auth.tsx`).
- All admin screens and their saves: dashboard, product list/create/edit/publish/archive/restore/delete, image upload (resize to WebP in browser), replace, remove, reorder, main image, categories CRUD + image, homepage editor (hero, sections, featured order), business details, appearance, media library.
- Supabase Storage policies (`0003_storage.sql`): PGlite has no storage schema, so these are unverified.
- Unsaved-changes warning, confirm dialogs, toasts in real use.
- `npm run sitemap` against a live project.

### Partially implemented
- **SEO**: titles, descriptions, canonical, Open Graph, JSON-LD (LocalBusiness, Product only with a real price), robots.txt, sitemap generator. Metadata is set client-side, so link-preview bots that do not run JavaScript see only the default tags. No prerendering.
- **Preview before publishing**: drafts can be previewed only by publishing; there is a "Preview homepage" link but no draft-preview route.
- **Reordering** uses up/down buttons, not drag and drop.

### Not done / out of scope
- Cart, checkout, payments, customer accounts, orders (excluded by the brief).
- Self-hosted fonts (Google Fonts used; disclosed in Privacy).
- Automated end-to-end tests of the admin against a real backend.

## Known issues and limits
- The media bucket is public-read by URL. Paths use random UUIDs, so draft product images are unguessable but not private.
- A product that loses its only image is automatically unpublished (client-side step, not a database trigger). A direct database edit could still leave a published product with no image; the page then shows a placeholder.
- Image type is checked by the browser-reported MIME type and the bucket's allowed list; there is no server-side content scan.
- `@hookform/resolvers` needs `npm install --legacy-peer-deps` because of an unrelated optional peer conflict.
- Product `compare_at_price` must exceed `price` (enforced in UI and database).

## Required manual configuration
1. Create Supabase project; run the four migrations in order.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
3. Create the owner user, **disable public sign-ups**, run `supabase/provision_owner.sql`.
4. Add redirect URLs for password reset.
5. Enter real opening hours, logo, hero image and (optionally) email, Maps link and social links in the admin.
6. Add products with photos. The seed contains **no products**.
7. Run the manual checklist in the README against the live project.

## Deployment readiness
Code builds and the security rules pass their database tests. **Not ready to call production-ready until the manual checklist has been run against your Supabase project**, because auth, storage and every admin write have only been compiled, not run.

## Next steps
- Run the manual checklist; fix anything it finds.
- Add real photos and products; set hours.
- Consider prerendering product pages for link previews, and self-hosting fonts.
