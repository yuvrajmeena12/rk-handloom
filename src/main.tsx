import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'
import { AuthProvider } from './lib/auth'
import { SettingsProvider } from './hooks/useSettings'
import { SetupNotice } from './components/SetupNotice'
import { isSupabaseConfigured } from './lib/env'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" richColors closeButton />
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    ) : (
      <SetupNotice />
    )}
  </StrictMode>,
)
