import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Field, FormSection, PageHeader, StatusBadge, SubmitBar, Toggle, useUnsavedChangesGuard } from '@/components/admin/ui'
import { ProductImages } from '@/components/admin/ProductImages'
import { ErrorState, Spinner } from '@/components/ui/states'
import { createProduct, getAdminProduct, listAdminCategories, setProductPublished, updateProduct } from '@/lib/api/admin'
import { friendlyError } from '@/lib/errors'
import { PRODUCT_TYPE_LABELS, type ProductType } from '@/lib/types'
import { slugify } from '@/lib/utils'
import {
  emptyProductForm,
  getPublishIssues,
  productFormSchema,
  productFormToRow,
  productToFormValues,
  type ProductFormValues,
} from '@/lib/validation'

export default function ProductEditPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const productQuery = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => getAdminProduct(id!),
    enabled: !isNew,
  })
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => listAdminCategories(true) })

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getFieldState,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductForm(),
  })
  const specs = useFieldArray({ control, name: 'specifications' })
  const variants = useFieldArray({ control, name: 'variants' })

  const product = productQuery.data
  useEffect(() => {
    if (product) reset(productToFormValues(product))
  }, [product, reset])

  const guard = useUnsavedChangesGuard(isDirty)

  // Auto-fill the slug from the name until the owner edits the slug themselves.
  const name = watch('name')
  useEffect(() => {
    if (!isNew) return
    if (!getFieldState('slug').isDirty) setValue('slug', slugify(name), { shouldDirty: false })
  }, [name, isNew, setValue, getFieldState])

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin'] })
    void qc.invalidateQueries({ queryKey: ['products'] })
    void qc.invalidateQueries({ queryKey: ['product'] })
    void qc.invalidateQueries({ queryKey: ['category'] })
  }

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const row = productFormToRow(values)
      if (isNew) return createProduct(row)
      return updateProduct(id!, row)
    },
    onSuccess: (saved, values) => {
      refresh()
      if (isNew) {
        toast.success('Draft saved. Now add images, then publish.')
        guard.allowNextNavigation()
        navigate(`/admin/products/${saved.id}/edit`, { replace: true })
      } else {
        toast.success('Changes saved')
        reset({ ...values, slug: saved.slug })
      }
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const publish = useMutation({
    mutationFn: (value: boolean) => setProductPublished(id!, value),
    onSuccess: (_d, value) => {
      toast.success(value ? 'Published' : 'Unpublished')
      refresh()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const publishIssues = useMemo(
    () =>
      product
        ? getPublishIssues(
            { name: product.name, slug: product.slug, category_id: product.category_id, is_archived: product.is_archived },
            product.images.length,
          )
        : [],
    [product],
  )

  if (!isNew && productQuery.isLoading) return <Spinner />
  if (!isNew && productQuery.isError) return <ErrorState onRetry={() => productQuery.refetch()} />
  if (!isNew && !product) {
    return (
      <ErrorState title="Product not found" message="It may have been deleted." onRetry={() => navigate('/admin/products')} />
    )
  }

  const activeCategories = (categories.data ?? []).filter((c) => !c.is_archived || c.id === product?.category_id)
  const saving = save.isPending
  const unsavedBlocksPublish = isDirty

  return (
    <>
      {guard.dialog}
      <PageHeader
        title={isNew ? 'Add product' : product!.name}
        description={
          isNew
            ? 'Save the details first. You can add images and publish on the next step.'
            : 'Edit the details below. Changes appear on the website once saved and published.'
        }
        actions={
          !isNew && product ? (
            <>
              <StatusBadge kind={product.is_archived ? 'archived' : product.is_published ? 'published' : 'draft'} />
              {product.is_published && (
                <Link to={`/product/${product.slug}`} target="_blank" className="btn-secondary btn-sm">
                  <ExternalLink className="h-4 w-4" aria-hidden /> View on site
                </Link>
              )}
            </>
          ) : undefined
        }
      />

      {!isNew && product && !product.is_archived && (
        <section className="mb-8 border border-sand bg-white/50 p-5" aria-labelledby="publish-heading">
          <h2 id="publish-heading" className="text-2xl">
            {product.is_published ? 'This product is visible on your website' : 'This product is a draft'}
          </h2>
          {!product.is_published && publishIssues.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-charcoal/85">
              {publishIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
          {unsavedBlocksPublish && <p className="mt-2 text-sm text-amber-900">Save your changes before publishing.</p>}
          <button
            type="button"
            className={product.is_published ? 'btn-secondary mt-4' : 'btn-primary mt-4'}
            disabled={publish.isPending || unsavedBlocksPublish || (!product.is_published && publishIssues.length > 0)}
            onClick={() => publish.mutate(!product.is_published)}
          >
            {product.is_published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            {product.is_published ? 'Unpublish' : 'Publish'}
          </button>
        </section>
      )}

      <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-8">
        <FormSection title="Basics">
          <Field label="Product name" htmlFor="name" required error={errors.name?.message}>
            <input id="name" className="input" aria-invalid={!!errors.name} {...register('name')} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="URL slug" htmlFor="slug" required error={errors.slug?.message} hint="Used in the web address, e.g. /product/cotton-dari.">
              <input id="slug" className="input" aria-invalid={!!errors.slug} {...register('slug')} />
            </Field>
            <Field label="SKU or product code" htmlFor="sku" error={errors.sku?.message} hint="Optional. Must be unique.">
              <input id="sku" className="input" {...register('sku')} />
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Category" htmlFor="category_id" hint="Required to publish.">
              <select id="category_id" className="input" {...register('category_id')}>
                <option value="">Choose a category</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.is_archived ? ' (archived)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Product type" htmlFor="product_type">
              <select id="product_type" className="input" {...register('product_type')}>
                {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => (
                  <option key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Short description" htmlFor="short_description" error={errors.short_description?.message} hint="One or two sentences shown near the top of the product page.">
            <textarea id="short_description" rows={2} className="input" {...register('short_description')} />
          </Field>
          <Field label="Full description" htmlFor="description" error={errors.description?.message} hint="Leave a blank line between paragraphs.">
            <textarea id="description" rows={7} className="input" {...register('description')} />
          </Field>
        </FormSection>

        <FormSection title="Price" description="Prices are optional. Leave the price empty to show 'Contact for price'.">
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Price (INR)" htmlFor="price" error={errors.price?.message}>
              <input id="price" inputMode="decimal" className="input" aria-invalid={!!errors.price} {...register('price')} />
            </Field>
            <Field label="Compare-at price (INR)" htmlFor="compare_at_price" error={errors.compare_at_price?.message} hint="Shown struck through. Must be higher than the price.">
              <input id="compare_at_price" inputMode="decimal" className="input" aria-invalid={!!errors.compare_at_price} {...register('compare_at_price')} />
            </Field>
            <Field label="Price label" htmlFor="price_label" error={errors.price_label?.message} hint="e.g. Contact for price, Starting from.">
              <input id="price_label" className="input" {...register('price_label')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Details" description="Separate list items with commas.">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Materials and fabric" htmlFor="materials" hint="e.g. Cotton, Jute">
              <input id="materials" className="input" {...register('materials')} />
            </Field>
            <Field label="Sizes and dimensions" htmlFor="sizes" hint="e.g. 6x4 ft, Queen, King">
              <input id="sizes" className="input" {...register('sizes')} />
            </Field>
            <Field label="Colours and patterns" htmlFor="colours">
              <input id="colours" className="input" {...register('colours')} />
            </Field>
            <Field label="Tags" htmlFor="tags">
              <input id="tags" className="input" {...register('tags')} />
            </Field>
          </div>

          <div>
            <h3 className="text-xl">Specifications</h3>
            <p className="field-hint">Name and value pairs, such as Weave: Plain, or Thickness: 6 inch.</p>
            <ul className="mt-3 space-y-3">
              {specs.fields.map((field, i) => (
                <li key={field.id} className="grid grid-cols-[1fr_1.4fr_auto] items-start gap-3">
                  <Field label="Name" htmlFor={`spec-label-${i}`} error={errors.specifications?.[i]?.label?.message}>
                    <input id={`spec-label-${i}`} className="input" {...register(`specifications.${i}.label`)} />
                  </Field>
                  <Field label="Value" htmlFor={`spec-value-${i}`} error={errors.specifications?.[i]?.value?.message}>
                    <input id={`spec-value-${i}`} className="input" {...register(`specifications.${i}.value`)} />
                  </Field>
                  <button type="button" className="btn-quiet mt-7" onClick={() => specs.remove(i)} aria-label={`Remove specification ${i + 1}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => specs.append({ label: '', value: '' })}>
              <Plus className="h-4 w-4" aria-hidden /> Add specification
            </button>
          </div>

          <div>
            <h3 className="text-xl">Variants</h3>
            <p className="field-hint">Use for options with their own code or price, such as mattress sizes.</p>
            <ul className="mt-3 space-y-3">
              {variants.fields.map((field, i) => (
                <li key={field.id} className="grid items-start gap-3 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
                  <Field label="Variant" htmlFor={`var-name-${i}`} error={errors.variants?.[i]?.name?.message}>
                    <input id={`var-name-${i}`} className="input" {...register(`variants.${i}.name`)} />
                  </Field>
                  <Field label="Code" htmlFor={`var-sku-${i}`}>
                    <input id={`var-sku-${i}`} className="input" {...register(`variants.${i}.sku`)} />
                  </Field>
                  <Field label="Price" htmlFor={`var-price-${i}`} error={errors.variants?.[i]?.price?.message}>
                    <input id={`var-price-${i}`} inputMode="decimal" className="input" {...register(`variants.${i}.price`)} />
                  </Field>
                  <Field label="Note" htmlFor={`var-note-${i}`}>
                    <input id={`var-note-${i}`} className="input" {...register(`variants.${i}.note`)} />
                  </Field>
                  <button type="button" className="btn-quiet mt-7" onClick={() => variants.remove(i)} aria-label={`Remove variant ${i + 1}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => variants.append({ name: '', sku: '', price: '', note: '' })}>
              <Plus className="h-4 w-4" aria-hidden /> Add variant
            </button>
          </div>

          <Field label="Care instructions" htmlFor="care_instructions" error={errors.care_instructions?.message}>
            <textarea id="care_instructions" rows={3} className="input" {...register('care_instructions')} />
          </Field>
          <Field label="Additional notes" htmlFor="additional_notes" error={errors.additional_notes?.message}>
            <textarea id="additional_notes" rows={3} className="input" {...register('additional_notes')} />
          </Field>
        </FormSection>

        <FormSection title="Display">
          <Toggle
            id="show_enquiry_button"
            label="Show call and WhatsApp buttons"
            description="Lets visitors enquire about this product."
            checked={watch('show_enquiry_button')}
            onChange={(v) => setValue('show_enquiry_button', v, { shouldDirty: true })}
          />
          <Toggle
            id="is_featured"
            label="Feature on the homepage"
            description="Featured products appear in the homepage selection."
            checked={watch('is_featured')}
            onChange={(v) => setValue('is_featured', v, { shouldDirty: true })}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Featured order" htmlFor="featured_order" error={errors.featured_order?.message} hint="Lower numbers come first.">
              <input id="featured_order" inputMode="numeric" className="input" {...register('featured_order')} />
            </Field>
            <Field label="Display order" htmlFor="display_order" error={errors.display_order?.message} hint="Lower numbers come first in related products.">
              <input id="display_order" inputMode="numeric" className="input" {...register('display_order')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Search engines" description="Optional. Leave empty to use the product name and short description.">
          <Field label="SEO title" htmlFor="seo_title" error={errors.seo_title?.message} hint="Up to 70 characters.">
            <input id="seo_title" className="input" {...register('seo_title')} />
          </Field>
          <Field label="SEO description" htmlFor="seo_description" error={errors.seo_description?.message} hint="Up to 200 characters.">
            <textarea id="seo_description" rows={2} className="input" {...register('seo_description')} />
          </Field>
        </FormSection>

        <SubmitBar busy={saving} dirty={isDirty} label={isNew ? 'Save draft' : 'Save changes'} extra={<Link to="/admin/products" className="btn-quiet">Back to products</Link>} />
      </form>

      {!isNew && product && (
        <section className="mt-10 border border-sand bg-white/50 p-5 md:p-7">
          <h2 className="mb-4 text-2xl md:text-3xl">Images</h2>
          <ProductImages productId={product.id} productName={product.name} images={product.images} onChanged={() => void productQuery.refetch()} />
        </section>
      )}
    </>
  )
}
