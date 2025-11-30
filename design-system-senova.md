# Senova CRM Design System

*Comprehensive design system extracted from AudienceLab.io (visual aesthetics) and Monday.com (animations & interactions)*

---

## Color Palette

### Primary Colors
- **Primary Purple**: `#4A00D4` - Main brand color (from buttons, CTAs, links)
- **Primary Green**: `#61CE70` - Success/positive actions
- **Accent Green**: `#B4F9B2` - Light accent for highlights and buttons

### Secondary Colors
- **Magenta**: `#CC3366` - Secondary accent for emphasis
- **Cyan**: `#6EC1E4` - Information and secondary highlights
- **Orange**: `#C02B0A` - Warning/attention states

### Neutral Colors
- **Pure Black**: `#000000` - High contrast text
- **Off Black**: `#101010` - Softer black for backgrounds
- **Dark Gray**: `#1D1B21` - Dark sections and overlays
- **Navy**: `#112337` - Dark blue-gray for depth
- **Medium Gray**: `#333333` - Body text and secondary content
- **Pure White**: `#FFFFFF` - Primary background and contrast

### Semantic Colors
- **Success**: `#61CE70` (Primary Green)
- **Warning**: `#C02B0A` (Orange)
- **Error**: `#CC3366` (Magenta)
- **Info**: `#6EC1E4` (Cyan)

---

## Typography

### Font Families
```css
/* Primary Font Stack - Modern Sans */
--font-primary: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Display Font - For Headlines */
--font-display: "Host Grotesk", sans-serif;

/* Body Font - For Content */
--font-body: "Noto Sans", sans-serif;

/* System Fallback */
--font-system: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Type Scale
```css
/* Display/Hero */
--text-hero: 74px;       /* line-height: 96px */
--text-display: 64px;    /* line-height: 80px */

/* Headings */
--text-h1: 48px;         /* line-height: 60px */
--text-h2: 34px;         /* line-height: 44px */
--text-h3: 25px;         /* line-height: 35px */
--text-h4: 20px;         /* line-height: 28px */
--text-h5: 18px;         /* line-height: 26px */
--text-h6: 16px;         /* line-height: 24px */

/* Body */
--text-body-lg: 18px;    /* line-height: 28px */
--text-body: 16px;       /* line-height: 24px */
--text-body-sm: 14px;    /* line-height: 20px */
--text-caption: 12px;    /* line-height: 16px */
```

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

---

## Spacing System

Based on 4px grid system:
```css
--space-xxs: 4px;
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
--space-4xl: 96px;
--space-5xl: 128px;
```

### Common Padding Patterns
- Buttons: `11px 25px`
- Cards: `24px`
- Sections: `48px 0`
- Container: `0 16px` (mobile), `0 32px` (desktop)

---

## Animation System

### Timing Functions
```css
/* Duration Scale */
--duration-instant: 0.05s;
--duration-fast: 0.1s;
--duration-quick: 0.15s;
--duration-moderate: 0.2s;
--duration-normal: 0.3s;
--duration-slow: 0.4s;
--duration-slower: 0.5s;
--duration-lazy: 0.6s;
--duration-extended: 0.8s;
--duration-long: 1s;
```

### Easing Functions
```css
/* Standard Easings */
--ease-linear: linear;
--ease-in: ease-in;
--ease-out: ease-out;
--ease-in-out: ease-in-out;

