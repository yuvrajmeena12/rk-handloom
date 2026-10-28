import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState, Spinner } from '@/components/ui/states'
import { Field, FormSection, PageHeader, SubmitBar, Toggle } from '@/components/admin/ui'
import { SingleImageField } from '@/components/admin/SingleImageField'
import { useSettingsForm } from '@/components/admin/useSettingsForm'
import { Picture } from '@/components/catalog/Picture'
import {
  listFeaturedCategories,
  listFeaturedProducts,
  reorderFeatured,
  setCategoryFeatured,
  setProductFeatured,
  setSettingsImage,
  updateHomepageSections,
} from '@/lib/api/admin'
import { getHomepageSections } from '@/lib/api/public'
import { friendlyError } from '@/lib/errors'
import { sectionsKey, settingsKey } from '@/hooks/useSettings'
import type { HomepageSection } from '@/lib/types'

function SectionsEditor() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'sections'], queryFn: getHomepageSections })
  const [draft, setDraft] = useState<HomepageSection[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (query.data) {
      setDraft([...query.data].sort((a, b) => a.display_order - b.display_order))
      setDirty(false)
    }
  }, [query.data])

  const save = useMutation({
    mutationFn: () => updateHomepageSections(draft.map((s, i) => ({ key: s.key, is_visible: s.is_visible, display_order: i + 1, heading: s.heading?.trim() || null, body: s.body?.trim() || null }))),
    onSuccess: () => {
      toast.success('Homepage sections saved')
      void qc.invalidateQueries({ queryKey: ['admin', 'sections'] })
      void qc.invalidateQueries({ queryKey: sectionsKey })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  if (query.isLoading) return <Spinner />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const change = (i: number, patch: Partial<HomepageSection>) => {
    setDraft((d) => d.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
    setDirty(true)
  }
  const move = (i: number, to: number) => {
    setDraft((d) => {
      const next = [...d]
      const [item] = next.splice(i, 1)
      next.splice(to, 0, item)
      return next
    })
    setDirty(true)
  }
  const editableText = (key: string) => key === 'featured_categories' || key === 'featured_products' || key === 'discovery' || key === 'store_info' || key === 'contact'

  return (
    <FormSection title="Sections" description="Show, hide and reorder the sections of your homepage. The hero at the top always appears first.">
      <ol className="space-y-3">
        {draft.map((s, i) => (
          <li key={s.key} className="border border-sand bg-ivory p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle id={`sec-${s.key}`} label={s.label} checked={s.is_visible} onChange={(v) => change(i, { is_visible: v })} />
              <div className="flex gap-1">
                <button type="button" className="btn-quiet btn-sm" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move ${s.label} up`}>
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" className="btn-quiet btn-sm" disabled={i === draft.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move ${s.label} down`}>
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            {editableText(s.key) && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Heading" htmlFor={`sec-h-${s.key}`}>
                  <input id={`sec-h-${s.key}`} className="input" maxLength={160} value={s.heading ?? ''} onChange={(e) => change(i, { heading: e.target.value })} />
                </Field>
                <Field label="Text" htmlFor={`sec-b-${s.key}`}>
                  <input id={`sec-b-${s.key}`} className="input" maxLength={1000} value={s.body ?? ''} onChange={(e) => change(i, { body: e.target.value })} />
                </Field>
              </div>
            )}
          </li>
        ))}
      </ol>
      <button type="button" className="btn-primary" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving' : 'Save sections'}
      </button>
      {dirty && <p className="text-sm text-earth" aria-live="polite">You have unsaved section changes.</p>}
    </FormSection>
  )
}

function FeaturedEditor({ kind }: { kind: 'products' | 'categories' }) {
  const qc = useQueryClient()
  const isProducts = kind === 'products'
  interface FeaturedRow {
    id: string
    name: string
    is_published: boolean
    image: string | null
  }
  const query = useQuery({
    queryKey: ['admin', 'featured', kind],
    queryFn: async (): Promise<FeaturedRow[]> => {
      if (isProducts) {
        const products = await listFeaturedProducts()
        return products.map((p) => ({ id: p.id, name: p.name, is_published: p.is_published, image: p.images[0]?.storage_path ?? null }))
      }
      const categories = await listFeaturedCategories()
      return categories.map((c) => ({ id: c.id, name: c.name, is_published: c.is_published, image: c.image_path }))
    },
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin'] })
    void qc.invalidateQueries({ queryKey: ['products'] })
    void qc.invalidateQueries({ queryKey: ['categories'] })
  }

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderFeatured(isProducts ? 'products' : 'categories', ids),
    onSuccess: refresh,
    onError: (e) => toast.error(friendlyError(e)),
  })
  const unfeature = useMutation({
    mutationFn: (id: string) => (isProducts ? setProductFeatured(id, false) : setCategoryFeatured(id, false)),
    onSuccess: () => {
      toast.success('Removed from the homepage')
      refresh()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  if (query.isLoading) return <Spinner />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const rows = query.data ?? []

  const move = (i: number, to: number) => {
    const ids = rows.map((r) => r.id)
    const [id] = ids.splice(i, 1)
    ids.splice(to, 0, id)
    reorder.mutate(ids)
  }

  return (
    <FormSection
      title={isProducts ? 'Featured products' : 'Featured categories'}
      description={
        isProducts
          ? 'Shown on the homepage in this order. Only published products are visible to visitors. Mark a product as featured on its edit page.'
          : 'Shown on the homepage in this order. Mark a category as featured on the Categories page.'
      }
    >
      {rows.length === 0 ? (
        <p className="text-[15px] text-charcoal/80">
          Nothing is featured yet. {isProducts ? <>Open a product and switch on “Feature on the homepage”. <Link to="/admin/products" className="link">Go to products</Link></> : <><Link to="/admin/categories" className="link">Go to categories</Link></>}
        </p>
      ) : (
        <ol className="divide-y divide-sand border-y border-sand">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <Picture path={r.image} alt="" ratio="aspect-square" className="h-12 w-12 shrink-0" width={96} height={96} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-walnut">{r.name}</p>
                {isProducts && !r.is_published && <p className="text-xs text-amber-900">Not published, so not shown yet</p>}
              </div>
              <button type="button" className="btn-quiet btn-sm" disabled={i === 0 || reorder.isPending} onClick={() => move(i, i - 1)} aria-label={`Move ${r.name} up`}>
                <ArrowUp className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" className="btn-quiet btn-sm" disabled={i === rows.length - 1 || reorder.isPending} onClick={() => move(i, i + 1)} aria-label={`Move ${r.name} down`}>
                <ArrowDown className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" className="btn-quiet btn-sm" disabled={unfeature.isPending} onClick={() => unfeature.mutate(r.id)} aria-label={`Remove ${r.name} from the homepage`}>
                <X className="h-4 w-4" aria-hidden /> Remove
              </button>
            </li>
          ))}
        </ol>
      )}
    </FormSection>
  )
}

