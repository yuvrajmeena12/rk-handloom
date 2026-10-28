import { useQueryClient } from '@tanstack/react-query'
import { ErrorState, Spinner } from '@/components/ui/states'
import { Field, FormSection, PageHeader, SubmitBar, Toggle } from '@/components/admin/ui'
import { SingleImageField } from '@/components/admin/SingleImageField'
import { useSettingsForm } from '@/components/admin/useSettingsForm'
import { setSettingsImage } from '@/lib/api/admin'
import { settingsKey } from '@/hooks/useSettings'
import type { AccentTheme } from '@/lib/types'

const THEMES: Array<{ value: AccentTheme; name: string; swatch: string; note: string }> = [
  { value: 'olive', name: 'Olive', swatch: 'rgb(91 99 71)', note: 'Soft green, the default' },
  { value: 'earth', name: 'Earth', swatch: 'rgb(111 84 56)', note: 'Warm brown' },
  { value: 'walnut', name: 'Walnut', swatch: 'rgb(73 56 46)', note: 'Deep, dark brown' },
]

export default function AppearancePage() {
  const qc = useQueryClient()
  const { form, query, save, onSubmit, guard, isDirty } = useSettingsForm([
    'accent_theme', 'call_label', 'whatsapp_label', 'directions_label', 'catalogue_page_size',
    'show_prices', 'show_sku', 'announcement_enabled', 'announcement_text', 'announcement_link', 'footer_text',
  ])
  const { register, watch, setValue, formState: { errors } } = form

  if (query.isLoading) return <Spinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />
  const settings = query.data

  const afterImage = async () => {
    await qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
    await qc.invalidateQueries({ queryKey: settingsKey })
  }

  return (
    <>
      {guard.dialog}
      <PageHeader title="Appearance" description="Logo, colour, button labels and what the catalogue shows. The overall design stays consistent." />

      <div className="mb-8">
        <FormSection title="Logo" description="Shown beside your name in the header. A square or wide image on a plain background works best.">
          <SingleImageField
            id="logo-image"
            label="Logo"
            path={settings.logo_path}
            ratio="aspect-[3/1]"
            onChange={async (file) => {
              await setSettingsImage('logo_path', file)
              await afterImage()
            }}
          />
        </FormSection>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <FormSection title="Accent colour" description="Used for buttons and links. All options keep text easy to read.">
          <fieldset>
            <legend className="sr-only">Accent colour</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {THEMES.map((t) => (
                <label key={t.value} className={`flex cursor-pointer items-center gap-3 border p-3 ${watch('accent_theme') === t.value ? 'border-walnut bg-sand/50' : 'border-sand'}`}>
                  <input type="radio" value={t.value} className="sr-only" {...register('accent_theme')} />
                  <span className="h-9 w-9 shrink-0 border border-charcoal/20" style={{ background: t.swatch }} aria-hidden />
                  <span>
                    <span className="block font-medium text-walnut">{t.name}</span>
                    <span className="block text-xs text-earth">{t.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </FormSection>

        <FormSection title="Button labels">
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Call button" htmlFor="call_label" error={errors.call_label?.message}>
              <input id="call_label" className="input" placeholder="Call us" {...register('call_label')} />
            </Field>
            <Field label="WhatsApp button" htmlFor="whatsapp_label" error={errors.whatsapp_label?.message}>
              <input id="whatsapp_label" className="input" placeholder="WhatsApp" {...register('whatsapp_label')} />
            </Field>
            <Field label="Directions button" htmlFor="directions_label" error={errors.directions_label?.message}>
              <input id="directions_label" className="input" placeholder="Get directions" {...register('directions_label')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Catalogue display">
          <Field label="Products per page" htmlFor="catalogue_page_size" error={errors.catalogue_page_size?.message} hint="From 6 to 48.">
            <input id="catalogue_page_size" inputMode="numeric" className="input max-w-[140px]" {...register('catalogue_page_size')} />
          </Field>
          <Toggle id="show_prices" label="Show prices" description="Turn off to hide all prices and ask visitors to enquire." checked={watch('show_prices')} onChange={(v) => setValue('show_prices', v, { shouldDirty: true })} />
          <Toggle id="show_sku" label="Show product codes" checked={watch('show_sku')} onChange={(v) => setValue('show_sku', v, { shouldDirty: true })} />
        </FormSection>

        <FormSection title="Announcement bar" description="A thin message across the top of every page.">
          <Toggle id="announcement_enabled" label="Show the announcement bar" checked={watch('announcement_enabled')} onChange={(v) => setValue('announcement_enabled', v, { shouldDirty: true })} />
          <Field label="Message" htmlFor="announcement_text" error={errors.announcement_text?.message}>
            <input id="announcement_text" className="input" {...register('announcement_text')} />
          </Field>
          <Field label="Link (optional)" htmlFor="announcement_link" error={errors.announcement_link?.message} hint="A page such as /catalog, or a https:// link.">
            <input id="announcement_link" className="input" {...register('announcement_link')} />
          </Field>
        </FormSection>

        <FormSection title="Footer">
          <Field label="Footer text" htmlFor="footer_text" error={errors.footer_text?.message}>
            <textarea id="footer_text" rows={2} className="input" {...register('footer_text')} />
          </Field>
        </FormSection>

        <SubmitBar busy={save.isPending} dirty={isDirty} />
      </form>
    </>
  )
}
