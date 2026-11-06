import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import type { ProductSummary } from '@/lib/api/public'
import { describePrice } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import { whatsappHref, productEnquiryMessage } from '@/lib/contact'
import { Picture } from './Picture'

interface ProductCardProps {
  product: ProductSummary
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { settings } = useSettings()
  const price = describePrice(product, settings?.show_prices ?? true)
  const image = product.images[0]

  const hasDiscount =
    Boolean(product.compare_at_price && product.price && product.compare_at_price > product.price)
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price!) / product.compare_at_price!) * 100)
    : null

  const waMessage = productEnquiryMessage(
    settings?.name_en ?? 'RK HANDLOOM',
    product,
  )
  const waUrl = settings?.whatsapp_number
    ? whatsappHref(settings.whatsapp_number, waMessage)
    : null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-sand bg-ivory shadow-card-subtle transition-all duration-300 hover:-translate-y-1 hover:border-earth/40 hover:shadow-luxury">
      <Link
        to={`/product/${product.slug}`}
        className="flex flex-1 flex-col"
        aria-label={`View details for ${product.name}`}
      >
        {/* Image Container with Badges */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone/20">
          <Picture
            path={image?.storage_path}
            alt={image?.alt_text || product.name}
            width={400}
            height={500}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />

          {/* Badges overlay */}
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-1">
            {product.category ? (
              <span className="rounded bg-ivory/95 px-2 py-0.5 text-[11px] font-medium tracking-wide text-walnut shadow-sm backdrop-blur-sm">
                {product.category.name}
              </span>
            ) : <span />}

            {discountPercent && discountPercent > 0 && (
              <span className="rounded bg-accent/90 px-2 py-0.5 text-[11px] font-semibold text-ivory shadow-sm">
                Save {discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <h3 className="font-serif text-[17px] font-medium leading-snug text-walnut transition-colors group-hover:text-accent sm:text-[19px]">
            {product.name}
          </h3>

          {product.sku && (
            <p className="mt-1 text-[11px] font-mono tracking-wider text-earth/80">
              SKU: {product.sku}
            </p>
          )}

          <div className="mt-auto pt-3">
            {price.main && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className={
                    price.enquire
                      ? 'text-sm font-medium italic text-earth'
                      : 'text-base font-semibold text-walnut sm:text-lg'
                  }
                >
                  {price.main}
                </span>
                {price.compareAt && (
                  <span className="text-xs text-earth/70 line-through">
                    {price.compareAt}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

        {/* Quick WhatsApp Enquiry Button */}
        {waUrl && (
          <div className="border-t border-sand/60 px-3.5 py-2.5 sm:px-4">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-sand/30 py-1.5 text-xs font-medium text-walnut transition-all duration-200 hover:bg-emerald-600 hover:text-white"
              aria-label={`Enquire about ${product.name} on WhatsApp`}
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600 transition-colors group-hover/wa:text-white" />
              <span>WhatsApp Enquiry</span>
            </a>
          </div>
        )}
    </article>
  )
}
