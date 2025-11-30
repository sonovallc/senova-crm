# Senova CRM Design System - "Solar Flare" Theme

## Design Philosophy

The Solar Flare design system embodies energy, warmth, and innovation. Built with vibrant oranges, electric yellows, and coral reds, it creates an exciting, professional interface that stands out from generic corporate designs.

### Core Principles
- **Energetic**: Bold, vibrant colors that inspire action
- **Warm**: Inviting tones that feel human and approachable
- **Professional**: Sophisticated color balance with strong contrast
- **Distinctive**: Unique aesthetic that avoids generic AI design patterns

## Color Palette

### Primary Colors - Orange Spectrum
```css
--senova-primary: #ff6b35;        /* Bright Orange - Main brand color */
--senova-primary-dark: #e85a24;   /* Deep Orange - Hover states */
--senova-primary-light: #ff8f5c;  /* Light Orange - Backgrounds */
```

### Accent Colors - Yellow & Red
```css
--senova-accent: #ffc107;         /* Electric Amber - CTAs */
--senova-accent-light: #ffd54f;   /* Bright Yellow - Highlights */
--senova-hot: #ff5252;            /* Coral Red - Notifications */
--senova-warm: #ff7043;           /* Deep Coral - Active states */
```

### Neutral Scale - Warm Tones
```css
--senova-dark: #2c2c2c;          /* Warm Charcoal - Primary text */
--senova-gray-900: #3d3d3d;      /* Dark gray - Headers */
--senova-gray-700: #5c5c5c;      /* Medium dark - Secondary text */
--senova-gray-500: #7d7d7d;      /* Medium - Muted text */
--senova-gray-400: #9e9e9e;      /* Light medium - Placeholders */
--senova-gray-300: #c4c4c4;      /* Light - Borders */
--senova-gray-100: #f5f5f5;      /* Very light - Backgrounds */
--senova-off-white: #fffbf5;     /* Warm cream - Page background */
--senova-white: #ffffff;         /* Pure white - Cards */
```

### Background Colors
```css
--senova-bg-primary: #fffbf5;    /* Warm cream - Main background */
--senova-bg-secondary: #fff8f0;  /* Peachy cream - Sections */
--senova-bg-tertiary: #fff3e8;   /* Light orange tint - Highlights */
```

### Semantic Colors
```css
--senova-success: #ff9800;       /* Warm orange for success */
--senova-warning: #ffc107;       /* Amber for warnings */
--senova-error: #ff5252;         /* Coral red for errors */
--senova-info: #ff6b35;          /* Primary orange for info */
```

## Typography

### Font Stack
```css
--font-display: 'Bricolage Grotesque', system-ui, sans-serif;
--font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Font Weights - Extreme Contrasts
```css
--font-thin: 200;
--font-regular: 400;
--font-semibold: 600;
--font-bold: 700;
--font-black: 800;
```

### Type Scale
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
--text-6xl: 3.75rem;    /* 60px */
--text-7xl: 4.5rem;     /* 72px */
```

## Gradients

### Hero Gradients
```css
/* Sunset Gradient - Primary hero */
.gradient-sunset {
  background: linear-gradient(135deg, #ff6b35 0%, #ffc107 100%);
}

/* Fire Gradient - Hot CTAs */
.gradient-fire {
  background: linear-gradient(to right, #ff6b35, #ff5252);
}

/* Solar Gradient - Warm backgrounds */
.gradient-solar {
  background: linear-gradient(180deg, #ffc107 0%, #ff6b35 50%, #ff5252 100%);
}

/* Glow Gradient - Subtle backgrounds */
.gradient-glow {
  background: linear-gradient(135deg, #fff8f0 0%, #fff3e8 100%);
}
```

### Mesh Backgrounds
```css
/* Warm Mesh - Page backgrounds */
.mesh-warm {
  background:
    radial-gradient(at 40% 20%, rgba(255, 107, 53, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(255, 193, 7, 0.15) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(255, 82, 82, 0.1) 0px, transparent 50%),
    #fffbf5;
}

/* Active Mesh - Interactive elements */
.mesh-active {
  background:
    radial-gradient(at 50% 50%, rgba(255, 107, 53, 0.3) 0px, transparent 40%),
    radial-gradient(at 80% 80%, rgba(255, 193, 7, 0.25) 0px, transparent 40%),
    #ffffff;
}
```

## Shadows

### Shadow System
```css
--shadow-xs: 0 1px 2px rgba(44, 44, 44, 0.05);
--shadow-sm: 0 2px 4px rgba(44, 44, 44, 0.06);
--shadow-md: 0 4px 8px rgba(44, 44, 44, 0.08);
--shadow-lg: 0 8px 16px rgba(44, 44, 44, 0.1);
--shadow-xl: 0 16px 32px rgba(44, 44, 44, 0.12);
--shadow-2xl: 0 24px 48px rgba(44, 44, 44, 0.14);

/* Colored Shadows */
--shadow-primary: 0 8px 24px rgba(255, 107, 53, 0.25);
--shadow-glow: 0 0 40px rgba(255, 193, 7, 0.3);
--shadow-hot: 0 4px 20px rgba(255, 82, 82, 0.2);
--shadow-warm: 0 12px 32px rgba(255, 112, 67, 0.15);
```

