# Theme & Background System

## Overview

NirikshanAI uses a sophisticated theme system that supports both a stunning animated landing page background and traditional light/dark mode theming for authenticated pages.

## Architecture

### 1. Landing Page (Public)
- **Background**: Always dark with animated GitHub contribution grid
- **Theme Independence**: Visual appearance doesn't change with theme toggle
- **Why**: Creates a consistent, impressive first impression
- **Implementation**: Fixed `bg-black` with `ContributionGridBackground` component

### 2. Authenticated Pages (Dashboard, Admin, Settings)
- **Background**: Theme-aware (light/dark mode)
- **Theme Dependent**: Respects user's theme preference
- **Why**: Provides user choice and comfort for extended use
- **Implementation**: Uses `bg-gray-50 dark:bg-gray-900` pattern

## How It Works

### Global CSS (`app/globals.css`)

```css
/* Default transparent body to show page-specific backgrounds */
body {
  background-color: transparent;
}

/* Theme-specific backgrounds only apply when theme class is set */
html.light body {
  background-color: #f9fafb; /* gray-50 */
}

html.dark body {
  background-color: #111827; /* gray-900 */
}
```

**Key Points:**
- Body is transparent by default
- Backgrounds only apply when `html.light` or `html.dark` classes are present
- Allows pages to override with their own backgrounds

### Theme Provider (`components/ThemeProvider.tsx`)

- Manages theme state (light/dark)
- Persists preference in localStorage
- Applies theme class to `<html>` element
- Prevents hydration mismatches
- Checks system preference as fallback

### Landing Page (`app/page.tsx`)

```jsx
<main className="min-h-screen bg-black ...">
  <ContributionGridBackground />
  <div className="relative z-10">
    {/* Content */}
  </div>
</main>
```

**Key Points:**
- Fixed `bg-black` ensures dark background
- `ContributionGridBackground` renders below content (`z-0` or negative z-index)
- Content sits above with `z-10`
- Theme toggle visible but doesn't affect landing page appearance

### Contribution Grid Background (`components/ContributionGridBackground.tsx`)

**Features:**
- 7 rows × 52 columns grid (GitHub-style)
- Animated cells with random intensity changes
- Green color scheme (`#22c55e`)
- Glow effects and soft filtering
- Vignette overlay for depth
- SSR-safe implementation

**Animation:**
- Updates every 900ms
- ~8% of cells change per cycle
- Random intensity values (0-1)
- Smooth transitions

## Visual Hierarchy

```
┌─────────────────────────────────────┐
│ Landing Page                         │
│ ├─ bg-black (fixed)                 │
│ ├─ ContributionGridBackground        │
│ │   └─ Animated SVG grid            │
│ └─ Content (z-10)                   │
│     ├─ Theme Toggle (visible)       │
│     └─ CTA buttons, forms, etc.     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Dashboard/Admin Pages                │
│ ├─ bg-gray-50 dark:bg-gray-900      │
│ │   (theme-aware)                   │
│ └─ Content                           │
│     ├─ User Profile Dropdown         │
│     └─ Stats, charts, tables, etc.  │
└─────────────────────────────────────┘
```

## Implementation Details

### Page-Specific Background Strategy

| Page | Background | Theme Affects? | Reason |
|------|-----------|----------------|--------|
| Landing | Fixed dark + animated grid | ❌ No | Branding consistency |
| Dashboard | Theme-aware solid | ✅ Yes | User comfort |
| Admin | Theme-aware solid | ✅ Yes | Extended use |
| Settings | Theme-aware solid | ✅ Yes | Accessibility |
| How It Works | Theme-aware solid | ✅ Yes | Readability |

### Z-Index Management

- `-z-10`: Background elements (ContributionGridBackground)
- `z-0`: Default layer (most content)
- `z-10`: Above-background content (landing page main content)
- `z-20`: Modals and overlays
- `z-50`: Dropdowns and tooltips

