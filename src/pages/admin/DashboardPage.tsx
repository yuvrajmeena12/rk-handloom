import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FolderPlus, PackagePlus, Store } from 'lucide-react'
import { PageHeader, StatusBadge } from '@/components/admin/ui'
import { Picture } from '@/components/catalog/Picture'
import { ErrorState, Spinner } from '@/components/ui/states'
import { getDashboardStats } from '@/lib/api/admin'
import { formatDateTime } from '@/lib/utils'

function Stat({ label, value, to }: { label: string; value: number; to?: string }) {
  const body = (
    <div className="border border-sand bg-white/50 p-5">
      <p className="font-serif text-5xl text-walnut">{value}</p>
      <p className="mt-1 text-sm text-charcoal/80">{label}</p>
    </div>
  )
  return to ? (
    <Link to={to} className="block hover:bg-sand/30">
      {body}
    </Link>
  ) : (
    body
  )
}

export default function DashboardPage() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getDashboardStats })

  if (query.isLoading) return <Spinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />
  const s = query.data

  return (
    <>
      <PageHeader
        title="Overview"
        description="A snapshot of your catalogue."
        actions={
          <>
            <Link to="/admin/products/new" className="btn-primary">
              <PackagePlus className="h-4 w-4" aria-hidden /> Add product
            </Link>
            <Link to="/admin/categories" className="btn-secondary">
              <FolderPlus className="h-4 w-4" aria-hidden /> Add category
            </Link>
            <Link to="/admin/business-settings" className="btn-secondary">
              <Store className="h-4 w-4" aria-hidden /> Edit business details
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Products" value={s.totalProducts} to="/admin/products" />
        <Stat label="Published" value={s.publishedProducts} to="/admin/products?status=published" />
        <Stat label="Drafts (not visible)" value={s.draftProducts} to="/admin/products?status=draft" />
        <Stat label="Featured on homepage" value={s.featuredProducts} />
        <Stat label="Categories" value={s.totalCategories} to="/admin/categories" />
        <Stat label="Archived" value={s.archivedProducts} to="/admin/products?status=archived" />
      </div>

      <section className="mt-12">
        <h2 className="text-3xl">Recently updated</h2>
        {s.recent.length === 0 ? (
          <div className="weave mt-4 border border-sand p-8 text-center">
            <p className="text-[15px]">No products yet. Start by adding your first product.</p>
            <Link to="/admin/products/new" className="btn-primary mt-4">
              Add product
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-sand border-y border-sand">
            {s.recent.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/products/${p.id}/edit`} className="flex items-center gap-4 py-3 hover:bg-sand/30">
                  <Picture
                    path={p.images[0]?.storage_path}
                    alt=""
                    ratio="aspect-square"
                    className="h-14 w-14 shrink-0"
                    width={112}
                    height={112}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-medium text-walnut">{p.name}</span>
                    <span className="block text-sm text-earth">Updated {formatDateTime(p.updated_at)}</span>
                  </span>
                  <StatusBadge kind={p.is_archived ? 'archived' : p.is_published ? 'published' : 'draft'} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
