import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Picture } from '@/components/catalog/Picture'
import { friendlyError } from '@/lib/errors'
import { validateImageFile } from '@/lib/validation'

interface Props {
  id: string
  label: string
  path: string | null
  ratio?: string
  hint?: string
  /** Uploads and saves the file (or clears the image when null). */
  onChange: (file: File | null) => Promise<void>
}

/** One image that saves immediately on choose/remove, with a local preview while uploading. */
export function SingleImageField({ id, label, path, ratio = 'aspect-[4/3]', hint, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const run = async (file: File | null) => {
    setBusy(true)
    if (file) setPreview(URL.createObjectURL(file))
    try {
      await onChange(file)
      toast.success(file ? `${label} saved` : `${label} removed`)
    } catch (error) {
      toast.error(friendlyError(error, 'Could not save the image.'))
    } finally {
      setBusy(false)
      setPreview((p) => {
        if (p) URL.revokeObjectURL(p)
        return null
      })
    }
  }

  return (
    <div>
      <p className="field-label" id={`${id}-label`}>{label}</p>
      <div className="relative max-w-sm border border-sand">
        {preview ? (
          <div className={`${ratio} overflow-hidden`}>
            <img src={preview} alt="" className="h-full w-full object-cover opacity-60" />
          </div>
        ) : (
          <Picture path={path} alt={path ? label : `No ${label.toLowerCase()} set`} ratio={ratio} width={640} height={480} />
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-walnut" aria-hidden />
            <span className="sr-only">Saving</span>
          </div>
        )}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-labelledby={`${id}-label`}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          const problem = validateImageFile(file)
          if (problem) return void toast.error(problem)
          void run(file)
        }}
      />
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus className="h-4 w-4" aria-hidden /> {path ? 'Replace' : 'Upload'}
        </button>
        {path && (
          <button type="button" className="btn-quiet btn-sm text-red-800" disabled={busy} onClick={() => void run(null)}>
            <Trash2 className="h-4 w-4" aria-hidden /> Remove
          </button>
        )}
      </div>
    </div>
  )
}
