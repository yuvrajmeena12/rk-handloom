import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getHomepageSections, getSettings } from '@/lib/api/public'
import type { BusinessSettings, HomepageSection } from '@/lib/types'

interface SettingsContextValue {
  settings: BusinessSettings | undefined
  sections: HomepageSection[]
  isLoading: boolean
  isError: boolean
  retry: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export const settingsKey = ['settings'] as const
export const sectionsKey = ['homepage-sections'] as const

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settingsQuery = useQuery({ queryKey: settingsKey, queryFn: getSettings, staleTime: 5 * 60_000 })
  const sectionsQuery = useQuery({ queryKey: sectionsKey, queryFn: getHomepageSections, staleTime: 5 * 60_000 })

  const accent = settingsQuery.data?.accent_theme
  useEffect(() => {
    if (accent && accent !== 'olive') document.documentElement.dataset.accent = accent
    else delete document.documentElement.dataset.accent
  }, [accent])

  const value: SettingsContextValue = {
    settings: settingsQuery.data,
    sections: sectionsQuery.data ?? [],
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    retry: () => {
      void settingsQuery.refetch()
      void sectionsQuery.refetch()
    },
  }
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
