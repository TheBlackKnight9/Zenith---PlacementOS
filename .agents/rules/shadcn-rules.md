---
trigger: always_on
---

# shadcn/ui Coding Standards for PlacementOS

1. **Component Reuse**:
   - Always import primitives from `@/components/ui/*` (Button, Input, Card, Badge, Dialog, Table, SearchBar, Typography).
   - Use `cn()` from `@/lib/utils` to merge dynamic Tailwind classes.
   - Do NOT write custom buttons or unstyled inputs from scratch; wrap or extend shadcn components.

2. **Typography**:
   - Use typography components from `@/components/ui/typography` or standard semantic Tailwind classes (`text-2xl font-bold tracking-tight text-slate-900` for headers, `text-sm text-slate-600` for body).

3. **Icons**:
   - Use `lucide-react` icons exclusively. Standardize icon sizes: `h-4 w-4` for buttons/badges, `h-5 w-5` for cards/nav headers.

4. **Colors**:
   - Maintain the approved blue-purple theme using Tailwind CSS variables (`bg-primary`, `text-primary-foreground`, `border-border`).
