import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Heart, Layers, MapPin, Sparkles } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { ContactActions } from '@/components/ContactActions'
import { Picture } from '@/components/catalog/Picture'
import { useSettings } from '@/hooks/useSettings'
import { directionsUrl } from '@/lib/contact'
import { mediaUrl } from '@/lib/media'
import { localBusinessJsonLd } from '@/lib/structuredData'

export default function AboutPage() {
  const { settings } = useSettings()
  if (!settings) return null
  const body = settings.about_body || settings.long_description || ''
  const dir = directionsUrl(settings)

  const heritagePillars = [
    {
      icon: Sparkles,
      title: 'Rajasthani Handloom Heritage',
      description:
        'We specialize in authentic handloom bedsheets, Jaipuri dohars, and traditional weaving techniques that bring breathable natural elegance into everyday living.',
    },
    {
      icon: Layers,
      title: 'Bespoke Custom Mattresses',
      description:
        'Every body requires distinct support. We tailor mattresses to your exact bed frame dimensions, required firmness levels, and durable natural core materials.',
    },
    {
      icon: Heart,
      title: 'The Beawar Showroom Experience',
      description:
        'Located on Sendra Road near Hera Hospital in Beawar, our physical showroom invites you to touch fabrics, feel the quality, and consult directly with our craft team.',
    },
  ]

  return (
    <div className="container-page py-10 md:py-16">
      <Seo
        title={`About Us | ${settings.name_en}`}
        description={
          settings.short_description ??
          `Learn about ${settings.name_en}, our Rajasthani handloom textile heritage, and bespoke custom mattresses on Sendra Road, Beawar.`
        }
        path="/about"
        image={mediaUrl(settings.hero_image_path)}
        jsonLd={localBusinessJsonLd(settings)}
      />

      {/* Hero Section */}
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-3 py-1 text-xs font-medium text-earth shadow-card-subtle mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Tradition · Quality · Comfort</span>
          </div>

          <h1 className="font-serif text-4xl font-medium leading-[1.1] text-walnut sm:text-5xl md:text-6xl">
            {settings.about_heading || `About ${settings.name_en}`}
          </h1>

          {settings.name_hi && (
            <p lang="hi" className="mt-3 font-serif text-2xl text-earth/90 sm:text-3xl">
              {settings.name_hi}
            </p>
          )}

          <div className="selvedge my-6 max-w-[160px]" aria-hidden />

          {body ? (
            <div className="prose-body space-y-4 text-base leading-relaxed text-charcoal/85 sm:text-lg">
              {body.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <div className="prose-body space-y-4 text-base leading-relaxed text-charcoal/85 sm:text-lg">
              <p>
                Welcome to <strong>{settings.name_en}</strong>, your trusted destination for authentic handloom textiles and bespoke mattresses in Beawar, Rajasthan.
              </p>
              <p>
                Rooted in the timeless textile traditions of Rajasthan, we curate pure cotton bedsheets, Jaipuri dohars, quilts, and premium home furnishings that embody lasting comfort and meticulous hand-finishing.
              </p>
              <p>
                Beyond textiles, we take immense pride in crafting tailored mattresses suited to non-standard cot sizes, individual ergonomic needs, and natural sleep preferences.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ContactActions size="md" />
            <Link to="/catalog" className="btn-secondary btn-sm shadow-sm">
              <span>Explore Catalogue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Visual Spread */}
        <div>
          <div className="relative overflow-hidden rounded-lg border border-sand bg-ivory shadow-luxury">
            {settings.hero_image_path ? (
              <Picture
                path={settings.hero_image_path}
                alt={`${settings.name_en} showroom in Beawar`}
                ratio="aspect-[4/5]"
                width={1000}
                height={1250}
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="weave-dark flex aspect-[4/5] flex-col items-center justify-center p-10 text-center text-ivory">
                <div className="selvedge absolute left-0 right-0 top-0" aria-hidden />
                {settings.name_hi && (
                  <p lang="hi" className="font-serif text-5xl text-sand mb-2">
                    {settings.name_hi}
                  </p>
                )}
                <p className="font-serif text-2xl tracking-widest text-ivory">{settings.name_en}</p>
                <p className="mt-4 max-w-xs text-sm text-ivory/80">
                  Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan
                </p>
              </div>
            )}
            <div className="selvedge" aria-hidden />
          </div>
        </div>
      </div>

      <div className="selvedge my-14" aria-hidden />

      {/* Three Heritage Pillars */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Our Foundations</span>
          <h2 className="mt-2 font-serif text-3xl font-medium text-walnut sm:text-4xl">What Defines Our Store</h2>
          <p className="mt-2 text-sm text-earth">Committed to honesty, genuine fabrics, and customer-first service.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {heritagePillars.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <div
                key={i}
                className="rounded-lg border border-sand bg-ivory p-6 shadow-card-subtle transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/30 text-accent mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-medium text-walnut">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{pillar.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Showroom Visit Callout */}
      <div className="mt-16 rounded-xl border border-sand bg-sand/20 p-8 shadow-card-subtle md:p-12">
        <div className="grid gap-8 items-center md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Physical Showroom</span>
            </div>
            <h2 className="mt-2 font-serif text-3xl font-medium text-walnut sm:text-4xl">
              Visit Us in Beawar, Rajasthan
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal/85">
              Experience the breathability of authentic handloom fabrics and test our custom mattress comfort in person. Our showroom is situated conveniently on Sendra Road, near Hera Hospital.
            </p>
            {settings.address && (
              <p className="mt-4 font-medium text-walnut">{settings.address}</p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {dir && (
              <a
                href={dir}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary shadow-sm"
              >
                <Compass className="h-4 w-4" />
                <span>Get Directions on Google Maps</span>
              </a>
            )}
            <Link to="/contact" className="btn-secondary shadow-sm">
              Showroom Hours & Contact Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
