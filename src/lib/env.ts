const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const env = {
  supabaseUrl: url ?? '',
  supabaseAnonKey: anonKey ?? '',
  // Default to confirmed live canonical deployment URL: https://rk-handloom.vercel.app
  siteUrl: ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://rk-handloom.vercel.app')
    .trim()
    .replace(/\/+$/, ''),
}

export const isSupabaseConfigured = Boolean(
  url && anonKey && /^https?:\/\//.test(url) && !url.includes('YOUR-PROJECT-REF'),
)

/** Absolute canonical URL for search engines and social sharing. */
export function absoluteUrl(path: string): string {
  const origin = env.siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://rk-handloom.vercel.app')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${cleanPath}`
}
