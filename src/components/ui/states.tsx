import type { ReactNode } from 'react'
import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-earth">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="weave border border-sand px-6 py-14 text-center">
      <PackageOpen className="mx-auto h-8 w-8 text-earth" aria-hidden />
      <h3 className="mt-4 text-2xl">{title}</h3>
      {children && <div className="mx-auto mt-2 max-w-md text-[15px] text-charcoal/80">{children}</div>}
      {action && <div className="mt-6 flex justify-center gap-3">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'We could not load this',
  message = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="border border-red-800/30 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="mx-auto h-7 w-7 text-red-800" aria-hidden />
      <h3 className="mt-3 text-xl text-red-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-red-900/80">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-5" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[4/5] w-full" />
          <div className="skeleton mt-3 h-4 w-3/4" />
          <div className="skeleton mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}
