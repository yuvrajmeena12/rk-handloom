import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { directionsUrl, generalEnquiryMessage, telHref, whatsappHref } from '@/lib/contact'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

interface ContactActionsProps {
  /** Prefilled WhatsApp text. Defaults to a general enquiry. */
  message?: string
  show?: Array<'call' | 'whatsapp' | 'directions'>
  className?: string
  /** Visual weight: 'sm' or 'md' or 'lg' */
  size?: 'sm' | 'md' | 'lg'
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
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {show.includes('whatsapp') && wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAction}
          className={cn('btn-whatsapp group shadow-sm transition-all duration-200', sizeClass)}
        >
          <MessageCircle className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
          <span>{settings.whatsapp_label || 'WhatsApp Enquiry'}</span>
        </a>
      )}
      {show.includes('call') && tel && (
        <a
          href={tel}
          onClick={onAction}
          className={cn('btn-secondary group shadow-sm transition-all duration-200', sizeClass)}
        >
          <Phone className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
          <span>{settings.call_label || 'Call Showroom'}</span>
        </a>
      )}
      {show.includes('directions') && dir && (
        <a
          href={dir}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAction}
          className={cn('btn-secondary group shadow-sm transition-all duration-200', sizeClass)}
        >
          <MapPin className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
          <span>{settings.directions_label || 'Get Directions'}</span>
        </a>
      )}
    </div>
  )
}
