import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listProducts, type ProductListParams } from '@/lib/api/public'
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/states'
import { Pagination } from '@/components/ui/Pagination'
import { ProductCard } from './ProductCard'
import type { ReactNode } from 'react'

interface ProductGridProps {
  params: ProductListParams
  onPageChange: (page: number) => void
  emptyTitle: string
  emptyBody: ReactNode
  emptyAction?: ReactNode
  onCount?: (total: number) => void
}

/** Paged, published-only product grid with loading, error and empty states. */
export function ProductGrid({ params, onPageChange, emptyTitle, emptyBody, emptyAction }: ProductGridProps) {
  const query = useQuery({
    queryKey: ['products', 'list', params],
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  if (query.isLoading) return <ProductGridSkeleton count={params.pageSize ?? 12} />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const { items = [], total = 0, page = 1, pageSize = 12 } = query.data ?? {}
  if (items.length === 0) {
    return (
      <EmptyState title={emptyTitle} action={emptyAction}>
        {emptyBody}
      </EmptyState>
    )
  }

  return (
    <div aria-busy={query.isFetching}>
      <p className="mb-5 text-sm text-earth" aria-live="polite">
        {total} {total === 1 ? 'product' : 'products'}
      </p>
      <div
        className={`grid grid-cols-2 gap-x-4 gap-y-9 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${
          query.isPlaceholderData ? 'opacity-60' : ''
        }`}
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
    </div>
  )
}