/* Custom Cubic Beziers (from Monday.com) */
--ease-smooth: cubic-bezier(0.25, 1, 0.5, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Micro-interactions

#### Button Hover States
```css
.button {
  transition: all 0.2s ease-in-out;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(74, 0, 212, 0.2);
}

.button:active {
  transform: translateY(0);
}
```

#### Link Hover
```css
.link {
  transition: color 0.2s ease-in-out;
  position: relative;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-purple);
  transition: width 0.3s ease-out;
}

.link:hover::after {
  width: 100%;
}
```

### Page Transitions

#### Fade In Animation
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
}
```

#### Stagger Effect (from Monday.com)
```css
@keyframes textAnimation {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Apply with incremental delays */
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
/* ... continue pattern */
```

### Loading States

#### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

#### Spinner
```css
.spinner {
  border: 3px solid rgba(74, 0, 212, 0.1);
  border-top-color: #4A00D4;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Component Patterns

### Buttons

#### Primary Button
```css
.btn-primary {
  background: #B4F9B2;
  color: #4A00D4;
  padding: 11px 25px;
  border-radius: 50px;
  border: 0.8px solid #B4F9B2;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.btn-primary:hover {
  background: #4A00D4;
  color: #B4F9B2;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(74, 0, 212, 0.3);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: #4A00D4;
  padding: 11px 25px;
  border-radius: 50px;
  border: 2px solid #4A00D4;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}

.btn-secondary:hover {
  background: #4A00D4;
  color: white;
}
```

#### Button Sizes
- Small: `padding: 8px 16px; font-size: 14px;`
- Medium: `padding: 11px 25px; font-size: 15px;` (default)
- Large: `padding: 14px 32px; font-size: 16px;`

### Cards

```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### Forms

#### Input Fields
```css
.input {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #4A00D4;
  box-shadow: 0 0 0 3px rgba(74, 0, 212, 0.1);
}
```

#### Focus States
```css
.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: #4A00D4;
  box-shadow: 0 0 0 3px rgba(74, 0, 212, 0.1);
}
```

### Navigation

#### Header Pattern
```css
.header {
  background: white;
  padding: 16px 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.nav-link {
  color: #333333;
  padding: 8px 16px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #4A00D4;
}

.nav-link.active {
  color: #4A00D4;
  font-weight: 600;
}
```

#### Sidebar Pattern
```css
.sidebar {
  background: #1D1B21;
  width: 260px;
  height: 100vh;
  padding: 24px 16px;
  overflow-y: auto;
}

.sidebar-item {
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-item.active {
  background: #4A00D4;
}
```

---

## CSS Variables Template

```css
:root {
  /* Colors */
  --color-primary: #4A00D4;
  --color-primary-light: #B4F9B2;
  --color-secondary: #CC3366;
  --color-success: #61CE70;
  --color-warning: #C02B0A;
  --color-info: #6EC1E4;
  --color-black: #000000;
  --color-dark: #1D1B21;
  --color-gray: #333333;
  --color-light-gray: #e0e0e0;
  --color-white: #FFFFFF;

  /* Typography */
  --font-primary: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: "Host Grotesk", sans-serif;

  /* Font Sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 25px;
  --text-3xl: 34px;
  --text-4xl: 48px;
  --text-5xl: 64px;
  --text-hero: 74px;

  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 50px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16);

  /* Animations */
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.5s;
  --ease-default: ease-in-out;
  --ease-smooth: cubic-bezier(0.25, 1, 0.5, 1);

  /* Z-index */
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;
}
```

---

## Implementation Notes

### Key Design Principles

1. **Modern & Clean**: Use ample whitespace, clean lines, and subtle shadows
2. **Vibrant Accents**: Purple and green create a fresh, modern tech aesthetic
3. **Smooth Interactions**: All interactive elements have subtle transitions
4. **Consistent Spacing**: Stick to the 4px grid system
5. **Accessibility**: Ensure proper color contrast and focus states

### Animation Best Practices

1. Keep animations under 0.5s for UI elements
2. Use `ease-in-out` for most transitions
3. Add stagger effects for lists and grids
4. Implement skeleton loaders for async content
5. Use `transform` and `opacity` for performance

### Responsive Considerations

1. Scale typography down 10-15% on mobile
2. Increase touch targets to minimum 44px
3. Simplify animations on mobile devices
4. Stack cards vertically on small screens
5. Use overflow scrolling for tables

---

## Visual References

Screenshots have been saved to:
- `C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\design-reference\`

Key reference points:
- AudienceLab.io: Modern gradient overlays, bold typography, vibrant CTAs
- Monday.com: Smooth micro-interactions, staggered animations, loading states

---

*This design system provides a comprehensive foundation for the Senova CRM rebrand, combining AudienceLab's bold visual aesthetic with Monday.com's sophisticated interaction patterns.*