import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { useSettings } from '@/hooks/useSettings'

function LegalShell({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-12 md:py-16">
      <Seo title={`${title} | RK HANDLOOM`} path={path} description={`${title} policy for RK HANDLOOM website.`} />
      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl font-medium text-walnut sm:text-5xl md:text-6xl">{title}</h1>
        <div className="selvedge my-6 max-w-[160px]" aria-hidden />
      </header>
      <div className="prose-body max-w-3xl space-y-6 text-base leading-relaxed text-charcoal/85 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-walnut [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5">
        {children}
      </div>
    </div>
  )
}

export function PrivacyPage() {
  const { settings } = useSettings()
  const name = settings?.name_en ?? 'RK HANDLOOM'
  return (
    <LegalShell title="Privacy Policy" path="/privacy">
      <p>
        This website serves as an informational digital catalogue and showroom guide for <strong>{name}</strong>. You can browse all collections without creating a customer account, and the website does not solicit sensitive financial details.
      </p>
      <h2>What happens when you browse</h2>
      <ul>
        <li>
          The site is hosted on modern infrastructure (Vercel), which may record technical request information such as your IP address, browser type, and requested resource URLs as part of normal web service operations.
        </li>
        <li>
          Typography and fonts are loaded from Google Fonts over HTTPS.
        </li>
        <li>Catalogue data and product imagery are securely stored and delivered via Supabase.</li>
        <li>
          When you click Call, WhatsApp, or Get Directions, your browser transitions to your device&apos;s native dialer, the WhatsApp application, or Google Maps. Any interactions within those third-party services are subject to their respective terms and privacy policies.
        </li>
      </ul>
      <h2>Enquiries & Direct Messages</h2>
      <p>
        When you telephone or send a WhatsApp message to {name}, we receive your contact number and query solely to answer your questions, advise on textile availability, or confirm bespoke mattress specifications. We do not sell or market your contact information to external entities.
      </p>
      <h2>Owner Sign-In Area</h2>
      <p>
        The administrative dashboard at <code>/admin</code> is strictly reserved for store owners and uses secure session storage. Standard visitors to the public catalogue do not utilize or require authentication.
      </p>
      <h2>Questions & Assistance</h2>
      <p>
        If you have questions regarding this privacy notice, please reach us via our{' '}
        <Link to="/contact" className="font-medium text-accent underline underline-offset-4">
          Contact page
        </Link>.
      </p>
    </LegalShell>
  )
}

export function TermsPage() {
  const { settings } = useSettings()
  const name = settings?.name_en ?? 'RK HANDLOOM'
  return (
    <LegalShell title="Terms of Service" path="/terms">
      <p>By accessing or browsing this website, you acknowledge and agree to these simple terms.</p>
      <h2>Showroom Catalogue Information</h2>
      <p>
        This website showcases handloom textile products, bedsheets, dohars, and custom mattresses offered by {name}. Photographs, colors, fabric weaves, dimensions, and prices are provided as an authentic guide and may reflect subtle artisanal variations in person. Listed prices and stock levels may vary; we invite you to call or message our showroom directly to confirm real-time availability.
      </p>
      <h2>Showroom Orders & Enquiries</h2>
      <p>
        This website functions as a showroom catalogue rather than an automated transaction gateway. Purchases, tailor-made sizing, and delivery logistics are arranged directly with {name} via phone, WhatsApp, or in person at our Beawar showroom.
      </p>
      <h2>Intellectual Property & Heritage Materials</h2>
      <p>
        All textual content, branding, photographs, and media displayed on this website are the property of {name} or used with permission. Unauthorised commercial duplication is prohibited.
      </p>
      <h2>Revisions</h2>
      <p>We may update catalogue details, showroom policies, or these terms periodically.</p>
    </LegalShell>
  )
}
