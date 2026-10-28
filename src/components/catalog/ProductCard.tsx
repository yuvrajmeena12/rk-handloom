import { Link } from 'react-router-dom'
import type { ProductSummary } from '@/lib/api/public'
import { describePrice } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import { Picture } from './Picture'

export function ProductCard({ product }: { product: ProductSummary }) {
  const { settings } = useSettings()
  const price = describePrice(product, settings?.show_prices ?? true)
  const image = product.images[0]

  return (
    <article className="group">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="overflow-hidden border border-sand">
          <Picture
            path={image?.storage_path}
            alt={image?.alt_text || product.name}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        </div>
        <div className="mt-3">
          {product.category && <p className="text-[13px] text-earth">{product.category.name}</p>}
          <h3 className="mt-0.5 text-[21px] leading-tight group-hover:text-accent">{product.name}</h3>
          {price.main && (
            <p className="mt-1 text-sm text-charcoal/85">
              <span className={price.enquire ? 'italic text-earth' : 'font-medium'}>{price.main}</span>
              {price.compareAt && <span className="ml-2 text-earth line-through">{price.compareAt}</span>}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
