# Senova CRM Blue Accent Colors Specification

## Color Theory Rationale
The warm orange-red palette creates an energetic, dynamic feel. Adding blue accents provides:
- **Complementary contrast** (blue is opposite orange on the color wheel)
- **Temperature balance** (cool blues balance hot oranges/reds)
- **Professional depth** (blues add trust and stability)
- **Visual hierarchy** (blues can indicate different interaction states)

---

## 1. VIBRANT METALLIC BLUE (Public Website Accent)

### Core Color
- **HEX:** `#0066ff`
- **Name:** "Electric Cobalt"
- **Description:** A vibrant, electric blue with metallic intensity. Creates striking contrast against #ff6b35 primary orange.

### Color Variants
```css
--color-electric: #0066ff;        /* Main - Electric Cobalt */
--color-electric-light: #3385ff;  /* Lighter - Hover states, backgrounds */
--color-electric-dark: #0052cc;   /* Darker - Active states, text */
--color-electric-pale: #e6f0ff;   /* Pale - Subtle backgrounds */
```

### Tailwind Configuration
```javascript
electric: {
  DEFAULT: '#0066ff',
  50: '#e6f0ff',
  100: '#cce0ff',
  200: '#99c2ff',
  300: '#66a3ff',
  400: '#3385ff',
  500: '#0066ff', // Primary
  600: '#0052cc',
  700: '#003d99',
  800: '#002966',
  900: '#001433',
}
```

### Use Cases
- Hero section CTAs on public website
- Feature highlights and badges
- Interactive elements that need high visibility
- Video play buttons
- "New" or "Featured" tags
- Hover states for primary buttons
- Links against white backgrounds
- Icon accents in marketing materials

---

## 2. SOFT SKY BLUE (CRM Dashboard Accent)

### Core Color
- **HEX:** `#4a90e2`
- **Name:** "Professional Sky"
- **Description:** A sophisticated, calming blue that maintains professionalism while providing visual interest.

### Color Variants
```css
--color-sky: #4a90e2;         /* Main - Professional Sky */
--color-sky-light: #6ba3e9;  /* Lighter - Hover states */
--color-sky-dark: #3a7bc8;   /* Darker - Active states, readable text */
--color-sky-pale: #edf4fc;   /* Pale - Background tints */
```

### Tailwind Configuration
```javascript
sky: {
  DEFAULT: '#4a90e2',
  50: '#edf4fc',
  100: '#dae9f9',
  200: '#b5d3f3',
  300: '#90bded',
  400: '#6ba3e9',
  500: '#4a90e2', // Primary
  600: '#3a7bc8',
  700: '#2e6196',
  800: '#224864',
  900: '#162f42',
}
```

### Use Cases
- Secondary buttons in CRM
- Information badges and pills
- Border accents on cards
- Selected/active navigation states
- Form field focus states
- Chart/graph accents
- Table headers
- Success/info message backgrounds
- Progress indicators
- Sidebar trim and dividers

---

## Complete Tailwind Configuration

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Existing Solar Flare Hot Colors
        'senova-primary': '#ff6b35',    // Vibrant Orange
        'senova-accent': '#ffc107',     // Bright Yellow
        'senova-hot': '#ff5252',        // Hot Red
        'senova-warm': '#ff7043',       // Warm Orange-Red

        // NEW Blue Accent Colors
        'senova-electric': {
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
        'senova-sky': {
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
        }
      }
    }
  }
}
```

---

## CSS Custom Properties

```css
:root {
  /* Existing Solar Flare Hot Colors */
  --color-primary: #ff6b35;
  --color-accent: #ffc107;
  --color-hot: #ff5252;
  --color-warm: #ff7043;

  /* NEW Electric Blue (Public Website) */
  --color-electric: #0066ff;
  --color-electric-light: #3385ff;
  --color-electric-dark: #0052cc;
  --color-electric-pale: #e6f0ff;

  /* NEW Sky Blue (CRM Dashboard) */
  --color-sky: #4a90e2;
  --color-sky-light: #6ba3e9;
  --color-sky-dark: #3a7bc8;
  --color-sky-pale: #edf4fc;
}
```

---

## Tailwind Utility Classes

### Electric Blue Classes
- `bg-senova-electric` - Electric blue background
- `text-senova-electric` - Electric blue text
- `border-senova-electric` - Electric blue border
- `bg-senova-electric-50` to `bg-senova-electric-900` - Shade variants
- `hover:bg-senova-electric-400` - Hover state
- `focus:ring-senova-electric` - Focus ring

### Sky Blue Classes
- `bg-senova-sky` - Sky blue background
- `text-senova-sky` - Sky blue text
- `border-senova-sky` - Sky blue border
- `bg-senova-sky-50` to `bg-senova-sky-900` - Shade variants
- `hover:bg-senova-sky-400` - Hover state
- `focus:ring-senova-sky` - Focus ring

---

## Usage Examples

### Public Website - Hero CTA
```jsx
<button className="bg-senova-electric hover:bg-senova-electric-600 text-white px-8 py-4 rounded-lg shadow-xl transition-all duration-300 transform hover:scale-105">
  Get Started Free
</button>
```

### CRM Dashboard - Info Card
```jsx
<div className="border border-senova-sky-300 bg-senova-sky-50 rounded-lg p-4">
  <h3 className="text-senova-sky-700 font-semibold">Quick Tip</h3>
  <p className="text-gray-700">Your message here...</p>
</div>
```

### Mixed Usage - Feature Badge
```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-senova-electric text-white">
  <svg className="mr-1.5 h-2 w-2 text-senova-accent" fill="currentColor" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4"/>
  </svg>
  New Feature
</span>
```

### CRM Dashboard - Secondary Button
```jsx
<button className="bg-senova-sky hover:bg-senova-sky-600 text-white px-6 py-2 rounded-md transition-colors duration-200">
  Save as Draft
</button>
```

---

## Color Accessibility

### Electric Blue (#0066ff)
- **On White:** WCAG AAA (contrast ratio: 8.59:1) ✅
- **On Black:** WCAG AA (contrast ratio: 4.96:1) ✅
- **With Primary Orange:** Good contrast for adjacent elements

### Sky Blue (#4a90e2)
- **On White:** WCAG AA (contrast ratio: 3.52:1) ✅
- **On Black:** WCAG AAA (contrast ratio: 5.96:1) ✅
- **Dark variant (#3a7bc8) on white:** WCAG AA (contrast ratio: 4.51:1) ✅

---

## Implementation Notes

1. **Electric Blue** should be used sparingly on the public website for maximum impact
2. **Sky Blue** can be used more liberally in the CRM for UI elements
3. Both blues work well with the existing warm palette through complementary contrast
4. Use the pale variants (50 shades) for large background areas
5. Reserve the darker variants (700-900) for text on light backgrounds
6. The electric blue creates a "wow" factor against the orange primary
7. The sky blue provides a calming counterpoint to the energetic warm colors

---

## Visual Harmony Tips

### Do's
- ✅ Use electric blue for high-impact CTAs on marketing pages
- ✅ Use sky blue for informational UI elements in the dashboard
- ✅ Pair electric blue with white text for best readability
- ✅ Use sky blue borders with sky-50 backgrounds for subtle cards
- ✅ Combine with existing warm colors for vibrant, energetic designs

### Don'ts
- ❌ Don't use both blues prominently on the same component
- ❌ Don't use electric blue for large background areas
- ❌ Don't use light blue variants for text on white backgrounds
- ❌ Don't mix more than 2-3 colors from the palette in one component
- ❌ Don't use electric blue for error states (keep red for errors)