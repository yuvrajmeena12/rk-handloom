// Generates public/sitemap.xml and updates public/robots.txt from the live catalogue.
// Uses only the PUBLIC anon key: Row Level Security returns published content only.
// Usage: VITE_SITE_URL=https://example.com VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run sitemap
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

function loadEnvFile(file) {
  if (!existsSync(file)) return {}
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  )
}

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const site = (env.VITE_SITE_URL || '').replace(/\/$/, '')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

if (!site || !url || !key) {
  console.error('Set VITE_SITE_URL, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (in .env.local or the environment).')
  process.exit(1)
}

async function get(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${path}`)
  return res.json()
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const entry = (loc, lastmod) =>
  `  <url><loc>${esc(site + loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`

const [categories, products] = await Promise.all([
  get('categories?select=slug,updated_at&is_published=eq.true&is_archived=eq.false&order=display_order'),
  get('products?select=slug,updated_at,categories!inner(is_published)&is_published=eq.true&is_archived=eq.false&categories.is_published=eq.true&order=created_at.desc&limit=5000'),
])

const urls = [
  entry('/'),
  entry('/catalog'),
  entry('/about'),
  entry('/contact'),
  ...categories.map((c) => entry(`/category/${c.slug}`, c.updated_at)),
  ...products.map((p) => entry(`/product/${p.slug}`, p.updated_at)),
]

writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)
writeFileSync(
  'public/robots.txt',
  `User-agent: *\nDisallow: /admin\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
)
console.log(`Wrote public/sitemap.xml with ${urls.length} URLs and updated public/robots.txt`)
