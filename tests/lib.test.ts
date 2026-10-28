import { describe, expect, it } from 'vitest'
import {
  digitsOnly,
  directionsUrl,
  generalEnquiryMessage,
  productEnquiryMessage,
  telHref,
  whatsappHref,
} from '../src/lib/contact'
import { friendlyError, isUniqueViolation } from '../src/lib/errors'
import {
  describePrice,
  formatPrice,
  isSafeLink,
  parseList,
  sanitizeSearch,
  slugCandidate,
  slugify,
} from '../src/lib/utils'
import {
  categoryFormSchema,
  emptyProductForm,
  getPublishIssues,
  productFormSchema,
  productFormToRow,
  settingsFormSchema,
  settingsFormToRow,
  settingsToFormValues,
  validateImageFile,
} from '../src/lib/validation'
import type { BusinessSettings } from '../src/lib/types'

const PHONE = '+91 98291 08112'

describe('contact links', () => {
  it('builds a tel: link for the business phone', () => {
    expect(telHref(PHONE)).toBe('tel:+919829108112')
    expect(telHref('')).toBeNull()
    expect(telHref('12')).toBeNull()
  })

  it('builds a wa.me link that opens the configured number', () => {
    expect(whatsappHref('919829108112')).toBe('https://wa.me/919829108112')
    expect(whatsappHref(PHONE)).toBe('https://wa.me/919829108112')
    expect(whatsappHref(null)).toBeNull()
  })

  it('URL-encodes the prefilled product enquiry', () => {
    const message = productEnquiryMessage('RK HANDLOOM', { name: 'Cotton Dari & Rug', sku: 'RK-001' })
    expect(message).toBe(
      'Hello RK HANDLOOM, I would like to enquire about Cotton Dari & Rug. Product code: RK-001. Please share more details.',
    )
    const href = whatsappHref('919829108112', message)!
    expect(href.startsWith('https://wa.me/919829108112?text=')).toBe(true)
    expect(href).not.toContain(' ')
    expect(href).toContain('%26') // the ampersand must be encoded
    expect(decodeURIComponent(href.split('?text=')[1])).toBe(message)
  })

  it('omits the SKU when there is none and appends the URL when given', () => {
    const m = productEnquiryMessage('RK HANDLOOM', { name: 'Throw' }, 'https://example.com/product/throw')
    expect(m).not.toContain('Product code')
    expect(m.endsWith('https://example.com/product/throw')).toBe(true)
    expect(generalEnquiryMessage('RK HANDLOOM')).toContain('RK HANDLOOM')
  })

  it('normalises digits', () => {
    expect(digitsOnly('+91 (98291) 08112')).toBe('919829108112')
  })

  it('builds directions from the address without inventing coordinates', () => {
    const url = directionsUrl({
      maps_url: null,
      name_en: 'RK HANDLOOM',
      location_code: '38X4+JR Beawar, Rajasthan',
      address: 'RK Handloom, Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901, India',
    })!
    expect(url.startsWith('https://www.google.com/maps/dir/?api=1&destination=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Sendra Road')
    expect(url).not.toMatch(/@-?\d+\.\d+,-?\d+\.\d+/) // no lat/long
  })

  it('prefers the owner-configured maps link, only if https', () => {
    const base = { name_en: 'x', location_code: null, address: 'Somewhere' }
    expect(directionsUrl({ ...base, maps_url: 'https://maps.app.goo.gl/abc' })).toBe('https://maps.app.goo.gl/abc')
    expect(directionsUrl({ ...base, maps_url: 'javascript:alert(1)' })!.startsWith('https://www.google.com/maps')).toBe(true)
    expect(directionsUrl({ name_en: 'x', maps_url: null, address: null, location_code: null })).toBeNull()
  })
})

describe('utils', () => {
  it('slugifies names safely', () => {
    expect(slugify('Cotton Dari & Rug (6x4 ft)')).toBe('cotton-dari-and-rug-6x4-ft')
    expect(slugify('  Café  Mattress!! ')).toBe('cafe-mattress')
    expect(slugify('आरके हैंडलूम')).toBe('')
    expect(slugCandidate('rug', 1)).toBe('rug')
    expect(slugCandidate('rug', 3)).toBe('rug-3')
  })

  it('formats prices and handles missing prices', () => {
    expect(formatPrice(1499)).toBe('₹1,499')
    expect(formatPrice(1499.5)).toBe('₹1,499.50')
    expect(formatPrice(null)).toBeNull()
    const none = { price: null, compare_at_price: null, price_label: null }
    expect(describePrice(none)).toEqual({ main: 'Contact for price', compareAt: null, enquire: true })
    expect(describePrice({ ...none, price_label: 'Ask in store' }).main).toBe('Ask in store')
    expect(describePrice({ price: 999, compare_at_price: 1299, price_label: null })).toEqual({
      main: '₹999',
      compareAt: '₹1,299',
      enquire: false,
    })
    expect(describePrice({ price: 999, compare_at_price: null, price_label: null }, false)).toEqual({
      main: null,
      compareAt: null,
      enquire: true,
    })
  })

  it('parses list fields', () => {
    expect(parseList('Cotton, wool,\nCotton,  ,Jute')).toEqual(['Cotton', 'wool', 'Jute'])
    expect(parseList('')).toEqual([])
  })

  it('strips filter-breaking characters from search text', () => {
    expect(sanitizeSearch('dari,name.eq.x)')).toBe('dari name.eq.x');
    expect(sanitizeSearch('50%_off "sale"')).toBe('50 off sale')
    expect(sanitizeSearch('a'.repeat(200))).toHaveLength(80)
    expect(sanitizeSearch('  ()  ')).toBe('')
  })

  it('only allows safe admin-configured links', () => {
    expect(isSafeLink('/catalog')).toBe(true)
    expect(isSafeLink('#directions')).toBe(true)
    expect(isSafeLink('https://example.com')).toBe(true)
    expect(isSafeLink('javascript:alert(1)')).toBe(false)
    expect(isSafeLink('//evil.example')).toBe(false)
    expect(isSafeLink('')).toBe(false)
  })
})

describe('product validation', () => {
  const valid = () => ({ ...emptyProductForm(), name: 'Cotton Dari', slug: 'cotton-dari' })

  it('accepts a minimal product: only name and slug are required, price is optional', () => {
    expect(productFormSchema.safeParse(valid()).success).toBe(true)
  })

  it('rejects a missing name, bad slug and bad price', () => {
    expect(productFormSchema.safeParse({ ...valid(), name: '  ' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...valid(), slug: 'Bad Slug' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...valid(), price: '12abc' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...valid(), price: '-5' }).success).toBe(false)
  })

  it('requires compare-at price to exceed price', () => {
    expect(productFormSchema.safeParse({ ...valid(), price: '100', compare_at_price: '100' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...valid(), price: '100', compare_at_price: '150' }).success).toBe(true)
  })

  it('rejects half-filled specification rows', () => {
    const bad = { ...valid(), specifications: [{ label: 'Weave', value: '' }] }
    expect(productFormSchema.safeParse(bad).success).toBe(false)
  })

  it('maps form values to database columns', () => {
    const row = productFormToRow({
      ...valid(),
      sku: ' rk-1 ',
      price: '1499.5',
      materials: 'Cotton, Jute',
      specifications: [
        { label: 'Weave', value: 'Plain' },
        { label: '', value: '' },
      ],
      variants: [{ name: 'Queen', sku: '', price: '8999', note: '' }],
      category_id: '',
    })
    expect(row.sku).toBe('rk-1')
    expect(row.price).toBe(1499.5)
    expect(row.materials).toEqual(['Cotton', 'Jute'])
    expect(row.specifications).toEqual([{ label: 'Weave', value: 'Plain' }])
    expect(row.variants).toEqual([{ name: 'Queen', price: 8999 }])
    expect(row.category_id).toBeNull()
    expect(row.compare_at_price).toBeNull()
  })

  it('lists what blocks publishing', () => {
    expect(getPublishIssues({ name: 'x', slug: 'x', category_id: null }, 0)).toEqual([
      'Choose a category.',
      'Upload at least one image.',
    ])
    expect(getPublishIssues({ name: 'x', slug: 'x', category_id: 'c' }, 2)).toEqual([])
    expect(getPublishIssues({ name: 'x', slug: 'x', category_id: 'c', is_archived: true }, 1)).toHaveLength(1)
  })

  it('validates categories', () => {
    const ok = { name: 'Rugs', slug: 'rugs', description: '', display_order: '1', is_published: true, is_featured: false, featured_order: '0' }
    expect(categoryFormSchema.safeParse(ok).success).toBe(true)
    expect(categoryFormSchema.safeParse({ ...ok, slug: 'not valid' }).success).toBe(false)
  })
})

describe('image validation', () => {
  it('accepts supported types and rejects others or oversized files', () => {
    expect(validateImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 1000 })).toBeNull()
    expect(validateImageFile({ name: 'a.gif', type: 'image/gif', size: 1000 })).toMatch(/not a supported image/)
    expect(validateImageFile({ name: 'a.svg', type: 'image/svg+xml', size: 1000 })).toMatch(/not a supported image/)
    expect(validateImageFile({ name: 'big.png', type: 'image/png', size: 16 * 1024 * 1024 })).toMatch(/15 MB/)
    expect(validateImageFile({ name: 'e.png', type: 'image/png', size: 0 })).toMatch(/empty/)
  })
})