### Glow Effects
```css
/* Orange Glow */
.glow-orange {
  box-shadow:
    0 0 20px rgba(255, 107, 53, 0.4),
    0 0 40px rgba(255, 107, 53, 0.2);
}

/* Yellow Glow */
.glow-yellow {
  box-shadow:
    0 0 20px rgba(255, 193, 7, 0.5),
    0 0 40px rgba(255, 193, 7, 0.25);
}

/* Hot Glow */
.glow-hot {
  box-shadow:
    0 0 20px rgba(255, 82, 82, 0.4),
    0 0 40px rgba(255, 82, 82, 0.2);
}
```

## Glassmorphism

### Glass Effects
```css
/* Warm Glass */
.glass-warm {
  background: rgba(255, 251, 245, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 53, 0.1);
}

/* Hot Glass */
.glass-hot {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 82, 82, 0.15);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.1);
}

/* Solar Glass */
.glass-solar {
  background: linear-gradient(
    135deg,
    rgba(255, 193, 7, 0.1) 0%,
    rgba(255, 107, 53, 0.1) 100%
  );
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 193, 7, 0.2);
}
```

## Spacing System

### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;
```

## Animation

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 250ms ease;
--transition-slow: 350ms ease;
--transition-slower: 500ms ease;

/* Spring animations */
--spring-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--spring-smooth: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Keyframes
```css
@keyframes pulse-orange {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; background-color: #ff8f5c; }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.4); }
  50% { box-shadow: 0 0 40px rgba(255, 193, 7, 0.6); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## Component Patterns

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(to right, #ff6b35, #ff7043);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  transition: all 250ms ease;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
}

.btn-primary:hover {
  background: linear-gradient(to right, #e85a24, #ff5252);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.35);
  transform: translateY(-2px);
}
```

#### Hot Button
```css
.btn-hot {
  background: linear-gradient(135deg, #ff5252, #ff6b35);
  color: white;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(255, 82, 82, 0.3);
}
```

### Cards

```css
.card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(44, 44, 44, 0.06);
  border: 1px solid rgba(255, 107, 53, 0.08);
  transition: all 250ms ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
  border-color: rgba(255, 107, 53, 0.2);
  transform: translateY(-4px);
}
```

### Forms

```css
.input {
  background: white;
  border: 2px solid #c4c4c4;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: all 200ms ease;
}

.input:focus {
  border-color: #ff6b35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  outline: none;
}
```

## Responsive Breakpoints

```css
--screen-xs: 475px;
--screen-sm: 640px;
--screen-md: 768px;
--screen-lg: 1024px;
--screen-xl: 1280px;
--screen-2xl: 1536px;
```

## Usage Guidelines

### Color Usage
1. **Primary Orange** (#ff6b35): Main brand color, primary buttons, active states
2. **Accent Yellow** (#ffc107): CTAs, highlights, success states
3. **Hot Red** (#ff5252): Urgent actions, errors, notifications
4. **Warm Coral** (#ff7043): Hover states, secondary actions
5. **Neutrals**: Text and backgrounds, always use warm-toned grays

### Typography Guidelines
1. Use **Bricolage Grotesque** for headings and display text
2. Use **Plus Jakarta Sans** for body text and UI elements
3. Maintain extreme weight contrasts (200 vs 800) for visual hierarchy
4. Never use weights 400-600 together (too similar)

### Do's and Don'ts

#### DO:
- Use warm color combinations
- Apply orange/yellow glows to interactive elements
- Maintain high contrast for accessibility
- Use gradient backgrounds sparingly for impact
- Keep text dark (#2c2c2c) on light backgrounds

#### DON'T:
- Use purple, green, or navy colors
- Apply more than 2 colors in a gradient
- Use cold/blue-toned grays
- Overcomplicate with too many glow effects
- Forget hover states on interactive elements

## Accessibility

### Color Contrast
- Primary orange on white: 3.56:1 (Use for large text only)
- Dark text on cream: 15.2:1 (Excellent)
- White on primary orange: 3.56:1 (Use bold/large text)
- Dark text on white: 16.5:1 (Excellent)

### Focus States
Always provide visible focus indicators:
```css
:focus-visible {
  outline: 2px solid #ff6b35;
  outline-offset: 2px;
}
```

## Implementation Notes

### Tailwind Classes
```html
<!-- Primary button -->
<button class="bg-gradient-to-r from-senova-primary to-senova-warm text-white
               font-semibold px-6 py-3 rounded-lg shadow-primary
               hover:shadow-glow transition-all duration-250">
  Get Started
</button>

<!-- Card with hover -->
<div class="bg-white rounded-2xl p-6 border border-senova-primary/10
            shadow-md hover:shadow-primary hover:-translate-y-1
            transition-all duration-250">
  Content
</div>
```

### CSS Variables Setup
All colors are available as CSS variables and Tailwind classes:
- CSS: `var(--senova-primary)`
- Tailwind: `bg-senova-primary`, `text-senova-primary`, `border-senova-primary`

## Version History

- v1.0.0 - Initial Solar Flare design system
- Created: November 2024
- Theme: Hot, vibrant, energetic colors only