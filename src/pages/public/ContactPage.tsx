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
  const wa = whatsappHref(settings.whatsapp_number)
  const dir = directionsUrl(settings)
  const mapLink = mapSearchUrl(settings)
  const hours = configuredHours(settings.hours)
  const social = Object.entries(settings.social ?? {}).filter(([, v]) => v)

  return (
    <div className="container-page py-12 md:py-16">
      <Seo
        title="Contact and location"
        description={`Visit ${settings.name_en}${settings.address ? ` at ${settings.address}` : ''}, or call and message us on WhatsApp.`}
        path="/contact"
        jsonLd={localBusinessJsonLd(settings)}
      />
      <header className="max-w-2xl">
        <h1 className="text-5xl md:text-6xl">{settings.contact_heading || 'Visit or contact us'}</h1>
        {settings.contact_body && <p className="mt-4 text-[17px] text-charcoal/85">{settings.contact_body}</p>}
      </header>
      <div className="selvedge my-8" aria-hidden />

      <div className="grid gap-12 md:grid-cols-2 md:gap-16" id="directions">
        <div className="space-y-8">
          <section>
            <h2 className="text-3xl">{settings.name_en}</h2>
            {settings.name_hi && (
              <p lang="hi" className="text-earth">
                {settings.name_hi}
              </p>
            )}
            <address className="mt-4 text-[17px] not-italic leading-relaxed text-charcoal">{settings.address}</address>
            {settings.location_code && <p className="mt-2 text-sm text-earth">Plus code: {settings.location_code}</p>}
            {mapLink && (
              <p className="mt-3">
                <a href={mapLink} target="_blank" rel="noopener noreferrer" className="link">
                  View on Google Maps
                </a>
              </p>
            )}
          </section>

          <section>
            <h2 className="text-3xl">Phone and WhatsApp</h2>
            <ul className="mt-3 space-y-1.5 text-[17px]">
              {tel && settings.phone && (
                <li>
                  Call: <a href={tel} className="link">{settings.phone}</a>
                </li>
              )}
              {wa && (
                <li>
                  WhatsApp:{' '}
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="link">
                    Start a chat
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  Email: <a href={`mailto:${settings.email}`} className="link">{settings.email}</a>
                </li>
              )}
            </ul>
            {social.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-4 text-[15px]">
                {social.map(([name, href]) => (
                  <li key={name}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="link capitalize">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ContactActions />
        </div>

        <section className="weave self-start border border-sand p-6 md:p-8">
          <h2 className="text-3xl">Opening hours</h2>
          {hours.length > 0 ? (
            <ul className="mt-4 divide-y divide-sand/80 text-[16px]">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-6 py-2">
                  <span>{h.day}</span>
                  <span>{h.closed ? 'Closed' : `${formatTime12(h.open)} to ${formatTime12(h.close)}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[16px] leading-relaxed text-charcoal/90">
              {settings.hours_note || 'Please call to confirm opening hours.'}
            </p>
          )}
          {hours.length > 0 && settings.hours_note && (
            <p className="mt-4 text-sm text-earth">{settings.hours_note}</p>
          )}
          {!dir && <p className="mt-4 text-sm text-earth">Directions are not available yet.</p>}
        </section>
      </div>
    </div>
  )
}