### SSR Considerations

1. **ContributionGridBackground**:
   - Generates cells outside component
   - Uses `useState` with initializer function
   - Renders fallback until mounted
   - Prevents hydration mismatches

2. **ThemeProvider**:
   - Returns invisible div during SSR
   - Loads theme preference on mount
   - Uses `suppressHydrationWarning` on html/body

## Customization

### Changing Landing Page Background

To modify the animated background:

1. Edit `components/ContributionGridBackground.tsx`
2. Adjust constants: `ROWS`, `COLS`, `CELL`, `GAP`
3. Change colors in the SVG elements
4. Modify animation speed (interval in `useEffect`)

### Adding More Theme Options

To add a new theme (e.g., "midnight"):

1. Update `ThemeProvider.tsx` to include new theme type
2. Add CSS rules in `globals.css`:
   ```css
   html.midnight body {
     background-color: #0a0a0f;
   }
   ```
3. Update all pages to include new theme classes

### Making Landing Page Theme-Aware

If you want the landing page to also respect theme:

1. Remove fixed `bg-black` from `app/page.tsx`
2. Add theme-aware classes: `bg-white dark:bg-black`
3. Update `ContributionGridBackground` to have light/dark variants
4. Use `useTheme()` hook to conditionally render different backgrounds

## Best Practices

### ✅ Do

- Use `bg-gray-50 dark:bg-gray-900` for content pages
- Let landing page override global background
- Keep animated background theme-independent
- Use `relative z-10` for content above backgrounds
- Test both light and dark modes

### ❌ Don't

- Apply fixed backgrounds to `html` or `body` in globals.css
- Use inline styles for theme colors
- Forget to add dark mode variants
- Overlap z-index layers
- Assume SSR and client rendering behave identically

## Troubleshooting

### Background not visible

1. Check if page has overriding background class
2. Verify z-index hierarchy
3. Ensure `ContributionGridBackground` is rendered
4. Check browser console for errors

### Theme not changing

1. Verify localStorage permission
2. Check if theme classes apply to `<html>`
3. Ensure all pages have `dark:` variants
4. Clear cache and hard refresh

### Hydration mismatch

1. Use `suppressHydrationWarning` on dynamic elements
2. Ensure SSR and client render same initial state
3. Initialize state outside `useEffect` when possible
4. Use `mounted` flag for client-only rendering

## Performance

### Optimization Techniques

1. **ContributionGridBackground**:
   - Fixed-size SVG with `preserveAspectRatio`
   - Animates only 8% of cells per cycle
   - Uses CSS transforms and filters (GPU-accelerated)
   - Memoized cell generation function

2. **Theme Switching**:
   - Single class toggle on root element
   - CSS custom properties for instant updates
   - localStorage for persistence (no network calls)
   - No re-rendering of component tree

3. **Page Load**:
   - Background renders immediately (SSR)
   - Content appears above without waiting
   - Theme loads from localStorage (no flash)
   - Animations start only after mount

## Future Enhancements

Potential improvements for the theme/background system:

1. **Multiple Landing Backgrounds**: Rotate different animated backgrounds
2. **User-Selectable Themes**: More than just light/dark
3. **Seasonal Themes**: Holiday-specific color schemes
4. **Accessibility Mode**: High contrast, reduced motion
5. **Background Preferences**: Allow users to disable animations
6. **Performance Mode**: Simplified graphics for slower devices

## Summary

The NirikshanAI theme system provides:
- ✨ Stunning animated landing page (theme-independent)
- 🌓 Light/dark mode for authenticated pages (user preference)
- 🎯 Smart background management (page-specific)
- 🚀 SSR-safe implementation (no hydration issues)
- ⚡ Performant animations (GPU-accelerated)
- 🎨 Easy customization (well-structured code)

This architecture ensures a beautiful first impression while respecting user preferences for extended use.

