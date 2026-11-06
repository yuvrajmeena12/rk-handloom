import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Home, MessageCircle } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { Picture } from '@/components/catalog/Picture'
import { ContactActions } from '@/components/ContactActions'
import { ErrorState, Spinner } from '@/components/ui/states'
import { useSettings } from '@/hooks/useSettings'
import { getCategoryBySlug } from '@/lib/api/public'
import { whatsappHref } from '@/lib/contact'
import { mediaUrl } from '@/lib/media'
import { breadcrumbJsonLd } from '@/lib/structuredData'
import NotFoundPage from './NotFoundPage'

export default function CategoryPage() {
  const { slug = '' } = useParams()
  const { settings } = useSettings()
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
  if (!category) return <NotFoundPage message="We could not find that collection or category." />

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Catalogue', path: '/catalog' },
    { name: category.name, path: `/category/${category.slug}` },
  ]

  const waMessage = `Hello ${settings?.name_en ?? 'RK HANDLOOM'}, I am viewing your "${category.name}" collection. Can you share current availability and pricing?`
  const waUrl = settings?.whatsapp_number ? whatsappHref(settings.whatsapp_number, waMessage) : null

  return (
    <div className="container-page py-8 md:py-14">
      <Seo
        title={`${category.name} | Collections`}
        description={
          category.description ??
          `Browse ${category.name} handloom textiles and bespoke furnishings from RK HANDLOOM, Sendra Road, Beawar.`
        }
        path={`/category/${category.slug}`}
        image={mediaUrl(category.image_path)}
        noindex={page > 1}
        jsonLd={breadcrumbJsonLd(breadcrumbs)}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-earth">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-walnut">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-sand" />
        <Link to="/catalog" className="hover:text-walnut">
          Catalogue
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-sand" />
        <span className="font-medium text-walnut">{category.name}</span>
      </nav>

      {/* Editorial Header Banner */}
      <header className="rounded-xl border border-sand bg-sand/20 p-6 sm:p-8 md:p-10 shadow-card-subtle">
        <div className="grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-3 py-1 text-xs font-medium text-earth shadow-card-subtle mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Curated Showroom Collection</span>
            </div>

            <h1 className="font-serif text-4xl font-medium text-walnut sm:text-5xl md:text-6xl">
              {category.name}
            </h1>

            {category.description ? (
              <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-charcoal/85 sm:text-lg">
                {category.description}
              </p>
            ) : (
              <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-charcoal/85 sm:text-lg">
                Explore our fine selection of {category.name.toLowerCase()}. Handcrafted with natural fibers and traditional weaving techniques.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Enquire about {category.name} on WhatsApp</span>
                </a>
              )}
              <Link to="/catalog" className="btn-secondary btn-sm shadow-sm">
                View all collections
              </Link>
            </div>
          </div>

          {category.image_path && (
            <div className="overflow-hidden rounded-lg border border-sand bg-ivory shadow-luxury">
              <Picture
                path={category.image_path}
                alt={category.name}
                ratio="aspect-[16/9]"
                width={960}
                height={540}
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <div className="selvedge my-10" aria-hidden />

      {/* Category Product Grid */}
      <ProductGrid
        params={{ categorySlug: category.slug, sort: 'newest', page, pageSize: 12 }}
        onPageChange={(p) => {
          setPage(p)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        emptyTitle={`No products currently listed in ${category.name}`}
        emptyBody="We are actively updating our digital showroom. Contact us directly to enquire about available designs and custom orders."
        emptyAction={<ContactActions show={['whatsapp', 'call']} />}
      />
    </div>
  )
}
