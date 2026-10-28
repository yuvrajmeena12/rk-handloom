import { requireSupabase } from '../supabase'
import { isUniqueViolation } from '../errors'
import { removeFiles, uploadImage, MEDIA_BUCKET } from '../media'
import { sanitizeSearch, slugCandidate } from '../utils'
import { sortImages } from './public'
import type {
  AdminStatusFilter,
  BusinessSettings,
  Category,
  HomepageSection,
  Product,
  ProductImage,
  ProductWithRelations,
} from '../types'

/**
 * Owner-only operations. Every call here is authorised by Row Level Security in the
 * database; the UI guard is only a convenience.
 */

/* ------------------------------- Helpers -------------------------------- */

async function withUniqueSlug<T>(base: string, run: (slug: string) => Promise<T>): Promise<T> {
  const MAX_ATTEMPTS = 25
  for (let attempt = 1; ; attempt++) {
    try {
      return await run(slugCandidate(base, attempt))
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isUniqueViolation(error, 'slug')) continue
      throw error
    }
  }
}

const IMAGE_FIELDS = 'id,product_id,storage_path,alt_text,position,is_main'

interface RawProduct {
  categories?: { id: string; name: string; slug: string } | null
  product_images?: ProductImage[] | null
  [key: string]: unknown
}

function mapProduct(row: RawProduct): ProductWithRelations {
  const { categories, product_images, ...rest } = row
  return {
    ...(rest as unknown as Product),
    category: categories ?? null,
    images: sortImages(product_images),
  }
}

/* ------------------------------- Dashboard ------------------------------ */

