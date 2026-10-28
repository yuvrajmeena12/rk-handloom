import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'

export default function NotFoundPage({ message = 'This page does not exist or has moved.' }: { message?: string }) {
  return (
    <div className="container-page py-24 text-center">
      <Seo title="Page not found" noindex />
      <div className="selvedge mx-auto mb-8 max-w-[120px]" aria-hidden />
      <h1 className="text-5xl md:text-6xl">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md text-[17px] text-charcoal/80">{message}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/" className="btn-primary">
          Go to the homepage
        </Link>
        <Link to="/catalog" className="btn-secondary">
          Browse the catalogue
        </Link>
      </div>
    </div>
  )
}
