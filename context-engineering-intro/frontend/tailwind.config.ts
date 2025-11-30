import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Senova Brand Colors - Solar Flare Hot Color Design System
        senova: {
          primary: '#ff6b35',        // Vibrant Orange
          'primary-dark': '#e85a24', // Darker Orange
          'primary-light': '#ff8f5c', // Lighter Orange
          accent: '#ffc107',         // Bright Yellow
          'accent-light': '#ffd54f', // Light Yellow
          success: '#ffc107',        // Use yellow as success, not green
          hot: '#ff5252',            // Hot Red
          warm: '#ff7043',           // Warm Orange-Red
          secondary: '#ff5252',      // Hot Red as secondary
          warning: '#ff5252',        // Hot Red for warnings
          info: '#ffc107',          // Bright Yellow for info
          dark: '#2c2c2c',          // Darker gray for contrast
          'gray-900': '#3d3d3d',
          'gray-700': '#5c5c5c',
          'gray-500': '#7d7d7d',
          'gray-400': '#9e9e9e',
          'gray-300': '#c4c4c4',
          'gray-100': '#f5f5f5',
          'off-white': '#fffbf5',   // Warm off-white
          steel: '#5c5c5c',
          white: '#ffffff',
          'bg-primary': '#fffbf5',   // Warm off-white background
          'bg-secondary': '#fff8f0',
          'bg-tertiary': '#fff3e8',
        },
        // NEW Blue Accent Colors - Top level for proper Tailwind support
        'senova-electric': {         // Vibrant Metallic Blue (Public Website)
          DEFAULT: '#0066ff',
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        'senova-sky': {              // Soft Sky Blue (CRM Dashboard)
          DEFAULT: '#4a90e2',
          50: '#edf4fc',
          100: '#dae9f9',
          200: '#b5d3f3',
          300: '#90bded',
          400: '#6ba3e9',
          500: '#4a90e2',
          600: '#3a7bc8',
          700: '#2e6196',
          800: '#224864',
          900: '#162f42',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(50px)', opacity: '0' },
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
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.8s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 1s ease-out',
        'scale-in': 'scale-in 0.5s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
