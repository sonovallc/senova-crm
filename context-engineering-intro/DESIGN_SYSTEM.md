# Senova CRM Design System

## Design Philosophy
A prestigious, editorial-inspired design that evokes luxury financial services and premium enterprise software. No purple gradients, no green accents, no generic tech aesthetics.

## Color Palette - Editorial Luxury

### Primary Colors
```css
--color-midnight: #0f172a;      /* Deep Midnight Navy - Primary brand color */
--color-ink: #1e293b;           /* Ink Blue - Secondary navigation */
--color-slate: #334155;          /* Slate - Tertiary elements */
```

### Accent Colors
```css
--color-gold: #d4a574;          /* Warm Gold - Primary accent */
--color-champagne: #f3e7d3;     /* Champagne - Light accent */
--color-copper: #a67c52;        /* Deep Copper - Interactive hover */
```

### Background Colors
```css
--color-ivory: #fffef7;         /* Ivory - Main background */
--color-cream: #faf9f4;         /* Cream - Secondary background */
--color-pearl: #f5f4ef;         /* Pearl - Tertiary background */
```

### Text Colors
```css
--color-charcoal: #1a1a1a;      /* Charcoal - Primary text */
--color-graphite: #4a4a4a;      /* Graphite - Secondary text */
--color-stone: #737373;         /* Stone - Muted text */
--color-silver: #a8a8a8;        /* Silver - Disabled text */
```

### Status Colors
```css
--color-success: #059669;       /* Emerald - Success states */
--color-warning: #ea580c;       /* Burnt Orange - Warning states */
--color-error: #dc2626;         /* Crimson - Error states */
--color-info: #0284c7;          /* Ocean Blue - Information */
```

## Typography

### Font Stack

**Display Headlines (H1, Hero Text)**
```css
font-family: 'Playfair Display', 'Georgia', serif;
/* Google Fonts: https://fonts.google.com/specimen/Playfair+Display */
```

**Section Headers (H2-H4)**
```css
font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
/* Google Fonts: https://fonts.google.com/specimen/Plus+Jakarta+Sans */
```

**Body Text & UI Elements**
```css
font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
```

**Data & Code**
```css
font-family: 'JetBrains Mono', 'Consolas', monospace;
/* Google Fonts: https://fonts.google.com/specimen/JetBrains+Mono */
```

### Font Sizes (Desktop)
```css
--text-6xl: 4.5rem;      /* Hero headlines */
--text-5xl: 3rem;        /* Page titles */
--text-4xl: 2.25rem;     /* Section headers */
--text-3xl: 1.875rem;    /* Subsection headers */
--text-2xl: 1.5rem;      /* Card titles */
--text-xl: 1.25rem;      /* Large body */
--text-lg: 1.125rem;     /* Emphasized body */
--text-base: 1rem;       /* Body text */
--text-sm: 0.875rem;     /* Small text */
--text-xs: 0.75rem;      /* Tiny text */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900;
```

## CSS Variables Implementation

```css
:root {
  /* Colors */
  --midnight: #0f172a;
  --ink: #1e293b;
  --slate: #334155;
  --gold: #d4a574;
  --champagne: #f3e7d3;
  --copper: #a67c52;
  --ivory: #fffef7;
  --cream: #faf9f4;
  --pearl: #f5f4ef;
  --charcoal: #1a1a1a;
  --graphite: #4a4a4a;
  --stone: #737373;
  --silver: #a8a8a8;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.08);
  --shadow-xl: 0 20px 25px rgba(15, 23, 42, 0.1);

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;

  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
}
```

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        midnight: '#0f172a',
        ink: '#1e293b',
        slate: '#334155',
        gold: '#d4a574',
        champagne: '#f3e7d3',
        copper: '#a67c52',
        ivory: '#fffef7',
        cream: '#faf9f4',
        pearl: '#f5f4ef',
        charcoal: '#1a1a1a',
        graphite: '#4a4a4a',
        stone: '#737373',
        silver: '#a8a8a8',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(15, 23, 42, 0.04)',
        'medium': '0 4px 12px rgba(15, 23, 42, 0.06)',
        'hard': '0 8px 24px rgba(15, 23, 42, 0.08)',
        'glow': '0 0 20px rgba(212, 165, 116, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
}
```

## Component Styling Guidelines

### Buttons

**Primary Button**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--midnight) 0%, var(--ink) 100%);
  color: var(--ivory);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: transparent;
  color: var(--midnight);
  border: 1px solid var(--midnight);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--midnight);
  color: var(--ivory);
}
```

