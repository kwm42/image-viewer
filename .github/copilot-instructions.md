# AI Coding Instructions

## 通用
所有的回答使用中文，除了特定的代码和专有名词，所有chat中的回答都使用中文。

## Project Overview
This is a Next.js 13+ application using the App Router pattern, showcasing Radix UI components with Tailwind CSS styling. Despite the "image-viewer" folder name, this is actually a Radix UI example project demonstrating dropdown menu components.

## Tech Stack & Architecture
- **Framework**: Next.js 13+ with App Router (`app/` directory structure)
- **UI Components**: Radix UI primitives (headless, accessible components)
- **Styling**: Tailwind CSS with utility-first approach
- **Type Safety**: TypeScript with relaxed strict mode (`strict: false`)
- **Package Manager**: pnpm (evidenced by `pnpm-lock.yaml`)

## Key Patterns & Conventions

### Component Structure
- **Wrapper Components**: Create styled wrapper components around Radix primitives (see `DropdownMenuItem`, `DropdownMenuCheckboxItem` in `app/page.tsx`)
- **Compound Components**: Radix components follow compound pattern - use `DropdownMenu.Root`, `DropdownMenu.Trigger`, etc.
- **Client Components**: Use `"use client"` directive for interactive components (required for Radix components with state)

### Styling Approach
- **Tailwind Classes**: Apply styling directly via className props, particularly for hover states (`hover:bg-gray-700 hover:text-gray-200`)
- **Conditional Styling**: Concatenate classes based on props (see disabled state handling in `DropdownMenuItem`)
- **Design System**: Uses consistent spacing (`px-1 pl-6`), colors (gray scale), and sizing (`h-6`, `h-8`)

### State Management
- Use React hooks for local component state (`useState` for checkboxes, radio groups)
- Radix components provide their own state management via controlled props (`checked`, `onCheckedChange`, `value`, `onValueChange`)

## Development Workflow

### Commands
- **Development**: `pnpm dev` (not npm/yarn - uses pnpm)
- **Build**: `pnpm build`
- **Start**: `pnpm start`

### File Organization
- `app/layout.tsx`: Root layout with minimal HTML structure and global CSS import
- `app/page.tsx`: Main page component with all interactive examples
- `styles/globals.css`: Tailwind directives only
- Configuration files are standard Next.js/Tailwind setup

## Component Development Guidelines

### Radix UI Integration
- Always import specific components from scoped packages (`@radix-ui/react-dropdown-menu`)
- Use `asChild` prop to compose with custom elements (see trigger button example)
- Handle accessibility automatically via Radix - no need to add ARIA attributes manually

### Custom Component Wrappers
Follow the pattern established in `page.tsx`:
```tsx
function DropdownMenuItem({ children, ...props }) {
  return (
    <DropdownMenu.Item
      {...props}
      className={baseClasses + conditionalClasses}
    >
      {children}
    </DropdownMenu.Item>
  );
}
```

### TypeScript Usage
- Props typing is minimal - use `React.ReactNode` for children
- Spread props pattern (`...props`) is common for component wrappers
- Optional typing for specific props when needed (see `DropdownMenuRadioItem`)

## Styling Conventions
- Gradient backgrounds for main containers (`bg-gradient-to-r from-cyan-500 to-blue-500`)
- Consistent spacing scale (1, 2, 4, 6 for padding/margins)
- Shadow usage for elevated elements (`shadow-lg`)
- Gray-based color scheme for menu items with hover states