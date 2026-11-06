import { useEffect } from 'react'
import { absoluteUrl } from '@/lib/env'

interface SeoProps {
  title: string
  description?: string
  path?: string
  image?: string | null
  type?: 'website' | 'product'
  noindex?: boolean
  jsonLd?: object | object[] | null
}

const BRAND_NAME = 'RK HANDLOOM'
const BRAND_SUFFIX = 'RK HANDLOOM'
const DEFAULT_DESCRIPTION =
  'RK HANDLOOM (आरके हैंडलूम) is a handloom textiles and mattress store on Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901. Discover authentic cotton daris, bedsheets, and custom-crafted mattresses.'

function upsertMeta(attr: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (content === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (href === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Robust, technical SEO manager that dynamically synchronizes Document Title,
 * Open Graph, Twitter Card, Canonical URL, Robots Directives, and JSON-LD structured data.
 */
export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = title.includes(BRAND_SUFFIX) ? title : `${title} | ${BRAND_SUFFIX}`
  const canonicalUrl = path !== undefined && !noindex ? absoluteUrl(path) : null
  const shareImage = image || absoluteUrl('/favicon.svg')

  useEffect(() => {
    // 1. Title
    document.title = fullTitle

    // 2. Standard Meta
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // 3. Open Graph
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type === 'product' ? 'product' : 'website')
    upsertMeta('property', 'og:site_name', BRAND_NAME)
    upsertMeta('property', 'og:locale', 'en_IN')
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', shareImage)

    // 4. Twitter Card
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', shareImage)

    // 5. Canonical Link
    upsertLink('canonical', canonicalUrl)

    // 6. JSON-LD Structured Data
    // Remove previous script elements created by Seo
    const oldScripts = document.head.querySelectorAll('script[data-seo="true"]')
    oldScripts.forEach((s) => s.remove())

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
      items.forEach((item, index) => {
        if (!item) return
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.dataset.seo = 'true'
        script.dataset.seoIndex = String(index)
        script.textContent = JSON.stringify(item)
        document.head.appendChild(script)
      })
    }

    return () => {
      const cleanup = document.head.querySelectorAll('script[data-seo="true"]')
      cleanup.forEach((s) => s.remove())
    }
  }, [fullTitle, description, canonicalUrl, shareImage, image, type, noindex, jsonLd])

  return null
}
