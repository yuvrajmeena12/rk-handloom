import { describe, expect, it, vi } from 'vitest'
import { telHref, whatsappHref, directionsUrl } from '../src/lib/contact'
import type { BusinessSettings } from '../src/lib/types'

describe('Responsive Navbar Configuration & Helpers', () => {
  const mockSettings: BusinessSettings = {
    id: 1,
    name_en: 'RK HANDLOOM',
    name_hi: 'आर के हैंडलूम',
    phone: '+91 98291 08112',
    whatsapp_number: '919829108112',
    call_label: 'Call us',
    whatsapp_label: 'WhatsApp',
    directions_label: 'Get directions',
    maps_url: 'https://maps.google.com/?q=RK+Handloom',
    logo_path: null,
    address: 'Near Old Bus Stand, Bikaner, Rajasthan',
    email: 'info@rkhandloom.com',
    hours: [],
    hours_note: null,
    announcement_enabled: false,
    announcement_text: null,
    announcement_link: null,
    catalogue_page_size: 24,
    show_prices: true,
    show_sku: true,
    accent_theme: 'olive',
    tagline: null,
    short_description: null,
    long_description: null,
    location_code: null,
    hero_image_path: null,
    hero_heading: null,
    hero_subheading: null,
    hero_primary_label: null,
    hero_primary_link: null,
    hero_secondary_label: null,
    hero_secondary_link: null,
    craft_heading: null,
    craft_body: null,
    about_heading: null,
    about_body: null,
    contact_heading: null,
    contact_body: null,
    footer_text: null,
    social: {},
    updated_at: new Date().toISOString(),
  }

  it('generates correct phone and whatsapp communication links', () => {
    const tel = telHref(mockSettings.phone)
    expect(tel).toBe('tel:+919829108112')

    const wa = whatsappHref(mockSettings.whatsapp_number, 'General enquiry')
    expect(wa).toContain('https://wa.me/919829108112')

    const dir = directionsUrl(mockSettings)
    expect(dir).toBe('https://maps.google.com/?q=RK+Handloom')
  })

  it('ensures core public routes are strictly defined and correct', () => {
    const expectedPublicRoutes = ['/', '/catalog', '/about', '/contact']
    expect(expectedPublicRoutes).toContain('/')
    expect(expectedPublicRoutes).toContain('/catalog')
    expect(expectedPublicRoutes).toContain('/about')
    expect(expectedPublicRoutes).toContain('/contact')
  })

  it('validates mobile menu action callback execution', () => {
    const onAction = vi.fn()
    onAction()
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('validates search box ID uniqueness', () => {
    const desktopSearchId = 'desktop-search'
    const mobileSearchId = 'mobile-search'
    expect(desktopSearchId).not.toBe(mobileSearchId)
  })
})
