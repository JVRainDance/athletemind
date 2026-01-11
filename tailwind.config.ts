import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Theme-aware colors using CSS variables
        'theme-primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'theme-primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'theme-secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
        'theme-secondary-hover': 'rgb(var(--color-secondary-hover) / <alpha-value>)',
        'theme-accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'theme-accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        '1': 'var(--elevation-1)',
        '2': 'var(--elevation-2)',
        '3': 'var(--elevation-3)',
        '4': 'var(--elevation-4)',
        '5': 'var(--elevation-5)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
        slower: 'var(--motion-slower)',
      },
      transitionTimingFunction: {
        'ease-spring': 'var(--ease-spring)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'bounce-soft': 'bounce-soft 0.6s ease-in-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        // New animations from design system
        'star-sparkle': 'star-sparkle 0.6s ease-in-out',
        'achievement-pop': 'achievement-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10%)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'star-sparkle': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.2) rotate(180deg)' },
        },
        'achievement-pop': {
          '0%': { transform: 'scale(0) rotate(0deg)' },
          '50%': { transform: 'scale(1.1) rotate(5deg)' },
          '70%': { transform: 'scale(1.1) rotate(-5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
export default config


