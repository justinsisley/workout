# ShadCN/UI + Tailwind CSS 4.0 Setup Guide

## Overview

This project uses ShadCN/UI components with Tailwind CSS 4.0. This document outlines the correct setup and important differences from previous Tailwind versions.

## Critical Tailwind 4.0 Changes

### CSS Import Syntax
**✅ Correct (Tailwind 4.0):**
```css
@import "tailwindcss";
```

**❌ Incorrect (Pre-4.0 syntax):**
```css
@tailwind base;
@tailwind components; 
@tailwind utilities;
```

### PostCSS Configuration
Required `postcss.config.mjs` in project root:
```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

## Project Structure

### CSS Files Location
- Main CSS: `src/app/(frontend)/globals.css`
- Contains only: `@import "tailwindcss";`
- No custom CSS rules - use Tailwind utility classes instead

### Component Styling
- **Never use custom CSS classes** - use Tailwind utilities
- **Follow mobile-first responsive design** with Tailwind breakpoints
- **Use ShadCN/UI components** for complex UI elements

## Installation Commands

1. Install Tailwind CSS 4.0:
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

2. Initialize ShadCN/UI:
```bash
npx shadcn@latest init
```

## Best Practices

### Responsive Design
Use Tailwind's mobile-first breakpoints:
- `max-[400px]:` - Very small screens
- `max-md:` - Mobile devices  
- `max-lg:` - Tablets
- `max-xl:` - Small laptops

### Class Organization
Order classes logically:
1. Layout (flex, grid, position)
2. Sizing (width, height, padding, margin)
3. Typography (text-*, font-*)
4. Colors (bg-*, text-*)
5. Effects (border, rounded, shadow)

### Example Component
```tsx
<div className="flex flex-col justify-between items-center h-screen p-11 max-w-4xl mx-auto overflow-hidden max-[400px]:p-6">
  <h1 className="text-center my-10 text-6xl leading-[70px] font-bold max-lg:my-6 max-lg:text-[42px] max-lg:leading-[42px]">
    Title
  </h1>
</div>
```

## Common Issues

### Build Errors
If you see CSS import errors, ensure:
1. PostCSS config is correct
2. Using `@import "tailwindcss";` not `@tailwind` directives
3. Tailwind CSS 4.0+ is installed

### Styling Not Working
1. Check dev server is running: `npm run dev`
2. Verify globals.css is imported in layout.tsx
3. Ensure no conflicting custom CSS

## ShadCN/UI Integration

ShadCN/UI works seamlessly with Tailwind 4.0 using the correct import syntax. Components are installed into `src/components/ui/` and automatically configured.

## Development Workflow

1. **Never write custom CSS** - use Tailwind utilities
2. **Test responsive behavior** on multiple screen sizes  
3. **Use ShadCN/UI components** for complex UI patterns
4. **Follow coding standards** for kebab-case file naming