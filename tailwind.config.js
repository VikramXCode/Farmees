/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // FarmEase Custom Color Palette
        farm: {
          primary: {
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
          earth: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          },
          accent: {
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16',
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314',
          }
        },
        // Status Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        malayalam: ['Noto Sans Malayalam', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'farm': '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -2px rgba(34, 197, 94, 0.1)',
        'farm-lg': '0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -4px rgba(34, 197, 94, 0.1)',
        'farm-xl': '0 20px 25px -5px rgba(34, 197, 94, 0.1), 0 8px 10px -6px rgba(34, 197, 94, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-farm-primary': {
          color: theme('colors.farm.primary.600'),
        },
        '.bg-farm-primary': {
          backgroundColor: theme('colors.farm.primary.600'),
        },
        '.border-farm-primary': {
          borderColor: theme('colors.farm.primary.600'),
        },
        '.text-farm-earth': {
          color: theme('colors.farm.earth.600'),
        },
        '.bg-farm-earth': {
          backgroundColor: theme('colors.farm.earth.100'),
        },
        '.border-farm-earth': {
          borderColor: theme('colors.farm.earth.200'),
        },
        // Mobile-first responsive utilities
        '.container-farm': {
          maxWidth: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            maxWidth: '1024px',
          },
          '@screen xl': {
            maxWidth: '1280px',
          },
        },
        // Card variants
        '.card-farm': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.farm'),
          border: `1px solid ${theme('colors.farm.primary.100')}`,
          padding: theme('spacing.4'),
        },
        '.card-farm-elevated': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.farm-lg'),
          border: `1px solid ${theme('colors.farm.primary.200')}`,
          padding: theme('spacing.6'),
        },
        // Button variants
        '.btn-farm-primary': {
          backgroundColor: theme('colors.farm.primary.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.farm.primary.700'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.farm-lg'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.farm.primary.200')}`,
          },
        },
        '.btn-farm-secondary': {
          backgroundColor: theme('colors.farm.earth.100'),
          color: theme('colors.farm.earth.700'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.farm.earth.200'),
            transform: 'translateY(-1px)',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.farm.earth.300')}`,
          },
        },
        // Input variants
        '.input-farm': {
          width: '100%',
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          border: `1px solid ${theme('colors.gray.300')}`,
          borderRadius: theme('borderRadius.lg'),
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.farm.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.farm.primary.100')}`,
          },
          '&::placeholder': {
            color: theme('colors.gray.400'),
          },
        },
        // Status indicators
        '.status-high': {
          color: theme('colors.danger.600'),
          backgroundColor: theme('colors.danger.100'),
          borderColor: theme('colors.danger.200'),
        },
        '.status-medium': {
          color: theme('colors.warning.600'),
          backgroundColor: theme('colors.warning.100'),
          borderColor: theme('colors.warning.200'),
        },
        '.status-low': {
          color: theme('colors.success.600'),
          backgroundColor: theme('colors.success.100'),
          borderColor: theme('colors.success.200'),
        },
        // Mobile optimizations
        '.mobile-touch': {
          minHeight: '44px',
          minWidth: '44px',
        },
        '.mobile-text': {
          fontSize: theme('fontSize.base'),
          lineHeight: theme('lineHeight.relaxed'),
        },
        '.mobile-spacing': {
          padding: theme('spacing.4'),
          '@screen sm': {
            padding: theme('spacing.6'),
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
