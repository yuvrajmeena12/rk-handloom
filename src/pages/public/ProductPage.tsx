import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  Compass,
  Home,
  Layers,
  Maximize2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Picture } from '@/components/catalog/Picture'
import { ProductCard } from '@/components/catalog/ProductCard'
import { ErrorState, Spinner } from '@/components/ui/states'
import { useSettings } from '@/hooks/useSettings'
import { getProductBySlug, getRelatedProducts } from '@/lib/api/public'
import { directionsUrl, productEnquiryMessage, telHref, whatsappHref } from '@/lib/contact'
import { absoluteUrl } from '@/lib/env'
import { mediaUrl } from '@/lib/media'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/structuredData'
import { cn, describePrice, truncate } from '@/lib/utils'
import { PRODUCT_TYPE_LABELS } from '@/lib/types'
import NotFoundPage from './NotFoundPage'

function Chips({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="font-serif text-lg font-medium text-walnut">{title}</h3>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-sand bg-ivory px-3 py-1 text-xs font-medium text-charcoal shadow-card-subtle"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-body text-base leading-relaxed text-charcoal/85">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="mb-3.5 last:mb-0">
          {p}
        </p>
      ))}
    </div>
  )
}

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { settings } = useSettings()
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setSelected(0)
    setLightboxOpen(false)
  }, [slug])

  const query = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug),
    staleTime: 60_000,
  })
  const product = query.data
  const related = useQuery({
    queryKey: ['product', slug, 'related'],
    queryFn: () => getRelatedProducts({ id: product!.id, category_id: product!.category_id }),
    enabled: Boolean(product),
    staleTime: 60_000,
  })

  // Lightbox keyboard listener
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  if (query.isLoading) return <Spinner />
  if (query.isError) {
    return (
      <div className="container-page py-20">
        <ErrorState onRetry={() => query.refetch()} />
      </div>
    )
  }
  if (!product || !settings) {
    return <NotFoundPage message="We could not find that product. It may have been removed or archived." />
  }

  const images = product.images
  const current = images[Math.min(selected, Math.max(0, images.length - 1))]
  const price = describePrice(product, settings.show_prices)
  const url = absoluteUrl(`/product/${product.slug}`)
  const message = productEnquiryMessage(settings.name_en, product, url)
  const description =
    product.seo_description || product.short_description || truncate(product.description ?? '', 160)

  const waHref = settings.whatsapp_number
    ? whatsappHref(settings.whatsapp_number, message)
    : null
  const tel = telHref(settings.phone)
  const dir = directionsUrl(settings)

  const hasDiscount = Boolean(product.compare_at_price && product.price && product.compare_at_price > product.price)
  const discountAmount = hasDiscount ? product.compare_at_price! - product.price! : null

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Catalogue', path: '/catalog' },
  ]
  if (product.category) {
    breadcrumbs.push({ name: product.category.name, path: `/category/${product.category.slug}` })
  }
  breadcrumbs.push({ name: product.name, path: `/product/${product.slug}` })

  return (
    <div className="container-page py-8 md:py-14">
      <Seo
        title={product.seo_title || `${product.name} | ${settings.name_en}`}
        description={description || undefined}
        path={`/product/${product.slug}`}
        image={mediaUrl(images[0]?.storage_path)}
        type="product"
        jsonLd={[productJsonLd(product, settings), breadcrumbJsonLd(breadcrumbs)]}
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
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-sand" />
            <Link to={`/category/${product.category.slug}`} className="hover:text-walnut">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-sand" />
        <span className="font-medium text-walnut truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* Gallery Column */}
        <div>
          <div className="group relative overflow-hidden rounded-md border border-sand bg-ivory shadow-luxury">
            <Picture
              path={current?.storage_path}
              alt={current?.alt_text || product.name}
              ratio="aspect-[4/5]"
              priority
              width={1000}
              height={1250}
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
            />
            {current?.storage_path && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded bg-ivory/90 px-3 py-1.5 text-xs font-medium text-walnut shadow-sm backdrop-blur-sm transition-opacity hover:bg-ivory"
                aria-label="Inspect fabric details in full size"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Inspect Weave</span>
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <ul className="mt-3.5 flex flex-wrap gap-2.5" aria-label="Product thumbnails">
              {images.map((img, i) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-label={`View image ${i + 1} of ${images.length}`}
                    aria-current={i === selected}
                    className={cn(
                      'block h-16 w-16 overflow-hidden rounded border-2 transition-all',
                      i === selected ? 'border-accent ring-1 ring-accent' : 'border-sand hover:border-earth/60',
                    )}
                  >
                    <Picture
                      path={img.storage_path}
                      alt=""
                      ratio="aspect-square"
                      width={160}
                      height={160}
                      sizes="64px"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-sand/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-earth">
                {product.category ? product.category.name : PRODUCT_TYPE_LABELS[product.product_type]}
              </span>
              {product.sku && settings.show_sku && (
                <span className="font-mono text-xs text-earth/80">Code: {product.sku}</span>
              )}
            </div>

            <h1 className="mt-2.5 font-serif text-3xl font-medium leading-tight text-walnut sm:text-4xl md:text-5xl">
              {product.name}
            </h1>

            {/* Price section */}
            {price.main && (
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span
                  className={
                    price.enquire
                      ? 'text-lg font-medium italic text-earth'
                      : 'font-serif text-2xl font-semibold text-walnut sm:text-3xl'
                  }
                >
                  {price.main}
                </span>
                {price.compareAt && (
                  <span className="text-base text-earth line-through sm:text-lg">
                    {price.compareAt}
                  </span>
                )}
                {discountAmount && (
                  <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                    Save ₹{discountAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}

            {product.short_description && (
              <p className="mt-4 text-base leading-relaxed text-charcoal/85 sm:text-lg">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Quick Enquiry CTA Box */}
          {product.show_enquiry_button && (
            <div className="mt-8 rounded-lg border border-sand bg-sand/20 p-5 shadow-card-subtle">
              <h2 className="font-serif text-lg font-medium text-walnut">
                Direct Showroom Enquiry & Custom Orders
              </h2>
              <p className="mt-1 text-xs text-earth">
                Need a custom mattress size, specific bedsheet dimensions, or color confirmation? Chat with us instantly:
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp px-6 py-2.5 shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Enquire on WhatsApp</span>
                  </a>
                )}
                {tel && (
                  <a href={tel} className="btn-secondary px-5 py-2.5 shadow-sm">
                    <Phone className="h-4 w-4" />
                    <span>Call Showroom</span>
                  </a>
                )}
              </div>

              {dir && (
                <div className="mt-4 border-t border-sand/70 pt-3">
                  <a
                    href={dir}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-earth hover:text-accent hover:underline"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Visit our showroom on Sendra Road, Beawar to view this piece</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Heritage guarantees */}
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-sand/70 pt-6 text-xs text-earth">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
              <span>Genuine Handloom Weave</span>
            </div>
            <div className="flex items-start gap-2">
              <Layers className="h-4 w-4 shrink-0 text-accent" />
              <span>Custom Sizing Available</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-accent" />
              <span>In-Store Inspection</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 text-accent" />
              <span>Care Instructions Included</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-earth">Tags:</span>
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-ivory border border-sand px-2.5 py-0.5 text-xs text-walnut shadow-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="selvedge my-12" aria-hidden />

      {/* Structured Details: Description, Specifications, Care */}
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-10">
          {product.description && (
            <section className="rounded-lg border border-sand bg-ivory p-6 shadow-card-subtle sm:p-8">
              <h2 className="font-serif text-2xl font-medium text-walnut sm:text-3xl">Craftsmanship & Details</h2>
              <div className="mt-4">
                <Paragraphs text={product.description} />
              </div>
            </section>
          )}

          {product.care_instructions && (
            <section className="rounded-lg border border-sand bg-ivory p-6 shadow-card-subtle sm:p-8">
              <h2 className="font-serif text-2xl font-medium text-walnut sm:text-3xl">Washing & Care Instructions</h2>
              <div className="mt-4">
                <Paragraphs text={product.care_instructions} />
              </div>
            </section>
          )}

          {product.additional_notes && (
            <section className="rounded-lg border border-sand bg-ivory p-6 shadow-card-subtle sm:p-8">
              <h2 className="font-serif text-2xl font-medium text-walnut sm:text-3xl">Showroom & Custom Sizing Notes</h2>
              <div className="mt-4">
                <Paragraphs text={product.additional_notes} />
              </div>
            </section>
          )}
        </div>

        {/* Specifications Sidebar */}
        <div className="space-y-6">
          {product.specifications.length > 0 && (
            <section className="rounded-lg border border-sand bg-ivory p-6 shadow-card-subtle">
              <h2 className="font-serif text-xl font-medium text-walnut">Specifications</h2>
              <dl className="mt-4 divide-y divide-sand/70 border-t border-sand/70">
                {product.specifications.map((s, i) => (
                  <div key={`${s.label}-${i}`} className="grid grid-cols-[1fr_1.3fr] gap-4 py-2.5 text-sm">
                    <dt className="font-medium text-earth">{s.label}</dt>
                    <dd className="text-walnut">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <Chips title="Fabric & Materials" items={product.materials} />
          <Chips title="Available Dimensions & Sizes" items={product.sizes} />
          <Chips title="Available Colors & Patterns" items={product.colours} />

          {product.variants.length > 0 && (
            <section className="rounded-lg border border-sand bg-ivory p-6 shadow-card-subtle">
              <h3 className="font-serif text-xl font-medium text-walnut">Product Variants</h3>
              <ul className="mt-3 divide-y divide-sand/70 border-t border-sand/70">
                {product.variants.map((v, i) => (
                  <li key={`${v.name}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5 text-sm">
                    <span className="font-medium text-walnut">
                      {v.name}
                      {v.sku && <span className="ml-2 font-mono text-xs text-earth">{v.sku}</span>}
                    </span>
                    <span className="text-earth">
                      {settings.show_prices && v.price
                        ? describePrice({ price: v.price, compare_at_price: null, price_label: null }).main
                        : v.note}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.data && related.data.length > 0 && (
        <section className="mt-20 border-t border-sand/70 pt-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-earth">Similar Collections</span>
              <h2 className="mt-1 font-serif text-3xl font-medium text-walnut">
                More in {product.category?.name ?? 'Our Showroom'}
              </h2>
            </div>
            <Link to="/catalog" className="btn-secondary btn-sm shadow-sm hidden sm:inline-flex">
              View all products
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
            {related.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Full-screen Lightbox for Weave Inspection */}
      {lightboxOpen && current?.storage_path && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inspect fabric weave"
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-ivory/80 p-2 text-walnut transition-colors hover:bg-ivory"
            aria-label="Close weave inspection"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-h-[90vh] max-w-4xl overflow-hidden rounded-md border border-sand bg-ivory shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Picture
              path={current.storage_path}
              alt={current.alt_text || product.name}
              width={1600}
              height={1600}
              priority
              sizes="90vw"
              className="max-h-[85vh] w-auto object-contain"
            />
            <div className="bg-ivory p-3 text-center text-xs text-earth">
              {product.name} — Fabric & Weave Inspection
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
