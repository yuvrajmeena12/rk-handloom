import { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { mediaUrl } from '@/lib/media'
import { cn } from '@/lib/utils'

interface PictureProps {
  path: string | null | undefined
  alt: string
  className?: string
  ratio?: string
  /** Set for the first visible image on a page (hero, top product card). */
  priority?: boolean
  width?: number
  height?: number
  fit?: 'cover' | 'contain'
  /** Responsive image slot hints to inform browser resource prioritization. */
  sizes?: string
}

/**
 * Image component with a reserved aspect ratio (preventing Cumulative Layout Shift),
 * automatic decoding="async", priority LCP loading, responsive slot sizes,
 * and graceful fallback to a woven placeholder on missing or failed images.
 */
export function Picture({
  path,
  alt,
  className,
  ratio = 'aspect-[4/5]',
  priority = false,
  width = 800,
  height = 1000,
  fit = 'cover',
  sizes,
}: PictureProps) {
  const src = mediaUrl(path)
  const [hasError, setHasError] = useState(false)

  // Reset error state if path changes
  useEffect(() => {
    setHasError(false)
  }, [path])

  const showPlaceholder = !src || hasError

  return (
    <div className={cn('weave relative overflow-hidden', ratio, className)}>
      {!showPlaceholder ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setHasError(true)}
          className={cn(
            'h-full w-full',
            fit === 'cover' ? 'object-cover' : 'object-contain',
          )}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-earth/60"
          role="img"
          aria-label={alt}
        >
          <ImageIcon className="h-8 w-8" aria-hidden />
        </div>
      )}
    </div>
  )
}
