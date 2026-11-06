import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  Clock,
  Compass,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { listCategories } from '@/lib/api/public'
import { telHref, whatsappHref, directionsUrl, configuredHours } from '@/lib/contact'
import { mediaUrl } from '@/lib/media'
import { formatTime12, isSafeLink } from '@/lib/utils'
import { ContactActions } from '@/components/ContactActions'
import { ErrorState, Spinner } from '@/components/ui/states'

function Wordmark({ onNavigate }: { onNavigate?: () => void }) {
  const { settings } = useSettings()
  const logo = mediaUrl(settings?.logo_path)
  const name = settings?.name_en ?? 'RK HANDLOOM'
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className="group flex min-w-0 items-center gap-2.5 sm:gap-3.5"
      aria-label={`${name} home`}
    >
      {logo && (
        <img
          src={logo}
          alt=""
          className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-11"
          width={44}
          height={44}
          loading="eager"
          decoding="async"
        />
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-[19px] font-semibold tracking-wide text-walnut transition-colors group-hover:text-accent xs:text-[22px] sm:text-[26px]">
          {name}
        </span>
        {settings?.name_hi && (
          <span lang="hi" className="mt-0.5 block truncate text-[11px] font-medium text-earth/90 sm:text-[13px]">
            {settings.name_hi}
          </span>
        )}
      </span>
    </Link>
  )
}

function Announcement() {
  const { settings } = useSettings()
  if (!settings?.announcement_enabled || !settings.announcement_text) return null
  const link = isSafeLink(settings.announcement_link) ? settings.announcement_link : null
  const content = (
    <span className="inline-flex items-center gap-2">
      <Sparkles className="h-3.5 w-3.5 text-sand animate-pulse" aria-hidden />
      <span>{settings.announcement_text}</span>
    </span>
  )
  return (
    <div className="border-b border-walnut/20 bg-walnut text-center text-xs font-medium tracking-wide text-ivory/95 sm:text-sm">
      <div className="container-page py-2">
        {link ? (
          link.startsWith('/') ? (
            <Link to={link} className="underline decoration-sand/60 underline-offset-4 hover:text-sand transition-colors">
              {content}
            </Link>
          ) : (
            <a href={link} className="underline decoration-sand/60 underline-offset-4 hover:text-sand transition-colors">
              {content}
            </a>
          )
        ) : (
          content
        )}
      </div>
    </div>
  )
}

function CategoriesMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  })
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (categories.length === 0) return null
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 py-2 text-[15px] font-medium text-walnut transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Collections</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180 text-accent' : 'text-earth'}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-30 mt-2 min-w-[240px] rounded-md border border-sand bg-ivory/95 p-1.5 shadow-luxury backdrop-blur-md animate-fade-in">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded px-3 py-2 text-[14px] font-medium text-walnut transition-colors hover:bg-sand/50 hover:text-accent"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchBox({
  id = 'site-search',
  onDone,
  className,
}: {
  id?: string
  onDone?: () => void
  className?: string
}) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/catalog?q=${encodeURIComponent(term)}` : '/catalog')
    setQ('')
    onDone?.()
  }
  return (
    <form onSubmit={submit} role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth" aria-hidden />
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search textiles, mattresses..."
          className="input !min-h-[40px] pl-9 text-sm focus:border-accent"
          maxLength={80}
        />
      </div>
    </form>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative py-2 text-[15px] font-medium transition-colors hover:text-accent ${
    isActive ? 'text-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full' : 'text-walnut/90'
  }`

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] items-center justify-between py-3 text-base text-walnut transition-colors hover:text-accent ${
    isActive ? 'font-semibold text-accent' : ''
  }`

function Header() {
  const { settings } = useSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const tel = telHref(settings?.phone)
  const wa = settings?.whatsapp_number ? whatsappHref(settings.whatsapp_number, 'Hello RK HANDLOOM, I would like to enquire about your products.') : null
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  })
  const [categoriesOpen, setCategoriesOpen] = useState(() => location.pathname.startsWith('/category/'))

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (location.pathname.startsWith('/category/')) {
      setCategoriesOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const onBreakpointChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileOpen(false)
      }
    }

    document.addEventListener('keydown', onKey)
    mediaQuery.addEventListener('change', onBreakpointChange)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', onKey)
      mediaQuery.removeEventListener('change', onBreakpointChange)
    }
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-ivory/95 backdrop-blur-md transition-all">
      <div className="container-page flex h-[72px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-8">
        <Wordmark onNavigate={() => setMobileOpen(false)} />
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/catalog" className={navClass}>
            Catalogue
          </NavLink>
          <CategoriesMenu />
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navClass}>
            Contact & Showroom
          </NavLink>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <SearchBox id="desktop-search" className="w-56" />
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp btn-sm shadow-sm"
              aria-label="Enquire on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              <span>WhatsApp</span>
            </a>
          )}
          {tel && (
            <a href={tel} className="btn-secondary btn-sm shadow-sm" aria-label="Call showroom">
              <Phone className="h-4 w-4" aria-hidden />
              <span>{settings?.call_label || 'Call us'}</span>
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-quiet min-h-[44px] min-w-[44px] p-2 text-emerald-700"
              aria-label="WhatsApp enquiry"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
            </a>
          )}
          {tel && (
            <a
              href={tel}
              className="btn-quiet min-h-[44px] min-w-[44px] p-2"
              aria-label={settings?.call_label || 'Call us'}
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
          )}
          <button
            type="button"
            className="btn-quiet min-h-[44px] min-w-[44px] p-2"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-30 bg-charcoal/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />

          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="absolute left-0 right-0 top-full z-40 max-h-[calc(100dvh-73px)] overflow-y-auto border-b border-sand bg-ivory shadow-2xl animate-fade-in"
          >
            <div className="container-page px-4 py-5 sm:px-8">
              <SearchBox
                id="mobile-search"
                className="w-full"
                onDone={() => setMobileOpen(false)}
              />

              <nav aria-label="Mobile" className="mt-5 flex flex-col divide-y divide-sand/70">
                <NavLink to="/" end className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                  Home
                </NavLink>

                <NavLink to="/catalog" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                  Catalogue
                </NavLink>

                {categories.length > 0 && (
                  <div>
                    <button
                      type="button"
                      className="flex min-h-[44px] w-full items-center justify-between py-3 text-base text-walnut transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      aria-expanded={categoriesOpen}
                      aria-controls="mobile-categories-list"
                      onClick={() => setCategoriesOpen((v) => !v)}
                    >
                      <span className={location.pathname.startsWith('/category/') ? 'font-semibold text-accent' : ''}>
                        Collections
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-earth transition-transform duration-200 ${
                          categoriesOpen ? 'rotate-180 text-accent' : ''
                        }`}
                        aria-hidden
                      />
                    </button>
                    {categoriesOpen && (
                      <ul id="mobile-categories-list" className="mb-2 ml-2 space-y-0.5 border-l-2 border-sand pl-3">
                        {categories.map((c) => (
                          <li key={c.id}>
                            <NavLink
                              to={`/category/${c.slug}`}
                              className={({ isActive }) =>
                                `flex min-h-[40px] items-center py-2 text-[15px] transition-colors hover:text-accent ${
                                  isActive ? 'font-medium text-accent' : 'text-walnut/85'
                                }`
                              }
                              onClick={() => setMobileOpen(false)}
                            >
                              {c.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <NavLink to="/about" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                  About
                </NavLink>

                <NavLink to="/contact" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                  Contact & Showroom
                </NavLink>
              </nav>

              <div className="mt-6 border-t border-sand/70 pt-5">
                <ContactActions
                  show={['whatsapp', 'call', 'directions']}
                  onAction={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const { settings } = useSettings()
  if (!settings) return null
  const tel = telHref(settings.phone)
  const dir = directionsUrl(settings)
  const hours = configuredHours(settings.hours)
  const social = Object.entries(settings.social ?? {}).filter(([, v]) => v)

  return (
    <footer className="mt-24 border-t border-walnut/20 bg-walnut text-ivory">
      <div className="selvedge" aria-hidden />
      <div className="container-page py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Identity */}
          <div>
            <p className="font-serif text-2xl font-semibold tracking-wide text-ivory">{settings.name_en}</p>
            {settings.name_hi && (
              <p lang="hi" className="mt-1 font-medium text-sand/90">
                {settings.name_hi}
              </p>
            )}
            <p className="mt-3 text-[14px] leading-relaxed text-ivory/80">
              {settings.footer_text ||
                'Authentic handloom textiles, bedsheets, dohars, and bespoke custom mattresses. Serving Beawar, Ajmer, and Rajasthan with heritage craftsmanship.'}
            </p>
            {social.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3 text-sm">
                {social.map(([name, href]) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="capitalize text-sand hover:underline underline-offset-4 transition-colors"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Column 2: Collections & Catalogue */}
          <div>
            <h2 className="font-serif text-lg font-semibold tracking-wide text-ivory">Collections</h2>
            <ul className="mt-4 space-y-2.5 text-[14px] text-ivory/80">
              <li>
                <Link to="/catalog" className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                  About Our Craft
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                  Showroom & Store Visit
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Showroom & Visit */}
          <div>
            <h2 className="font-serif text-lg font-semibold tracking-wide text-ivory">Visit Showroom</h2>
            <address className="mt-4 space-y-2.5 text-[14px] not-italic text-ivory/80">
              {settings.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden />
                  <span>{settings.address}</span>
                </div>
              )}
              {dir && (
                <p className="pl-6">
                  <a
                    href={dir}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-sand hover:underline underline-offset-4"
                  >
                    <Compass className="h-3.5 w-3.5" aria-hidden />
                    <span>Get Directions on Google Maps</span>
                  </a>
                </p>
              )}
              {tel && settings.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-sand" aria-hidden />
                  <a href={tel} className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                    {settings.phone}
                  </a>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-sand" aria-hidden />
                  <a href={`mailto:${settings.email}`} className="hover:text-sand hover:underline underline-offset-4 transition-colors">
                    {settings.email}
                  </a>
                </div>
              )}
            </address>
            {hours.length > 0 ? (
              <div className="mt-4 border-t border-ivory/15 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sand">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  <span>Showroom Hours</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-ivory/75">
                  {hours.map((h) => (
                    <li key={h.day}>
                      {h.day}: {h.closed ? 'Closed' : `${formatTime12(h.open)} – ${formatTime12(h.close)}`}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              settings.hours_note && <p className="mt-3 text-xs text-ivory/70">{settings.hours_note}</p>
            )}
          </div>

          {/* Column 4: Heritage & Craftsmanship Guarantees */}
          <div>
            <h2 className="font-serif text-lg font-semibold tracking-wide text-ivory">Our Promise</h2>
            <ul className="mt-4 space-y-3 text-[14px] text-ivory/80">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden />
                <span>
                  <strong className="font-medium text-ivory">100% Authentic Handlooms</strong>
                  <br />
                  Traditional weaving techniques, premium pure cottons & linens.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden />
                <span>
                  <strong className="font-medium text-ivory">Custom Tailored Mattresses</strong>
                  <br />
                  Bespoke sizing, firmness, and natural filling crafted to your order.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden />
                <span>
                  <strong className="font-medium text-ivory">Direct Showroom Service</strong>
                  <br />
                  Personal guidance via WhatsApp and phone for custom requirements.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-ivory/15 bg-walnut/90">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-[13px] text-ivory/70">
          <p>© {new Date().getFullYear()} {settings.name_en}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-sand hover:underline">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-sand hover:underline">Terms</Link>
            <span>·</span>
            <Link to="/admin" className="hover:text-sand hover:underline">Owner Login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])
  return null
}

export function SiteLayout() {
  const { isLoading, isError, retry, settings } = useSettings()

  return (
    <div className="flex min-h-screen flex-col bg-linen text-charcoal antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-walnut focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Announcement />
      <Header />
      <main id="main" className="flex-1">
        {isLoading ? (
          <Spinner label="Loading RK HANDLOOM" />
        ) : isError || !settings ? (
          <div className="container-page py-20">
            <ErrorState onRetry={retry} />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  )
}
