import {
  Clock,
  Compass,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ContactActions } from '@/components/ContactActions'
import { useSettings } from '@/hooks/useSettings'
import { configuredHours, directionsUrl, mapSearchUrl, telHref, whatsappHref } from '@/lib/contact'
import { localBusinessJsonLd } from '@/lib/structuredData'
import { formatTime12 } from '@/lib/utils'

export default function ContactPage() {
  const { settings } = useSettings()
  if (!settings) return null

  const tel = telHref(settings.phone)
  const wa = whatsappHref(settings.whatsapp_number, 'Hello RK HANDLOOM, I would like to enquire about your showroom products and visit.')
  const dir = directionsUrl(settings)
  const mapLink = mapSearchUrl(settings)
  const hours = configuredHours(settings.hours)
  const social = Object.entries(settings.social ?? {}).filter(([, v]) => v)

  return (
    <div className="container-page py-10 md:py-16">
      <Seo
        title={`Contact & Showroom Location | ${settings.name_en}`}
        description={`Visit ${settings.name_en} at ${settings.address || 'Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901'}, or call ${settings.phone || '+91 98291 08112'} and message us on WhatsApp.`}
        path="/contact"
        jsonLd={localBusinessJsonLd(settings)}
      />

      {/* Header */}
      <header className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-3 py-1 text-xs font-medium text-earth shadow-card-subtle mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span>Showroom & Direct Contact</span>
        </div>
        <h1 className="font-serif text-4xl font-medium text-walnut sm:text-5xl md:text-6xl">
          {settings.contact_heading || 'Visit Our Showroom or Call Us'}
        </h1>
        {settings.name_hi && (
          <p lang="hi" className="mt-2 font-serif text-xl text-earth/90 sm:text-2xl">
            {settings.name_hi}
          </p>
        )}
        <p className="mt-3 text-base leading-relaxed text-charcoal/85 sm:text-lg">
          {settings.contact_body ||
            'We are located on Sendra Road, Beawar. Whether you want to view our handloom collections, discuss bespoke mattress dimensions, or arrange direct delivery, we are here to assist.'}
        </p>
      </header>

      <div className="selvedge my-8" aria-hidden />

      {/* 3 Quick Action Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: WhatsApp */}
        {wa && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-card-subtle transition-all duration-300 hover:shadow-luxury">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white mb-4">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-xl font-medium text-walnut">WhatsApp Direct Chat</h2>
            <p className="mt-1 text-xs text-earth">Fastest response for catalogue photos, pricing & custom sizing.</p>
            <div className="mt-5">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp w-full justify-center shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Start WhatsApp Chat</span>
              </a>
            </div>
          </div>
        )}

        {/* Card 2: Phone */}
        {tel && settings.phone && (
          <div className="rounded-xl border border-sand bg-ivory p-6 shadow-card-subtle transition-all duration-300 hover:shadow-luxury">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-ivory mb-4">
              <Phone className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-xl font-medium text-walnut">Telephone Helpline</h2>
            <p className="mt-1 text-xs text-earth">Speak with our showroom manager during operating hours.</p>
            <p className="mt-3 font-serif text-xl font-semibold text-walnut">{settings.phone}</p>
            <div className="mt-4">
              <a href={tel} className="btn-secondary w-full justify-center shadow-sm">
                <Phone className="h-4 w-4" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        )}

        {/* Card 3: Location / Directions */}
        {dir && (
          <div className="rounded-xl border border-sand bg-ivory p-6 shadow-card-subtle transition-all duration-300 hover:shadow-luxury sm:col-span-2 lg:col-span-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sand text-walnut mb-4">
              <Compass className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-xl font-medium text-walnut">Showroom Navigation</h2>
            <p className="mt-1 text-xs text-earth">Turn-by-turn directions directly to our storefront.</p>
            <p className="mt-3 text-xs text-charcoal/80 line-clamp-2">{settings.address || 'Sendra Road, Beawar'}</p>
            <div className="mt-4">
              <a
                href={dir}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center shadow-sm"
              >
                <Compass className="h-4 w-4" />
                <span>Get Directions</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Main Details & Hours Grid */}
      <div className="mt-12 grid gap-10 md:grid-cols-2 lg:gap-14" id="directions">
        {/* Address and Store Details */}
        <div className="space-y-8 rounded-xl border border-sand bg-ivory p-6 sm:p-8 shadow-card-subtle">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <MapPin className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-medium text-walnut">Showroom Address</h2>
            </div>
            <address className="mt-4 text-base not-italic leading-relaxed text-charcoal/90">
              <strong className="block font-medium text-walnut">{settings.name_en}</strong>
              {settings.address || 'Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901'}
            </address>

            {settings.location_code && (
              <p className="mt-2 text-xs font-mono text-earth">
                Google Plus Code: <span className="font-semibold text-walnut">{settings.location_code}</span>
              </p>
            )}

            {mapLink && (
              <p className="mt-3">
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Open in Google Maps search</span>
                </a>
              </p>
            )}
          </div>

          <div className="border-t border-sand/70 pt-6">
            <h3 className="font-serif text-xl font-medium text-walnut">Direct Communications</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-charcoal/90">
              {tel && settings.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-earth" />
                  <span>Phone:</span>
                  <a href={tel} className="font-medium text-walnut hover:underline">
                    {settings.phone}
                  </a>
                </li>
              )}
              {wa && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp:</span>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 hover:underline">
                    Available for enquiries
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-earth" />
                  <span>Email:</span>
                  <a href={`mailto:${settings.email}`} className="font-medium text-walnut hover:underline">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>

            {social.length > 0 && (
              <div className="mt-5 border-t border-sand/50 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-earth mb-2">Connect with us:</p>
                <ul className="flex flex-wrap gap-3 text-xs">
                  {social.map(([name, href]) => (
                    <li key={name}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="capitalize text-accent hover:underline font-medium"
                      >
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-sand/70 pt-6">
            <ContactActions size="md" />
          </div>
        </div>

        {/* Operating Hours and Guarantees */}
        <div className="flex flex-col justify-between rounded-xl border border-sand bg-sand/20 p-6 sm:p-8 shadow-card-subtle">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <Clock className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-medium text-walnut">Opening Hours</h2>
            </div>
            {hours.length > 0 ? (
              <ul className="mt-4 divide-y divide-sand/70 rounded-lg border border-sand bg-ivory p-4 text-sm shadow-card-subtle">
                {hours.map((h) => (
                  <li key={h.day} className="flex justify-between gap-6 py-2">
                    <span className="font-medium text-walnut">{h.day}</span>
                    <span className="text-earth">
                      {h.closed ? 'Closed' : `${formatTime12(h.open)} – ${formatTime12(h.close)}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-charcoal/85">
                {settings.hours_note || 'Open 7 days a week. Please call to confirm holiday timings.'}
              </p>
            )}

            {hours.length > 0 && settings.hours_note && (
              <p className="mt-3 text-xs text-earth">{settings.hours_note}</p>
            )}
          </div>

          <div className="mt-8 border-t border-sand/70 pt-6">
            <div className="rounded-lg bg-ivory p-4 border border-sand text-xs text-earth space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-charcoal/90">
                  <strong>Parking & Accessibility:</strong> Ample street parking available along Sendra Road.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-charcoal/90">
                  <strong>Custom Consultations:</strong> Bring your cot or bed dimensions for bespoke mattress fitting advice.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
