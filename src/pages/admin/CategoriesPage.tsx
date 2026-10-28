import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, Field, PageHeader, StatusBadge, Toggle } from '@/components/admin/ui'
import { SingleImageField } from '@/components/admin/SingleImageField'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/states'
import {
  archiveCategory,
  createCategory,
  deleteCategory,
  listAdminCategories,
  restoreCategory,
  setCategoryImage,
  updateCategory,
  type AdminCategory,
} from '@/lib/api/admin'
import { friendlyError } from '@/lib/errors'
import { slugify } from '@/lib/utils'
import {
  categoryFormSchema,
  categoryFormToRow,
  categoryToFormValues,
  emptyCategoryForm,
  type CategoryFormValues,
} from '@/lib/validation'

function CategoryForm({
  category,
  onDone,
  onSaved,
}: {
  category: AdminCategory | null
  onDone: () => void
  onSaved: () => void
}) {
  const isNew = !category
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getFieldState,
    formState: { errors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category ? categoryToFormValues(category) : emptyCategoryForm(),
  })

  const name = watch('name')
  useEffect(() => {
    if (isNew && !getFieldState('slug').isDirty) setValue('slug', slugify(name))
  }, [name, isNew, setValue, getFieldState])

  const save = useMutation({
    mutationFn: (v: CategoryFormValues) => (category ? updateCategory(category.id, categoryFormToRow(v)) : createCategory(categoryFormToRow(v))),
    onSuccess: () => {
      toast.success(isNew ? 'Category created' : 'Category saved')
      onSaved()
      if (isNew) onDone()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  return (
    <div className="border border-sand bg-white/50 p-5 md:p-7">
      <h2 className="text-3xl">{isNew ? 'New category' : `Edit ${category.name}`}</h2>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="mt-5 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name" htmlFor="c-name" required error={errors.name?.message}>
            <input id="c-name" className="input" aria-invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="URL slug" htmlFor="c-slug" required error={errors.slug?.message} hint="Used in /category/your-slug">
            <input id="c-slug" className="input" aria-invalid={!!errors.slug} {...register('slug')} />
          </Field>
        </div>
        <Field label="Description" htmlFor="c-desc" error={errors.description?.message}>
          <textarea id="c-desc" rows={3} className="input" {...register('description')} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Display order" htmlFor="c-order" error={errors.display_order?.message} hint="Lower numbers come first.">
            <input id="c-order" inputMode="numeric" className="input" {...register('display_order')} />
          </Field>
          <Field label="Featured order" htmlFor="c-forder" error={errors.featured_order?.message} hint="Order on the homepage.">
            <input id="c-forder" inputMode="numeric" className="input" {...register('featured_order')} />
          </Field>
        </div>
        <Toggle id="c-pub" label="Visible on the website" checked={watch('is_published')} onChange={(v) => setValue('is_published', v, { shouldDirty: true })} />
        <Toggle id="c-feat" label="Feature on the homepage" checked={watch('is_featured')} onChange={(v) => setValue('is_featured', v, { shouldDirty: true })} />

        {category ? (
          <SingleImageField
            id="c-image"
            label="Category image"
            path={category.image_path}
            hint="Saves as soon as you choose a file."
            onChange={async (file) => {
              await setCategoryImage(category.id, file)
              onSaved()
            }}
          />
        ) : (
          <p className="text-sm text-earth">You can add an image after the category is created.</p>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={save.isPending || (!isNew && !isDirty)}>
            {save.isPending ? 'Saving' : isNew ? 'Create category' : 'Save changes'}
          </button>
          <button type="button" className="btn-secondary" onClick={onDone}>
            {isNew ? 'Cancel' : 'Close'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | 'new' | null>(null)
  const [pending, setPending] = useState<{ kind: 'archive' | 'delete'; category: AdminCategory } | null>(null)

  const query = useQuery({ queryKey: ['admin', 'categories', showArchived], queryFn: () => listAdminCategories(showArchived) })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin'] })
    void qc.invalidateQueries({ queryKey: ['categories'] })
    void qc.invalidateQueries({ queryKey: ['category'] })
    void qc.invalidateQueries({ queryKey: ['products'] })
  }

  const archive = useMutation({
    mutationFn: archiveCategory,
    onSuccess: () => { toast.success('Category archived'); setPending(null); invalidate() },
    onError: (e) => { toast.error(friendlyError(e)); setPending(null) },
  })
  const restore = useMutation({
    mutationFn: restoreCategory,
    onSuccess: () => { toast.success('Category restored. It is hidden until you make it visible.'); invalidate() },
    onError: (e) => toast.error(friendlyError(e)),
  })
  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { toast.success('Category deleted'); setPending(null); invalidate() },
    onError: (e) => { toast.error(friendlyError(e)); setPending(null) },
  })

  const items = query.data ?? []
  // Keep the open editor in sync with refreshed data (e.g. after an image upload).
  const current = editing && editing !== 'new' ? items.find((c) => c.id === editing.id) ?? editing : editing

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your products. Hidden or archived categories, and their products, do not appear on the website."
        actions={
          <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden /> Add category
          </button>
        }
      />

      {current && (
        <div className="mb-10">
          <CategoryForm
            key={current === 'new' ? 'new' : current.id}
            category={current === 'new' ? null : current}
            onDone={() => setEditing(null)}
            onSaved={invalidate}
          />
        </div>
      )}

      <div className="mb-4">
        <Toggle id="show-archived" label="Show archived categories" checked={showArchived} onChange={setShowArchived} />
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No categories yet" action={<button type="button" className="btn-primary" onClick={() => setEditing('new')}>Add a category</button>}>
          Categories group your products so visitors can browse them.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-sand border-y border-sand">
          {items.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <div className="min-w-0 flex-1 basis-52">
                <p className="truncate text-[17px] font-medium text-walnut">{c.name}</p>
                <p className="text-sm text-earth">/category/{c.slug} · {c.product_count} {c.product_count === 1 ? 'product' : 'products'} · order {c.display_order}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge kind={c.is_archived ? 'archived' : c.is_published ? 'published' : 'hidden'} />
                {c.is_featured && <StatusBadge kind="featured" />}
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="btn-quiet btn-sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-4 w-4" aria-hidden /> Edit
                </button>
                {c.is_archived ? (
                  <>
                    <button type="button" className="btn-quiet btn-sm" onClick={() => restore.mutate(c.id)} aria-label={`Restore ${c.name}`}>
                      <RotateCcw className="h-4 w-4" aria-hidden /> Restore
                    </button>
                    <button type="button" className="btn-quiet btn-sm text-red-800" onClick={() => setPending({ kind: 'delete', category: c })} aria-label={`Delete ${c.name}`}>
                      <Trash2 className="h-4 w-4" aria-hidden /> Delete
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-quiet btn-sm" onClick={() => setPending({ kind: 'archive', category: c })} aria-label={`Archive ${c.name}`}>
                    <Archive className="h-4 w-4" aria-hidden /> Archive
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pending?.kind === 'archive'}
        title="Archive this category?"
        confirmLabel="Archive"
        busy={archive.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && archive.mutate(pending.category.id)}
      >
        <p><strong>{pending?.category.name}</strong> will be hidden from the website.</p>
        {pending && pending.category.product_count > 0 && (
          <p>It still contains {pending.category.product_count} {pending.category.product_count === 1 ? 'product' : 'products'}. Move or archive them first, or the archive will be refused.</p>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={pending?.kind === 'delete'}
        title="Delete this category?"
        confirmLabel="Delete category"
        danger
        busy={remove.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.category.id)}
      >
        <p><strong>{pending?.category.name}</strong> will be deleted permanently. A category that still has products cannot be deleted.</p>
      </ConfirmDialog>
    </>
  )
}
