import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Loads key-value pairs from an env file without external dependencies.
 */
export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf8')
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=')
        const key = line.slice(0, idx).trim()
        let val = line.slice(idx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        return [key, val]
      }),
  )
}

/**
 * Resolves and validates the base site URL for sitemap and SEO generation.
 * Priority:
 * 1. env.VITE_SITE_URL
 * 2. env.VERCEL_PROJECT_PRODUCTION_URL (auto-injected by Vercel for production)
 * 3. env.VERCEL_URL (auto-injected by Vercel preview/deployment)
 *
 * @param {Record<string, string | undefined>} env
 * @param {{ allowLocalhost?: boolean }} [options]
 * @returns {{ valid: boolean; url?: string; isLocalhost?: boolean; reason?: string }}
 */
export function resolveBaseUrl(env = {}, options = {}) {
  const allowLocalhost = Boolean(options.allowLocalhost)
  const rawUrl = (
    env.VITE_SITE_URL ||
    env.VERCEL_PROJECT_PRODUCTION_URL ||
    env.VERCEL_URL ||
    ''
  ).trim()

  if (!rawUrl) {
    return {
      valid: false,
      reason: 'No site URL configured in VITE_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL',
    }
  }

  // Ensure protocol
  let formatted = rawUrl
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`
  }
  // Strip trailing slashes
  formatted = formatted.replace(/\/+$/, '')

  let parsed
  try {
    parsed = new URL(formatted)
  } catch {
    return {
      valid: false,
      reason: `Malformed URL: "${rawUrl}"`,
    }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Check for placeholder or dummy domains
  const placeholderPatterns = [
    'your-domain.example',
    'example.com',
    'example.org',
    'example.net',
    'your-project-ref',
  ]
  if (placeholderPatterns.some((p) => hostname.includes(p))) {
    return {
      valid: false,
      reason: `Placeholder domain detected: "${hostname}". A real deployment domain is required.`,
    }
  }

  // Check for localhost / loopback addresses
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')

  if (isLocal) {
    if (allowLocalhost) {
      return {
        valid: true,
        url: formatted,
        isLocalhost: true,
      }
    }
    return {
      valid: false,
      isLocalhost: true,
      reason: `Localhost address "${formatted}" cannot be used as a production canonical sitemap URL.`,
    }
  }

  // Enforce HTTPS for production domains
  if (parsed.protocol !== 'https:') {
    parsed.protocol = 'https:'
    formatted = parsed.toString().replace(/\/+$/, '')
  }

  return {
    valid: true,
    url: formatted,
    isLocalhost: false,
  }
}

/**
 * Escapes special XML characters.
 */
export function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Formats ISO date or timestamp into YYYY-MM-DD for sitemap lastmod.
 */
export function formatLastMod(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const match = dateStr.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(match)) {
    return match
  }
  return null
}

/**
 * Eligible public static routes in RK Handloom.
 */
export const STATIC_PUBLIC_ROUTES = [
  '/',
  '/catalog',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]

/**
 * Builds standard XML sitemap string.
 */
export function buildSitemapXml(siteUrl, staticRoutes = STATIC_PUBLIC_ROUTES, categories = [], products = []) {
  const cleanSite = siteUrl.replace(/\/+$/, '')

  const makeEntry = (loc, rawDate) => {
    const fullLoc = escapeXml(`${cleanSite}${loc.startsWith('/') ? loc : `/${loc}`}`)
    const lastmod = formatLastMod(rawDate)
    return `  <url>\n    <loc>${fullLoc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`
  }

  const entries = [
    ...staticRoutes.map((route) => makeEntry(route)),
    ...categories
      .filter((c) => c && c.slug)
      .map((c) => makeEntry(`/category/${c.slug}`, c.updated_at)),
    ...products
      .filter((p) => p && p.slug)
      .map((p) => makeEntry(`/product/${p.slug}`, p.updated_at)),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
}

/**
 * Safely updates robots.txt content without overwriting custom directives.
 * If sitemapUrl is provided, it sets or replaces the Sitemap: directive.
 * If sitemapUrl is null/empty, it removes any Sitemap directive and leaves clean directives.
 */
export function updateRobotsTxt(existingContent = '', sitemapUrl = null) {
  const lines = existingContent ? existingContent.split('\n') : []
  const filtered = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Remove existing Sitemap directives and old placeholder comment lines
    if (/^sitemap:\s*/i.test(trimmed)) {
      continue
    }
    if (/^#\s*Replace with your real domain/i.test(trimmed)) {
      continue
    }
    if (/^#\s*Note: Sitemap URL is automatically added/i.test(trimmed)) {
      continue
    }
    filtered.push(line)
  }

  // Ensure default User-agent and Allow/Disallow exist if file was empty
  let text = filtered.join('\n').trim()
  if (!text) {
    text = 'User-agent: *\nDisallow: /admin\nAllow: /'
  }

  if (sitemapUrl) {
    return `${text}\n\nSitemap: ${sitemapUrl.trim()}\n`
  }

  return `${text}\n\n# Note: Sitemap URL is automatically added during build once VITE_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL is configured.\n`
}

/**
 * Executes sitemap generation and robots.txt update.
 * Never throws fatal error to break builds.
 */
export async function generateSitemap(options = {}) {
  const rootDir = options.rootDir || process.cwd()
  const publicDir = path.resolve(rootDir, 'public')
  const robotsPath = path.resolve(publicDir, 'robots.txt')
  const sitemapPath = path.resolve(publicDir, 'sitemap.xml')

  const env = {
    ...loadEnvFile(path.resolve(rootDir, '.env')),
    ...loadEnvFile(path.resolve(rootDir, '.env.local')),
    ...process.env,
    ...(options.env || {}),
  }

  const urlResolution = resolveBaseUrl(env, {
    allowLocalhost: Boolean(options.allowLocalhost),
  })

  // Read existing robots.txt
  let existingRobots = ''
  if (existsSync(robotsPath)) {
    existingRobots = readFileSync(robotsPath, 'utf8')
  }

  if (!urlResolution.valid) {
    console.warn(`[sitemap] Notice: ${urlResolution.reason}`)
    console.warn('[sitemap] Skipping sitemap generation. Updating robots.txt safely without placeholder.')

    // Update robots.txt to remove any placeholder sitemap directive
    const cleanedRobots = updateRobotsTxt(existingRobots, null)
    writeFileSync(robotsPath, cleanedRobots, 'utf8')

    // Remove any stale or dummy sitemap.xml in public/
    if (existsSync(sitemapPath) && !options.preserveExistingSitemap) {
      unlinkSync(sitemapPath)
    }

    return {
      success: true,
      skipped: true,
      reason: urlResolution.reason,
    }
  }

  const siteUrl = urlResolution.url
  const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim()
  const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim()

  let categories = []
  let products = []

  const canQuerySupabase =
    supabaseUrl &&
    supabaseAnonKey &&
    /^https?:\/\//.test(supabaseUrl) &&
    !supabaseUrl.includes('YOUR-PROJECT-REF')

  if (canQuerySupabase) {
    try {
      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      }

      const [catRes, prodRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/categories?select=slug,updated_at&is_published=eq.true&is_archived=eq.false&order=display_order`,
          { headers },
        ),
        fetch(
          `${supabaseUrl}/rest/v1/products?select=slug,updated_at,categories!inner(is_published,is_archived)&is_published=eq.true&is_archived=eq.false&categories.is_published=eq.true&categories.is_archived=eq.false&order=created_at.desc&limit=5000`,
          { headers },
        ),
      ])

      if (catRes.ok) {
        categories = await catRes.json()
      } else {
        console.warn(`[sitemap] Warning: Category query returned status ${catRes.status}`)
      }

      if (prodRes.ok) {
        products = await prodRes.json()
      } else {
        console.warn(`[sitemap] Warning: Product query returned status ${prodRes.status}`)
      }
    } catch (err) {
      console.warn(`[sitemap] Warning: Could not connect to Supabase: ${err.message}. Generating static pages sitemap.`)
    }
  } else {
    console.warn('[sitemap] Notice: Supabase credentials not provided or using placeholder. Generating static routes sitemap.')
  }

  const xml = buildSitemapXml(siteUrl, STATIC_PUBLIC_ROUTES, categories, products)
  writeFileSync(sitemapPath, xml, 'utf8')

  const updatedRobots = updateRobotsTxt(existingRobots, `${siteUrl}/sitemap.xml`)
  writeFileSync(robotsPath, updatedRobots, 'utf8')

  const totalUrls = STATIC_PUBLIC_ROUTES.length + categories.length + products.length
  console.log(`[sitemap] Successfully generated public/sitemap.xml with ${totalUrls} URLs for ${siteUrl}`)

  return {
    success: true,
    skipped: false,
    siteUrl,
    totalUrls,
  }
}

