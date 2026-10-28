import { absoluteUrl } from './env'
import { mediaUrl } from './media'
import { digitsOnly } from './contact'
import { configuredHours } from './contact'
import type { BusinessSettings, ProductWithRelations } from './types'

/** schema.org LocalBusiness data, built only from details the owner has entered. */
export function localBusinessJsonLd(s: BusinessSettings) {
  const sameAs = Object.values(s.social ?? {}).filter(Boolean)
  const hours = configuredHours(s.hours).filter((h) => !h.closed && h.open && h.close)
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeGoodsStore',
    name: s.name_en,
    ...(s.name_hi ? { alternateName: s.name_hi } : {}),
    url: absoluteUrl('/'),
    ...(s.short_description ? { description: s.short_description } : {}),
    ...(s.phone ? { telephone: `+${digitsOnly(s.phone)}` } : {}),
    ...(s.email ? { email: s.email } : {}),
    ...(s.address ? { address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'IN' } } : {}),
    ...(mediaUrl(s.logo_path) ? { logo: mediaUrl(s.logo_path) } : {}),
    ...(mediaUrl(s.hero_image_path) ? { image: mediaUrl(s.hero_image_path) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(hours.length
      ? {
          openingHoursSpecification: hours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.day,
            opens: h.open,
            closes: h.close,
          })),
        }
      : {}),
  }
}

/** schema.org Product data. An offer is included only when the owner has set a price. */
export function productJsonLd(p: ProductWithRelations, business: BusinessSettings) {
  const images = p.images.map((i) => mediaUrl(i.storage_path)).filter(Boolean)
  const url = absoluteUrl(`/product/${p.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url,
    ...(images.length ? { image: images } : {}),
    ...(p.short_description || p.description ? { description: p.short_description || p.description } : {}),
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.category ? { category: p.category.name } : {}),
    brand: { '@type': 'Brand', name: business.name_en },
    ...(p.price !== null && business.show_prices
      ? { offers: { '@type': 'Offer', price: p.price, priceCurrency: 'INR', url } }
      : {}),
  }
}
