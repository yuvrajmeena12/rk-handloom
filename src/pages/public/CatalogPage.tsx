import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Search, SlidersHorizontal, X } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ContactActions } from '@/components/ContactActions'
import { useSettings } from '@/hooks/useSettings'
import { listCategories } from '@/lib/api/public'
import { whatsappHref } from '@/lib/contact'
import type { ProductSort } from '@/lib/types'

const SORTS: Array<{ value: ProductSort; label: string; needsPrice?: boolean }> = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'name', label: 'Name (A to Z)' },
  { value: 'price_asc', label: 'Price: Low to High', needsPrice: true },
  { value: 'price_desc', label: 'Price: High to Low', needsPrice: true },
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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  })

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

  const activeCategoryObj = categories.find((c) => c.slug === category)

  const customOrderWaMessage = q
    ? `Hello ${settings?.name_en ?? 'RK HANDLOOM'}, I was searching for "${q}" in your catalogue. Do you have this or custom options available?`
    : `Hello ${settings?.name_en ?? 'RK HANDLOOM'}, I would like to ask about product availability in your catalogue.`

  const customWaHref = settings?.whatsapp_number
    ? whatsappHref(settings.whatsapp_number, customOrderWaMessage)
    : null

  return (
    <div className="container-page py-10 md:py-16">
      <Seo
        title={activeCategoryObj ? `${activeCategoryObj.name} | Catalogue` : 'Product Catalogue'}
        description={`Browse handloom textiles, bedsheets, dohars, and custom mattresses at ${settings?.name_en ?? 'RK HANDLOOM'}. Sendra Road, Beawar.`}
        path="/catalog"
        noindex={Boolean(q || category || page > 1)}
      />

      {/* Header */}
      <header className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-3 py-1 text-xs font-medium text-earth shadow-card-subtle mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span>Showroom Catalogue · Direct Inquiries</span>
        </div>
        <h1 className="font-serif text-4xl font-medium text-walnut sm:text-5xl md:text-6xl">
          {activeCategoryObj ? activeCategoryObj.name : 'Showroom Catalogue'}
        </h1>
        <p className="mt-3 text-base text-charcoal/80 sm:text-lg">
          Browse our handloom textiles, pure cotton weaves, and custom mattresses. For custom sizing, bulk requests, or instant quotes, enquire via WhatsApp or phone.
        </p>
      </header>

      <div className="selvedge my-7" aria-hidden />

      {/* 1-Click Category Filter Pills */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2" role="navigation" aria-label="Quick Category Filter">
          <button
            type="button"
            onClick={() => update({ category: null })}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              !category
                ? 'bg-walnut text-ivory shadow-sm'
                : 'border border-sand bg-ivory text-charcoal/80 hover:border-earth hover:text-walnut'
            }`}
          >
            All Collections
          </button>
          {categories.map((c) => {
            const isActive = category === c.slug
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => update({ category: isActive ? null : c.slug })}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-ivory shadow-sm'
                    : 'border border-sand bg-ivory text-charcoal/80 hover:border-earth hover:text-walnut'
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-lg border border-sand bg-ivory p-4 shadow-card-subtle">
        <form
          role="search"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px_auto] lg:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            update({ q: input.trim() || null })
          }}
        >
          <div>
            <label htmlFor="catalog-q" className="field-label text-xs font-medium uppercase tracking-wider text-earth">
              Search Products
            </label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth" aria-hidden />
              <input
                id="catalog-q"
                type="search"
                className="input pl-9 text-sm"
                placeholder="Search bedsheets, dohars, sizes, code..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          <div>
            <label htmlFor="catalog-category" className="field-label text-xs font-medium uppercase tracking-wider text-earth">
              Filter by Category
            </label>
            <select
              id="catalog-category"
              className="input mt-1 text-sm"
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
            <label htmlFor="catalog-sort" className="field-label text-xs font-medium uppercase tracking-wider text-earth">
              Sort By
            </label>
            <select
              id="catalog-sort"
              className="input mt-1 text-sm"
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
              className="btn-quiet h-[42px] px-3 text-xs"
              onClick={() => {
                setInput('')
                setParams({}, { replace: true })
              }}
            >
              <X className="h-4 w-4" aria-hidden />
              <span>Reset filters</span>
            </button>
          )}
        </form>

        {/* Active Filter Chips */}
        {hasFilters && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-3 text-xs text-earth">
            <span className="flex items-center gap-1 font-medium text-walnut">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Active:
            </span>
            {q && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand/40 px-2.5 py-0.5 text-walnut">
                Query: &quot;{q}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setInput('')
                    update({ q: null })
                  }}
                  className="hover:text-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeCategoryObj && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand/40 px-2.5 py-0.5 text-walnut">
                {activeCategoryObj.name}
                <button type="button" onClick={() => update({ category: null })} className="hover:text-accent">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {sort !== 'newest' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand/40 px-2.5 py-0.5 text-walnut">
                {sorts.find((s) => s.value === sort)?.label}
                <button type="button" onClick={() => update({ sort: null })} className="hover:text-accent">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="mt-8">
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
          emptyTitle={hasFilters ? 'No products match your search criteria' : 'No products yet'}
          emptyBody={
            hasFilters
              ? 'Try modifying your search or clearing active filters. If you are looking for a specific textile pattern or bespoke mattress size, we can help you directly.'
              : 'Our showroom catalogue is being updated with our latest collections. Please call or message us for current availability.'
          }
          emptyAction={
            <div className="flex flex-col items-center gap-3">
              {customWaHref && (
                <a
                  href={customWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Enquire about &quot;{q || 'Custom Requirements'}&quot; on WhatsApp</span>
                </a>
              )}
              <ContactActions show={['call', 'directions']} />
            </div>
          }
        />
      </div>
    </div>
  )
}
