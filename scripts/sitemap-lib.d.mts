export interface UrlResolutionResult {
  valid: boolean
  url?: string
  isLocalhost?: boolean
  reason?: string
}

export function loadEnvFile(filePath: string): Record<string, string>

export function resolveBaseUrl(
  env?: Record<string, string | undefined>,
  options?: { allowLocalhost?: boolean },
): UrlResolutionResult

export function escapeXml(str?: string): string

export function formatLastMod(dateStr?: string | null): string | null

export const STATIC_PUBLIC_ROUTES: string[]

export interface CategoryEntry {
  slug: string
  updated_at?: string | null
}

export interface ProductEntry {
  slug: string
  updated_at?: string | null
}

export function buildSitemapXml(
  siteUrl: string,
  staticRoutes?: string[],
  categories?: CategoryEntry[],
  products?: ProductEntry[],
): string

export function updateRobotsTxt(
  existingContent?: string,
  sitemapUrl?: string | null,
): string

export interface GenerateSitemapOptions {
  rootDir?: string
  allowLocalhost?: boolean
  preserveExistingSitemap?: boolean
  env?: Record<string, string | undefined>
}

export interface GenerateSitemapResult {
  success: boolean
  skipped?: boolean
  reason?: string
  siteUrl?: string
  totalUrls?: number
}

export function generateSitemap(
  options?: GenerateSitemapOptions,
): Promise<GenerateSitemapResult>

