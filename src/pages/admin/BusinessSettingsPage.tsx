import { ErrorState, Spinner } from '@/components/ui/states'
import { Field, FormSection, PageHeader, SubmitBar, Toggle } from '@/components/admin/ui'
import { useSettingsForm } from '@/components/admin/useSettingsForm'
import { formatTime12 } from '@/lib/utils'

export default function BusinessSettingsPage() {
  const { form, query, save, onSubmit, guard, isDirty } = useSettingsForm([
    'name_en', 'name_hi', 'tagline', 'short_description', 'long_description', 'phone', 'whatsapp_number',
    'email', 'address', 'location_code', 'maps_url', 'hours', 'hours_note', 'social',
    'about_heading', 'about_body', 'contact_heading', 'contact_body',
  ])
  const { register, watch, setValue, formState: { errors } } = form

  if (query.isLoading) return <Spinner />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const hours = watch('hours') ?? []

  return (
    <>
      {guard.dialog}
      <PageHeader title="Business details" description="Your name, contact details, address and opening hours. These appear across the whole website." />
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <FormSection title="Name and description">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Business name (English)" htmlFor="name_en" required error={errors.name_en?.message}>
              <input id="name_en" className="input" {...register('name_en')} />
            </Field>
            <Field label="Business name (Hindi)" htmlFor="name_hi" error={errors.name_hi?.message}>
              <input id="name_hi" lang="hi" className="input" {...register('name_hi')} />
            </Field>
          </div>
          <Field label="Tagline" htmlFor="tagline" error={errors.tagline?.message} hint="Shown in the browser tab title for the homepage.">
            <input id="tagline" className="input" {...register('tagline')} />
          </Field>
          <Field label="Short description" htmlFor="short_description" error={errors.short_description?.message} hint="Used for search engine and sharing previews. Up to 300 characters.">
            <textarea id="short_description" rows={2} className="input" {...register('short_description')} />
          </Field>
          <Field label="Long description" htmlFor="long_description" error={errors.long_description?.message} hint="Used on the About page when no About text is set.">
            <textarea id="long_description" rows={4} className="input" {...register('long_description')} />
          </Field>
        </FormSection>

        <FormSection title="Contact">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Phone number" htmlFor="phone" error={errors.phone?.message} hint="Used for Call buttons.">
              <input id="phone" type="tel" className="input" {...register('phone')} />
            </Field>
            <Field label="WhatsApp number" htmlFor="whatsapp_number" error={errors.whatsapp_number?.message} hint="Include the country code, e.g. +91 98291 08112.">
              <input id="whatsapp_number" type="tel" className="input" {...register('whatsapp_number')} />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" error={errors.email?.message} hint="Optional.">
            <input id="email" type="email" className="input" {...register('email')} />
          </Field>
        </FormSection>

        <FormSection title="Address and directions">
          <Field label="Full address" htmlFor="address" error={errors.address?.message}>
            <textarea id="address" rows={2} className="input" {...register('address')} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Plus code" htmlFor="location_code" error={errors.location_code?.message} hint="e.g. 38X4+JR Beawar, Rajasthan">
              <input id="location_code" className="input" {...register('location_code')} />
            </Field>
            <Field label="Google Maps link" htmlFor="maps_url" error={errors.maps_url?.message} hint="Optional. If empty, directions are built from the address.">
              <input id="maps_url" type="url" className="input" placeholder="https://maps.app.goo.gl/..." {...register('maps_url')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Opening hours" description="Leave a day empty if you are not sure. Empty days are not shown to visitors. Use 24-hour time, for example 09:00 and 20:00.">
          <ul className="space-y-3">
            {hours.map((h, i) => (
              <li key={h.day} className="grid items-start gap-3 md:grid-cols-[130px_1fr_1fr_auto]">
                <p className="pt-3 text-[15px] font-medium text-walnut">{h.day}</p>
                <Field label={`${h.day} opens`} htmlFor={`h-open-${i}`} error={errors.hours?.[i]?.open?.message}>
                  <input id={`h-open-${i}`} type="time" className="input" disabled={h.closed} {...register(`hours.${i}.open`)} />
                </Field>
                <Field label={`${h.day} closes`} htmlFor={`h-close-${i}`} error={errors.hours?.[i]?.close?.message}>
                  <input id={`h-close-${i}`} type="time" className="input" disabled={h.closed} {...register(`hours.${i}.close`)} />
                </Field>
                <div className="pt-3">
                  <Toggle id={`h-closed-${i}`} label="Closed" checked={h.closed} onChange={(v) => setValue(`hours.${i}.closed`, v, { shouldDirty: true })} />
                </div>
                {!h.closed && h.open && h.close && (
                  <p className="text-xs text-earth md:col-start-2 md:col-span-3">Shown as {formatTime12(h.open)} to {formatTime12(h.close)}</p>
                )}
              </li>
            ))}
          </ul>
          <Field label="Hours note" htmlFor="hours_note" error={errors.hours_note?.message} hint="Shown instead of hours when none are set, or under them when they are.">
            <input id="hours_note" className="input" {...register('hours_note')} />
          </Field>
        </FormSection>

        <FormSection title="Social links" description="Optional. Each link must start with https://">
          <div className="grid gap-5 md:grid-cols-2">
            {(['facebook', 'instagram', 'youtube', 'website'] as const).map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)} htmlFor={`social-${k}`} error={errors.social?.[k]?.message}>
                <input id={`social-${k}`} type="url" className="input" {...register(`social.${k}`)} />
              </Field>
            ))}
          </div>
        </FormSection>

        <FormSection title="About and contact pages">
          <Field label="About page heading" htmlFor="about_heading" error={errors.about_heading?.message}>
            <input id="about_heading" className="input" {...register('about_heading')} />
          </Field>
          <Field label="About page text" htmlFor="about_body" error={errors.about_body?.message} hint="Leave a blank line between paragraphs. Only include facts you are happy to stand behind.">
            <textarea id="about_body" rows={7} className="input" {...register('about_body')} />
          </Field>
          <Field label="Contact page heading" htmlFor="contact_heading" error={errors.contact_heading?.message}>
            <input id="contact_heading" className="input" {...register('contact_heading')} />
          </Field>
          <Field label="Contact page text" htmlFor="contact_body" error={errors.contact_body?.message}>
            <textarea id="contact_body" rows={2} className="input" {...register('contact_body')} />
          </Field>
        </FormSection>

        <SubmitBar busy={save.isPending} dirty={isDirty} />
      </form>
    </>
  )
}
