import clsx, { type ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

/** URL-safe, ASCII slug. Returns '' when nothing usable remains (e.g. Hindi-only input). */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Returns `base`, `base-2`, `base-3`… for retry-on-conflict slug generation. */
export function slugCandidate(base: string, attempt: number): string {
  return attempt <= 1 ? base : `${base}-${attempt}`
}

export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export interface PriceDisplay {
  /** Text to show, or null when there is nothing to show (price hidden). */
  main: string | null
  compareAt: string | null
  /** True when the visitor should enquire for the price. */
  enquire: boolean
}

/**
 * Decides what price text to show. Prices are optional: a product without a price shows
 * its custom label or "Contact for price". When the owner hides prices site-wide, nothing
 * numeric is shown.
 */
export function describePrice(
  product: { price: number | null; compare_at_price: number | null; price_label: string | null },
  showPrices = true,
): PriceDisplay {
  const label = product.price_label?.trim() || null
  if (!showPrices) return { main: label, compareAt: null, enquire: !label }
  if (product.price === null || product.price === undefined) {
    return { main: label ?? 'Contact for price', compareAt: null, enquire: true }
  }
  const main = formatPrice(product.price)
  return {
    main: label ? `${label} ${main}` : main,
    compareAt: product.compare_at_price ? formatPrice(product.compare_at_price) : null,
    enquire: false,
  }
}

/** Splits comma/newline separated text into trimmed, de-duplicated, non-empty items. */
export function parseList(input: string | null | undefined): string[] {
  if (!input) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of input.split(/[\n,]/)) {
    const item = part.trim()
    const key = item.toLowerCase()
    if (item && !seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}

export const joinList = (items: string[] | null | undefined) => (items ?? []).join(', ')

/**
 * Makes user search text safe for a PostgREST `or()` filter / ILIKE pattern by removing
 * characters that have structural meaning there.
 */
export function sanitizeSearch(input: string): string {
  return input
    .replace(/[%_\\*,()"':;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

/** Only allows in-site paths, hash links and http(s) URLs for admin-configured links. */
export function isSafeLink(href: string | null | undefined): href is string {
  if (!href) return false
  const value = href.trim()
  return /^(\/(?!\/)|#|https?:\/\/)/i.test(value)
}

/** "09:00" -> "9:00 AM". Returns the input unchanged if it is not HH:MM. */
export function formatTime12(value: string | null | undefined): string {
  if (!value) return ''
  const m = /^(\d{2}):(\d{2})$/.exec(value)
  if (!m) return value
  const h = Number(m[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${suffix}`
}
