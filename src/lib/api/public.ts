import { requireSupabase } from '../supabase'
import { sanitizeSearch } from '../utils'
import type {
  BusinessSettings,
  Category,
  HomepageSection,
  Product,
  ProductImage,
  ProductSort,
  ProductWithRelations,
} from '../types'

/**
 * Public catalogue queries.
 *
 * Row Level Security already hides unpublished data from visitors. These queries ALSO filter
 * explicitly, so the public pages stay correct even when the signed-in owner browses the site
 * (the owner's session is allowed to read drafts).
 */

export type ProductSummary = Pick<
  Product,
  | 'id'
  | 'name'
  | 'slug'
  | 'sku'
  | 'short_description'
  | 'price'
  | 'compare_at_price'
  | 'price_label'
  | 'product_type'
  | 'is_featured'
  | 'created_at'
> & {
  images: ProductImage[]
  category: { id: string; name: string; slug: string } | null
}

const IMAGE_FIELDS = 'id,product_id,storage_path,alt_text,position,is_main'
const SUMMARY_SELECT = `id,name,slug,sku,short_description,price,compare_at_price,price_label,product_type,is_featured,created_at,categories!inner(id,name,slug,is_published),product_images(${IMAGE_FIELDS})`
const DETAIL_SELECT = `*,categories!inner(id,name,slug,is_published),product_images(${IMAGE_FIELDS})`

interface RawRow {
  categories?: { id: string; name: string; slug: string } | null
  product_images?: ProductImage[] | null
  [key: string]: unknown
}

export const sortImages = (images: ProductImage[] | null | undefined): ProductImage[] =>
  [...(images ?? [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.position - b.position)

function mapRow<T>(row: RawRow): T {
  const { categories, product_images, ...rest } = row
  return {
    ...rest,
    category: categories ? { id: categories.id, name: categories.name, slug: categories.slug } : null,
    images: sortImages(product_images),
  } as T
}

export async function getSettings(): Promise<BusinessSettings> {
  const { data, error } = await requireSupabase().from('business_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data as BusinessSettings
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const { data, error } = await requireSupabase()
    .from('homepage_sections')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as HomepageSection[]
}

export async function listCategories(options: { featuredOnly?: boolean } = {}): Promise<Category[]> {
  let query = requireSupabase()
    .from('categories')
    .select('*')
    .eq('is_published', true)
    .eq('is_archived', false)
  if (options.featuredOnly) {
    query = query.eq('is_featured', true).order('featured_order', { ascending: true })
  }
  const { data, error } = await query.order('display_order', { ascending: true }).order('name')
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await requireSupabase()
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_archived', false)
    .maybeSingle()
  if (error) throw error
  return (data as Category | null) ?? null
}

export interface ProductListParams {
  search?: string
  categorySlug?: string
  sort?: ProductSort
  page?: number
  pageSize?: number
  featuredOnly?: boolean
}

export interface ProductListResult {
  items: ProductSummary[]
  total: number
  page: number
  pageSize: number
}

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(48, Math.max(1, params.pageSize ?? 12))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = requireSupabase()
    .from('products')
    .select(SUMMARY_SELECT, { count: 'exact' })
    .eq('is_published', true)
    .eq('is_archived', false)
    .eq('categories.is_published', true)
    .eq('categories.is_archived', false)

  if (params.categorySlug) query = query.eq('categories.slug', params.categorySlug)
  if (params.featuredOnly) query = query.eq('is_featured', true)

  const search = sanitizeSearch(params.search ?? '')
  if (search) {
    const term = `%${search}%`
    query = query.or(
      `name.ilike.${term},sku.ilike.${term},short_description.ilike.${term},description.ilike.${term}`,
    )
  }

  switch (params.sort) {
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true, nullsFirst: false })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false, nullsFirst: false })
      break
    default:
      if (params.featuredOnly) query = query.order('featured_order', { ascending: true })
      query = query.order('created_at', { ascending: false })
  }
  query = query.order('id', { ascending: true }).range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return {
    items: ((data ?? []) as unknown as RawRow[]).map((r) => mapRow<ProductSummary>(r)),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select(DETAIL_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_archived', false)
    .eq('categories.is_published', true)
    .eq('categories.is_archived', false)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow<ProductWithRelations>(data as unknown as RawRow) : null
}

export async function getRelatedProducts(product: { id: string; category_id: string | null }, limit = 4) {
  if (!product.category_id) return [] as ProductSummary[]
  const { data, error } = await requireSupabase()
    .from('products')
    .select(SUMMARY_SELECT)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .eq('is_published', true)
    .eq('is_archived', false)
    .eq('categories.is_published', true)
    .eq('categories.is_archived', false)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as unknown as RawRow[]).map((r) => mapRow<ProductSummary>(r))
}
