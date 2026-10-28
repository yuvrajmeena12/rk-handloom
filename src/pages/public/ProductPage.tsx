import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Seo } from '@/components/Seo'
import { ContactActions } from '@/components/ContactActions'
import { Picture } from '@/components/catalog/Picture'
import { ProductCard } from '@/components/catalog/ProductCard'
import { ErrorState, Spinner } from '@/components/ui/states'
import { useSettings } from '@/hooks/useSettings'
import { getProductBySlug, getRelatedProducts } from '@/lib/api/public'
import { productEnquiryMessage } from '@/lib/contact'
import { absoluteUrl } from '@/lib/env'
import { mediaUrl } from '@/lib/media'
import { productJsonLd } from '@/lib/structuredData'
import { cn, describePrice, truncate } from '@/lib/utils'
import { PRODUCT_TYPE_LABELS } from '@/lib/types'
import NotFoundPage from './NotFoundPage'

function Chips({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-xl">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="border border-earth/30 bg-white/60 px-3 py-1 text-sm text-charcoal">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-body">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { settings } = useSettings()
  const [selected, setSelected] = useState(0)
  useEffect(() => setSelected(0), [slug])

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

  if (query.isLoading) return <Spinner />
  if (query.isError) {
    return (
      <div className="container-page py-20">
        <ErrorState onRetry={() => query.refetch()} />
      </div>
    )
  }
  if (!product || !settings) return <NotFoundPage message="We could not find that product. It may have been removed." />

  const images = product.images
  const current = images[Math.min(selected, Math.max(0, images.length - 1))]
  const price = describePrice(product, settings.show_prices)
  const url = absoluteUrl(`/product/${product.slug}`)
  const message = productEnquiryMessage(settings.name_en, product, url)
  const description = product.seo_description || product.short_description || truncate(product.description ?? '', 160)

  return (
    <div className="container-page py-10 md:py-14">
      <Seo
        title={product.seo_title || product.name}
        description={description || undefined}
        path={`/product/${product.slug}`}
        image={mediaUrl(images[0]?.storage_path)}
        type="product"
        jsonLd={productJsonLd(product, settings)}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-earth">
        <Link to="/" className="hover:underline">Home</Link> / <Link to="/catalog" className="hover:underline">Catalogue</Link>
        {product.category && (
          <>
            {' / '}
            <Link to={`/category/${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="border border-sand">
            <Picture
              path={current?.storage_path}
              alt={current?.alt_text || product.name}
              ratio="aspect-[4/5]"
              priority
              width={1000}
              height={1250}
            />
          </div>
          {images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Product images">
              {images.map((img, i) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-label={`Show image ${i + 1} of ${images.length}`}
                    aria-current={i === selected}
                    className={cn('block w-full border-2 transition-colors', i === selected ? 'border-accent' : 'border-transparent hover:border-earth/50')}
                  >
                    <Picture path={img.storage_path} alt="" ratio="aspect-square" width={200} height={200} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary */}
        <div>
          <p className="text-sm text-earth">
            {product.category ? product.category.name : PRODUCT_TYPE_LABELS[product.product_type]}
          </p>
          <h1 className="mt-1 text-4xl md:text-5xl">{product.name}</h1>
          {settings.show_sku && product.sku && <p className="mt-2 text-sm text-earth">Product code: {product.sku}</p>}

          {price.main && (
            <p className="mt-5 text-2xl">
              <span className={price.enquire ? 'italic text-earth' : 'font-medium text-walnut'}>{price.main}</span>
              {price.compareAt && <span className="ml-3 text-lg text-earth line-through">{price.compareAt}</span>}
            </p>
          )}

          {product.short_description && (
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-charcoal/90">{product.short_description}</p>
          )}

          {product.show_enquiry_button && (
            <div className="mt-8">
              <p className="mb-3 text-sm text-earth">Ask about price, sizes and availability</p>
              <ContactActions message={message} />
            </div>
          )}

          {product.tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
              {product.tags.map((t) => (
                <li key={t} className="bg-sand/70 px-2.5 py-1 text-[13px] text-walnut">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="selvedge my-12" aria-hidden />

      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-10">
          {product.description && (
            <section>
              <h2 className="mb-3 text-3xl">About this product</h2>
              <Paragraphs text={product.description} />
            </section>
          )}
          {product.care_instructions && (
            <section>
              <h2 className="mb-3 text-3xl">Care</h2>
              <Paragraphs text={product.care_instructions} />
            </section>
          )}
          {product.additional_notes && (
            <section>
              <h2 className="mb-3 text-3xl">Notes</h2>
              <Paragraphs text={product.additional_notes} />
            </section>
          )}
        </div>

        <div className="space-y-8">
          {product.specifications.length > 0 && (
            <section>
              <h2 className="mb-3 text-3xl">Specifications</h2>
              <dl className="divide-y divide-sand border-y border-sand">
                {product.specifications.map((s, i) => (
                  <div key={`${s.label}-${i}`} className="grid grid-cols-[1fr_1.4fr] gap-4 py-2.5 text-[15px]">
                    <dt className="text-earth">{s.label}</dt>
                    <dd className="text-charcoal">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <Chips title="Materials" items={product.materials} />
          <Chips title="Sizes" items={product.sizes} />
          <Chips title="Colours and patterns" items={product.colours} />
          {product.variants.length > 0 && (
            <section>
              <h3 className="text-xl">Options</h3>
              <ul className="mt-2 divide-y divide-sand border-y border-sand">
                {product.variants.map((v, i) => (
                  <li key={`${v.name}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5 text-[15px]">
                    <span className="text-charcoal">
                      {v.name}
                      {v.sku && <span className="ml-2 text-xs text-earth">{v.sku}</span>}
                    </span>
                    <span className="text-earth">
                      {settings.show_prices && v.price ? describePrice({ price: v.price, compare_at_price: null, price_label: null }).main : v.note}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-4xl">More in {product.category?.name ?? 'this collection'}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">
            {related.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
