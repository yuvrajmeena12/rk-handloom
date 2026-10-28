interface PgLikeError {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

/** Turns Supabase/Postgres/storage errors into messages a shop owner can act on. */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback
  const e = error as PgLikeError
  const message = e.message ?? (typeof error === 'string' ? error : '')

  switch (e.code) {
    case '23505':
      if (/slug/i.test(message)) return 'That URL slug is already used. Choose a different one.'
      if (/sku/i.test(message)) return 'That SKU is already used by another product.'
      return 'That value is already in use.'
    case '23503':
      return 'This item is still in use by other records, so it cannot be removed. Archive it instead.'
    case '23514':
      // Our own trigger messages are written for humans; constraint names are not.
      if (/violates check constraint/i.test(message)) {
        if (/compare_price/i.test(message)) return 'The compare-at price must be higher than the price.'
        if (/archived_not_published/i.test(message)) return 'Unpublish the item before archiving it.'
        return 'One of the values is not allowed. Please review the form.'
      }
      return message || fallback
    case '42501':
      return 'You do not have permission to do that. Please sign in again as the owner.'
    case 'PGRST301':
    case 'PGRST303':
      return 'Your session has expired. Please sign in again.'
  }

  if (/row-level security|permission denied/i.test(message)) {
    return 'You do not have permission to do that. Please sign in again as the owner.'
  }
  if (/Failed to fetch|NetworkError|network/i.test(message)) {
    return 'Could not reach the server. Check your internet connection and try again.'
  }
  if (/exceeded the maximum allowed size|too large/i.test(message)) {
    return 'That file is too large.'
  }
  if (/mime type|not supported/i.test(message)) {
    return 'That file type is not supported. Use JPG, PNG, WebP or AVIF.'
  }
  return message || fallback
}

export const isUniqueViolation = (error: unknown, constraintPart?: string) => {
  const e = error as PgLikeError
  if (e?.code !== '23505') return false
  return constraintPart ? new RegExp(constraintPart, 'i').test(e.message ?? '') : true
}
