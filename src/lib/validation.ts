import { z } from 'zod'
import { SLUG_PATTERN, joinList, parseList } from './utils'
import type { BusinessSettings, Category, DayHours, Product, ProductType } from './types'

const PRODUCT_TYPES = ['handloom_fabric', 'mattress', 'bedding', 'other'] as const

const money = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{1,10}(\.\d{1,2})?$/.test(v), 'Enter a valid amount, e.g. 1499 or 1499.50')

const wholeNumber = z
  .string()
  .trim()
  .refine((v) => v === '' || /^-?\d{1,6}$/.test(v), 'Enter a whole number')

const slugField = z
  .string()
  .trim()
  .min(1, 'Enter a URL slug')
  .max(180)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and single hyphens only')

const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/i.test(v), 'Enter a full link starting with https://')

const inSiteOrHttpsLink = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^(\/(?!\/)|#|https:\/\/)\S*$/i.test(v), 'Use a page like /catalog, #directions or a https:// link')

/* ----------------------------- Product form ----------------------------- */

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a product name').max(160, 'Keep the name under 160 characters'),
    slug: slugField,
    sku: z.string().trim().max(60, 'Keep the SKU under 60 characters'),
    category_id: z.string(),
    product_type: z.enum(PRODUCT_TYPES),
    short_description: z.string().trim().max(400, 'Keep this under 400 characters'),
    description: z.string().trim().max(8000, 'Keep this under 8000 characters'),
    price: money,
    compare_at_price: money,
    price_label: z.string().trim().max(60, 'Keep this under 60 characters'),
    specifications: z
      .array(z.object({ label: z.string().trim().max(80), value: z.string().trim().max(300) }))
      .max(30, 'At most 30 specifications'),
    materials: z.string().max(500),
    sizes: z.string().max(500),
    colours: z.string().max(500),
    tags: z.string().max(500),
    variants: z
      .array(
        z.object({
          name: z.string().trim().max(120),
          sku: z.string().trim().max(60),
          price: money,
          note: z.string().trim().max(200),
        }),
      )
      .max(30, 'At most 30 variants'),
    care_instructions: z.string().trim().max(3000),
    additional_notes: z.string().trim().max(3000),
    show_enquiry_button: z.boolean(),
    is_featured: z.boolean(),
    featured_order: wholeNumber,
    display_order: wholeNumber,
    seo_title: z.string().trim().max(70, 'Keep the SEO title under 70 characters'),
    seo_description: z.string().trim().max(200, 'Keep the SEO description under 200 characters'),
  })
  .superRefine((v, ctx) => {
    if (v.price && v.compare_at_price && Number(v.compare_at_price) <= Number(v.price)) {
      ctx.addIssue({
        code: 'custom',
        path: ['compare_at_price'],
        message: 'The compare-at price must be higher than the price',
      })
    }
    v.specifications.forEach((s, i) => {
      if (!!s.label !== !!s.value) {
        ctx.addIssue({
          code: 'custom',
          path: ['specifications', i, s.label ? 'value' : 'label'],
          message: 'Fill in both the name and the value, or remove the row',
        })
      }
    })
    v.variants.forEach((variant, i) => {
      if (!variant.name && (variant.sku || variant.price || variant.note)) {
        ctx.addIssue({ code: 'custom', path: ['variants', i, 'name'], message: 'Give this variant a name' })
      }
    })
  })

export type ProductFormValues = z.infer<typeof productFormSchema>

export const emptyProductForm = (): ProductFormValues => ({
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  product_type: 'other',
  short_description: '',
  description: '',
  price: '',
  compare_at_price: '',
  price_label: '',
  specifications: [],
  materials: '',
  sizes: '',
  colours: '',
  tags: '',
  variants: [],
  care_instructions: '',
  additional_notes: '',
  show_enquiry_button: true,
  is_featured: false,
  featured_order: '0',
  display_order: '0',
  seo_title: '',
  seo_description: '',
})

const orNull = (v: string) => (v.trim() === '' ? null : v.trim())
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

