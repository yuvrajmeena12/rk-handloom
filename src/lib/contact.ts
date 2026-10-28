import type { BusinessSettings } from './types'

/** Keeps only digits: "+91 98291 08112" -> "919829108112". */
export const digitsOnly = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '')

/** tel: link. Keeps a leading + so the dialler treats it as an international number. */
export function telHref(phone: string | null | undefined): string | null {
  const digits = digitsOnly(phone)
  if (digits.length < 8) return null
  return `tel:+${digits}`
}

export function whatsappHref(number: string | null | undefined, message?: string): string | null {
  const digits = digitsOnly(number)
  if (digits.length < 8) return null
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function productEnquiryMessage(
  businessName: string,
  product: { name: string; sku?: string | null },
  url?: string,
): string {
  const parts = [`Hello ${businessName}, I would like to enquire about ${product.name}.`]
  if (product.sku) parts.push(`Product code: ${product.sku}.`)
  parts.push('Please share more details.')
  if (url) parts.push(url)
  return parts.join(' ')
}

export function generalEnquiryMessage(businessName: string): string {
  return `Hello ${businessName}, I would like to know more about your products.`
}

/**
 * Directions link. Uses the owner's own Google Maps link when configured; otherwise a
 * Google Maps directions URL built from the supplied address text. No coordinates are invented.
 */
export function directionsUrl(
  settings: Pick<BusinessSettings, 'maps_url' | 'address' | 'location_code' | 'name_en'>,
): string | null {
  if (settings.maps_url && /^https:\/\//i.test(settings.maps_url)) return settings.maps_url
  const destination = settings.address?.trim() || settings.location_code?.trim()
  if (!destination) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

/** Embed-free map search link (opens the place on Google Maps). */
export function mapSearchUrl(settings: Pick<BusinessSettings, 'address' | 'location_code'>): string | null {
  const query = settings.location_code?.trim() || settings.address?.trim()
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function configuredHours(hours: BusinessSettings['hours']) {
  return (hours ?? []).filter((d) => d.closed || d.open || d.close)
}
