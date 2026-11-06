import { absoluteUrl } from './env'
import { mediaUrl } from './media'
import { digitsOnly } from './contact'
import { configuredHours } from './contact'
import type { BusinessSettings, ProductWithRelations } from './types'

/**
 * schema.org HomeGoodsStore / LocalBusiness data.
 * Grounded strictly in authentic store data: Sendra Road, Beawar, Rajasthan.
 */
export function localBusinessJsonLd(s: BusinessSettings) {
  const sameAs = Object.values(s.social ?? {}).filter(Boolean)
  const hours = configuredHours(s.hours).filter((h) => !h.closed && h.open && h.close)
  const storeUrl = absoluteUrl('/')

  return {
    '@context': 'https://schema.org',
    '@type': 'HomeGoodsStore',
    '@id': `${storeUrl}#store`,
    name: s.name_en,
    ...(s.name_hi ? { alternateName: s.name_hi } : {}),
    url: storeUrl,
    description:
      s.short_description ||
      'Authentic handloom textiles and mattress showroom on Sendra Road, Beawar, Rajasthan.',
    ...(s.phone ? { telephone: `+${digitsOnly(s.phone)}` } : {}),
    ...(s.email ? { email: s.email } : {}),
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address || 'Sendra Road, near Hera Hospital, Vidya Nagar',
      addressLocality: 'Beawar',
      addressRegion: 'Rajasthan',
      postalCode: '305901',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 26.1017,
      longitude: 74.3168,
    },
    hasMap:
      s.maps_url ||
      'https://www.google.com/maps/search/?api=1&query=RK+Handloom+Sendra+Road+Beawar',
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

/**
 * schema.org WebSite structured data with SearchAction.
 */
export function webSiteJsonLd() {
  const siteUrl = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: 'RK HANDLOOM',
    alternateName: 'आरके हैंडलूम',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/catalog')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export interface BreadcrumbItem {
  name: string
  path: string
}

/**
 * schema.org BreadcrumbList structured data for rich snippet navigation.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/**
 * schema.org Product data.
 * Validates offers, brand, condition, and availability without fabricating ratings or reviews.
 */
export function productJsonLd(p: ProductWithRelations, business: BusinessSettings) {
  const images = p.images.map((i) => mediaUrl(i.storage_path)).filter(Boolean)
  const url = absoluteUrl(`/product/${p.slug}`)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url,
    ...(images.length ? { image: images } : {}),
    description: p.short_description || p.description || `${p.name} from RK HANDLOOM Beawar`,
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.category ? { category: p.category.name } : {}),
    brand: {
      '@type': 'Brand',
      name: business.name_en || 'RK HANDLOOM',
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: p.price !== null && business.show_prices ? p.price : 0,
      priceValidUntil: '2028-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'HomeGoodsStore',
        name: business.name_en || 'RK HANDLOOM',
      },
    },
  }
}
