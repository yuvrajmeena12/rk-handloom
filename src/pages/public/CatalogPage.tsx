import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ContactActions } from '@/components/ContactActions'
import { useSettings } from '@/hooks/useSettings'
import { listCategories } from '@/lib/api/public'
import type { ProductSort } from '@/lib/types'

const SORTS: Array<{ value: ProductSort; label: string; needsPrice?: boolean }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name, A to Z' },
  { value: 'price_asc', label: 'Price, low to high', needsPrice: true },
  { value: 'price_desc', label: 'Price, high to low', needsPrice: true },
]

export default function CatalogPage() {
  const { settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const sortParam = params.get('sort') as ProductSort | null
  const sort: ProductSort = SORTS.some((s) => s.value === sortParam) ? (sortParam as ProductSort) : 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [input, setInput] = useState(q)
  useEffect(() => setInput(q), [q])

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => listCategories(), staleTime: 5 * 60_000 })

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
  }

  // Debounce typing into the URL so each keystroke does not query the database.
  useEffect(() => {
    if (input === q) return
    const id = window.setTimeout(() => update({ q: input.trim() || null }), 350)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  const hasFilters = Boolean(q || category || sort !== 'newest')
  const showPrices = settings?.show_prices ?? true
  const sorts = SORTS.filter((s) => showPrices || !s.needsPrice)

  return (
    <div className="container-page py-12 md:py-16">
      <Seo
        title="Catalogue"
        description={`Browse the ${settings?.name_en ?? 'RK HANDLOOM'} catalogue of handloom products and mattresses.`}
        path="/catalog"
        noindex={Boolean(q || category || page > 1)}
      />
      <header className="max-w-2xl">
        <h1 className="text-5xl md:text-6xl">Catalogue</h1>
        <p className="mt-3 text-[17px] text-charcoal/80">
          Browse what we offer. For prices, sizes and availability, call or message us.
        </p>
      </header>

      <div className="selvedge my-8" aria-hidden />

      <form
        role="search"
        className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          update({ q: input.trim() || null })
        }}
      >
        <div>
          <label htmlFor="catalog-q" className="field-label">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth" aria-hidden />
            <input
              id="catalog-q"
              type="search"
              className="input pl-9"
              placeholder="Name, code or description"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={80}
            />
          </div>
        </div>
        <div>
          <label htmlFor="catalog-category" className="field-label">
            Category
          </label>
          <select
            id="catalog-category"
            className="input"
            value={category}
            onChange={(e) => update({ category: e.target.value || null })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="catalog-sort" className="field-label">
            Sort by
          </label>
          <select
            id="catalog-sort"
            className="input"
            value={sort}
            onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })}
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              setInput('')
              setParams({}, { replace: true })
            }}
          >
            <X className="h-4 w-4" aria-hidden /> Clear filters
          </button>
        )}
      </form>

      <div className="mt-10">
        <ProductGrid
          params={{
            search: q,
            categorySlug: category || undefined,
            sort,
            page,
            pageSize: settings?.catalogue_page_size ?? 12,
          }}
          onPageChange={(p) => {
            update({ page: p > 1 ? String(p) : null }, false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          emptyTitle={hasFilters ? 'No products match your search' : 'No products yet'}
          emptyBody={
            hasFilters
              ? 'Try a different word, or clear the filters to see everything. If you are looking for something specific, ask us directly.'
              : 'Products will appear here once they are added. Call or message us to ask about what is available.'
          }
          emptyAction={<ContactActions show={['whatsapp', 'call']} />}
        />
      </div>
    </div>
  )
}
