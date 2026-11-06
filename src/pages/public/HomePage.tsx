import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ContactActions } from '@/components/ContactActions'
import { Picture } from '@/components/catalog/Picture'
import { ProductCard } from '@/components/catalog/ProductCard'
import { CategoryCard } from '@/components/catalog/CategoryCard'
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/states'
import { useSettings } from '@/hooks/useSettings'
import { listCategories, listProducts } from '@/lib/api/public'
import { configuredHours, directionsUrl, telHref, whatsappHref } from '@/lib/contact'
import { mediaUrl } from '@/lib/media'
import { localBusinessJsonLd, webSiteJsonLd } from '@/lib/structuredData'
import { formatTime12, isSafeLink } from '@/lib/utils'
import type { BusinessSettings, HomepageSection } from '@/lib/types'

function SmartLink({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  if (href === '#directions') {
    return (
      <a
        href="#directions"
        className={className}
        onClick={(e) => {
          e.preventDefault()
          const target = document.getElementById('directions')
          if (target) target.scrollIntoView({ behavior: 'smooth' })
          else navigate('/contact')
        }}
      >
        {children}
      </a>
    )
  }
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className={className}
      {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

function HeritagePillars() {
  const pillars = [
    {
      icon: Sparkles,
      title: 'Authentic Handlooms',
      desc: 'Pure cotton bedsheets, Jaipuri dohars & traditional Rajasthani weaves',
    },
    {
      icon: Layers,
      title: 'Custom Mattresses',
      desc: 'Bespoke dimensions, firmness levels & natural supportive fillings',
    },
    {
      icon: MapPin,
      title: 'Sendra Road Showroom',
      desc: 'Experience the texture, thickness & craft in person at Beawar',
    },
    {
      icon: ShieldCheck,
      title: 'Direct Personal Care',
      desc: 'Personalized assistance and quick quotes over WhatsApp or call',
    },
  ]

  return (
    <section className="border-y border-sand/70 bg-sand/20 py-8" aria-label="Heritage and quality pillars">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory border border-sand shadow-sm text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-serif text-[16px] font-semibold text-walnut">{pillar.title}</h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-earth">{pillar.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Hero({ settings }: { settings: BusinessSettings }) {
  const hero = settings.hero_image_path
  const primary = isSafeLink(settings.hero_primary_link) && settings.hero_primary_label
  const secondary = isSafeLink(settings.hero_secondary_link) && settings.hero_secondary_label
  const wa = settings.whatsapp_number
    ? whatsappHref(settings.whatsapp_number, 'Hello RK HANDLOOM, I am visiting your website and would like to enquire about your handloom & mattress collections.')
    : null
  const tel = telHref(settings.phone)

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand/15 to-transparent">
      <div className="container-page grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          {/* Heritage Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sand bg-ivory/80 px-3.5 py-1 text-xs font-medium text-earth shadow-card-subtle backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Showroom on Sendra Road, Beawar · Authentic Textiles</span>
          </div>

          <h1 className="font-serif text-[38px] font-medium leading-[1.1] text-walnut xs:text-5xl sm:text-6xl lg:text-[68px]">
            {settings.hero_heading || settings.name_en}
          </h1>

          {settings.name_hi && (
            <p lang="hi" className="mt-2 font-serif text-xl text-earth/90 sm:text-2xl">
              {settings.name_hi}
            </p>
          )}

          {settings.hero_subheading ? (
            <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-charcoal/85 sm:text-lg">
              {settings.hero_subheading}
            </p>
          ) : (
            <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-charcoal/85 sm:text-lg">
              Discover authentic Rajasthani handlooms, pure cotton bedsheets, handcrafted dohars, and customized mattresses tailored to your comfort.
            </p>
          )}

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primary ? (
              <SmartLink href={settings.hero_primary_link!} className="btn-primary px-7 shadow-sm">
                <span>{settings.hero_primary_label}</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </SmartLink>
            ) : (
              <Link to="/catalog" className="btn-primary px-7 shadow-sm">
                <span>Explore Catalogue</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}

            {secondary ? (
              <SmartLink href={settings.hero_secondary_link!} className="btn-secondary px-6 shadow-sm">
                {settings.hero_secondary_label}
              </SmartLink>
            ) : (
              <a href="#directions" className="btn-secondary px-6 shadow-sm">
                <span>Visit Showroom</span>
              </a>
            )}

            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp px-5 shadow-sm"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span>WhatsApp Enquiry</span>
              </a>
            )}

            {tel && (
              <a href={tel} className="btn-secondary px-5 shadow-sm">
                <Phone className="h-4 w-4" aria-hidden />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-sand/70 pt-6 text-xs text-earth">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              100% Genuine Cotton & Weaves
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Custom Sizing on Demand
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              In-Store Inspection Welcome
            </span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative">
          <div className="relative mx-auto max-w-[500px] overflow-hidden rounded-md border border-sand bg-ivory shadow-luxury">
            {hero ? (
              <div className="relative">
                <Picture
                  path={hero}
                  alt={`${settings.name_en} handloom showroom collection`}
                  ratio="aspect-[4/5]"
                  priority
                  width={1000}
                  height={1250}
                  sizes="(max-width: 1024px) 100vw, 48vw"
                />
                <div className="selvedge" aria-hidden />
              </div>
            ) : (
              <div className="weave-dark flex aspect-[4/5] flex-col items-center justify-center p-8 text-center text-ivory">
                <div className="selvedge absolute left-0 right-0 top-0" aria-hidden />
                {settings.name_hi && (
                  <p lang="hi" className="font-serif text-5xl leading-tight text-ivory sm:text-6xl">
                    {settings.name_hi}
                  </p>
                )}
                <p className="mt-4 font-serif text-2xl tracking-[0.2em] text-sand">{settings.name_en}</p>
                <p className="mt-2 text-sm text-sand/80">Sendra Road, Beawar, Rajasthan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionShell({
  id,
  heading,
  body,
  children,
  tone = 'plain',
  action,
}: {
  id?: string
  heading?: string | null
  body?: string | null
  children: ReactNode
  tone?: 'plain' | 'weave'
  action?: ReactNode
}) {
  return (
    <section id={id} className={tone === 'weave' ? 'weave border-y border-sand py-16 md:py-20' : 'py-14 md:py-20'}>
      <div className="container-page">
        {(heading || body || action) && (
          <header className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              {heading && <h2 className="font-serif text-3xl font-medium text-walnut md:text-4xl">{heading}</h2>}
              {body && <p className="mt-2.5 text-[16px] leading-relaxed text-earth">{body}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}

function FeaturedCategories({ section }: { section: HomepageSection }) {
  const { data = [] } = useQuery({
    queryKey: ['categories', 'featured'],
    queryFn: () => listCategories({ featuredOnly: true }),
    staleTime: 60_000,
  })
  if (data.length === 0) return null
  return (
    <SectionShell
      heading={section.heading ?? 'Featured Collections'}
      body={section.body ?? 'Explore handloom textile categories curated for timeless comfort and authentic style.'}
      action={
        <Link to="/catalog" className="btn-secondary btn-sm shadow-sm">
          <span>View all categories</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>
    </SectionShell>
  )
}

function FeaturedProducts({ section }: { section: HomepageSection }) {
  const { settings } = useSettings()
  const featured = useQuery({
    queryKey: ['products', 'home'],
    queryFn: async () => {
      const first = await listProducts({ featuredOnly: true, pageSize: 8 })
      if (first.items.length > 0) return { ...first, isFeatured: true }
      const latest = await listProducts({ pageSize: 8, sort: 'newest' })
      return { ...latest, isFeatured: false }
    },
    staleTime: 60_000,
  })

  return (
    <SectionShell
      heading={section.heading ?? 'Handloom & Mattress Highlights'}
      body={section.body ?? 'Finest textiles and custom mattress craft directly from our Beawar showroom.'}
      action={
        <Link to="/catalog" className="btn-secondary btn-sm shadow-sm">
          <span>Explore full catalogue</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      }
    >
      {featured.isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : featured.isError ? (
        <ErrorState onRetry={() => featured.refetch()} />
      ) : featured.data && featured.data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {featured.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/catalog" className="btn-primary px-8 shadow-sm">
              <span>View All Products in Catalogue</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </>
      ) : (
        <EmptyState
          title="The catalogue is being prepared"
          action={<ContactActions show={['whatsapp', 'call']} />}
        >
          Products will appear here as soon as they are added. In the meantime, call or message {settings?.name_en} to
          ask about handloom products and custom mattresses.
        </EmptyState>
      )}
    </SectionShell>
  )
}

function Discovery({ section }: { section: HomepageSection }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/catalog?q=${encodeURIComponent(term)}` : '/catalog')
  }

  const popularSearches = ['Bedsheet', 'Dohar', 'Mattress', 'Pillow', 'Curtain', 'Durrie']

  return (
    <SectionShell
      heading={section.heading ?? 'Find Your Textile or Mattress'}
      body={section.body ?? 'Search by product name, fabric type, or browse by collection.'}
      tone="weave"
    >
      <div className="mx-auto max-w-2xl">
        <form onSubmit={submit} role="search" className="flex flex-col gap-2.5 sm:flex-row">
          <label htmlFor="discover-q" className="sr-only">
            Search the catalogue
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-earth" aria-hidden />
            <input
              id="discover-q"
              type="search"
              className="input pl-10 text-base"
              placeholder="Search cotton bedsheets, dohars, mattresses..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={80}
            />
          </div>
          <button type="submit" className="btn-primary px-6 shadow-sm">
            Search Catalogue
          </button>
        </form>

        {/* Popular search chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-earth">
          <span className="font-medium text-walnut">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => navigate(`/catalog?q=${encodeURIComponent(term)}`)}
              className="rounded-full border border-sand bg-ivory px-3 py-1 transition-colors hover:border-earth hover:text-accent"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Categories Chips */}
        {categories.length > 0 && (
          <div className="mt-6 border-t border-sand/60 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth mb-3">
              Browse by Category:
            </p>
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/category/${c.slug}`}
                    className="inline-flex items-center gap-1 rounded-md border border-sand bg-ivory px-3 py-1.5 text-xs font-medium text-walnut shadow-card-subtle transition-all hover:border-accent hover:text-accent"
                  >
                    <span>{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionShell>
  )
}

function Craft({ settings }: { settings: BusinessSettings }) {
  if (!settings.craft_heading && !settings.craft_body) return null
  return (
    <SectionShell tone="plain">
      <div className="grid gap-10 rounded-lg border border-sand bg-sand/10 p-8 md:grid-cols-[1fr_1.4fr] md:gap-16 md:p-12">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">Our Craft & Heritage</span>
          <h2 className="mt-2 font-serif text-3xl font-medium text-walnut md:text-4xl">{settings.craft_heading}</h2>
          <div className="mt-6">
            <Link to="/about" className="btn-secondary btn-sm shadow-sm">
              <span>Read About Our Heritage</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="prose-body text-base leading-relaxed text-charcoal/85">
          {(settings.craft_body ?? '').split(/\n{2,}/).map((para, i) => (
            <p key={i} className="mb-4 last:mb-0">{para}</p>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

function StoreInfo({ section, settings }: { section: HomepageSection; settings: BusinessSettings }) {
  const hours = configuredHours(settings.hours)
  const dir = directionsUrl(settings)
  const tel = telHref(settings.phone)

  return (
    <SectionShell
      heading={section.heading ?? 'Visit Our Showroom'}
      body={section.body ?? 'Come feel the texture, evaluate mattress firmness, and talk to our knowledgeable team.'}
      tone="weave"
    >
      <div className="grid gap-8 rounded-lg border border-sand bg-ivory p-6 sm:p-8 md:grid-cols-2 md:gap-12">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <MapPin className="h-5 w-5" />
            <h3 className="font-serif text-xl font-medium text-walnut">Showroom Location</h3>
          </div>
          {settings.address && (
            <p className="mt-3 text-base leading-relaxed text-charcoal/90">{settings.address}</p>
          )}
          {settings.location_code && (
            <p className="mt-1 text-xs font-mono text-earth">Plus Code: {settings.location_code}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {dir && (
              <a
                href={dir}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-sm shadow-sm"
              >
                <Compass className="h-4 w-4" aria-hidden />
                <span>{settings.directions_label || 'Get Google Maps Directions'}</span>
              </a>
            )}
            {tel && (
              <a href={tel} className="btn-secondary btn-sm shadow-sm">
                <Phone className="h-4 w-4" aria-hidden />
                <span>Call Showroom</span>
              </a>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-accent">
            <Clock className="h-5 w-5" />
            <h3 className="font-serif text-xl font-medium text-walnut">Opening Hours</h3>
          </div>
          {hours.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm text-charcoal/85">
              {hours.map((h) => (
                <li key={h.day} className="flex max-w-sm justify-between border-b border-sand/40 py-1">
                  <span className="font-medium text-walnut">{h.day}</span>
                  <span className="text-earth">{h.closed ? 'Closed' : `${formatTime12(h.open)} – ${formatTime12(h.close)}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 max-w-[40ch] text-sm text-charcoal/85">
              {settings.hours_note || 'Open 7 days a week. Please call to confirm holiday hours.'}
            </p>
          )}
        </div>
      </div>
    </SectionShell>
  )
}

function ContactSection({ section, settings }: { section: HomepageSection; settings: BusinessSettings }) {
  const tel = telHref(settings.phone)

  return (
    <SectionShell
      id="directions"
      heading={section.heading ?? settings.contact_heading ?? 'Custom Orders & Personal Inquiries'}
      body={
        section.body ??
        settings.contact_body ??
        'Looking for custom mattress dimensions, bulk orders, or specific handloom patterns? Contact us directly for immediate assistance.'
      }
    >
      <div className="rounded-lg border border-sand bg-gradient-to-br from-sand/20 to-ivory p-8 shadow-card-subtle">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-earth">Direct Showroom Helpline</span>
            {tel && settings.phone && (
              <p className="mt-1 font-serif text-3xl font-medium text-walnut sm:text-4xl">
                <a href={tel} className="hover:text-accent transition-colors">
                  {settings.phone}
                </a>
              </p>
            )}
            <p className="mt-2 text-sm text-charcoal/80">
              Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901
            </p>
          </div>
          <div className="shrink-0">
            <ContactActions show={['whatsapp', 'call', 'directions']} size="lg" />
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

export default function HomePage() {
  const { settings, sections } = useSettings()
  if (!settings) return null

  const visible = sections.filter((s) => s.is_visible).sort((a, b) => a.display_order - b.display_order)

  return (
    <>
      <Seo
        title={`${settings.name_en} | ${settings.tagline || 'Handloom Textiles & Custom Mattresses'}`}
        description={
          settings.short_description ??
          'Authentic handloom textiles, pure cotton bedsheets, Jaipuri dohars, and bespoke custom mattresses on Sendra Road, Beawar, Rajasthan.'
        }
        path="/"
        image={mediaUrl(settings.hero_image_path)}
        jsonLd={[localBusinessJsonLd(settings), webSiteJsonLd()]}
      />
      <Hero settings={settings} />
      <HeritagePillars />
      <div className="selvedge" aria-hidden />
      {visible.map((section) => {
        switch (section.key) {
          case 'featured_categories':
            return <FeaturedCategories key={section.key} section={section} />
          case 'featured_products':
            return <FeaturedProducts key={section.key} section={section} />
          case 'discovery':
            return <Discovery key={section.key} section={section} />
          case 'craft':
            return <Craft key={section.key} settings={settings} />
          case 'store_info':
            return <StoreInfo key={section.key} section={section} settings={settings} />
          case 'contact':
            return <ContactSection key={section.key} section={section} settings={settings} />
          default:
            return null
        }
      })}
    </>
  )
}
