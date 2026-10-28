import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSettings } from '@/lib/api/public'
import { updateSettings } from '@/lib/api/admin'
import { friendlyError } from '@/lib/errors'
import { sectionsKey, settingsKey } from '@/hooks/useSettings'
import {
  settingsFormSchema,
  settingsFormToRow,
  settingsToFormValues,
  type SettingsFormValues,
} from '@/lib/validation'
import type { BusinessSettings } from '@/lib/types'
import { useUnsavedChangesGuard } from './ui'

type RowKey = keyof ReturnType<typeof settingsFormToRow>

/**
 * Form state for a group of business-settings fields. Each admin page saves only the
 * columns it shows, so editing one page can never overwrite another page's changes.
 */
export function useSettingsForm(fields: RowKey[]) {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings })
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: query.data ? settingsToFormValues(query.data) : undefined,
  })
  const { reset, formState } = form

  useEffect(() => {
    if (query.data) reset(settingsToFormValues(query.data))
  }, [query.data, reset])

  const guard = useUnsavedChangesGuard(formState.isDirty)

  const save = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const row = settingsFormToRow(values)
      const patch = Object.fromEntries(fields.map((k) => [k, row[k]])) as Partial<BusinessSettings>
      return updateSettings(patch)
    },
    onSuccess: (saved) => {
      toast.success('Changes saved')
      qc.setQueryData(['admin', 'settings'], saved)
      qc.setQueryData(settingsKey, saved)
      void qc.invalidateQueries({ queryKey: sectionsKey })
      reset(settingsToFormValues(saved))
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const onSubmit = form.handleSubmit(
    (values) => save.mutate(values),
    () => toast.error('Some fields need attention. Check the messages in red.'),
  )

  return { form, query, save, onSubmit, guard, isDirty: formState.isDirty }
}
