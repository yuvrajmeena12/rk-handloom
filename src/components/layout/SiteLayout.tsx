import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Menu, Phone, Search, X } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { listCategories } from '@/lib/api/public'
import { telHref, configuredHours } from '@/lib/contact'
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
      className="flex min-w-0 items-center gap-2 sm:gap-3"
      aria-label={`${name} home`}
    >
      {logo && (
        <img
          src={logo}
          alt=""
          className="h-8 w-auto shrink-0 sm:h-10"
          width={40}
          height={40}
        />
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-[18px] font-semibold tracking-[0.02em] text-walnut xs:text-[21px] sm:text-[26px]">
          {name}
        </span>
        {settings?.name_hi && (
          <span lang="hi" className="mt-0.5 block truncate text-[11px] text-earth sm:text-[13px]">
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
  const content = <span>{settings.announcement_text}</span>
  return (
    <div className="weave-dark text-center text-sm text-ivory">
      <div className="container-page py-2">
        {link ? (
          link.startsWith('/') ? (
            <Link to={link} className="underline underline-offset-4">
              {content}
            </Link>
          ) : (
            <a href={link} className="underline underline-offset-4">
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
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => listCategories(), staleTime: 5 * 60_000 })
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
        className="inline-flex items-center gap-1 py-2 text-[15px] text-walnut hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        Categories <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-30 mt-1 min-w-[220px] border border-sand bg-ivory py-2 shadow-md">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[15px] text-walnut hover:bg-sand/60 transition-colors"
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
          placeholder="Search products"
          className="input !min-h-[40px] pl-9"
          maxLength={80}
        />
      </div>
    </form>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `py-2 text-[15px] hover:text-accent ${isActive ? 'text-accent underline decoration-accent/50 underline-offset-8' : 'text-walnut'}`

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] items-center justify-between py-3 text-base text-walnut transition-colors hover:text-accent ${
    isActive ? 'font-semibold text-accent' : ''
  }`

function Header() {
  const { settings } = useSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const tel = telHref(settings?.phone)
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => listCategories(), staleTime: 5 * 60_000 })
  const [categoriesOpen, setCategoriesOpen] = useState(() => location.pathname.startsWith('/category/'))

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  // If viewing a category page, keep the categories accordion open in mobile nav
  useEffect(() => {
    if (location.pathname.startsWith('/category/')) {
      setCategoriesOpen(true)
    }
  }, [location.pathname])

  // Manage Escape key, body scroll locking, and breakpoint changes
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
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory/95 backdrop-blur-[2px]">
      <div className="container-page flex h-[72px] items-center justify-between gap-2 px-4 sm:gap-6 sm:px-8">
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
            Contact
          </NavLink>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <SearchBox id="desktop-search" className="w-52" />
          {tel && (
            <a href={tel} className="btn-primary btn-sm">
              <Phone className="h-4 w-4" aria-hidden />
              {settings?.call_label || 'Call us'}
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 lg:hidden">
          {tel && (
            <a
              href={tel}
              className="btn-quiet min-h-[44px] min-w-[44px] p-2 sm:px-3"
              aria-label={settings?.call_label || 'Call us'}
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
          )}
          <button
            type="button"
            className="btn-quiet min-h-[44px] min-w-[44px] p-2 sm:px-3"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <Menu className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden">
          {/* Backdrop overlay covering the page below header */}
          <div
            className="fixed inset-0 z-30 bg-charcoal/40 backdrop-blur-[1px]"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />

          {/* Clean dropdown panel attached directly beneath header */}
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="absolute left-0 right-0 top-full z-40 max-h-[calc(100dvh-73px)] overflow-y-auto border-b border-sand bg-ivory shadow-xl"
          >
            <div className="container-page px-4 py-5 sm:px-8">
              <SearchBox
                id="mobile-search"
                className="w-full"
                onDone={() => setMobileOpen(false)}
              />

              <nav aria-label="Mobile" className="mt-5 flex flex-col divide-y divide-sand/70">
                <NavLink
                  to="/"
                  end
                  className={mobileNavClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </NavLink>

                <NavLink
                  to="/catalog"
                  className={mobileNavClass}
                  onClick={() => setMobileOpen(false)}
                >
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
                        Categories
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

                <NavLink
                  to="/about"
                  className={mobileNavClass}
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </NavLink>

                <NavLink
                  to="/contact"
                  className={mobileNavClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Contact
                </NavLink>
              </nav>

              <div className="mt-6 border-t border-sand/70 pt-5">
                <ContactActions
                  show={['whatsapp', 'directions']}
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
  const hours = configuredHours(settings.hours)
  const social = Object.entries(settings.social ?? {}).filter(([, v]) => v)

  return (
    <footer className="mt-24 bg-walnut text-ivory">
      <div className="selvedge" aria-hidden />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-serif text-3xl text-ivory">{settings.name_en}</p>
          {settings.name_hi && (
            <p lang="hi" className="mt-1 text-sand">
              {settings.name_hi}
            </p>
          )}
          {settings.footer_text && <p className="mt-4 max-w-sm text-[15px] text-ivory/80">{settings.footer_text}</p>}
          {social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-4 text-sm">
              {social.map(([name, href]) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="capitalize underline underline-offset-4">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xl text-ivory">Explore</h2>
          <ul className="mt-3 space-y-2 text-[15px] text-ivory/85">
            <li><Link to="/catalog" className="hover:underline">Catalogue</Link></li>
            <li><Link to="/about" className="hover:underline">About us</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact and location</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl text-ivory">Visit or call</h2>
          <address className="mt-3 space-y-2 text-[15px] not-italic text-ivory/85">
            {settings.address && <p>{settings.address}</p>}
            {tel && settings.phone && (
              <p>
                <a href={tel} className="underline underline-offset-4">{settings.phone}</a>
              </p>
            )}
            {settings.email && (
              <p>
                <a href={`mailto:${settings.email}`} className="underline underline-offset-4">{settings.email}</a>
              </p>
            )}
          </address>
          {hours.length > 0 ? (
            <ul className="mt-3 text-sm text-ivory/80">
              {hours.map((h) => (
                <li key={h.day}>
                  {h.day}: {h.closed ? 'Closed' : `${formatTime12(h.open)} to ${formatTime12(h.close)}`}
                </li>
              ))}
            </ul>
          ) : (
            settings.hours_note && <p className="mt-3 text-sm text-ivory/80">{settings.hours_note}</p>
          )}
        </div>
      </div>
      <div className="border-t border-ivory/15">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-5 text-[13px] text-ivory/70">
          <p>© {new Date().getFullYear()} {settings.name_en}</p>
          <Link to="/admin" className="hover:underline">Owner login</Link>
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
    <div className="flex min-h-screen flex-col">
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
