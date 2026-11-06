import { Link } from 'react-router-dom'
import { Compass, Home, MessageCircle } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { useSettings } from '@/hooks/useSettings'
import { whatsappHref } from '@/lib/contact'

export default function NotFoundPage({
  message = 'The page or collection you are looking for does not exist, has been renamed, or was moved.',
}: {
  message?: string
}) {
  const { settings } = useSettings()
  const wa = settings?.whatsapp_number
    ? whatsappHref(settings.whatsapp_number, 'Hello RK HANDLOOM, I could not find a page on your website and would like assistance.')
    : null

  return (
    <div className="container-page py-20 text-center md:py-28">
      <Seo title="Page Not Found | RK HANDLOOM" noindex />
      <div className="selvedge mx-auto mb-8 max-w-[120px]" aria-hidden />

      <p className="font-mono text-xs uppercase tracking-widest text-accent">Error 404</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-walnut sm:text-5xl md:text-6xl">
        Textile or Page Not Found
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-charcoal/80 sm:text-lg">
        {message}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary shadow-sm">
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
        <Link to="/catalog" className="btn-secondary shadow-sm">
          <Compass className="h-4 w-4" />
          <span>Browse Catalogue</span>
        </Link>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Ask us on WhatsApp</span>
          </a>
        )}
      </div>

      <div className="mt-12 text-xs text-earth">
        <p>Looking for something specific? Call our Beawar showroom: <a href="tel:+919829108112" className="underline font-medium text-walnut">+91 98291 08112</a></p>
      </div>
    </div>
  )
}
