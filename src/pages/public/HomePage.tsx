import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ContactActions } from '@/components/ContactActions'
import { Picture } from '@/components/catalog/Picture'
import { ProductCard } from '@/components/catalog/ProductCard'
import { CategoryCard } from '@/components/catalog/CategoryCard'
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/states'
import { useSettings } from '@/hooks/useSettings'
import { listCategories, listProducts } from '@/lib/api/public'
import { configuredHours, directionsUrl, telHref } from '@/lib/contact'
import { mediaUrl } from '@/lib/media'
import { localBusinessJsonLd } from '@/lib/structuredData'
import { formatTime12, isSafeLink } from '@/lib/utils'
import type { BusinessSettings, HomepageSection } from '@/lib/types'

function SmartLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const navigate = useNavigate()
  if (href === '#directions') {
    // Scroll to the contact section when it is on this page; otherwise open the contact page.
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
    <a href={href} className={className} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

function Hero({ settings }: { settings: BusinessSettings }) {
  const hero = settings.hero_image_path
  const primary = isSafeLink(settings.hero_primary_link) && settings.hero_primary_label
  const secondary = isSafeLink(settings.hero_secondary_link) && settings.hero_secondary_label

  return (
    <section className="container-page grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div>
        <h1 className="text-[44px] font-semibold sm:text-6xl lg:text-[72px]">
          {settings.hero_heading || settings.name_en}
        </h1>
        {settings.hero_subheading && (
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-charcoal/85">{settings.hero_subheading}</p>
        )}
        <div className="mt-9 flex flex-wrap gap-3">
          {primary && (
            <SmartLink href={settings.hero_primary_link!} className="btn-primary px-7">
              {settings.hero_primary_label}
            </SmartLink>
          )}
          {secondary && (
            <SmartLink href={settings.hero_secondary_link!} className="btn-secondary px-7">
              {settings.hero_secondary_label}
            </SmartLink>
          )}
        </div>
      </div>

      <div className="relative">
        {hero ? (
          <div className="border border-sand">
            <Picture
              path={hero}
              alt={`${settings.name_en} handloom`}
              ratio="aspect-[4/5]"
              priority
              width={1000}
              height={1250}
            />
            <div className="selvedge" aria-hidden />
          </div>
        ) : (
          <div className="weave-dark flex aspect-[4/5] flex-col items-center justify-center border border-walnut p-8 text-center">
            <div className="selvedge absolute left-0 right-0 top-0" aria-hidden />
            {settings.name_hi && (
              <p lang="hi" className="font-serif text-5xl leading-tight text-ivory sm:text-6xl">
                {settings.name_hi}
              </p>
            )}
            <p className="mt-4 font-serif text-2xl tracking-[0.18em] text-sand">{settings.name_en}</p>
          </div>
        )}
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
}: {
  id?: string
  heading?: string | null
  body?: string | null
  children: ReactNode
  tone?: 'plain' | 'weave'
}) {
  return (
    <section id={id} className={tone === 'weave' ? 'weave border-y border-sand py-16 md:py-20' : 'py-14 md:py-16'}>
      <div className="container-page">
        {(heading || body) && (
          <header className="mb-8 max-w-2xl">
            {heading && <h2 className="text-4xl md:text-[44px]">{heading}</h2>}
            {body && <p className="mt-3 text-[17px] text-charcoal/80">{body}</p>}
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
    <SectionShell heading={section.heading} body={section.body}>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
    <SectionShell heading={section.heading} body={section.body}>
      {featured.isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : featured.isError ? (
        <ErrorState onRetry={() => featured.refetch()} />
      ) : featured.data && featured.data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {featured.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10">
            <Link to="/catalog" className="btn-secondary">
              View the full catalogue
            </Link>
          </div>
        </>
      ) : (
        <EmptyState
          title="The catalogue is being prepared"
          action={<ContactActions show={['whatsapp', 'call']} />}
        >
          Products will appear here as soon as they are added. In the meantime, call or message {settings?.name_en} to
          ask about handloom products and mattresses.
        </EmptyState>
      )}
    </SectionShell>
  )
}

function Discovery({ section }: { section: HomepageSection }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => listCategories(), staleTime: 5 * 60_000 })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/catalog?q=${encodeURIComponent(term)}` : '/catalog')
  }

  return (
    <SectionShell heading={section.heading} body={section.body} tone="weave">
      <form onSubmit={submit} role="search" className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <label htmlFor="discover-q" className="sr-only">
          Search the catalogue
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth" aria-hidden />
          <input
            id="discover-q"
            type="search"
            className="input pl-9"
            placeholder="Search by product name or code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={80}
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
      {categories.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link to={`/category/${c.slug}`} className="btn-secondary btn-sm bg-ivory">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  )
}

function Craft({ settings }: { settings: BusinessSettings }) {
  if (!settings.craft_heading && !settings.craft_body) return null
  return (
    <SectionShell>
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <h2 className="text-4xl md:text-5xl">{settings.craft_heading}</h2>
        <div className="prose-body">
          {(settings.craft_body ?? '').split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p className="mt-6">
            <Link to="/about" className="link">
              About {settings.name_en}
            </Link>
          </p>
        </div>
      </div>
    </SectionShell>
  )
}

function StoreInfo({ section, settings }: { section: HomepageSection; settings: BusinessSettings }) {
  const hours = configuredHours(settings.hours)
  const dir = directionsUrl(settings)
  return (
    <SectionShell heading={section.heading ?? 'Visit the store'} body={section.body} tone="weave">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {settings.address && <p className="text-lg leading-relaxed text-walnut">{settings.address}</p>}
          {settings.location_code && <p className="mt-2 text-sm text-earth">Plus code: {settings.location_code}</p>}
          {dir && (
            <a href={dir} target="_blank" rel="noopener noreferrer" className="link mt-4 inline-block">
              {settings.directions_label || 'Get directions'}
            </a>
          )}
        </div>
        <div>
          <h3 className="text-2xl">Opening hours</h3>
          {hours.length > 0 ? (
            <ul className="mt-3 space-y-1 text-[15px]">
              {hours.map((h) => (
                <li key={h.day} className="flex max-w-xs justify-between gap-6">
                  <span>{h.day}</span>
                  <span>{h.closed ? 'Closed' : `${formatTime12(h.open)} to ${formatTime12(h.close)}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 max-w-[40ch] text-[15px] text-charcoal/85">
              {settings.hours_note || 'Please call to confirm opening hours.'}
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
    <SectionShell id="directions" heading={section.heading ?? settings.contact_heading} body={section.body ?? settings.contact_body}>
      <div className="flex flex-col gap-6">
        {tel && settings.phone && (
          <p className="font-serif text-4xl text-walnut">
            <a href={tel}>{settings.phone}</a>
          </p>
        )}
        <ContactActions />
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
        title={`${settings.name_en} | ${settings.tagline || 'Handloom & mattress store'}`}
        description={settings.short_description ?? undefined}
        path="/"
        image={mediaUrl(settings.hero_image_path)}
        jsonLd={localBusinessJsonLd(settings)}
      />
      <Hero settings={settings} />
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
