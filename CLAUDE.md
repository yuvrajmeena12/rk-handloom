# RK HANDLOOM: project instructions

Product catalogue + owner admin for RK HANDLOOM (आरके हैंडलूम), a handloom and mattress store in Beawar, Rajasthan. **Not e-commerce**: no cart, checkout, payments, customer accounts or orders. Visitors browse, then call / WhatsApp / get directions.

## Stack
Vite + React 19 + TypeScript (strict), Tailwind 3, React Router 7 (data router, lazy routes), TanStack Query, react-hook-form + zod, Supabase (Postgres + RLS, Auth, Storage), sonner toasts, lucide-react. Tests: vitest (+ PGlite for real-Postgres policy tests).

## Commands
`npm install --legacy-peer-deps` · `npm run dev` · `npm run build` (tsc -b + vite) · `npm run typecheck` · `npm run lint` · `npm test` · `npm run sitemap` (needs env; writes public/sitemap.xml + robots.txt)

## Layout
- `supabase/migrations/0001..0004`: schema, RLS, storage, seed. Run in order. `supabase/provision_owner.sql` makes the owner.
- `src/lib/api/public.ts`: published-only queries. `src/lib/api/admin.ts`: owner operations.
- `src/lib/validation.ts`: zod schemas and form<->row mapping. `contact.ts`: tel/WhatsApp/directions. `utils.ts`: price/slug/search helpers.
- `src/pages/public`, `src/pages/admin`, `src/components/admin` (`ui.tsx`: ConfirmDialog, unsaved-changes guard, Field, SubmitBar).
- `tests/db.test.ts` runs the migrations in PGlite and tests RLS as anon / customer / owner. `tests/lib.test.ts` holds unit tests.

## Security rules (do not weaken)
- Authorization lives in the database. Owner = a row in `public.admin_users`, writable only by the postgres/service role (no INSERT policy). Never rely on the UI guard.
- Only the anon key in the browser. Never put a service_role key in any `VITE_` variable.
- Public reads: published, non-archived products in published, non-archived categories only. Public queries ALSO filter explicitly so the signed-in owner browsing the site never sees drafts.
- Products cannot be inserted as published; publishing needs a category and at least one image (trigger). Categories with live products cannot be archived or deleted.
- Storage bucket `media`: public-read by URL (UUID paths), admin-only write, 5 MB, jpeg/png/webp/avif.
- Admin-configured links are validated (`https://`, in-site `/path`, `#hash`) before render. Search text is sanitised before PostgREST `or()` filters.

## Business decisions
- Only supplied facts are asserted: name, address, phone +91 98291 08112 (WhatsApp 919829108112), plus code 38X4+JR, "opens 9:00 AM". Hours are NOT configured, so the UI shows a note instead of invented times. No invented history, ratings, testimonials or certifications.
- Prices are optional; no price shows "Contact for price". The owner can hide all prices.
- Directions: the owner's Maps link if set, otherwise a Google Maps directions URL built from the address. No invented coordinates.
- Archive before delete; permanent delete only for archived products, and it removes their image files.

## Conventions
Plain sentence-case UI copy; errors say what happened and what to do (`friendlyError`). Each admin settings page saves only its own columns (`useSettingsForm(fields)`). Design: ivory/sand/walnut/olive palette, serif headings (Cormorant Garamond), woven-texture panels and a "selvedge" rule as the signature motif; one accent colour, no decorative gradients.

## Status
See `IMPLEMENTATION_STATUS.md`. Admin writes, auth and storage have not been run against a live Supabase project yet.