**Accent Button**
```css
.btn-accent {
  background: linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%);
  color: var(--ivory);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.25);
}
```

### Cards

```css
.card {
  background: var(--ivory);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(30, 41, 59, 0.06);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-luxury {
  background: linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%);
  border: 1px solid var(--gold);
  box-shadow: 0 0 20px rgba(212, 165, 116, 0.1);
}
```

### Forms

```css
.input {
  background: var(--ivory);
  border: 1px solid rgba(30, 41, 59, 0.12);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  color: var(--charcoal);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
}

.input-luxury {
  background: linear-gradient(to right, var(--ivory), var(--cream));
  border: 1px solid var(--champagne);
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: 0.015em;
}
```

### Navigation

```css
.nav {
  background: var(--midnight);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(212, 165, 116, 0.1);
}

.nav-link {
  color: var(--ivory);
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--gold);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gold);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.nav-link:hover::after {
  transform: scaleX(1);
}
```

### Tables

```css
.table {
  background: var(--ivory);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-header {
  background: var(--midnight);
  color: var(--ivory);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.table-row {
  border-bottom: 1px solid rgba(30, 41, 59, 0.06);
  transition: background 0.15s ease;
}

.table-row:hover {
  background: var(--cream);
}

.table-cell {
  padding: 1rem;
  color: var(--charcoal);
}
```

## Distinctive Design Elements

### 1. Gold Accent Line
Use thin gold lines as elegant dividers and highlights:
```css
.divider-gold {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
```

### 2. Luxury Gradients
Subtle gradients for premium feel:
```css
.gradient-luxury {
  background: linear-gradient(135deg, var(--ivory) 0%, var(--cream) 50%, var(--pearl) 100%);
}

.gradient-midnight {
  background: linear-gradient(135deg, var(--midnight) 0%, var(--ink) 100%);
}
```

### 3. Typography Hierarchy
Clear visual hierarchy with serif headers:
```css
h1.luxury {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--midnight);
}

.subheading {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.875rem;
  color: var(--gold);
}
```

### 4. Micro-interactions
Subtle animations for premium feel:
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.shimmer {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(212, 165, 116, 0.2) 50%,
    transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

## Implementation Notes

1. **Avoid**: Purple gradients, neon greens, rainbow effects, glass morphism
2. **Embrace**: Deep navies, warm metallics, editorial typography, subtle animations
3. **Font Loading**: Use font-display: swap for optimal loading
4. **Accessibility**: Maintain WCAG AAA contrast ratios with chosen colors
5. **Dark Mode**: Consider inverted cream/midnight palette for dark theme

## Sample Component HTML

```html
<!-- Hero Section -->
<section class="bg-gradient-luxury py-24">
  <div class="container mx-auto px-4">
    <h1 class="font-display text-6xl text-midnight mb-4">
      Welcome to Senova
    </h1>
    <p class="subheading text-gold mb-8">
      ENTERPRISE CRM REIMAGINED
    </p>
    <button class="btn-primary">
      Get Started
    </button>
  </div>
</section>

<!-- Feature Card -->
<div class="card-luxury">
  <div class="divider-gold mb-4"></div>
  <h3 class="font-sans text-2xl font-semibold text-midnight mb-2">
    Premium Features
  </h3>
  <p class="text-graphite leading-relaxed">
    Experience the luxury of seamless customer relationship management.
  </p>
</div>
```

This design system creates a sophisticated, editorial aesthetic that stands apart from typical AI-generated designs while maintaining excellent usability and modern web standards.