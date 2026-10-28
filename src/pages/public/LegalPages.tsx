import { Seo } from '@/components/Seo'
import { useSettings } from '@/hooks/useSettings'
import { Link } from 'react-router-dom'

function LegalShell({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-12 md:py-16">
      <Seo title={title} path={path} description={`${title} for this website.`} />
      <h1 className="text-5xl md:text-6xl">{title}</h1>
      <div className="selvedge my-8 max-w-[160px]" aria-hidden />
      <div className="prose-body space-y-6 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-3xl [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5">
        {children}
      </div>
    </div>
  )
}

export function PrivacyPage() {
  const { settings } = useSettings()
  const name = settings?.name_en ?? 'RK HANDLOOM'
  return (
    <LegalShell title="Privacy" path="/privacy">
      <p>
        This website is a product catalogue for {name}. You can browse it without creating an account, and it does not
        ask you to submit personal details through a form.
      </p>
      <h2>What happens when you use the site</h2>
      <ul>
        <li>
          The site is hosted by third-party providers, which may record technical information such as your IP address,
          browser type and the pages requested, as part of normal server logs.
        </li>
        <li>
          Page fonts are loaded from Google Fonts, which means your browser contacts Google when a page loads.
        </li>
        <li>Catalogue data and images are served from our database and storage provider (Supabase).</li>
        <li>
          If you tap Call, WhatsApp or Get directions, your phone or browser hands over to that app or service
          (your phone dialler, WhatsApp, Google Maps). What you share there is covered by their own policies.
        </li>
      </ul>
      <h2>Messages you send us</h2>
      <p>
        If you call or message {name} on WhatsApp, we receive the number you contact us from and anything you tell us,
        and we use it to answer your enquiry.
      </p>
      <h2>Owner sign-in</h2>
      <p>
        The owner area uses a sign-in that stores a session in the browser of the person signed in. Visitors to the
        public catalogue do not use it.
      </p>
      <h2>Questions</h2>
      <p>
        For questions about this page, please <Link to="/contact" className="link">contact us</Link>.
      </p>
    </LegalShell>
  )
}

export function TermsPage() {
  const { settings } = useSettings()
  const name = settings?.name_en ?? 'RK HANDLOOM'
  return (
    <LegalShell title="Terms" path="/terms">
      <p>By using this website you agree to these simple terms.</p>
      <h2>Catalogue information</h2>
      <p>
        This site shows products offered by {name}. Photos, colours, sizes, materials and prices are provided as a
        guide and can differ in the store. Prices shown may change, and a product listed here may not be in stock.
        Please call or message us to confirm details before you visit or buy.
      </p>
      <h2>No online ordering</h2>
      <p>
        You cannot buy or pay on this website. To purchase, visit the store or contact {name} directly.
      </p>
      <h2>Content</h2>
      <p>
        The text and images on this site belong to {name} or are used with permission. Please do not copy them for
        commercial use without asking us first.
      </p>
      <h2>Changes</h2>
      <p>We may update the catalogue and these terms from time to time.</p>
    </LegalShell>
  )
}
