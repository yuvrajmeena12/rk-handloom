import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ExternalLink,
  FolderTree,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Store,
  X,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/homepage', label: 'Homepage', icon: Home },
  { to: '/admin/business-settings', label: 'Business details', icon: Store },
  { to: '/admin/appearance', label: 'Appearance', icon: Palette },
  { to: '/admin/media', label: 'Media library', icon: ImageIcon },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Owner area" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-[44px] items-center gap-3 px-3 text-[15px] transition-colors',
              isActive ? 'bg-walnut text-ivory' : 'text-walnut hover:bg-sand/70',
            )
          }
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  const { email, signOut } = useAuth()
  return (
    <div className="mt-8 space-y-2 border-t border-sand pt-4">
      {email && <p className="truncate px-3 text-xs text-earth">{email}</p>}
      <Link
        to="/"
        target="_blank"
        className="flex min-h-[44px] items-center gap-3 px-3 text-[15px] text-walnut hover:bg-sand/70"
      >
        <ExternalLink className="h-[18px] w-[18px]" aria-hidden /> View public site
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex min-h-[44px] w-full items-center gap-3 px-3 text-left text-[15px] text-walnut hover:bg-sand/70"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden /> Sign out
      </button>
    </div>
  )
}

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[250px_1fr]">
      <Seo title="Owner area" noindex />
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-walnut focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-sand bg-ivory p-4 lg:flex">
        <Link to="/admin" className="mb-6 block px-3 pt-2">
          <span className="block font-serif text-2xl font-semibold text-walnut">RK HANDLOOM</span>
          <span className="text-xs text-earth">Owner area</span>
        </Link>
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile top bar and drawer */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sand bg-ivory px-4 lg:hidden">
        <Link to="/admin" className="font-serif text-xl font-semibold text-walnut">
          RK HANDLOOM <span className="text-sm font-normal text-earth">Owner</span>
        </Link>
        <button type="button" className="btn-quiet" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Owner menu" className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-charcoal/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[min(86vw,320px)] flex-col overflow-y-auto bg-ivory p-4">
            <div className="mb-4 flex items-center justify-between px-3">
              <span className="font-serif text-2xl text-walnut">Menu</span>
              <button type="button" className="btn-quiet" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </div>
      )}

      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
