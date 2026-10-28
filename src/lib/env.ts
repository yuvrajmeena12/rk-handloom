const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const env = {
  supabaseUrl: url ?? '',
  supabaseAnonKey: anonKey ?? '',
  siteUrl: ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').trim().replace(/\/$/, ''),
}

export const isSupabaseConfigured = Boolean(
  url && anonKey && /^https?:\/\//.test(url) && !url.includes('YOUR-PROJECT-REF'),
)

/** Absolute URL for canonical links; falls back to the current origin in the browser. */
export function absoluteUrl(path: string): string {
  const origin = env.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
