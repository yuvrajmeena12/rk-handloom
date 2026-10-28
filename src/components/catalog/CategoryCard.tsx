import { Link } from 'react-router-dom'
import type { Category } from '@/lib/types'
import { Picture } from './Picture'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to={`/category/${category.slug}`} className="group block">
      <div className="overflow-hidden border border-sand">
        <Picture
          path={category.image_path}
          alt={category.name}
          ratio="aspect-[5/4]"
          width={1000}
          height={800}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
      <h3 className="mt-3 text-2xl group-hover:text-accent">{category.name}</h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 max-w-[44ch] text-[15px] text-charcoal/80">{category.description}</p>
      )}
    </Link>
  )
}
