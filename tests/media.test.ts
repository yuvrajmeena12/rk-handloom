import { describe, expect, it } from 'vitest'
import { MEDIA_BUCKET, mediaUrl } from '../src/lib/media'
import { validateImageFile } from '../src/lib/validation'

describe('Image Media & Delivery Optimizations (Phase 2)', () => {
  describe('mediaUrl', () => {
    it('returns null for null, undefined, or empty path', () => {
      expect(mediaUrl(null)).toBeNull()
      expect(mediaUrl(undefined)).toBeNull()
      expect(mediaUrl('')).toBeNull()
    })

    it('returns absolute URL directly if already fully qualified', () => {
      const externalUrl = 'https://images.example.com/photo.webp'
      expect(mediaUrl(externalUrl)).toBe(externalUrl)
    })

    it('encodes path segments safely with special characters', () => {
      const url = mediaUrl('products/test item/photo & sample.webp')
      expect(url).toContain(MEDIA_BUCKET)
      expect(url).toContain('products/test%20item/photo%20%26%20sample.webp')
      expect(url).not.toContain(' ')
    })
  })

  describe('validateImageFile', () => {
    it('accepts standard web image formats (JPG, PNG, WebP, AVIF)', () => {
      expect(validateImageFile({ name: 'photo.jpg', type: 'image/jpeg', size: 1024 })).toBeNull()
      expect(validateImageFile({ name: 'photo.png', type: 'image/png', size: 2048 })).toBeNull()
      expect(validateImageFile({ name: 'photo.webp', type: 'image/webp', size: 512 })).toBeNull()
      expect(validateImageFile({ name: 'photo.avif', type: 'image/avif', size: 256 })).toBeNull()
    })

    it('rejects animated GIF, SVG, and non-image types', () => {
      expect(validateImageFile({ name: 'anim.gif', type: 'image/gif', size: 1024 })).toMatch(/not a supported image/i)
      expect(validateImageFile({ name: 'vector.svg', type: 'image/svg+xml', size: 1024 })).toMatch(/not a supported image/i)
      expect(validateImageFile({ name: 'doc.pdf', type: 'application/pdf', size: 1024 })).toMatch(/not a supported image/i)
    })

    it('rejects empty files and files exceeding 15MB', () => {
      expect(validateImageFile({ name: 'empty.jpg', type: 'image/jpeg', size: 0 })).toMatch(/empty/i)
      expect(validateImageFile({ name: 'huge.jpg', type: 'image/jpeg', size: 16 * 1024 * 1024 })).toMatch(/larger than 15 MB/i)
    })
  })
})

