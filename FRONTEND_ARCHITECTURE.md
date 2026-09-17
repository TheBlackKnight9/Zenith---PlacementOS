# PlacementOS — Frontend Architecture & UI Design System

This document details the frontend architecture, UI design system, directory layout, route guarding, and component standards for **PlacementOS**. The frontend is built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**, strictly adhering to the specifications in [PlacementOS_Development_Plan.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/PlacementOS_Development_Plan.md).

---

## 📌 Table of Contents
- [Design System & Theme](#design-system--theme)
  - [Color Palette (Blue-Purple Theme)](#color-palette-blue-purple-theme)
  - [Typography & Hierarchy](#typography--hierarchy)
  - [Card, Table & Form Standards](#card-table--form-standards)
- [Directory & Route Structure](#directory--route-structure)
- [Route Guarding & Middleware](#route-guarding--middleware)
- [Component Architecture & shadcn/ui](#component-architecture--shadcnui)
- [State Management & Data Fetching](#state-management--data-fetching)
- [Feature Implementation Blueprints](#feature-implementation-blueprints)
  - [1. Dynamic Resume Builder](#1-dynamic-resume-builder)
  - [2. Interactive Skill Assessment](#2-interactive-skill-assessment)
  - [3. Application Status Pipeline](#3-application-status-pipeline)
  - [4. TPO Candidate Filter & Search](#4-tpo-candidate-filter--search)

---

## 🎨 Design System & Theme

In accordance with Section 7, Section 8, and Section 15 of the development plan, PlacementOS utilizes a cohesive **blue-purple, white, and clean light background theme**. It prioritizes readability, accessibility, and visual consistency across both Student and TPO portals while avoiding distracting animations.

### Color Palette (Blue-Purple Theme)

The Tailwind color tokens are defined below:

```javascript
// tailwind.config.js snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff', // Soft purple background tint
          100: '#ede9fe', // Light active state / borders
          200: '#ddd6fe', // Subtle badges / tags
          500: '#6366f1', // Primary Indigo
          600: '#4f46e5', // Primary Brand Action (Buttons, active tabs)
          700: '#4338ca', // Hover brand state
          800: '#3730a3', // Dark accents
          900: '#312e81', // Sidebar / Deep branding
        },
        surface: {
          DEFAULT: '#ffffff', // Card and panel backgrounds
          muted: '#f8fafc',   // Page workspace background
          border: '#e2e8f0',  // Divider and card border lines
        },
        status: {
          success: '#10b981', // Selected, Completed
          warning: '#f59e0b', // Under Review, Scheduled
          info:    '#3b82f6', // Applied, Shortlisted
          danger:  '#ef4444', // Rejected, Cancelled
        }
      }
    }
  }
}
```

### Typography & Hierarchy
- **Primary Font**: `Inter`, sans-serif.
- **H1 (Page Headers)**: `text-2xl font-bold text-slate-900 tracking-tight`
- **H2 (Section Titles)**: `text-lg font-semibold text-slate-800`
- **Body Text**: `text-sm text-slate-600 leading-relaxed`
- **Muted Text / Labels**: `text-xs font-medium text-slate-400 uppercase tracking-wider`

### Card, Table & Form Standards
- **Metric Cards**: Rounded-xl (`rounded-xl`), crisp light border (`border border-slate-200/80`), subtle shadow (`shadow-sm`), with clean icon containers (`bg-brand-50 p-2.5 rounded-lg text-brand-600`).
- **Data Tables**: Clean striped or bordered table with sticky header (`bg-slate-50 font-semibold text-slate-600`), row hover transitions (`hover:bg-slate-50/70`), and clear status badges.
- **Form Inputs**: Rounded-lg (`rounded-lg border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500`), paired with clear labels and immediate inline validation messages.

---

## 📂 Directory & Route Structure

The frontend matches Next.js App Router conventions:

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout with fonts, providers
│   ├── page.tsx                      # Public landing / redirection to login
│   │
│   ├── (auth)/                       # Authentication route group
│   │   ├── login/page.tsx            # Login page (Student / TPO switcher or auto-detect)
│   │   └── register/page.tsx         # Registration page
│   │
│   ├── (student)/student/            # Student portal group
│   │   ├── layout.tsx                # Student layout (Sidebar + Header + Breadcrumb)
│   │   ├── dashboard/page.tsx        # Overview cards, quick links, eligible drives
│   │   ├── profile/page.tsx          # Academic & technical profile editor
│   │   ├── resume-builder/page.tsx   # Live builder + PDF generator
│   │   ├── skill-assessment/page.tsx # Self-assessment test modules
│   │   ├── placement-drives/page.tsx # Browse drives with eligibility check
│   │   ├── internships/page.tsx      # Browse internship opportunities
│   │   ├── applications/page.tsx     # Student application timeline & status
│   │   ├── interviews/page.tsx       # Scheduled interview calendar & links
│   │   ├── progress/page.tsx         # Milestones, skills breakdown & stats
│   │   └── notifications/page.tsx    # Notification center
│   │
│   └── (tpo)/tpo/                    # TPO / Institution portal group
│       ├── layout.tsx                # TPO layout (Sidebar + Header + Quick Action buttons)
│       ├── dashboard/page.tsx        # Placement analytics, active drives & stats
│       ├── students/page.tsx         # Student directory, advanced search & filter
│       ├── placement-drives/page.tsx # Create, edit, manage placement drives
│       ├── internships/page.tsx      # Create, edit, manage internships
│       ├── applications/page.tsx     # Review student applicants, shortlist candidates
│       ├── interviews/page.tsx       # Interview schedule coordinator
│       ├── selection/page.tsx        # Offer recording & joining tracker
│       ├── analytics/page.tsx        # Charts (Department placement %, salary distribution)
│       └── reports/page.tsx          # Exportable placement summaries
│
├── components/
│   ├── ui/                           # shadcn/ui components (Button, Dialog, Badge, Card...)
│   ├── shared/                       # App-wide components
│   │   ├── Sidebar.tsx               # Reusable sidebar with role items
│   │   ├── Topbar.tsx                # Header with user profile menu & notifications bell
│   │   ├── StatusBadge.tsx           # Standardized status badge
│   │   └── DataTable.tsx             # Paginated, sortable data table
│   ├── student/                      # Student-specific components
│   │   ├── ResumePreview.tsx         # Live A4 resume preview
│   │   └── AssessmentRunner.tsx      # Timed quiz runner
│   └── tpo/                          # TPO-specific components
│       ├── StudentFilterSheet.tsx    # Filter drawer (CGPA, Branch, Backlogs)
│       └── ScheduleInterviewModal.tsx# Interview scheduler dialog
│
├── lib/
│   ├── api-client.ts                 # Axios instance with auth token interceptors
│   ├── auth.ts                       # Token parsing and session helpers
│   └── utils.ts                      # `cn()` clsx utility and formatters
│
├── types/
│   ├── user.ts                       # Auth and user models
│   ├── student.ts                    # Student profile & academic types
│   ├── drive.ts                      # Placement drive & internship types
│   └── application.ts                # Application, interview & selection types
│
├── middleware.ts                     # Next.js Edge Middleware for RBAC route gating
└── tailwind.config.js
```

---

## 🛡️ Route Guarding & Middleware

Route protection is handled at the edge using Next.js `middleware.ts`. This prevents unauthenticated users or users with invalid roles from accessing restricted views.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('user_role')?.value; // 'STUDENT' | 'TPO'
  const { pathname } = request.nextUrl;

  // 1. Unauthenticated users trying to access protected routes
  if (!token && (pathname.startsWith('/student') || pathname.startsWith('/tpo'))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Student trying to access TPO routes
  if (pathname.startsWith('/tpo') && role !== 'TPO') {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // 3. TPO trying to access Student routes
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/tpo/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/tpo/:path*'],
};
```

---

## 🧩 Component Architecture & shadcn/ui

PlacementOS uses **shadcn/ui** built on top of Radix UI primitives.

### Standard Components
| Component | Primary Use Case |
| :--- | :--- |
| `Card`, `CardHeader`, `CardContent` | Dashboard stat counters, drive cards, profile sections |
| `Badge` | Status tags (`Applied`, `Shortlisted`, `Selected`, `Eligible`) |
| `Button` | Action triggers (`Apply Now`, `Schedule Round`, `Download PDF`) |
| `Dialog` / `Sheet` | Modal popups for interview scheduling, drive creation |
| `Table`, `TableHeader`, `TableRow` | Student directory, applications list, interview roster |
| `Tabs`, `TabsList`, `TabsTrigger` | Switching between Placements vs. Internships |
| `Form`, `FormField`, `FormMessage` | Validated input forms with `zod` |
| `Avatar`, `AvatarFallback` | User topbar profile display |

### Standard Lucide Icons
- Dashboard: `LayoutDashboard`
- Profile: `UserCircle`
- Drives: `Briefcase`
- Internships: `GraduationCap`
- Applications: `FileCheck2`
- Interviews: `CalendarClock`
- Resume Builder: `FileText`
- Skill Assessment: `BrainCircuit`
- Students: `Users`
- Analytics: `BarChart3`
- Reports: `FileSpreadsheet`
- Notifications: `Bell`

---

## 🔄 State Management & Data Fetching

1. **API Client (`lib/api-client.ts`)**:
   Axios instance pre-configured with default headers, `baseURL`, and interceptors that inject the JWT Bearer token into outgoing requests and handle `401 Unauthorized` responses by clearing sessions.
2. **Form Management**:
   - `react-hook-form` paired with `@hookform/resolvers/zod`.
   - All input forms have explicit Zod validation schemas ensuring input sanitization before API dispatch.
3. **Local UI State**:
   - React hooks (`useState`, `useReducer`) for modal visibility, active tab selections, and filter drawers.
   - SWR or TanStack Query for server cache invalidation (e.g. invalidating application lists upon applying).

---

## 🛠️ Feature Implementation Blueprints

### 1. Dynamic Resume Builder
- **Route**: `/student/resume-builder`
- **Architecture**:
  - **Left Pane**: Form inputs split into tabs (Personal Details, Education, Technical Skills, Projects, Experience). Pre-populated automatically with verified student profile data.
  - **Right Pane**: A4 real-time interactive preview updated synchronously as the user types.
  - **Export Engine**: Uses client-side `@react-pdf/renderer` or `html2pdf.js` to render and download a crisp, professional, ATS-friendly PDF document.

### 2. Interactive Skill Assessment
- **Route**: `/student/skill-assessment`
- **Architecture**:
  - **Assessment Selector**: Displays available quizzes categorized by topic (DSA, Python, React, Aptitude).
  - **Timed Runner**: Displays one question at a time with a countdown timer at the top. Answers are stored in component state.
  - **Scorecard Modal**: Upon timer expiration or manual submission, answers are evaluated on the backend. The student receives an immediate result card with score %, passing badge, and answer explanations.

### 3. Application Status Pipeline
- **Route**: `/student/applications` & `/tpo/applications`
- **Visual Component**: A horizontal multi-step progress bar showing state progression:
  ```
  [ Applied ] ──▶ [ Under Review ] ──▶ [ Shortlisted ] ──▶ [ Interview ] ──▶ [ Selected / Joined ]
  ```
- Clear color coding:
  - Grey: Upcoming stage
  - Blue (`#3b82f6`): Active stage
  - Green (`#10b981`): Completed / Accepted stage
  - Red (`#ef4444`): Rejected / Withdrawn

### 4. TPO Candidate Filter & Search
- **Route**: `/tpo/students`
- **Architecture**:
  - Top search bar for instant roll number or name lookup with debouncing (300ms).
  - Multi-select dropdown for Departments (`CSE`, `IT`, `ECE`, `MECH`, etc.).
  - Slider or numeric input for Minimum CGPA (`0.0` to `10.0`).
  - Checkbox toggle: `Zero Active Backlogs Only`.
  - Batch year selector (`2025`, `2026`, `2027`).
  - One-click CSV export button to download filtered candidate list for recruiters.
