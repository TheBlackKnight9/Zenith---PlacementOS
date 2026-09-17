---
name: shadcn-ui
description: >-
  Comprehensive guide and design standards for building user interfaces with
  shadcn/ui, Radix UI primitives, Lucide React icons, and Tailwind CSS.
  Use when creating or refactoring UI components, pages, forms, tables, modals,
  search bars, or applying typography and color tokens.
---

# shadcn/ui Component & Design System Skill

This skill guides the construction, styling, and composition of UI elements using **shadcn/ui**, **Tailwind CSS**, and **Lucide React** in PlacementOS.

---

## 🎨 Color Tokens & Theme Architecture

PlacementOS uses an accessible **blue-purple, white, and clean slate theme**.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  /* Brand Primary: Indigo-Purple (#4f46e5 / 243 75% 59%) */
  --primary: 243 75% 59%;
  --primary-foreground: 210 40% 98%;

  /* Subtle secondary background (#f5f3ff) */
  --secondary: 250 100% 98%;
  --secondary-foreground: 243 75% 45%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --accent: 250 100% 96%;
  --accent-foreground: 243 75% 59%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 243 75% 59%;

  --radius: 0.75rem;
}
```

---

## 📝 Typography Standards

Always use semantic typography classes or the pre-built typography primitives from `@/components/ui/typography`:

| Element | Component | Tailwind Classes | Usage |
| :--- | :--- | :--- | :--- |
| **H1** | `<TypographyH1>` | `scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl text-slate-900` | Page main titles |
| **H2** | `<TypographyH2>` | `scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight text-slate-800` | Major section headers |
| **H3** | `<TypographyH3>` | `scroll-m-20 text-xl font-semibold tracking-tight text-slate-800` | Card titles, subsection headers |
| **H4** | `<TypographyH4>` | `scroll-m-20 text-lg font-semibold tracking-tight text-slate-700` | Drawer / Modal subheaders |
| **P** | `<TypographyP>` | `leading-7 text-sm text-slate-600 [&:not(:first-child)]:mt-4` | Body paragraphs |
| **Lead** | `<TypographyLead>` | `text-base text-slate-500 font-normal` | Subtitle beneath headers |
| **Muted** | `<TypographyMuted>` | `text-xs text-slate-400` | Footnotes, timestamps, metadata |

---

## 🔍 Search Bar Pattern

A standard shadcn search bar combines an `<Input>` with a Lucide `<Search>` icon inside a relative container:

```tsx
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-10 bg-white rounded-lg border-slate-200 focus-visible:ring-primary"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

---

## 💎 Standard Component Usage

### 1. Button Variants
```tsx
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

<Button variant="default">Save Changes</Button>
<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Create Drive</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Withdraw Application</Button>
```

### 2. Status Badges
```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Eligible</Badge>
<Badge variant="secondary">Applied</Badge>
<Badge variant="success">Selected</Badge>
<Badge variant="destructive">Rejected</Badge>
```

### 3. Metric Stat Cards
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

<Card className="rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-slate-500">Eligible Drives</CardTitle>
    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
      <Briefcase className="h-4 w-4" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-slate-900">8</div>
    <p className="text-xs text-slate-500 mt-1">3 new this week</p>
  </CardContent>
</Card>
```

---

## 📌 Lucide Icon Mapping

- **Navigation**: `LayoutDashboard`, `Briefcase`, `GraduationCap`, `Users`, `CalendarCheck`, `FileText`, `Settings`, `LogOut`
- **Actions**: `Plus`, `Search`, `Filter`, `Download`, `ExternalLink`, `ChevronRight`, `Check`, `X`
- **Statuses**: `CheckCircle2` (Success), `Clock` (Pending), `AlertCircle` (Ineligible), `XCircle` (Rejected)