describe('business settings validation', () => {
  const settings = {
    id: 1, name_en: 'RK HANDLOOM', name_hi: 'आरके हैंडलूम', tagline: null, short_description: null,
    long_description: null, phone: PHONE, whatsapp_number: '919829108112', email: null,
    address: 'Sendra Road, Beawar', location_code: null, maps_url: null, hours: [], hours_note: null,
    social: {}, logo_path: null, hero_image_path: null, hero_heading: null, hero_subheading: null,
    hero_primary_label: null, hero_primary_link: null, hero_secondary_label: null, hero_secondary_link: null,
    craft_heading: null, craft_body: null, about_heading: null, about_body: null, contact_heading: null,
    contact_body: null, footer_text: null, announcement_enabled: false, announcement_text: null,
    announcement_link: null, accent_theme: 'olive', call_label: null, whatsapp_label: null,
    directions_label: null, catalogue_page_size: 12, show_prices: true, show_sku: true, updated_at: '',
  } as BusinessSettings

  it('round-trips the supplied settings', () => {
    const form = settingsToFormValues(settings)
    expect(form.hours).toHaveLength(7)
    expect(settingsFormSchema.safeParse(form).success).toBe(true)
    const row = settingsFormToRow(form)
    expect(row.whatsapp_number).toBe('919829108112')
    expect(row.phone).toBe(PHONE)
    expect(row.email).toBeNull()
  })

  it('normalises a formatted WhatsApp number to digits', () => {
    const row = settingsFormToRow({ ...settingsToFormValues(settings), whatsapp_number: '+91 98291 08112' })
    expect(row.whatsapp_number).toBe('919829108112')
  })

  it('rejects invalid phone, email, links and hours', () => {
    const base = settingsToFormValues(settings)
    expect(settingsFormSchema.safeParse({ ...base, phone: 'call me' }).success).toBe(false)
    expect(settingsFormSchema.safeParse({ ...base, email: 'nope' }).success).toBe(false)
    expect(settingsFormSchema.safeParse({ ...base, maps_url: 'http://insecure.example' }).success).toBe(false)
    expect(settingsFormSchema.safeParse({ ...base, hero_primary_link: 'javascript:alert(1)' }).success).toBe(false)
    expect(settingsFormSchema.safeParse({ ...base, social: { ...base.social, facebook: 'facebook.com/x' } }).success).toBe(false)
    const hours = base.hours.map((h, i) => (i === 0 ? { ...h, open: '09:00', close: '' } : h))
    expect(settingsFormSchema.safeParse({ ...base, hours }).success).toBe(false)
    const reversed = base.hours.map((h, i) => (i === 0 ? { ...h, open: '18:00', close: '09:00' } : h))
    expect(settingsFormSchema.safeParse({ ...base, hours: reversed }).success).toBe(false)
    expect(settingsFormSchema.safeParse({ ...base, announcement_enabled: true, announcement_text: '' }).success).toBe(false)
  })

  it('does not treat unconfigured hours as open', () => {
    const row = settingsFormToRow(settingsToFormValues(settings))
    expect(row.hours.every((h) => h.open === null && h.close === null && h.closed === false)).toBe(true)
  })
})

describe('error messages', () => {
  it('explains duplicate slugs and SKUs', () => {
    expect(friendlyError({ code: '23505', message: 'duplicate key value violates unique constraint "products_slug_key"' }))
      .toMatch(/slug/i)
    expect(friendlyError({ code: '23505', message: 'duplicate key ... "products_sku_key"' })).toMatch(/SKU/)
    expect(isUniqueViolation({ code: '23505', message: '... products_slug_key' }, 'slug')).toBe(true)
    expect(isUniqueViolation({ code: '23505', message: '... products_sku_key' }, 'slug')).toBe(false)
  })

  it('passes through publishing rule messages and explains permission errors', () => {
    expect(friendlyError({ code: '23514', message: 'Add at least one image before publishing this product.' }))
      .toBe('Add at least one image before publishing this product.')
    expect(friendlyError({ code: '42501', message: 'x' })).toMatch(/permission/i)
    expect(friendlyError({ message: 'new row violates row-level security policy' })).toMatch(/permission/i)
    expect(friendlyError({ code: '23503', message: 'x' })).toMatch(/Archive it instead/)
    expect(friendlyError(null)).toMatch(/try again/i)
  })
})
