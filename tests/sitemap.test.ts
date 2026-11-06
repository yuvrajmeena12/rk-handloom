import { describe, expect, it } from 'vitest'
import {
  buildSitemapXml,
  escapeXml,
  formatLastMod,
  resolveBaseUrl,
  STATIC_PUBLIC_ROUTES,
  updateRobotsTxt,
} from '../scripts/sitemap-lib.mjs'

describe('Sitemap & Robots SEO Configuration (Phase 1)', () => {
  describe('resolveBaseUrl', () => {
    it('returns invalid when no URL variables are present', () => {
      const res = resolveBaseUrl({})
      expect(res.valid).toBe(false)
      expect(res.reason).toMatch(/No site URL configured/i)
    })

    it('supports VERCEL_PROJECT_PRODUCTION_URL without protocol and adds https://', () => {
      const res = resolveBaseUrl({
        VERCEL_PROJECT_PRODUCTION_URL: 'rk-handloom.vercel.app',
      })
      expect(res.valid).toBe(true)
      expect(res.url).toBe('https://rk-handloom.vercel.app')
      expect(res.isLocalhost).toBe(false)
    })

    it('supports VERCEL_URL as secondary fallback', () => {
      const res = resolveBaseUrl({
        VERCEL_URL: 'rk-handloom-preview.vercel.app',
      })
      expect(res.valid).toBe(true)
      expect(res.url).toBe('https://rk-handloom-preview.vercel.app')
    })

    it('prioritizes VITE_SITE_URL over Vercel variables', () => {
      const res = resolveBaseUrl({
        VITE_SITE_URL: 'https://custom-handloom.com',
        VERCEL_PROJECT_PRODUCTION_URL: 'rk-handloom.vercel.app',
      })
      expect(res.valid).toBe(true)
      expect(res.url).toBe('https://custom-handloom.com')
    })

    it('enforces https:// protocol on production domains', () => {
      const res = resolveBaseUrl({
        VITE_SITE_URL: 'http://custom-handloom.com/',
      })
      expect(res.valid).toBe(true)
      expect(res.url).toBe('https://custom-handloom.com')
    })

    it('rejects placeholder and dummy domains', () => {
      const placeholders = [
        'https://your-domain.example',
        'http://example.com',
        'https://my-store.example.org',
      ]
      for (const p of placeholders) {
        const res = resolveBaseUrl({ VITE_SITE_URL: p })
        expect(res.valid).toBe(false)
        expect(res.reason).toMatch(/placeholder domain detected/i)
      }
    })

    it('rejects localhost for production canonical URL by default', () => {
      const res = resolveBaseUrl({ VITE_SITE_URL: 'http://localhost:5173' })
      expect(res.valid).toBe(false)
      expect(res.isLocalhost).toBe(true)
      expect(res.reason).toMatch(/cannot be used as a production canonical sitemap URL/i)
    })

    it('allows localhost when allowLocalhost option is explicitly true for dev testing', () => {
      const res = resolveBaseUrl(
        { VITE_SITE_URL: 'http://localhost:5173' },
        { allowLocalhost: true },
      )
      expect(res.valid).toBe(true)
      expect(res.isLocalhost).toBe(true)
      expect(res.url).toBe('http://localhost:5173')
    })

    it('strips trailing slashes cleanly', () => {
      const res = resolveBaseUrl({
        VITE_SITE_URL: 'https://rk-handloom.vercel.app///',
      })
      expect(res.valid).toBe(true)
      expect(res.url).toBe('https://rk-handloom.vercel.app')
    })
  })

  describe('buildSitemapXml', () => {
    it('includes all core static public routes including /privacy and /terms', () => {
      expect(STATIC_PUBLIC_ROUTES).toContain('/')
      expect(STATIC_PUBLIC_ROUTES).toContain('/catalog')
      expect(STATIC_PUBLIC_ROUTES).toContain('/about')
      expect(STATIC_PUBLIC_ROUTES).toContain('/contact')
      expect(STATIC_PUBLIC_ROUTES).toContain('/privacy')
      expect(STATIC_PUBLIC_ROUTES).toContain('/terms')

      const xml = buildSitemapXml('https://rk-handloom.vercel.app')
      for (const route of STATIC_PUBLIC_ROUTES) {
        expect(xml).toContain(`<loc>https://rk-handloom.vercel.app${route === '/' ? '/' : route}</loc>`)
      }
    })

    it('includes published categories and products with formatted lastmod dates', () => {
      const categories = [
        { slug: 'handloom-rugs', updated_at: '2026-10-25T14:32:00.000Z' },
      ]
      const products = [
        { slug: 'cotton-dari-blue', updated_at: '2026-10-28T10:15:00.000Z' },
      ]

      const xml = buildSitemapXml('https://rk-handloom.vercel.app', STATIC_PUBLIC_ROUTES, categories, products)
      expect(xml).toContain('<loc>https://rk-handloom.vercel.app/category/handloom-rugs</loc>')
      expect(xml).toContain('<lastmod>2026-10-25</lastmod>')
      expect(xml).toContain('<loc>https://rk-handloom.vercel.app/product/cotton-dari-blue</loc>')
      expect(xml).toContain('<lastmod>2026-10-28</lastmod>')
    })

    it('escapes XML special characters in URLs', () => {
      expect(escapeXml('a & b < c > d " e \' f')).toBe('a &amp; b &lt; c &gt; d &quot; e &apos; f')
    })

    it('formats lastmod correctly and ignores invalid dates', () => {
      expect(formatLastMod('2026-10-29T18:00:00Z')).toBe('2026-10-29')
      expect(formatLastMod(null)).toBeNull()
      expect(formatLastMod('')).toBeNull()
      expect(formatLastMod('invalid-date')).toBeNull()
    })
  })

  describe('updateRobotsTxt', () => {
    it('removes placeholder sitemap and comments without touching custom rules', () => {
      const existing = [
        'User-agent: *',
        'Disallow: /admin',
        'Allow: /',
        '',
        '# Replace with your real domain, or run `npm run sitemap` to regenerate sitemap.xml',
        'Sitemap: https://your-domain.example/sitemap.xml',
      ].join('\n')

      const updated = updateRobotsTxt(existing, null)
      expect(updated).toContain('User-agent: *')
      expect(updated).toContain('Disallow: /admin')
      expect(updated).toContain('Allow: /')
      expect(updated).not.toContain('your-domain.example')
      expect(updated).not.toContain('Sitemap: https://your-domain.example/sitemap.xml')
      expect(updated).toContain('Sitemap URL is automatically added during build')
    })

    it('updates sitemap directive with verified URL', () => {
      const existing = 'User-agent: *\nDisallow: /admin\nAllow: /'
      const updated = updateRobotsTxt(existing, 'https://rk-handloom.vercel.app/sitemap.xml')
      expect(updated).toContain('Sitemap: https://rk-handloom.vercel.app/sitemap.xml')
    })

    it('replaces existing sitemap directive when URL changes', () => {
      const existing = 'User-agent: *\nDisallow: /admin\nSitemap: https://old-preview.vercel.app/sitemap.xml'
      const updated = updateRobotsTxt(existing, 'https://rk-handloom.vercel.app/sitemap.xml')
      expect(updated).not.toContain('old-preview.vercel.app')
      expect(updated).toContain('Sitemap: https://rk-handloom.vercel.app/sitemap.xml')
    })
  })
})

