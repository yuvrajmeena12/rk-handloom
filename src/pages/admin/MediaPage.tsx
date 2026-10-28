import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, PageHeader } from '@/components/admin/ui'
import { Picture } from '@/components/catalog/Picture'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import { deleteMediaFile, listMediaFiles, uploadSiteImage, type MediaFile } from '@/lib/api/admin'
import { friendlyError } from '@/lib/errors'
import { getSettings } from '@/lib/api/public'
import { mediaUrl } from '@/lib/media'
import { validateImageFile } from '@/lib/validation'

export default function MediaPage() {
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)

  const files = useQuery({ queryKey: ['admin', 'media'], queryFn: listMediaFiles })
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings })

  const remove = useMutation({
    mutationFn: (f: MediaFile) => deleteMediaFile(f.path),
    onSuccess: () => {
      toast.success('File deleted')
      setPending(null)
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const inUse = (path: string) => settings.data?.logo_path === path || settings.data?.hero_image_path === path

  const upload = async (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    if (input.current) input.current.value = ''
    setUploading(true)
    for (const file of picked) {
      const problem = validateImageFile(file)
      if (problem) {
        toast.error(problem)
        continue
      }
      try {
        await uploadSiteImage(file)
        toast.success(`${file.name} uploaded`)
      } catch (e) {
        toast.error(`${file.name}: ${friendlyError(e)}`)
      }
    }
    setUploading(false)
    void qc.invalidateQueries({ queryKey: ['admin', 'media'] })
  }

  return (
    <>
      <PageHeader
        title="Media library"
        description="Site and category images. Product photos are managed on each product's page."
        actions={
          <button type="button" className="btn-primary" disabled={uploading} onClick={() => input.current?.click()}>
            <ImagePlus className="h-4 w-4" aria-hidden /> {uploading ? 'Uploading' : 'Upload images'}
          </button>
        }
      />
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label="Choose images to upload" onChange={(e) => void upload(e.target.files)} />

      {files.isLoading ? (
        <Spinner />
      ) : files.isError ? (
        <ErrorState onRetry={() => files.refetch()} />
      ) : (files.data ?? []).length === 0 ? (
        <EmptyState title="No site images yet">Upload images here, or add a logo and hero image from the Appearance and Homepage pages.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(files.data ?? []).map((f) => {
            const used = inUse(f.path)
            const url = mediaUrl(f.path)
            return (
              <li key={f.path} className="border border-sand bg-white/60">
                <Picture path={f.path} alt={f.name} ratio="aspect-square" width={400} height={400} />
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium text-walnut">{f.folder}/{f.name}</p>
                  <p className="text-xs text-earth">{f.size ? `${Math.round(f.size / 1024)} KB` : ''}{used ? ' · In use' : ''}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn-quiet btn-sm"
                      onClick={() => {
                        if (url) void navigator.clipboard.writeText(url).then(() => toast.success('Link copied'), () => toast.error('Could not copy the link'))
                      }}
                    >
                      <Copy className="h-4 w-4" aria-hidden /> Copy link
                    </button>
                    <button type="button" className="btn-quiet btn-sm text-red-800" onClick={() => setPending(f)} aria-label={`Delete ${f.name}`}>
                      <Trash2 className="h-4 w-4" aria-hidden /> Delete
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this file?"
        confirmLabel="Delete file"
        danger
        busy={remove.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending)}
      >
        <p>The file is removed from storage and stops loading wherever it is used.</p>
        {pending && inUse(pending.path) && <p className="font-medium text-red-800">This image is currently used on your site as the logo or hero image.</p>}
      </ConfirmDialog>
    </>
  )
}