/** Database columns for a product, built from validated form values. Publication is separate. */
export function productFormToRow(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    sku: orNull(values.sku),
    category_id: values.category_id || null,
    product_type: values.product_type as ProductType,
    short_description: orNull(values.short_description),
    description: orNull(values.description),
    price: numOrNull(values.price),
    compare_at_price: numOrNull(values.compare_at_price),
    price_label: orNull(values.price_label),
    specifications: values.specifications
      .filter((s) => s.label && s.value)
      .map((s) => ({ label: s.label, value: s.value })),
    materials: parseList(values.materials),
    sizes: parseList(values.sizes),
    colours: parseList(values.colours),
    tags: parseList(values.tags),
    variants: values.variants
      .filter((v) => v.name)
      .map((v) => ({
        name: v.name,
        ...(v.sku ? { sku: v.sku } : {}),
        ...(v.price ? { price: Number(v.price) } : {}),
        ...(v.note ? { note: v.note } : {}),
      })),
    care_instructions: orNull(values.care_instructions),
    additional_notes: orNull(values.additional_notes),
    show_enquiry_button: values.show_enquiry_button,
    is_featured: values.is_featured,
    featured_order: Number(values.featured_order || 0),
    display_order: Number(values.display_order || 0),
    seo_title: orNull(values.seo_title),
    seo_description: orNull(values.seo_description),
  }
}

export function productToFormValues(p: Product): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? '',
    category_id: p.category_id ?? '',
    product_type: p.product_type,
    short_description: p.short_description ?? '',
    description: p.description ?? '',
    price: p.price === null ? '' : String(p.price),
    compare_at_price: p.compare_at_price === null ? '' : String(p.compare_at_price),
    price_label: p.price_label ?? '',
    specifications: (p.specifications ?? []).map((s) => ({ label: s.label, value: s.value })),
    materials: joinList(p.materials),
    sizes: joinList(p.sizes),
    colours: joinList(p.colours),
    tags: joinList(p.tags),
    variants: (p.variants ?? []).map((v) => ({
      name: v.name,
      sku: v.sku ?? '',
      price: v.price === null || v.price === undefined ? '' : String(v.price),
      note: v.note ?? '',
    })),
    care_instructions: p.care_instructions ?? '',
    additional_notes: p.additional_notes ?? '',
    show_enquiry_button: p.show_enquiry_button,
    is_featured: p.is_featured,
    featured_order: String(p.featured_order),
    display_order: String(p.display_order),
    seo_title: p.seo_title ?? '',
    seo_description: p.seo_description ?? '',
  }
}

/** Reasons a product cannot be published yet (also enforced again by database triggers). */
export function getPublishIssues(product: {
  name: string
  slug: string
  category_id: string | null
  is_archived?: boolean
}, imageCount: number): string[] {
  const issues: string[] = []
  if (!product.name.trim()) issues.push('Add a product name.')
  if (!product.slug.trim()) issues.push('Add a URL slug.')
  if (!product.category_id) issues.push('Choose a category.')
  if (imageCount < 1) issues.push('Upload at least one image.')
  if (product.is_archived) issues.push('Restore the product from the archive first.')
  return issues
}

/* ----------------------------- Category form ---------------------------- */

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name').max(120),
  slug: slugField.max(140),
  description: z.string().trim().max(2000, 'Keep this under 2000 characters'),
  display_order: wholeNumber,
  is_published: z.boolean(),
  is_featured: z.boolean(),
  featured_order: wholeNumber,
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const emptyCategoryForm = (): CategoryFormValues => ({
  name: '',
  slug: '',
  description: '',
  display_order: '0',
  is_published: true,
  is_featured: false,
  featured_order: '0',
})

export const categoryToFormValues = (c: Category): CategoryFormValues => ({
  name: c.name,
  slug: c.slug,
  description: c.description ?? '',
  display_order: String(c.display_order),
  is_published: c.is_published,
  is_featured: c.is_featured,
  featured_order: String(c.featured_order),
})

export const categoryFormToRow = (v: CategoryFormValues) => ({
  name: v.name.trim(),
  slug: v.slug.trim(),
  description: orNull(v.description),
  display_order: Number(v.display_order || 0),
  is_published: v.is_published,
  is_featured: v.is_featured,
  featured_order: Number(v.featured_order || 0),
})

/* --------------------------- Business settings -------------------------- */