export interface DashboardStats {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  archivedProducts: number
  totalCategories: number
  featuredProducts: number
  recent: ProductWithRelations[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = requireSupabase()
  const head = () => supabase.from('products').select('id', { count: 'exact', head: true })

  const [total, published, drafts, archived, featured, categories, recent] = await Promise.all([
    head().eq('is_archived', false),
    head().eq('is_published', true).eq('is_archived', false),
    head().eq('is_published', false).eq('is_archived', false),
    head().eq('is_archived', true),
    head().eq('is_featured', true).eq('is_archived', false),
    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_archived', false),
    supabase
      .from('products')
      .select(`*,categories(id,name,slug),product_images(${IMAGE_FIELDS})`)
      .order('updated_at', { ascending: false })
      .limit(6),
  ])
  for (const result of [total, published, drafts, archived, featured, categories, recent]) {
    if (result.error) throw result.error
  }

  return {
    totalProducts: total.count ?? 0,
    publishedProducts: published.count ?? 0,
    draftProducts: drafts.count ?? 0,
    archivedProducts: archived.count ?? 0,
    totalCategories: categories.count ?? 0,
    featuredProducts: featured.count ?? 0,
    recent: ((recent.data ?? []) as unknown as RawProduct[]).map(mapProduct),
  }
}

/* -------------------------------- Products ------------------------------ */

export type AdminProductSort = 'updated' | 'newest' | 'name' | 'price_asc' | 'price_desc'

export interface AdminProductParams {
  search?: string
  categoryId?: string
  status?: AdminStatusFilter
  sort?: AdminProductSort
  page?: number
  pageSize?: number
}

export async function listAdminProducts(params: AdminProductParams = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const from = (page - 1) * pageSize

  let query = requireSupabase()
    .from('products')
    .select(`*,categories(id,name,slug),product_images(${IMAGE_FIELDS})`, { count: 'exact' })

  switch (params.status ?? 'all') {
    case 'published':
      query = query.eq('is_published', true).eq('is_archived', false)
      break
    case 'draft':
      query = query.eq('is_published', false).eq('is_archived', false)
      break
    case 'archived':
      query = query.eq('is_archived', true)
      break
    default:
      query = query.eq('is_archived', false)
  }
  if (params.categoryId) query = query.eq('category_id', params.categoryId)

  const search = sanitizeSearch(params.search ?? '')
  if (search) {
    const term = `%${search}%`
    query = query.or(`name.ilike.${term},sku.ilike.${term},slug.ilike.${term}`)
  }

  switch (params.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
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
      query = query.order('updated_at', { ascending: false })
  }
  const { data, error, count } = await query.order('id').range(from, from + pageSize - 1)
  if (error) throw error
  return {
    items: ((data ?? []) as unknown as RawProduct[]).map(mapProduct),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getAdminProduct(id: string): Promise<ProductWithRelations | null> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select(`*,categories(id,name,slug),product_images(${IMAGE_FIELDS})`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapProduct(data as unknown as RawProduct) : null
}

type ProductRow = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_published' | 'is_archived'>

/** Creates a draft. If the slug is taken, a numeric suffix is added automatically. */
export async function createProduct(row: ProductRow): Promise<Product> {
  return withUniqueSlug(row.slug, async (slug) => {
    const { data, error } = await requireSupabase()
      .from('products')
      .insert({ ...row, slug, is_published: false, is_archived: false })
      .select('*')
      .single()
    if (error) throw error
    return data as Product
  })
}

export async function updateProduct(id: string, row: Partial<ProductRow>): Promise<Product> {
  const { data, error } = await requireSupabase().from('products').update(row).eq('id', id).select('*').single()
  if (error) throw error
  return data as Product
}

export async function setProductPublished(id: string, published: boolean): Promise<void> {
  const { error } = await requireSupabase().from('products').update({ is_published: published }).eq('id', id)
  if (error) throw error
}

export async function setProductFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await requireSupabase().from('products').update({ is_featured: featured }).eq('id', id)
  if (error) throw error
}

/** Archiving hides the product everywhere public but keeps all of its data and images. */
export async function archiveProduct(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('products')
    .update({ is_archived: true, is_published: false })
    .eq('id', id)
  if (error) throw error
}

export async function restoreProduct(id: string): Promise<void> {
  const { error } = await requireSupabase().from('products').update({ is_archived: false }).eq('id', id)
  if (error) throw error
}

/**
 * Permanently deletes an ARCHIVED product, then removes its image files. Returns how many
 * files could not be removed from storage (the product row is already gone in that case).
 */
export async function deleteArchivedProduct(id: string): Promise<{ failedFiles: number }> {
  const supabase = requireSupabase()
  const { data: product, error: readError } = await supabase
    .from('products')
    .select(`id,is_archived,product_images(${IMAGE_FIELDS})`)
    .eq('id', id)
    .single()
  if (readError) throw readError
  if (!(product as { is_archived: boolean }).is_archived) {
    throw new Error('Archive the product before deleting it permanently.')
  }
  const paths = ((product as unknown as RawProduct).product_images ?? []).map((i) => i.storage_path)

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error

  try {
    await removeFiles(paths)
    return { failedFiles: 0 }
  } catch {
    return { failedFiles: paths.length }
  }
}

export async function reorderFeatured(table: 'products' | 'categories', idsInOrder: string[]): Promise<void> {
  const supabase = requireSupabase()
  const results = await Promise.all(
    idsInOrder.map((id, index) => supabase.from(table).update({ featured_order: index + 1 }).eq('id', id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

/* --------------------------- Product images ----------------------------- */

export async function addProductImage(productId: string, file: File): Promise<ProductImage> {
  const supabase = requireSupabase()
  const path = await uploadImage(file, `products/${productId}`)
  try {
    const { data: existing, error: readError } = await supabase
      .from('product_images')
      .select('position,is_main')
      .eq('product_id', productId)
    if (readError) throw readError
    const nextPosition = (existing ?? []).reduce((max, r) => Math.max(max, r.position as number), -1) + 1
    const hasMain = (existing ?? []).some((r) => r.is_main)

    const { data, error } = await supabase
      .from('product_images')
      .insert({ product_id: productId, storage_path: path, position: nextPosition, is_main: !hasMain })
      .select(IMAGE_FIELDS)
      .single()
    if (error) throw error
    return data as ProductImage
  } catch (error) {
    // Do not leave an orphaned file behind when the database row could not be created.
    await removeFiles([path]).catch(() => undefined)
    throw error
  }
}

export async function removeProductImage(image: ProductImage): Promise<void> {
  const supabase = requireSupabase()
  // A published product must keep at least one image: removing the last one unpublishes it.
  const { count, error: countError } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', image.product_id)
  if (countError) throw countError
  if ((count ?? 0) <= 1) {
    const { error: unpublishError } = await supabase
      .from('products')
      .update({ is_published: false })
      .eq('id', image.product_id)
    if (unpublishError) throw unpublishError
  }
  const { error } = await supabase.from('product_images').delete().eq('id', image.id)
  if (error) throw error
  await removeFiles([image.storage_path]).catch(() => undefined)
}

export async function replaceProductImage(image: ProductImage, file: File): Promise<void> {
  const supabase = requireSupabase()
  const newPath = await uploadImage(file, `products/${image.product_id}`)
  const { error } = await supabase.from('product_images').update({ storage_path: newPath }).eq('id', image.id)
  if (error) {
    await removeFiles([newPath]).catch(() => undefined)
    throw error
  }
  await removeFiles([image.storage_path]).catch(() => undefined)
}

export async function setMainProductImage(imageId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('set_main_product_image', { p_image_id: imageId })
  if (error) throw error
}

export async function reorderProductImages(productId: string, idsInOrder: string[]): Promise<void> {
  const { error } = await requireSupabase().rpc('reorder_product_images', {
    p_product_id: productId,
    p_ids: idsInOrder,
  })
  if (error) throw error
}

export async function updateImageAlt(imageId: string, alt: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('product_images')
    .update({ alt_text: alt.trim() || null })
    .eq('id', imageId)
  if (error) throw error
}

/* ------------------------------- Categories ----------------------------- */

export type AdminCategory = Category & { product_count: number }

export async function listAdminCategories(includeArchived = false): Promise<AdminCategory[]> {
  let query = requireSupabase().from('categories').select('*,products(count)')
  if (!includeArchived) query = query.eq('is_archived', false)
  const { data, error } = await query.order('display_order', { ascending: true }).order('name')
  if (error) throw error
  return ((data ?? []) as unknown as Array<Category & { products: Array<{ count: number }> }>).map(
    ({ products, ...c }) => ({ ...c, product_count: products?.[0]?.count ?? 0 }),
  )
}

type CategoryRow = Pick<
  Category,
  'name' | 'slug' | 'description' | 'display_order' | 'is_published' | 'is_featured' | 'featured_order'
>

export async function createCategory(row: CategoryRow): Promise<Category> {
  return withUniqueSlug(row.slug, async (slug) => {
    const { data, error } = await requireSupabase()
      .from('categories')
      .insert({ ...row, slug })
      .select('*')
      .single()
    if (error) throw error
    return data as Category
  })
}

export async function updateCategory(id: string, row: Partial<CategoryRow & { image_path: string | null }>) {
  const { data, error } = await requireSupabase().from('categories').update(row).eq('id', id).select('*').single()
  if (error) throw error
  return data as Category
}

export async function setCategoryImage(id: string, file: File | null): Promise<void> {
  const path = file ? await uploadImage(file, 'categories') : null
  try {
    await updateCategory(id, { image_path: path })
  } catch (error) {
    if (path) await removeFiles([path]).catch(() => undefined)
    throw error
  }
}

export async function archiveCategory(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('categories')
    .update({ is_archived: true, is_published: false, is_featured: false })
    .eq('id', id)
  if (error) throw error
}

export async function restoreCategory(id: string): Promise<void> {
  const { error } = await requireSupabase().from('categories').update({ is_archived: false }).eq('id', id)
  if (error) throw error
}

/** Only succeeds for a category with no products at all; otherwise the database refuses. */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await requireSupabase().from('categories').delete().eq('id', id)
  if (error) throw error
}

/* ----------------------- Business settings & homepage ------------------- */

export async function updateSettings(patch: Partial<Omit<BusinessSettings, 'id' | 'updated_at'>>) {
  const { data, error } = await requireSupabase()
    .from('business_settings')
    .update(patch)
    .eq('id', 1)
    .select('*')
    .single()
  if (error) throw error
  return data as BusinessSettings
}

export async function setSettingsImage(field: 'logo_path' | 'hero_image_path', file: File | null): Promise<void> {
  const path = file ? await uploadImage(file, 'site') : null
  try {
    await updateSettings({ [field]: path })
  } catch (error) {
    if (path) await removeFiles([path]).catch(() => undefined)
    throw error
  }
}

export async function updateHomepageSections(
  sections: Array<Pick<HomepageSection, 'key' | 'is_visible' | 'display_order' | 'heading' | 'body'>>,
): Promise<void> {
  const supabase = requireSupabase()
  const results = await Promise.all(
    sections.map(({ key, ...patch }) => supabase.from('homepage_sections').update(patch).eq('key', key)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

/* --------------------------------- Media -------------------------------- */

export interface MediaFile {
  path: string
  name: string
  folder: string
  size: number | null
  createdAt: string | null
}

export async function listMediaFiles(): Promise<MediaFile[]> {
  const storage = requireSupabase().storage.from(MEDIA_BUCKET)
  const folders = ['site', 'categories']
  const lists = await Promise.all(
    folders.map((folder) =>
      storage.list(folder, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
    ),
  )
  const files: MediaFile[] = []
  lists.forEach((res, i) => {
    if (res.error) throw res.error
    for (const f of res.data ?? []) {
      if (!f.id) continue // folder placeholder
      files.push({
        path: `${folders[i]}/${f.name}`,
        name: f.name,
        folder: folders[i],
        size: (f.metadata as { size?: number } | null)?.size ?? null,
        createdAt: f.created_at ?? null,
      })
    }
  })
  return files
}

export async function uploadSiteImage(file: File): Promise<string> {
  return uploadImage(file, 'site')
}

export async function deleteMediaFile(path: string): Promise<void> {
  await removeFiles([path])
}

/* --------------------------- Featured content --------------------------- */

export async function listFeaturedProducts(): Promise<ProductWithRelations[]> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select(`*,categories(id,name,slug),product_images(${IMAGE_FIELDS})`)
    .eq('is_featured', true)
    .eq('is_archived', false)
    .order('featured_order', { ascending: true })
    .order('name')
  if (error) throw error
  return ((data ?? []) as unknown as RawProduct[]).map(mapProduct)
}

export async function listFeaturedCategories(): Promise<Category[]> {
  const { data, error } = await requireSupabase()
    .from('categories')
    .select('*')
    .eq('is_featured', true)
    .eq('is_archived', false)
    .order('featured_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function setCategoryFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await requireSupabase().from('categories').update({ is_featured: featured }).eq('id', id)
  if (error) throw error
}
