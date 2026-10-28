import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { directionsUrl, generalEnquiryMessage, telHref, whatsappHref } from '@/lib/contact'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

interface ContactActionsProps {
  /** Prefilled WhatsApp text. Defaults to a general enquiry. */
  message?: string
  show?: Array<'call' | 'whatsapp' | 'directions'>
  className?: string
  /** Visual weight: "solid" uses the primary button for the first action. */
  size?: 'sm' | 'md'
  onAction?: () => void
}

export function ContactActions({
  message,
  show = ['call', 'whatsapp', 'directions'],
  className,
  size = 'md',
  onAction,
}: ContactActionsProps) {
  const { settings } = useSettings()
  if (!settings) return null

  const tel = telHref(settings.phone)
  const wa = whatsappHref(settings.whatsapp_number, message ?? generalEnquiryMessage(settings.name_en))
  const dir = directionsUrl(settings)
  const sm = size === 'sm' ? 'btn-sm' : ''

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {show.includes('whatsapp') && wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" onClick={onAction} className={cn('btn-primary', sm)}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          {settings.whatsapp_label || 'WhatsApp'}
        </a>
      )}
      {show.includes('call') && tel && (
        <a href={tel} onClick={onAction} className={cn('btn-secondary', sm)}>
          <Phone className="h-4 w-4" aria-hidden />
          {settings.call_label || 'Call us'}
        </a>
      )}
      {show.includes('directions') && dir && (
        <a href={dir} target="_blank" rel="noopener noreferrer" onClick={onAction} className={cn('btn-secondary', sm)}>
          <MapPin className="h-4 w-4" aria-hidden />
          {settings.directions_label || 'Get directions'}
        </a>
      )}
    </div>
  )
}