const time = z
  .string()
  .trim()
  .refine((v) => v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Use 24-hour time like 09:00')

export const SOCIAL_KEYS = ['facebook', 'instagram', 'youtube', 'website'] as const

export const settingsFormSchema = z
  .object({
    name_en: z.string().trim().min(1, 'Enter the business name').max(120),
    name_hi: z.string().trim().max(120),
    tagline: z.string().trim().max(160),
    short_description: z.string().trim().max(300, 'Keep this under 300 characters'),
    long_description: z.string().trim().max(4000),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\+?[0-9][0-9 ()-]{6,19}$/.test(v), 'Enter a valid phone number, e.g. +91 98291 08112'),
    whatsapp_number: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\+?[0-9 ()-]{8,22}$/.test(v), 'Enter the WhatsApp number with country code')
      .refine(
        (v) => v === '' || (v.replace(/\D/g, '').length >= 8 && v.replace(/\D/g, '').length <= 15),
        'A WhatsApp number has 8 to 15 digits including the country code',
      ),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address'),
    address: z.string().trim().max(400),
    location_code: z.string().trim().max(80),
    maps_url: httpsUrl,
    hours: z.array(
      z.object({ day: z.string(), open: time, close: time, closed: z.boolean() }),
    ),
    hours_note: z.string().trim().max(300),
    social: z.object({
      facebook: httpsUrl,
      instagram: httpsUrl,
      youtube: httpsUrl,
      website: httpsUrl,
    }),
    hero_heading: z.string().trim().max(160),
    hero_subheading: z.string().trim().max(400),
    hero_primary_label: z.string().trim().max(40),
    hero_primary_link: inSiteOrHttpsLink,
    hero_secondary_label: z.string().trim().max(40),
    hero_secondary_link: inSiteOrHttpsLink,
    craft_heading: z.string().trim().max(160),
    craft_body: z.string().trim().max(2000),
    about_heading: z.string().trim().max(160),
    about_body: z.string().trim().max(6000),
    contact_heading: z.string().trim().max(160),
    contact_body: z.string().trim().max(1000),
    footer_text: z.string().trim().max(500),
    announcement_enabled: z.boolean(),
    announcement_text: z.string().trim().max(200),
    announcement_link: inSiteOrHttpsLink,
    accent_theme: z.enum(['olive', 'earth', 'walnut']),
    call_label: z.string().trim().max(30),
    whatsapp_label: z.string().trim().max(30),
    directions_label: z.string().trim().max(30),
    catalogue_page_size: z
      .string()
      .trim()
      .refine((v) => /^\d+$/.test(v) && Number(v) >= 6 && Number(v) <= 48, 'Choose a number from 6 to 48'),
    show_prices: z.boolean(),
    show_sku: z.boolean(),
  })
  .superRefine((v, ctx) => {
    v.hours.forEach((d, i) => {
      if (!d.closed && !!d.open !== !!d.close) {
        ctx.addIssue({
          code: 'custom',
          path: ['hours', i, d.open ? 'close' : 'open'],
          message: 'Enter both opening and closing time, or leave both empty',
        })
      }
      if (!d.closed && d.open && d.close && d.close <= d.open) {
        ctx.addIssue({ code: 'custom', path: ['hours', i, 'close'], message: 'Closing time must be after opening time' })
      }
    })
    if (v.announcement_enabled && !v.announcement_text) {
      ctx.addIssue({ code: 'custom', path: ['announcement_text'], message: 'Enter the announcement text or switch it off' })
    }
  })

export type SettingsFormValues = z.infer<typeof settingsFormSchema>

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function normaliseHours(hours: DayHours[] | null | undefined): DayHours[] {
  return DAYS.map((day) => {
    const found = (hours ?? []).find((h) => h.day === day)
    return { day, open: found?.open ?? null, close: found?.close ?? null, closed: found?.closed ?? false }
  })
}

