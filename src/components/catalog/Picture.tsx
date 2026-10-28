import { Image as ImageIcon } from 'lucide-react'
import { mediaUrl } from '@/lib/media'
import { cn } from '@/lib/utils'

interface PictureProps {
  path: string | null | undefined
  alt: string
  className?: string
  ratio?: string
  /** Set for the first visible image on a page (hero, product main image). */
  priority?: boolean
  width?: number
  height?: number
  fit?: 'cover' | 'contain'
}

/** Image with a reserved aspect ratio (no layout shift) and a woven placeholder. */
export function Picture({
  path,
  alt,
  className,
  ratio = 'aspect-[4/5]',
  priority = false,
  width = 800,
  height = 1000,
  fit = 'cover',
}: PictureProps) {
  const src = mediaUrl(path)
  return (
    <div className={cn('weave relative overflow-hidden', ratio, className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain')}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-earth/60" role="img" aria-label={alt}>
          <ImageIcon className="h-8 w-8" aria-hidden />
        </div>
      )}
    </div>
  )
}
