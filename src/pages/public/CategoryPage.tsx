import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Seo } from '@/components/Seo'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { Picture } from '@/components/catalog/Picture'
import { ContactActions } from '@/components/ContactActions'
import { ErrorState, Spinner } from '@/components/ui/states'
import { getCategoryBySlug } from '@/lib/api/public'
import { mediaUrl } from '@/lib/media'
import NotFoundPage from './NotFoundPage'

export default function CategoryPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [slug])
  const query = useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug(slug),
    staleTime: 60_000,
  })

  if (query.isLoading) return <Spinner />
  if (query.isError) {
    return (
      <div className="container-page py-20">
        <ErrorState onRetry={() => query.refetch()} />
      </div>
    )
  }
  const category = query.data
  if (!category) return <NotFoundPage message="We could not find that category." />

  return (
    <div className="container-page py-12 md:py-16">
      <Seo
        title={category.name}
        description={category.description ?? `Browse ${category.name} from the RK HANDLOOM catalogue.`}
        path={`/category/${category.slug}`}
        image={mediaUrl(category.image_path)}
        noindex={page > 1}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-earth">
        <Link to="/" className="hover:underline">Home</Link> / <Link to="/catalog" className="hover:underline">Catalogue</Link>
      </nav>

      <header className="mt-5 grid items-end gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="text-5xl md:text-6xl">{category.name}</h1>
          {category.description && (
            <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-charcoal/85">{category.description}</p>
          )}
        </div>
        {category.image_path && (
          <Picture path={category.image_path} alt={category.name} ratio="aspect-[16/9]" width={960} height={540} />
        )}
      </header>

      <div className="selvedge my-8" aria-hidden />

      <ProductGrid
        params={{ categorySlug: category.slug, sort: 'newest', page, pageSize: 12 }}
        onPageChange={(p) => {
          setPage(p)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        emptyTitle={`No ${category.name} products yet`}
        emptyBody="Nothing is listed in this category right now. Call or message us to ask what we have in store."
        emptyAction={<ContactActions show={['whatsapp', 'call']} />}
      />
    </div>
  )
}
