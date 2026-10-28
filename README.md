# RK HANDLOOM: catalogue and owner admin

A product catalogue for **RK HANDLOOM (आरके हैंडलूम)**, Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901, with a private owner area to manage products, categories, homepage content and business details. Visitors browse and then call, WhatsApp or get directions. There is no cart, checkout or payment.

## Tech stack
Vite, React 19, TypeScript, Tailwind CSS 3, React Router 7, TanStack Query, react-hook-form + zod, Supabase (Postgres with Row Level Security, Auth, Storage).

## Prerequisites
- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project

## Setup

### 1. Install
```bash
npm install --legacy-peer-deps
```
(`--legacy-peer-deps` avoids an unrelated optional-peer conflict in `@hookform/resolvers`.)

### 2. Create the database
In the Supabase dashboard, open **SQL Editor** and run these files in order:

1. `supabase/migrations/0001_schema.sql` tables, constraints, publishing rules
2. `supabase/migrations/0002_rls.sql` Row Level Security
3. `supabase/migrations/0003_storage.sql` the `media` bucket and its policies
4. `supabase/migrations/0004_seed.sql` business details, homepage sections, two starter categories

(Or use the Supabase CLI: `supabase db push`.) Nothing here deletes existing data, but run it on a fresh project first.

### 3. Environment variables
```bash
cp .env.example .env.local
```
| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `VITE_SITE_URL` | Your live address, e.g. `https://rkhandloom.example` (canonical links, sitemap) |

Use only the **anon** key. Never put the `service_role` key in a `VITE_` variable: it would be shipped to every visitor.

### 4. Create the owner login
1. **Authentication → Users → Add user**: enter the owner's email and a strong password.
2. **Authentication → Providers → Email**: turn **off** "Allow new users to sign up" so nobody else can register.
3. **Authentication → URL Configuration**: add your site address and `https://YOUR-SITE/admin/reset-password` to the redirect URLs (needed for password reset emails).
4. In the SQL Editor, run `supabase/provision_owner.sql` after replacing the email. This is the only way to become an owner: browsers cannot write to `admin_users`.

Sign in at `/admin`. Any other signed-in account is shown "No access to the owner area" and is blocked by the database as well.

### 5. Run
```bash
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build locally
```

## Using the owner area
- **Products**: add a draft, then upload images, then **Publish**. Publishing needs a category and at least one image. Unpublish hides it; Archive hides it and keeps everything; permanent Delete works only on archived products.
- **Categories**: create, reorder (display order), hide, archive. A category that still has products cannot be archived or deleted.
- **Homepage**: hero image, text and buttons, section order and visibility, featured categories and products order.
- **Business details**: name (English/Hindi), phone, WhatsApp, address, plus code, Maps link, opening hours, social links, About and Contact text.
- **Appearance**: logo, accent colour, button labels, show/hide prices and codes, page size, announcement bar, footer.
- **Media library**: site and category images.

## Opening hours
The supplied data says the store "opens at 9:00 AM" with no closing time or weekly schedule, so **no hours are set**. The site shows the note "Listed as opening at 9:00 AM. Please call to confirm today's timings." Enter the real hours under **Business details** and they replace the note.

## Tests
```bash
npm test           # vitest: 46 tests
npm run typecheck
npm run lint
```
`tests/db.test.ts` applies the real migrations to an in-process Postgres (PGlite) and checks what anonymous visitors, a signed-in non-owner and the owner can do. It does **not** cover Supabase Storage policies or Supabase Auth: check those with the manual checklist below.

### Manual checklist (needs your live project)
1. Signed out, open `/admin/products` → redirected to login.
2. Sign in as the owner → overview loads; add a product, upload two images, publish; it appears in `/catalog`.
3. Unpublish it → it disappears from `/catalog`, search and its category page; its `/product/slug` URL shows "Page not found" in a private window.
4. Create a second user in Supabase Auth (not in `admin_users`), sign in as them → "No access to the owner area".
5. In a private window, try uploading to storage with the anon key → refused (the bucket has no anon write policy).
6. Phone, WhatsApp and directions buttons open the dialler, the right WhatsApp chat (prefilled with the product name) and Google Maps.

## Deployment
Any static host works. The app is a single-page app, so every path must serve `index.html`:
- **Netlify / Cloudflare Pages**: `public/_redirects` is included.
- **Vercel**: `vercel.json` is included (rewrites plus basic security headers).

Set the three environment variables in the host's dashboard, then build with `npm run build` and publish `dist/`.

After publishing products, run `npm run sitemap` (with the env vars set) to generate `public/sitemap.xml` and point `robots.txt` at it, then rebuild.

**SEO note.** Pages set their title, description, canonical, Open Graph tags and JSON-LD in the browser. Google renders JavaScript, but most link-preview scrapers (WhatsApp, Facebook) do not, so shared product links may show only the default title. Prerendering or a small edge function would fix that; it is not included. Nothing here guarantees search ranking.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| "Connect the database" screen | `.env.local` missing or still has placeholder values. Restart the dev server after editing. |
| Site loads but shows an error with Try again | Migrations not run, or wrong URL/key. |
| Owner sees "No access to the owner area" | Step 4 not done, or done for a different email. Re-run `provision_owner.sql` and check with the verify query in it. |
| Upload says permission denied | `0003_storage.sql` not run, or you are not signed in as the owner. |
| Cannot publish | Product needs a category and at least one image. |
| Cannot archive a category | Move or archive its products first. |
| Reset email link goes to the wrong place | Add the redirect URL in Supabase URL Configuration. |
| Refreshing a product page gives 404 on the host | The host is not rewriting to `index.html`; see Deployment. |

## Privacy and fonts
Fonts load from Google Fonts. The Privacy page says so. To self-host instead, download the fonts and replace the `<link>` in `index.html`.
