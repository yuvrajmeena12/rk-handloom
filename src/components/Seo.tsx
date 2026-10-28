import { useEffect } from 'react'
import { absoluteUrl } from '@/lib/env'

interface SeoProps {
  title: string
  description?: string
  path?: string
  image?: string | null
  type?: 'website' | 'product'
  noindex?: boolean
  jsonLd?: object | null
}

const SUFFIX = 'RK HANDLOOM'

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

/** Sets page title and metadata. Effect-based so it works the same in every route. */
export function Seo({ title, description, path, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const fullTitle = title.includes(SUFFIX) ? title : `${title} | ${SUFFIX}`
  const json = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    document.title = fullTitle
    upsertMeta('name', 'description', description ?? null)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : null)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description ?? null)
    upsertMeta('property', 'og:type', type === 'product' ? 'website' : type)
    upsertMeta('property', 'og:site_name', SUFFIX)
    upsertMeta('property', 'og:image', image ?? null)
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    upsertLink('canonical', path !== undefined && !noindex ? absoluteUrl(path) : null)
    upsertMeta('property', 'og:url', path !== undefined && !noindex ? absoluteUrl(path) : null)

    let script: HTMLScriptElement | null = null
    if (json) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seo = 'true'
      script.textContent = json
      document.head.appendChild(script)
    }
    return () => {
      script?.remove()
    }
  }, [fullTitle, description, path, image, type, noindex, json])

  return null
}
