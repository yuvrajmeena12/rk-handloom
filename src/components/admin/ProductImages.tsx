import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RefreshCw, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from './ui'
import { Picture } from '@/components/catalog/Picture'
import {
  addProductImage,
  removeProductImage,
  reorderProductImages,
  replaceProductImage,
  setMainProductImage,
  updateImageAlt,
} from '@/lib/api/admin'
import { friendlyError } from '@/lib/errors'
import { validateImageFile } from '@/lib/validation'
import type { ProductImage } from '@/lib/types'

interface Props {
  productId: string
  images: ProductImage[]
  productName: string
  onChanged: () => void
}

interface UploadItem {
  key: string
  name: string
  preview: string
  state: 'uploading' | 'error'
  error?: string
}

export function ProductImages({ productId, images, productName, onChanged }: Props) {
  const qc = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const replaceTarget = useRef<ProductImage | null>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [removing, setRemoving] = useState<ProductImage | null>(null)

  const refresh = () => {
    onChanged()
    void qc.invalidateQueries({ queryKey: ['admin'] })
    void qc.invalidateQueries({ queryKey: ['products'] })
    void qc.invalidateQueries({ queryKey: ['product'] })
  }

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? [])
    if (fileInput.current) fileInput.current.value = ''
    if (files.length === 0) return

    const valid: File[] = []
    for (const file of files) {
      const problem = validateImageFile(file)
      if (problem) toast.error(problem)
      else valid.push(file)
    }
    // Upload one at a time so positions and the main image are assigned in a stable order.
    for (const file of valid) {
      const key = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      setUploads((u) => [...u, { key, name: file.name, preview, state: 'uploading' }])
      try {
        await addProductImage(productId, file)
        setUploads((u) => u.filter((x) => x.key !== key))
        URL.revokeObjectURL(preview)
        refresh()
      } catch (error) {
        const message = friendlyError(error, 'Upload failed.')
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, state: 'error', error: message } : x)))
        toast.error(`${file.name}: ${message}`)
      }
    }
  }

  const dismissUpload = (key: string) =>
    setUploads((u) => {
      const item = u.find((x) => x.key === key)
      if (item) URL.revokeObjectURL(item.preview)
      return u.filter((x) => x.key !== key)
    })

  const setMain = useMutation({
    mutationFn: setMainProductImage,
    onSuccess: () => {
      toast.success('Main image updated')
      refresh()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const move = useMutation({
    mutationFn: ({ from, to }: { from: number; to: number }) => {
      const ids = images.map((i) => i.id)
      const [moved] = ids.splice(from, 1)
      ids.splice(to, 0, moved)
      return reorderProductImages(productId, ids)
    },
    onSuccess: refresh,
    onError: (e) => toast.error(friendlyError(e)),
  })

  const remove = useMutation({
    mutationFn: removeProductImage,
    onSuccess: () => {
      toast.success('Image removed')
      setRemoving(null)
      refresh()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const replace = useMutation({
    mutationFn: ({ image, file }: { image: ProductImage; file: File }) => replaceProductImage(image, file),
    onSuccess: () => {
      toast.success('Image replaced')
      refresh()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const alt = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => updateImageAlt(id, text),
    onSuccess: refresh,
    onError: (e) => toast.error(friendlyError(e)),
  })

  const busy = move.isPending || setMain.isPending || replace.isPending

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-charcoal/80">
          JPG, PNG, WebP or AVIF. Large photos are resized automatically. The star marks the main image shown first.
        </p>
        <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}>
          <ImagePlus className="h-4 w-4" aria-hidden /> Add images
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        aria-label="Choose images to upload"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={replaceInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-label="Choose a replacement image"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const target = replaceTarget.current
          e.target.value = ''
          if (!file || !target) return
          const problem = validateImageFile(file)
          if (problem) return void toast.error(problem)
          replace.mutate({ image: target, file })
        }}
      />

      {images.length === 0 && uploads.length === 0 && (
        <div className="weave mt-4 border border-dashed border-earth/50 px-6 py-10 text-center text-[15px]">
          No images yet. Add at least one image before you can publish this product.
        </div>
      )}

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.id} className="border border-sand bg-white/60">
            <div className="relative">
              <Picture path={img.storage_path} alt={img.alt_text || productName} ratio="aspect-square" width={400} height={400} />
              {img.is_main && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-walnut px-2 py-1 text-xs text-ivory">
                  <Star className="h-3 w-3" aria-hidden /> Main
                </span>
              )}
            </div>
            <div className="space-y-2 p-3">
              <label className="sr-only" htmlFor={`alt-${img.id}`}>Description of image {i + 1}</label>
              <input
                id={`alt-${img.id}`}
                className="input !min-h-[36px] text-sm"
                placeholder="Describe this image (helps accessibility)"
                defaultValue={img.alt_text ?? ''}
                maxLength={300}
                onBlur={(e) => {
                  if (e.target.value.trim() !== (img.alt_text ?? '')) alt.mutate({ id: img.id, text: e.target.value })
                }}
              />
              <div className="flex flex-wrap gap-1">
                <button type="button" className="btn-quiet btn-sm" disabled={busy || i === 0} onClick={() => move.mutate({ from: i, to: i - 1 })} aria-label={`Move image ${i + 1} earlier`}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" className="btn-quiet btn-sm" disabled={busy || i === images.length - 1} onClick={() => move.mutate({ from: i, to: i + 1 })} aria-label={`Move image ${i + 1} later`}>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                {!img.is_main && (
                  <button type="button" className="btn-quiet btn-sm" disabled={busy} onClick={() => setMain.mutate(img.id)}>
                    <Star className="h-4 w-4" aria-hidden /> Make main
                  </button>
                )}
                <button
                  type="button"
                  className="btn-quiet btn-sm"
                  disabled={busy}
                  onClick={() => {
                    replaceTarget.current = img
                    replaceInput.current?.click()
                  }}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden /> Replace
                </button>
                <button type="button" className="btn-quiet btn-sm text-red-800" disabled={busy} onClick={() => setRemoving(img)} aria-label={`Remove image ${i + 1}`}>
                  <Trash2 className="h-4 w-4" aria-hidden /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}

        {uploads.map((u) => (
          <li key={u.key} className="border border-sand bg-white/60">
            <div className="relative aspect-square overflow-hidden">
              <img src={u.preview} alt="" className={`h-full w-full object-cover ${u.state === 'uploading' ? 'opacity-50' : 'opacity-30'}`} />
              {u.state === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center" role="status">
                  <Loader2 className="h-7 w-7 animate-spin text-walnut" aria-hidden />
                  <span className="sr-only">Uploading {u.name}</span>
                </div>
              )}
            </div>
            <div className="p-3 text-sm">
              <p className="truncate font-medium">{u.name}</p>
              {u.state === 'uploading' ? (
                <p className="text-earth">Uploading</p>
              ) : (
                <>
                  <p role="alert" className="field-error">{u.error}</p>
                  <button type="button" className="btn-quiet btn-sm mt-1" onClick={() => dismissUpload(u.key)}>Dismiss</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this image?"
        confirmLabel="Remove image"
        danger
        busy={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing)}
      >
        <p>The image is deleted from this product and from storage.</p>
        {images.length === 1 && removing && (
          <p className="font-medium text-red-800">This is the only image. The product will be unpublished because a published product needs at least one image.</p>
        )}
      </ConfirmDialog>
    </div>
  )
}
