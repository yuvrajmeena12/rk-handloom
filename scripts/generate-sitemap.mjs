#!/usr/bin/env node
import { generateSitemap } from './sitemap-lib.mjs'

const allowLocalhost =
  process.argv.includes('--allow-localhost') ||
  process.env.ALLOW_LOCALHOST === 'true'

generateSitemap({ allowLocalhost })
  .then((result) => {
    if (result.skipped) {
      process.exit(0)
    }
  })
  .catch((err) => {
    console.error('[sitemap] Error:', err.message)
    // Exit with 0 so unexpected sitemap errors never break production builds
    process.exit(0)
  })
