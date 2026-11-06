/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colours resolve from CSS variables for live accent theming
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        earth: 'rgb(var(--c-earth) / <alpha-value>)',
        walnut: 'rgb(var(--c-walnut) / <alpha-value>)',
        olive: 'rgb(var(--c-olive) / <alpha-value>)',
        charcoal: 'rgb(var(--c-charcoal) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--c-accent-soft) / <alpha-value>)',

        // Premium Indian Handloom Heritage Palette
        brand: {
          beige: '#F3EBDD',      // Warm Beige
          earth: '#75634D',      // Earthy Brown
          olive: '#788064',      // Muted Olive
          walnut: '#49382E',     // Deep Walnut
          linen: '#FAF7F2',      // Natural Linen
          ivory: '#FFFFF8',      // Pure Ivory
          stone: '#E5DFD5',      // Soft Stone
          clay: '#C89D7C',       // Muted Clay
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
        sans: ['Inter', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '80rem',
      },
      boxShadow: {
        luxury: '0 10px 30px -10px rgba(73, 56, 46, 0.08)',
        'luxury-hover': '0 20px 40px -15px rgba(73, 56, 46, 0.16)',
        'card-subtle': '0 2px 8px -2px rgba(73, 56, 46, 0.05)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
