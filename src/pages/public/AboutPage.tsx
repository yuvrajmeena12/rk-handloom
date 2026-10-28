import { Seo } from '@/components/Seo'
import { ContactActions } from '@/components/ContactActions'
import { Picture } from '@/components/catalog/Picture'
import { useSettings } from '@/hooks/useSettings'
import { mediaUrl } from '@/lib/media'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  const { settings } = useSettings()
  if (!settings) return null
  const body = settings.about_body || settings.long_description || ''

  return (
    <div className="container-page py-12 md:py-16">
      <Seo
        title="About us"
        description={settings.short_description ?? undefined}
        path="/about"
        image={mediaUrl(settings.hero_image_path)}
      />
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div>
          <h1 className="text-5xl md:text-6xl">{settings.about_heading || `About ${settings.name_en}`}</h1>
          {settings.name_hi && (
            <p lang="hi" className="mt-3 font-serif text-2xl text-earth">
              {settings.name_hi}
            </p>
          )}
          <div className="selvedge my-8 max-w-[160px]" aria-hidden />
          <div className="prose-body">
            {body.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-10">
            <ContactActions />
            <p className="mt-6">
              <Link to="/catalog" className="link">
                Browse the catalogue
              </Link>
            </p>
          </div>
        </div>
        {settings.hero_image_path && (
          <div className="border border-sand self-start">
            <Picture path={settings.hero_image_path} alt={settings.name_en} width={1000} height={1250} />
            <div className="selvedge" aria-hidden />
          </div>
        )}
      </div>
    </div>
  )
}
