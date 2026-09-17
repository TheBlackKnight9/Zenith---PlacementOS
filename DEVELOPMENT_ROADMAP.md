# PlacementOS — Development Roadmap & Team Sprint Plan

This document organizes the 18 development sequence steps and 2-person team division outlined in [PlacementOS_Development_Plan.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/PlacementOS_Development_Plan.md) into an actionable, sprint-based engineering roadmap.

---

## 📌 Table of Contents
- [Team Roles & Division of Responsibilities](#team-roles--division-of-responsibilities)
- [Sprint Overview & Milestones](#sprint-overview--milestones)
- [Detailed Phase Breakdown (Steps 1–18)](#detailed-phase-breakdown-steps-118)
  - [Phase 1: Foundation & Database Modeling (Steps 1–3)](#phase-1-foundation--database-modeling-steps-13)
  - [Phase 2: Authentication, Security & RBAC (Step 4)](#phase-2-authentication-security--rbac-step-4)
  - [Phase 3: TPO Core Management Portal (Steps 5–8)](#phase-3-tpo-core-management-portal-steps-58)
  - [Phase 4: Student Portal & Opportunity Discovery (Steps 9–10, 13)](#phase-4-student-portal--opportunity-discovery-steps-910-13)
  - [Phase 5: Application Engine & Eligibility Processing (Step 14)](#phase-5-application-engine--eligibility-processing-step-14)
  - [Phase 6: Interview Scheduling & Selection Pipeline (Step 15)](#phase-6-interview-scheduling--selection-pipeline-step-15)
  - [Phase 7: Value-Add Features (Steps 11, 12, 16)](#phase-7-value-add-features-steps-11-12-16)
  - [Phase 8: Institutional Analytics, QA & Deployment (Steps 17–18)](#phase-8-institutional-analytics-qa--deployment-steps-1718)
- [Git Branching & Integration Strategy](#git-branching--integration-strategy)

---

## 👥 Team Roles & Division of Responsibilities

In accordance with Section 17 of the development plan, engineering tasks are divided between two team members:

| Role | Primary Responsibilities | Main Codebase Areas |
| :--- | :--- | :--- |
| **Developer 1 (Frontend Lead)** | Next.js App Router, Tailwind CSS design system, shadcn/ui components, Student Dashboard, Resume Builder, and client-side state. | `frontend/app/*`, `frontend/components/*`, `frontend/lib/api-client.ts` |
| **Developer 2 (Backend Lead)** | Express API, PostgreSQL database modeling, Prisma migrations, Eligibility Engine, TPO APIs, and RBAC middleware. | `backend/src/*`, `backend/prisma/*`, `backend/server.js` |
| **Joint Collaboration** | API integration, authentication handshakes, end-to-end user testing, bug fixing, and cloud deployment. | Root configurations, documentation, shared QA scripts |

---

## ⏱️ Sprint Overview & Milestones

```mermaid
gantt
    title PlacementOS 8-Phase Engineering Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Project Setup & Database Modeling       :p1, 2026-10-01, 4d
    section Phase 2
    Authentication & RBAC Gating            :p2, after p1, 4d
    section Phase 3
    TPO Core: Drives, Internships & Students:p3, after p2, 6d
    section Phase 4
    Student Core: Profile & Opportunity Feed:p4, after p3, 5d
    section Phase 5
    Application Pipeline & Eligibility Check:p5, after p4, 5d
    section Phase 6
    Interviews & Selection Pipeline         :p6, after p5, 4d
    section Phase 7
    Resume Builder & Skill Assessment       :p7, after p6, 6d
    section Phase 8
    Analytics, Reports & Cloud Deployment   :p8, after p7, 5d
```

---

## 📋 Detailed Phase Breakdown (Steps 1–18)

### Phase 1: Foundation & Database Modeling (Steps 1–3)

- **Step 1: Project Setup (Frontend & Backend)**
  - [ ] **Developer 1 (Frontend)**: Initialize Next.js 14+ with TypeScript, Tailwind CSS, Lucide Icons, and configure shadcn/ui. Setup folder structure (`app/`, `components/`, `lib/`).
  - [ ] **Developer 2 (Backend)**: Initialize Node.js + Express project, setup ESLint/Prettier, install Prisma, CORS, dotenv, and nodemon.
- **Step 2: PostgreSQL & Prisma Setup**
  - [ ] **Developer 2**: Provision PostgreSQL instance (local or hosted on Neon/Supabase), connect database URL in backend `.env`.
- **Step 3: Database Schema Implementation**
  - [ ] **Developer 2**: Write full `schema.prisma` with all 15 tables and relations from [DATABASE_SCHEMA.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/DATABASE_SCHEMA.md). Run initial migration and write `prisma/seed.js` with initial test accounts.
  - [ ] **Developer 1**: Create shared TypeScript interfaces in `frontend/types/` corresponding to database models.
- **Integration Gate**: `prisma db push` passes without errors; test seed script populates sample database.

---

### Phase 2: Authentication, Security & RBAC (Step 4)

- **Step 4: Authentication & Role-Based Access**
  - [ ] **Developer 2 (Backend)**: Implement `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`. Write JWT token signer, bcrypt password hasher, and `authMiddleware` + `roleMiddleware`.
  - [ ] **Developer 1 (Frontend)**: Build `/login` and `/register` views with tabbed role switcher or auto-detection. Setup `lib/api-client.ts` Axios interceptors to store JWT in cookie/localStorage. Implement Next.js `middleware.ts` for `/student/*` and `/tpo/*` route protection.
- **Integration Gate**: Successfully log in as Student and TPO; verify unauthorized route redirection works properly.

---

### Phase 3: TPO Core Management Portal (Steps 5–8)

- **Step 5: TPO Dashboard Shell**
  - [ ] **Developer 1**: Build TPO layout (`Sidebar`, `Topbar`, responsive container). Create 4 main KPI summary cards.
  - [ ] **Developer 2**: Build `GET /api/tpo/dashboard-stats` returning total students, active drives, and pending applications.
- **Step 6: TPO Students Module**
  - [ ] **Developer 2**: Implement `GET /api/tpo/students` with multi-filter query parameters (department, batch, CGPA, backlogs).
  - [ ] **Developer 1**: Create `/tpo/students` view with searchable, paginated data table and slide-out filter drawer.
- **Step 7: TPO Placement Drives Module**
  - [ ] **Developer 2**: Implement CRUD for `/api/placement-drives` (create, list, update status).
  - [ ] **Developer 1**: Build `/tpo/placement-drives` list view and "Create Drive" modal form with validation.
- **Step 8: TPO Internship Opportunities Module**
  - [ ] **Developer 2**: Implement CRUD for `/api/internships`.
  - [ ] **Developer 1**: Build `/tpo/internships` list view and internship creation modal.
- **Integration Gate**: TPO can post drives and internships, and filter student directory in real time.

---

### Phase 4: Student Portal & Opportunity Discovery (Steps 9–10, 13)

- **Step 9: Student Dashboard Shell**
  - [ ] **Developer 1**: Build Student layout, navigation sidebar, and quick status cards (Eligible Drives, Applied, Interviews, Selections).
  - [ ] **Developer 2**: Build `GET /api/students/dashboard-stats`.
- **Step 10: Student Profile Module**
  - [ ] **Developer 2**: Implement `GET` and `PUT /api/students/profile` and `/api/students/skills`.
  - [ ] **Developer 1**: Build `/student/profile` multi-tab interface (Personal, Academic metrics, Skills tags, Portfolio/GitHub URLs).
- **Step 13: Student Placement Drives and Internships Module**
  - [ ] **Developer 2**: Integrate eligibility engine into `GET /api/placement-drives` and `GET /api/internships` to calculate `isEligible` flag for the requesting student.
  - [ ] **Developer 1**: Build `/student/placement-drives` and `/student/internships` views highlighting eligibility badges and criteria comparison cards.
- **Integration Gate**: Students can view their personal academic record and see whether they qualify for newly posted opportunities.

---

### Phase 5: Application Engine & Eligibility Processing (Step 14)

- **Step 14: Applications Module**
  - [ ] **Developer 2 (Backend)**:
    - Implement `POST /api/applications` with backend eligibility validation guard.
    - Implement `GET /api/applications/my-applications` for students.
    - Implement `GET /api/applications/drive/:driveId` and `PATCH /api/applications/:id/status` for TPO review.
  - [ ] **Developer 1 (Frontend)**:
    - Add "One-Click Apply" button to drive cards with confirmation modal.
    - Build `/student/applications` tracking view with the visual step pipeline (`Applied` → `Under Review` → `Shortlisted` → `Interview` → `Selected`).
    - Build `/tpo/applications` review panel allowing officers to inspect student profile details and update statuses.
- **Integration Gate**: Student submits application; backend checks eligibility; application appears in TPO review queue; status change updates student tracker.

---

### Phase 6: Interview Scheduling & Selection Pipeline (Step 15)

- **Step 15: Interviews and Selection**
  - [ ] **Developer 2 (Backend)**:
    - Implement `/api/interviews` (schedule round, update status, fetch student interviews).
    - Implement `/api/selections` (record offer, CTC, joining date, update student `placementStatus`).
  - [ ] **Developer 1 (Frontend)**:
    - Build "Schedule Interview" dialog for TPO with date picker, round title, and video meeting URL.
    - Build `/student/interviews` schedule view with calendar/card layout and join links.
    - Build `/tpo/selection` management page to record final offers and track joined students.
- **Integration Gate**: TPO shortlists candidate and schedules interview; student sees interview alert; TPO marks candidate selected; college placement counter increments.

---

### Phase 7: Value-Add Features (Steps 11, 12, 16)

- **Step 11: Skill Assessment Module**
  - [ ] **Developer 2**: Build `/api/assessments` (quiz list, question delivery, server-side grading).
  - [ ] **Developer 1**: Build `/student/skill-assessment` timed quiz runner with progress bar and instant scorecard modal.
- **Step 12: Dynamic Resume Builder Module**
  - [ ] **Developer 2**: Implement `/api/resumes` to save custom resume JSON layouts.
  - [ ] **Developer 1**: Build `/student/resume-builder` with dual-pane layout: live edit form on the left, real-time A4 preview on the right, and PDF download button.
- **Step 16: Notifications System**
  - [ ] **Developer 2**: Implement `/api/notifications` and backend trigger hooks (upon drive publish, interview schedule, status change).
  - [ ] **Developer 1**: Build notifications dropdown in topbar and `/student/notifications` center.
- **Integration Gate**: Students can build/download resumes, complete assessments, and receive automated system alerts.

---

### Phase 8: Institutional Analytics, QA & Deployment (Steps 17–18)

- **Step 17: Analytics and Reports Module**
  - [ ] **Developer 2**: Build `GET /api/analytics/tpo/summary` aggregating department placement %, average packages, and top companies.
  - [ ] **Developer 1**: Build `/tpo/analytics` dashboard charts and `/tpo/reports` printable summary table.
- **Step 18: Testing & Deployment**
  - [ ] **Both Developers**:
    - Execute end-to-end test scenarios from [TESTING_AND_DEPLOYMENT.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/TESTING_AND_DEPLOYMENT.md).
    - Deploy database to Supabase/Neon.
    - Deploy backend API to Render/Railway.
    - Deploy frontend Next.js app to Vercel.
- **Integration Gate**: Production deployment verified on live web URLs.

---

## 🌿 Git Branching & Integration Strategy

1. **`main`**: Always production-ready, protected branch.
2. **`dev`**: Main integration branch for sprint merges.
3. **Feature Branches**:
   - `feat/frontend-auth`, `feat/backend-auth`
   - `feat/tpo-drives`, `feat/student-profile`
   - `feat/eligibility-engine`, `feat/resume-builder`
4. **Pull Request Protocol**:
   - Every feature branch requires a PR targeting `dev`.
   - Both developers review and approve before merging.
