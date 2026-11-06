import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Category } from '@/lib/types'
import { Picture } from './Picture'

interface CategoryCardProps {
  category: Category
  priority?: boolean
}

export function CategoryCard({ category, priority = false }: CategoryCardProps) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative block overflow-hidden border border-sand bg-white/70 shadow-card-subtle transition-all duration-300 hover:border-earth/40 hover:bg-white hover:shadow-luxury"
    >
      <div className="relative overflow-hidden bg-sand/30">
        <Picture
          path={category.image_path}
          alt={category.name}
          ratio="aspect-[5/4]"
          width={600}
          height={480}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-serif text-xs uppercase tracking-[0.12em] text-earth">
              Collection
            </span>
            <h3 className="mt-1 text-2xl font-medium tracking-tight text-walnut transition-colors group-hover:text-accent sm:text-[26px]">
              {category.name}
            </h3>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand bg-ivory text-walnut transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ivory">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {category.description && (
          <p className="mt-2.5 line-clamp-2 text-[15px] leading-relaxed text-charcoal/80">
            {category.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent transition-colors group-hover:text-walnut">
          <span>Explore Collection</span>
        </div>
      </div>
    </Link>
  )
}
