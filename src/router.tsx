import { createBrowserRouter, Link, Navigate, useLocation, useRouteError } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { Spinner } from '@/components/ui/states'
import { useAuth } from '@/lib/auth'
import HomePage from '@/pages/public/HomePage'
import NotFoundPage from '@/pages/public/NotFoundPage'

const page = (loader: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: async () => ({ Component: (await loader()).default }),
})

function RouteError() {
  const error = useRouteError() as { message?: string } | null
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-charcoal/80">
        The page could not be shown. {error?.message ? `(${error.message})` : ''}
      </p>
      <p className="mt-6">
        <Link to="/" className="btn-primary">Go to the homepage</Link>
      </p>
    </div>
  )
}

/** Only the owner reaches the admin area; everyone else is sent to sign in or told they have no access. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, signOut, email } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Checking your sign-in" />
  if (status === 'signed_out') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (status === 'not_admin') {
    return (
      <div className="container-page flex min-h-screen max-w-xl flex-col justify-center py-16 text-center">
        <h1 className="text-4xl">No access to the owner area</h1>
        <p className="mt-3 text-charcoal/85">
          {email ? `${email} is signed in, but this account is not set up as the owner.` : 'This account is not set up as the owner.'}{' '}
          Sign in with the owner account instead.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => void signOut()}>
            Sign out
          </button>
          <Link to="/" className="btn-secondary">Back to the site</Link>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', ...page(() => import('@/pages/public/CatalogPage')) },
      { path: 'category/:slug', ...page(() => import('@/pages/public/CategoryPage')) },
      { path: 'product/:slug', ...page(() => import('@/pages/public/ProductPage')) },
      { path: 'about', ...page(() => import('@/pages/public/AboutPage')) },
      { path: 'contact', ...page(() => import('@/pages/public/ContactPage')) },
      {
        path: 'privacy',
        lazy: async () => ({ Component: (await import('@/pages/public/LegalPages')).PrivacyPage }),
      },
      {
        path: 'terms',
        lazy: async () => ({ Component: (await import('@/pages/public/LegalPages')).TermsPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: 'admin/login', errorElement: <RouteError />, ...page(() => import('@/pages/admin/LoginPage')) },
  {
    path: 'admin/reset-password',
    errorElement: <RouteError />,
    ...page(() => import('@/pages/admin/ResetPasswordPage')),
  },
  {
    path: 'admin',
    errorElement: <RouteError />,
    lazy: async () => {
      const { AdminLayout } = await import('@/components/admin/AdminLayout')
      return {
        Component: () => (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
      }
    },
    children: [
      { index: true, ...page(() => import('@/pages/admin/DashboardPage')) },
      { path: 'products', ...page(() => import('@/pages/admin/ProductsPage')) },
      { path: 'products/new', ...page(() => import('@/pages/admin/ProductEditPage')) },
      { path: 'products/:id/edit', ...page(() => import('@/pages/admin/ProductEditPage')) },
      { path: 'categories', ...page(() => import('@/pages/admin/CategoriesPage')) },
      { path: 'homepage', ...page(() => import('@/pages/admin/HomepageAdminPage')) },
      { path: 'business-settings', ...page(() => import('@/pages/admin/BusinessSettingsPage')) },
      { path: 'appearance', ...page(() => import('@/pages/admin/AppearancePage')) },
      { path: 'media', ...page(() => import('@/pages/admin/MediaPage')) },
    ],
  },
])