export default function HomepageAdminPage() {
  const qc = useQueryClient()
  const { form, query, save, onSubmit, guard, isDirty } = useSettingsForm([
    'hero_heading', 'hero_subheading', 'hero_primary_label', 'hero_primary_link',
    'hero_secondary_label', 'hero_secondary_link', 'craft_heading', 'craft_body',
  ])
  const { register, formState: { errors } } = form

  if (query.isLoading) return <Spinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  return (
    <>
      {guard.dialog}
      <PageHeader
        title="Homepage"
        description="Change what visitors see first. Use the preview link to check your changes on the real site."
        actions={<Link to="/" target="_blank" className="btn-secondary">Preview homepage</Link>}
      />
      <div className="space-y-8">
        <FormSection title="Hero image" description="The large image beside the main heading. Without one, a woven panel with your name is shown.">
          <SingleImageField
            id="hero-image"
            label="Hero image"
            path={query.data.hero_image_path}
            ratio="aspect-[4/5]"
            hint="A portrait photo works best."
            onChange={async (file) => {
              await setSettingsImage('hero_image_path', file)
              await qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
              await qc.invalidateQueries({ queryKey: settingsKey })
            }}
          />
        </FormSection>

        <form onSubmit={onSubmit} noValidate className="space-y-8">
          <FormSection title="Hero text and buttons">
            <Field label="Heading" htmlFor="hero_heading" error={errors.hero_heading?.message}>
              <input id="hero_heading" className="input" {...register('hero_heading')} />
            </Field>
            <Field label="Subheading" htmlFor="hero_subheading" error={errors.hero_subheading?.message}>
              <textarea id="hero_subheading" rows={2} className="input" {...register('hero_subheading')} />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Main button label" htmlFor="hero_primary_label" error={errors.hero_primary_label?.message}>
                <input id="hero_primary_label" className="input" {...register('hero_primary_label')} />
              </Field>
              <Field label="Main button link" htmlFor="hero_primary_link" error={errors.hero_primary_link?.message} hint="e.g. /catalog or a https:// link.">
                <input id="hero_primary_link" className="input" {...register('hero_primary_link')} />
              </Field>
              <Field label="Second button label" htmlFor="hero_secondary_label" error={errors.hero_secondary_label?.message}>
                <input id="hero_secondary_label" className="input" {...register('hero_secondary_label')} />
              </Field>
              <Field label="Second button link" htmlFor="hero_secondary_link" error={errors.hero_secondary_link?.message} hint="Use #directions to scroll to the contact section.">
                <input id="hero_secondary_link" className="input" {...register('hero_secondary_link')} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Introduction section" description="The short text about your store shown further down the homepage. Only state facts you can stand behind.">
            <Field label="Heading" htmlFor="craft_heading" error={errors.craft_heading?.message}>
              <input id="craft_heading" className="input" {...register('craft_heading')} />
            </Field>
            <Field label="Text" htmlFor="craft_body" error={errors.craft_body?.message} hint="Leave a blank line between paragraphs.">
              <textarea id="craft_body" rows={5} className="input" {...register('craft_body')} />
            </Field>
          </FormSection>
          <SubmitBar busy={save.isPending} dirty={isDirty} />
        </form>

        <SectionsEditor />
        <FeaturedEditor kind="categories" />
        <FeaturedEditor kind="products" />
      </div>
    </>
  )
}
