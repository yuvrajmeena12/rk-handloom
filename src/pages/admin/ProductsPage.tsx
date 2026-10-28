import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Eye, EyeOff, Pencil, PackagePlus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, PageHeader, StatusBadge } from '@/components/admin/ui'
import { Picture } from '@/components/catalog/Picture'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import { Pagination } from '@/components/ui/Pagination'
import {
  archiveProduct,
  deleteArchivedProduct,
  listAdminCategories,
  listAdminProducts,
  restoreProduct,
  setProductPublished,
  type AdminProductSort,
} from '@/lib/api/admin'
import { friendlyError } from '@/lib/errors'
import { describePrice, formatDateTime } from '@/lib/utils'
import type { AdminStatusFilter, ProductWithRelations } from '@/lib/types'

type Pending = { kind: 'archive' | 'delete'; product: ProductWithRelations } | null

export default function ProductsPage() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = (params.get('status') as AdminStatusFilter) || 'all'
  const categoryId = params.get('category') ?? ''
  const sort = (params.get('sort') as AdminProductSort) || 'updated'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [input, setInput] = useState(q)
  const [pending, setPending] = useState<Pending>(null)

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
  }

  useEffect(() => {
    if (input === q) return
    const id = window.setTimeout(() => update({ q: input.trim() || null }), 350)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => listAdminCategories(true) })
  const list = useQuery({
    queryKey: ['admin', 'products', { q, status, categoryId, sort, page }],
    queryFn: () => listAdminProducts({ search: q, status, categoryId: categoryId || undefined, sort, page, pageSize: 15 }),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin'] })
    void qc.invalidateQueries({ queryKey: ['products'] })
    void qc.invalidateQueries({ queryKey: ['product'] })
  }

  const publish = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setProductPublished(id, value),
    onSuccess: (_d, v) => {
      toast.success(v.value ? 'Published' : 'Unpublished')
      invalidate()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })
  const restore = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      toast.success('Restored as a draft')
      invalidate()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })
  const archive = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => {
      toast.success('Archived')
      setPending(null)
      invalidate()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })
  const remove = useMutation({
    mutationFn: deleteArchivedProduct,
    onSuccess: ({ failedFiles }) => {
      toast.success('Deleted permanently')
      if (failedFiles > 0) toast.warning(`${failedFiles} image file(s) could not be removed from storage.`)
      setPending(null)
      invalidate()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const items = list.data?.items ?? []
  const hasFilters = Boolean(q || categoryId || status !== 'all')

  return (
    <>
      <PageHeader
        title="Products"
        description="Add, edit and publish the products shown on your website."
        actions={
          <Link to="/admin/products/new" className="btn-primary">
            <PackagePlus className="h-4 w-4" aria-hidden /> Add product
          </Link>
        }
      />

      <form role="search" className="grid gap-3 md:grid-cols-[1fr_170px_200px_190px]" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="p-search" className="field-label">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth" aria-hidden />
            <input id="p-search" type="search" className="input pl-9" placeholder="Name, code or slug" value={input} onChange={(e) => setInput(e.target.value)} maxLength={80} />
          </div>
        </div>
        <div>
          <label htmlFor="p-status" className="field-label">Status</label>
          <select id="p-status" className="input" value={status} onChange={(e) => update({ status: e.target.value === 'all' ? null : e.target.value })}>
            <option value="all">All (not archived)</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="p-cat" className="field-label">Category</label>
          <select id="p-cat" className="input" value={categoryId} onChange={(e) => update({ category: e.target.value || null })}>
            <option value="">All categories</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.is_archived ? ' (archived)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-sort" className="field-label">Sort by</label>
          <select id="p-sort" className="input" value={sort} onChange={(e) => update({ sort: e.target.value === 'updated' ? null : e.target.value })}>
            <option value="updated">Recently updated</option>
            <option value="newest">Newest first</option>
            <option value="name">Name, A to Z</option>
            <option value="price_asc">Price, low to high</option>
            <option value="price_desc">Price, high to low</option>
          </select>
        </div>
      </form>

      <div className="mt-8" aria-busy={list.isFetching}>
        {list.isLoading ? (
          <Spinner />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No products match' : 'No products yet'}
            action={
              hasFilters ? (
                <button type="button" className="btn-secondary" onClick={() => { setInput(''); setParams({}, { replace: true }) }}>
                  Clear filters
                </button>
              ) : (
                <Link to="/admin/products/new" className="btn-primary">Add your first product</Link>
              )
            }
          >
            {hasFilters ? 'Try different filters or search words.' : 'Add a product with photos, then publish it to show it on the website.'}
          </EmptyState>
        ) : (
          <>
            <ul className={`divide-y divide-sand border-y border-sand ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
              {items.map((p) => {
                const price = describePrice(p)
                const badge = p.is_archived ? 'archived' : p.is_published ? 'published' : 'draft'
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                    <Picture path={p.images[0]?.storage_path} alt="" ratio="aspect-square" className="h-16 w-16 shrink-0" width={128} height={128} />
                    <div className="min-w-0 flex-1 basis-56">
                      <Link to={`/admin/products/${p.id}/edit`} className="block truncate text-[17px] font-medium text-walnut hover:underline">
                        {p.name}
                      </Link>
                      <p className="truncate text-sm text-earth">
                        {p.category?.name ?? 'No category'}
                        {p.sku ? ` · ${p.sku}` : ''} · {price.main}
                      </p>
                      <p className="text-xs text-earth">Updated {formatDateTime(p.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge kind={badge} />
                      {p.is_featured && <StatusBadge kind="featured" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Link to={`/admin/products/${p.id}/edit`} className="btn-quiet btn-sm" aria-label={`Edit ${p.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden /> Edit
                      </Link>
                      {!p.is_archived && (
                        <button
                          type="button"
                          className="btn-quiet btn-sm"
                          disabled={publish.isPending}
                          onClick={() => publish.mutate({ id: p.id, value: !p.is_published })}
                          aria-label={`${p.is_published ? 'Unpublish' : 'Publish'} ${p.name}`}
                        >
                          {p.is_published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                          {p.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                      {p.is_archived ? (
                        <>
                          <button type="button" className="btn-quiet btn-sm" onClick={() => restore.mutate(p.id)} aria-label={`Restore ${p.name}`}>
                            <RotateCcw className="h-4 w-4" aria-hidden /> Restore
                          </button>
                          <button type="button" className="btn-quiet btn-sm text-red-800" onClick={() => setPending({ kind: 'delete', product: p })} aria-label={`Delete ${p.name} permanently`}>
                            <Trash2 className="h-4 w-4" aria-hidden /> Delete
                          </button>
                        </>
                      ) : (
                        <button type="button" className="btn-quiet btn-sm" onClick={() => setPending({ kind: 'archive', product: p })} aria-label={`Archive ${p.name}`}>
                          <Archive className="h-4 w-4" aria-hidden /> Archive
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <Pagination page={list.data?.page ?? 1} pageSize={list.data?.pageSize ?? 15} total={list.data?.total ?? 0} onChange={(n) => update({ page: n > 1 ? String(n) : null }, false)} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={pending?.kind === 'archive'}
        title="Archive this product?"
        confirmLabel="Archive"
        busy={archive.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && archive.mutate(pending.product.id)}
      >
        <p><strong>{pending?.product.name}</strong> will be hidden from the website. Its details and images are kept, and you can restore it later.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={pending?.kind === 'delete'}
        title="Delete permanently?"
        confirmLabel="Delete permanently"
        danger
        busy={remove.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.product.id)}
      >
        <p><strong>{pending?.product.name}</strong> and its images will be deleted. This cannot be undone.</p>
      </ConfirmDialog>
    </>
  )
}