export function settingsToFormValues(s: BusinessSettings): SettingsFormValues {
  const social = s.social ?? {}
  return {
    name_en: s.name_en,
    name_hi: s.name_hi ?? '',
    tagline: s.tagline ?? '',
    short_description: s.short_description ?? '',
    long_description: s.long_description ?? '',
    phone: s.phone ?? '',
    whatsapp_number: s.whatsapp_number ?? '',
    email: s.email ?? '',
    address: s.address ?? '',
    location_code: s.location_code ?? '',
    maps_url: s.maps_url ?? '',
    hours: normaliseHours(s.hours).map((h) => ({ day: h.day, open: h.open ?? '', close: h.close ?? '', closed: h.closed })),
    hours_note: s.hours_note ?? '',
    social: {
      facebook: social.facebook ?? '',
      instagram: social.instagram ?? '',
      youtube: social.youtube ?? '',
      website: social.website ?? '',
    },
    hero_heading: s.hero_heading ?? '',
    hero_subheading: s.hero_subheading ?? '',
    hero_primary_label: s.hero_primary_label ?? '',
    hero_primary_link: s.hero_primary_link ?? '',
    hero_secondary_label: s.hero_secondary_label ?? '',
    hero_secondary_link: s.hero_secondary_link ?? '',
    craft_heading: s.craft_heading ?? '',
    craft_body: s.craft_body ?? '',
    about_heading: s.about_heading ?? '',
    about_body: s.about_body ?? '',
    contact_heading: s.contact_heading ?? '',
    contact_body: s.contact_body ?? '',
    footer_text: s.footer_text ?? '',
    announcement_enabled: s.announcement_enabled,
    announcement_text: s.announcement_text ?? '',
    announcement_link: s.announcement_link ?? '',
    accent_theme: s.accent_theme,
    call_label: s.call_label ?? '',
    whatsapp_label: s.whatsapp_label ?? '',
    directions_label: s.directions_label ?? '',
    catalogue_page_size: String(s.catalogue_page_size),
    show_prices: s.show_prices,
    show_sku: s.show_sku,
  }
}

/** Database columns from settings form values (only the groups present in `values`). */
export function settingsFormToRow(values: SettingsFormValues) {
  const social = Object.fromEntries(
    Object.entries(values.social).filter(([, v]) => v && v.trim()),
  ) as Record<string, string>
  return {
    name_en: values.name_en.trim(),
    name_hi: orNull(values.name_hi),
    tagline: orNull(values.tagline),
    short_description: orNull(values.short_description),
    long_description: orNull(values.long_description),
    phone: orNull(values.phone),
    whatsapp_number: values.whatsapp_number ? values.whatsapp_number.replace(/\D/g, '') : null,
    email: orNull(values.email),
    address: orNull(values.address),
    location_code: orNull(values.location_code),
    maps_url: orNull(values.maps_url),
    hours: values.hours.map((h) => ({
      day: h.day,
      open: h.closed ? null : orNull(h.open),
      close: h.closed ? null : orNull(h.close),
      closed: h.closed,
    })),
    hours_note: orNull(values.hours_note),
    social,
    hero_heading: orNull(values.hero_heading),
    hero_subheading: orNull(values.hero_subheading),
    hero_primary_label: orNull(values.hero_primary_label),
    hero_primary_link: orNull(values.hero_primary_link),
    hero_secondary_label: orNull(values.hero_secondary_label),
    hero_secondary_link: orNull(values.hero_secondary_link),
    craft_heading: orNull(values.craft_heading),
    craft_body: orNull(values.craft_body),
    about_heading: orNull(values.about_heading),
    about_body: orNull(values.about_body),
    contact_heading: orNull(values.contact_heading),
    contact_body: orNull(values.contact_body),
    footer_text: orNull(values.footer_text),
    announcement_enabled: values.announcement_enabled,
    announcement_text: orNull(values.announcement_text),
    announcement_link: orNull(values.announcement_link),
    accent_theme: values.accent_theme,
    call_label: orNull(values.call_label),
    whatsapp_label: orNull(values.whatsapp_label),
    directions_label: orNull(values.directions_label),
    catalogue_page_size: Number(values.catalogue_page_size),
    show_prices: values.show_prices,
    show_sku: values.show_sku,
  }
}

/* ------------------------------- Images -------------------------------- */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported image. Use JPG, PNG, WebP or AVIF.`
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return `"${file.name}" is larger than 15 MB. Choose a smaller image.`
  }
  if (file.size === 0) return `"${file.name}" is empty.`
  return null
}
