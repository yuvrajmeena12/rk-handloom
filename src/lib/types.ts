export type ProductType = 'handloom_fabric' | 'mattress' | 'bedding' | 'other'

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  handloom_fabric: 'Handloom fabric',
  mattress: 'Mattress',
  bedding: 'Bedding',
  other: 'Other',
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_path: string | null
  display_order: number
  is_published: boolean
  is_archived: boolean
  is_featured: boolean
  featured_order: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  alt_text: string | null
  position: number
  is_main: boolean
}

export interface SpecItem {
  label: string
  value: string
}

export interface VariantItem {
  name: string
  sku?: string
  price?: number | null
  note?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  category_id: string | null
  product_type: ProductType
  short_description: string | null
  description: string | null
  price: number | null
  compare_at_price: number | null
  price_label: string | null
  specifications: SpecItem[]
  materials: string[]
  sizes: string[]
  colours: string[]
  tags: string[]
  variants: VariantItem[]
  care_instructions: string | null
  additional_notes: string | null
  show_enquiry_button: boolean
  is_featured: boolean
  featured_order: number
  display_order: number
  is_published: boolean
  is_archived: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

/** A product together with its images and category, as returned by catalogue queries. */
export interface ProductWithRelations extends Product {
  images: ProductImage[]
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export interface DayHours {
  day: string
  open: string | null
  close: string | null
  closed: boolean
}

export type AccentTheme = 'olive' | 'earth' | 'walnut'

export interface BusinessSettings {
  id: 1
  name_en: string
  name_hi: string | null
  tagline: string | null
  short_description: string | null
  long_description: string | null
  phone: string | null
  whatsapp_number: string | null
  email: string | null
  address: string | null
  location_code: string | null
  maps_url: string | null
  hours: DayHours[]
  hours_note: string | null
  social: Record<string, string>
  logo_path: string | null
  hero_image_path: string | null
  hero_heading: string | null
  hero_subheading: string | null
  hero_primary_label: string | null
  hero_primary_link: string | null
  hero_secondary_label: string | null
  hero_secondary_link: string | null
  craft_heading: string | null
  craft_body: string | null
  about_heading: string | null
  about_body: string | null
  contact_heading: string | null
  contact_body: string | null
  footer_text: string | null
  announcement_enabled: boolean
  announcement_text: string | null
  announcement_link: string | null
  accent_theme: AccentTheme
  call_label: string | null
  whatsapp_label: string | null
  directions_label: string | null
  catalogue_page_size: number
  show_prices: boolean
  show_sku: boolean
  updated_at: string
}

export type HomepageSectionKey =
  | 'featured_categories'
  | 'featured_products'
  | 'discovery'
  | 'craft'
  | 'store_info'
  | 'contact'

export interface HomepageSection {
  key: HomepageSectionKey
  label: string
  is_visible: boolean
  display_order: number
  heading: string | null
  body: string | null
}

export type ProductSort = 'newest' | 'name' | 'price_asc' | 'price_desc'
export type AdminStatusFilter = 'all' | 'published' | 'draft' | 'archived'
