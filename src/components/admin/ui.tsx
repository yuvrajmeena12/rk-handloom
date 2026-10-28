import { useEffect, useRef, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------ Page header ----------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-charcoal/80">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}

/* -------------------------------- Fields -------------------------------- */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && (
          <span className="text-red-800" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border border-sand bg-white/50 p-5 md:p-7">
      <h2 className="text-2xl md:text-3xl">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-charcoal/75">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--c-accent))]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="text-[15px]">
        <span className="font-medium text-walnut">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-charcoal/70">{description}</span>}
      </label>
    </div>
  )
}

export function StatusBadge({ kind }: { kind: 'published' | 'draft' | 'archived' | 'hidden' | 'featured' }) {
  const styles = {
    published: 'bg-green-100 text-green-900',
    draft: 'bg-amber-100 text-amber-900',
    archived: 'bg-stone-200 text-stone-800',
    hidden: 'bg-amber-100 text-amber-900',
    featured: 'bg-sand text-walnut',
  }
  const labels = {
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
    hidden: 'Hidden',
    featured: 'Featured',
  }
  return <span className={cn('inline-block px-2 py-0.5 text-xs font-medium', styles[kind])}>{labels[kind]}</span>
}

export function SubmitBar({
  busy,
  dirty,
  label = 'Save changes',
  extra,
}: {
  busy: boolean
  dirty: boolean
  label?: string
  extra?: ReactNode
}) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-sand bg-ivory/95 px-4 py-4 sm:-mx-6 sm:px-6">
      <button type="submit" className="btn-primary" disabled={busy || !dirty}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? 'Saving' : label}
      </button>
      {extra}
      <p className="text-sm text-earth" aria-live="polite">
        {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
      </p>
    </div>
  )
}

/* ----------------------------- Confirm dialog --------------------------- */

interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Native <dialog>: focus is trapped and Escape closes it without extra code. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
      className="w-[min(92vw,460px)] border border-sand bg-ivory p-0 text-charcoal backdrop:bg-charcoal/50"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-3xl">
          {title}
        </h2>
        {children && <div className="mt-3 space-y-2 text-[15px] text-charcoal/85">{children}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

/* --------------------------- Unsaved changes guard ---------------------- */

/**
 * Warns before leaving a form with unsaved edits (in-app navigation and tab close).
 * Call `allowNextNavigation()` right before navigating away after a successful save.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const allowRef = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !allowRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const dialog = (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      confirmLabel="Leave page"
      cancelLabel="Keep editing"
      danger
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
      onCancel={() => blocker.state === 'blocked' && blocker.reset()}
    >
      <p>You have changes that have not been saved. If you leave now, they will be lost.</p>
    </ConfirmDialog>
  )

  return {
    dialog,
    allowNextNavigation: () => {
      allowRef.current = true
    },
  }
}
