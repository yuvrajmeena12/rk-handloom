# Google Search Console, SEO & Local Business Guide for RK HANDLOOM

**Business Name:** RK HANDLOOM (आरके हैंडलूम)  
**Live Production Domain:** `https://rk-handloom.vercel.app/`  
**Physical Location:** Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901, India  
**Google Plus Code:** `38X4+JR Beawar, Rajasthan`  
**Geo Coordinates:** `26.1017, 74.3168`  
**Primary Contact Number:** `+91 98291 08112`  
**WhatsApp Number:** `+91 98291 08112` (Direct Link: `https://wa.me/919829108112`)  

---

## 1. Google Search Console Verification

Since your current production deployment URL is `https://rk-handloom.vercel.app/`, follow these steps to claim and verify your property:

### Step 1: Open Search Console
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property**.
3. Select **URL prefix** and enter:
   ```
   https://rk-handloom.vercel.app/
   ```
4. Click **Continue**.

### Step 2: Choose Verification Method
Choose one of the following methods:
- **HTML Tag (Recommended for Vercel deployments)**:
  1. Copy the meta tag provided by Google (e.g., `<meta name="google-site-verification" content="YOUR_CODE" />`).
  2. Paste this tag into `index.html` inside the `<head>` section, or set it via environment variables.
  3. Deploy changes and click **Verify**.
- **Google Analytics or Google Tag Manager**:
  If you have an active GA4 or GTM container associated with the same Google Account, verification happens instantly.

---

## 2. Sitemap Submission

The website features an automated, production-safe XML sitemap builder located at `scripts/generate-sitemap.mjs`.

### Sitemap Location
```
https://rk-handloom.vercel.app/sitemap.xml
```

### Robots.txt Location
```
https://rk-handloom.vercel.app/robots.txt
```
Contents:
```txt
User-agent: *
Disallow: /admin
Allow: /

Sitemap: https://rk-handloom.vercel.app/sitemap.xml
```

### How to Submit:
1. In Google Search Console, select `https://rk-handloom.vercel.app/`.
2. Under the **Indexing** section in the left sidebar, click **Sitemaps**.
3. In the **Add a new sitemap** input field, enter:
   ```
   sitemap.xml
   ```
4. Click **Submit**.
5. GSC will crawl and index your public static routes (`/`, `/catalog`, `/about`, `/contact`, `/privacy`, `/terms`), active category pages (`/category/handloom`, `/category/mattresses`), and all published, non-archived products.

---

## 3. URL Inspection & Fast-Track Indexing

After submitting the sitemap:
1. Use the search bar at the top of GSC (**Inspect any URL in "https://rk-handloom.vercel.app/"**).
2. Enter your homepage: `https://rk-handloom.vercel.app/`.
3. Click **Test Live URL** to confirm Googlebot can fetch and render your luxury React 19 layout, Open Graph tags, and JSON-LD structured data.
4. Click **Request Indexing**.
5. Repeat for primary category and product pages.

---

## 4. Structured Data (Schema.org / JSON-LD) Implementation

The website dynamically mounts and synchronizes valid, rich JSON-LD data onto pages:

| Page / Section | Schema Type | Details Embedded |
| :--- | :--- | :--- |
| **Home (`/`)** | `HomeGoodsStore` & `WebSite` | Business name, Hindi name, Sendra Road address, Beawar postal code, Geo coordinates (`26.1017, 74.3168`), telephone, price range, opening hours, and `SearchAction` target. |
| **Product Detail (`/product/:slug`)** | `Product` & `BreadcrumbList` | Product name, image, description, SKU, pricing (`INR`), in-stock availability, seller details, and full breadcrumb sequence. |
| **Category (`/category/:slug`)** | `BreadcrumbList` | Hierarchical navigation (`Home` → `Catalogue` → `[Category Name]`). |
| **Contact (`/contact`)** | `HomeGoodsStore` | Physical address, phone number, direct WhatsApp channel, Google Plus Code, and showroom hours. |

### How to Test Rich Snippets:
1. Visit the [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Enter `https://rk-handloom.vercel.app/`.
3. Confirm that **Merchant Listings**, **Product**, **Breadcrumbs**, and **Local Business** are detected without errors.

---

## 5. Google Business Profile & Local SEO (Beawar, Rajasthan)

To dominate local search queries such as *"handloom store in Beawar"*, *"cotton bedsheets near me"*, and *"custom mattress manufacturer Beawar"*:

1. **Claim Google Business Profile**:
   - Ensure the name exactly matches: **RK HANDLOOM (आरके हैंडलूम)**.
   - Primary category: **Home goods store** or **Mattress store**.
   - Secondary categories: **Textile merchant**, **Bedding store**, **Curtain supplier and maker**.
2. **Standardized NAP (Name, Address, Phone)**:
   - **Name:** RK HANDLOOM
   - **Address:** Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901
   - **Phone:** `+91 98291 08112`
   - **Website:** `https://rk-handloom.vercel.app/`
3. **Google Maps Place Association**:
   - The website links directly to Google Maps navigation using the business coordinates and address, helping Google corroborate geographic relevance.
4. **Catalogue Syncing**:
   - Upload high-resolution photos of your showroom interior, pure cotton weaves, Jaipuri dohars, and mattress craft to Google Business Profile updates.

---

## 6. Performance & Core Web Vitals Checklist

- **Images**: Responsive WebP images rendered with explicit `width`, `height`, and `aspect-ratio` to eliminate Cumulative Layout Shift (CLS).
- **Above-the-Fold Priority**: Only hero images receive `loading="eager"` and `fetchpriority="high"`, ensuring fast Largest Contentful Paint (LCP).
- **Motion Reduction**: All CSS transitions honor `prefers-reduced-motion: reduce`.
- **Pre-rendering & Bundling**: Vite code-splitting delivers chunks under 300kB gzip with instant sub-second page transitions.

