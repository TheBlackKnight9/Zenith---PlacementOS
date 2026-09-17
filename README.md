# PlacementOS

> **A modern, streamlined Placement & Internship Management System for colleges and universities.**

PlacementOS bridges the gap between students and the Training & Placement Office (TPO). It eliminates manual spreadsheets and fragmented communication by providing two purpose-built, role-based dashboards: **Student Dashboard** and **TPO / Institution Dashboard**.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Student Dashboard](#student-dashboard)
  - [TPO / Institution Dashboard](#tpo--institution-dashboard)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Core Workflow](#core-workflow)
- [Comprehensive Documentation Index](#comprehensive-documentation-index)
- [Team & Roles](#team--roles)
- [License](#license)

---

## 🎯 Overview

Placement drives and internship programs in colleges often suffer from fragmented communication, manual eligibility verification, and lost applicant records. **PlacementOS** simplifies and automates these operations:

- **Automated Eligibility Engine**: Dynamically matches students against company criteria (CGPA, active backlogs, department/branch, batch year).
- **End-to-End Application Lifecycle**: Real-time status tracking from `Applied` to `Under Review`, `Shortlisted`, `Interview`, and `Selected/Joined`.
- **Integrated Preparation Tools**: Profile builder, dynamic resume generation with PDF download, and interactive skill assessments.
- **Data-Driven TPO Control**: One-stop administration for posting opportunities, filtering candidates, scheduling interviews, and generating placement analytics reports.

---

## 🚀 Key Features

### 🎓 Student Dashboard
- **Executive Summary Cards**: Instant count of Eligible Drives, Active Applications, Upcoming Interviews, and Final Selections.
- **My Profile**: Comprehensive management of personal details, academic metrics (CGPA, backlogs, batch, branch), technical skills, projects, and certifications.
- **Resume Builder**: Generates standardized, professional resumes directly from profile data with live real-time preview and instant PDF export.
- **Skill Assessment**: Interactive, timed technical questionnaires to self-evaluate readiness with instant score generation.
- **Placement Drives & Internships**: Filtered browse view highlighting eligible vs. non-eligible opportunities with instant one-click apply.
- **My Applications**: Visual status tracker detailing application review stages and recruiter decisions.
- **Interviews**: Calendar and list view showing scheduled interview dates, times, formats (Online/Offline), and venue links.
- **Notifications**: Automated real-time alerts for newly posted eligible drives, shortlisting updates, and interview schedules.

### 🏛️ TPO / Institution Dashboard
- **Placement Command Center**: Key metrics on total students, active drives, total applications, and overall college placement rate.
- **Student Directory**: Advanced search and multi-parameter filtering (by department, batch, CGPA range, backlog count, placement status) with export options.
- **Drive & Internship Management**: Create and publish company opportunities with defined deadlines, salary/stipend packages, job descriptions, and eligibility criteria.
- **Application Review & Shortlisting**: Inspect candidate profiles, review resumes, and shortlist eligible applicants with one click.
- **Interview Scheduler**: Set interview rounds, date, time slots, meeting links/venues, and notify shortlisted candidates.
- **Selection & Offer Tracking**: Mark student selection and joining status, record package details, and maintain institutional placement records.
- **Analytics & Reports**: Visual department-wise placement statistics, top recruiting companies, and printable/downloadable summary reports.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (Next.js + TypeScript + Tailwind CSS)"]
        Landing["Auth & Public Pages (/login, /register)"]
        StudentDash["Student Dashboard (/student/*)"]
        TPODash["TPO Dashboard (/tpo/*)"]
    end

    subgraph Gateway["Next.js Middleware & Axios Interceptors"]
        AuthGuard["JWT Role-Based Auth Guard"]
    end

    subgraph API["Backend API (Node.js + Express.js)"]
        AuthCtrl["Auth Controller & bcrypt"]
        StudentCtrl["Student Service"]
        TPOCtrl["TPO Controller"]
        DriveCtrl["Placement & Internship Service"]
        EligEngine["Eligibility Engine"]
        AppCtrl["Application & Interview Pipeline"]
        AnalyticsCtrl["Analytics & Reporting Service"]
    end

    subgraph Data["Database Layer"]
        PrismaORM["Prisma ORM"]
        Postgres[(PostgreSQL Database)]
    end

    Landing --> AuthGuard
    StudentDash --> AuthGuard
    TPODash --> AuthGuard

    AuthGuard --> AuthCtrl
    AuthGuard --> StudentCtrl
    AuthGuard --> TPOCtrl
    AuthGuard --> DriveCtrl
    AuthGuard --> AppCtrl
    AuthGuard --> AnalyticsCtrl

    DriveCtrl --> EligEngine
    EligEngine --> StudentCtrl

    AuthCtrl --> PrismaORM
    StudentCtrl --> PrismaORM
    TPOCtrl --> PrismaORM
    DriveCtrl --> PrismaORM
    AppCtrl --> PrismaORM
    AnalyticsCtrl --> PrismaORM

    PrismaORM --> Postgres
```

---

## 💻 Technology Stack

| Layer | Technology | Key Libraries / Modules |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router) | React, TypeScript |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Lucide React, Radix UI primitives, Class Variance Authority |
| **Forms & Validation** | React Hook Form | Zod validation schemas |
| **Backend Server** | Node.js + Express.js | Express, TypeScript / ES Modules, CORS, Helmet, Morgan |
| **Database & ORM** | PostgreSQL | Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens) | `jsonwebtoken`, `bcryptjs` |
| **PDF Generation** | Client/Server PDF engine | `@react-pdf/renderer` / HTML-to-PDF |
| **Tooling & DevOps** | Git, GitHub, Postman | Docker (optional for PostgreSQL), ESLint, Prettier |

---

## 📁 Repository Structure

```
PlacementOS/
├── frontend/                     # Next.js client application
│   ├── app/                      # App Router routes
│   │   ├── login/                # Authentication page
│   │   ├── register/             # Student/TPO registration
│   │   ├── student/              # Student portal routes
│   │   │   ├── dashboard/        # Student metrics & quick actions
│   │   │   ├── profile/          # Profile, academic & skills edit
│   │   │   ├── resume-builder/   # Live resume builder & PDF export
│   │   │   ├── skill-assessment/ # Quizzes and tests
│   │   │   ├── placement-drives/ # Active drives & eligibility
│   │   │   ├── internships/      # Internship openings
│   │   │   ├── applications/     # Status tracker
│   │   │   ├── interviews/       # Schedule & meeting links
│   │   │   ├── progress/         # Career milestones & activity
│   │   │   └── notifications/    # Student alert inbox
│   │   └── tpo/                  # TPO portal routes
│   │       ├── dashboard/        # Institutional metrics & stats
│   │       ├── students/         # Student directory & filtering
│   │       ├── placement-drives/ # Drive creation & management
│   │       ├── internships/      # Internship creation & management
│   │       ├── applications/     # Candidate review & shortlisting
│   │       ├── interviews/       # Interview scheduling
│   │       ├── selection/        # Offer letters & joining records
│   │       ├── analytics/        # Department & company charts
│   │       └── reports/          # Printable reports & summaries
│   ├── components/               # Reusable UI & layout components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── student/              # Student dashboard components
│   │   ├── tpo/                  # TPO dashboard components
│   │   └── shared/               # Navigation, headers, tables, badges
│   ├── lib/                      # Utilities, API client, auth helpers
│   ├── types/                    # TypeScript interfaces & types
│   └── public/                   # Static assets, logos, and icons
│
├── backend/                      # Node.js + Express API server
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema definition
│   │   └── seed.js               # Database seeder (roles, mock data)
│   ├── src/
│   │   ├── config/               # Database and environment configurations
│   │   ├── controllers/          # HTTP request handlers
│   │   ├── middleware/           # JWT auth, RBAC, error handling
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Business logic & eligibility engine
│   │   └── utils/                # Response helpers, validators
│   └── server.js                 # Express server bootstrap
│
├── README.md                     # Main documentation & quickstart
├── DATABASE_SCHEMA.md            # Complete Prisma & PostgreSQL data dictionary
├── API_SPECIFICATION.md          # REST API contracts, routes & sample payloads
├── FRONTEND_ARCHITECTURE.md      # UI design system, routing & state guide
├── BACKEND_ARCHITECTURE.md       # Layered architecture, RBAC & eligibility logic
├── DEVELOPMENT_ROADMAP.md        # 18-step sprint plan & 2-person work breakdown
├── TESTING_AND_DEPLOYMENT.md     # Test cases, QA checklist, deployment guide
└── PlacementOS_Development_Plan.md # Original foundational project brief
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` or `pnpm`
- **PostgreSQL**: `v14+` running locally or hosted (e.g. Supabase, Neon)
- **Git**: Installed and configured

---

### 1. Clone Repository
```bash
git clone https://github.com/your-username/PlacementOS.git
cd PlacementOS
```

---

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` and configure your database and JWT secret:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/placementos?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
```

Run database migrations and seed default data:
```bash
# Push Prisma schema to PostgreSQL
npx prisma migrate dev --name init

# Seed database with initial roles, sample drives, and test accounts
npx prisma db seed

# Start development server
npm run dev
```
Backend API will be live at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Default Demo Credentials (Post-Seed)

| Role | Email | Password | Assigned Dashboard |
| :--- | :--- | :--- | :--- |
| **TPO Administrator** | `tpo@college.edu` | `Tpo@12345` | `/tpo/dashboard` |
| **Student (CSE)** | `student@college.edu` | `Student@12345` | `/student/dashboard` |

---

## 🔄 Core Workflow

```mermaid
sequenceDiagram
    autonumber
    actor TPO as TPO Officer
    actor System as PlacementOS
    actor Student as Student

    TPO->>System: 1. Create Placement Drive / Internship (Eligibility: CGPA >= 7.5, No Backlogs, CSE/IT)
    System->>System: 2. Store Drive & Trigger Notifications
    Student->>System: 3. Browse Placement Drives
    System->>Student: 4. Display Eligible Drives (Checked dynamically against Student Profile)
    Student->>System: 5. Submit Application (Profile + Resume snapshot)
    System->>TPO: 6. Application appears under Drive Candidate Review
    TPO->>System: 7. Review Profile & Shortlist Candidate
    TPO->>System: 8. Schedule Interview (Date, Time, Video Link)
    System->>Student: 9. Alert: "Interview Scheduled for [Company]"
    Student->>System: 10. Attend Interview & Check Status Updates
    TPO->>System: 11. Mark Candidate as "Selected / Joined" & Record Package
    System->>System: 12. Update Student Profile & Recompute Institutional Placement Analytics
```

---

## 📚 Comprehensive Documentation Index

To explore the in-depth technical blueprints for each subsystem, consult the dedicated markdown guides:

- 🗄️ **[DATABASE_SCHEMA.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/DATABASE_SCHEMA.md)**: Full PostgreSQL entity dictionary, Mermaid ER diagram, 15 relational tables, and Prisma schema.
- 🌐 **[API_SPECIFICATION.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/API_SPECIFICATION.md)**: Detailed REST API specifications with endpoints, request bodies, response formats, and status codes.
- 🎨 **[FRONTEND_ARCHITECTURE.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/FRONTEND_ARCHITECTURE.md)**: Next.js App Router guidelines, blue-purple UI design system tokens, shadcn/ui component specs, and route guards.
- ⚙️ **[BACKEND_ARCHITECTURE.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/BACKEND_ARCHITECTURE.md)**: Node/Express architectural patterns, RBAC security middleware, eligibility calculation engine, and error handling.
- 🗺️ **[DEVELOPMENT_ROADMAP.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/DEVELOPMENT_ROADMAP.md)**: 18-step sprint plan & 2-person work breakdown, and integration milestones.
- 🧪 **[TESTING_AND_DEPLOYMENT.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/TESTING_AND_DEPLOYMENT.md)**: Quality assurance test matrix, user acceptance test flows, deployment guides (Vercel + Render + Neon), and environment variables.
- 📄 **[PlacementOS_Development_Plan.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/PlacementOS_Development_Plan.md)**: Original foundational project roadmap.

---

## 👥 Team & Roles

PlacementOS is designed for collaborative two-person engineering:
- **Student 1 (Frontend Lead)**: Next.js App Router, Tailwind/shadcn UI implementation, Student Dashboard pages, Resume Builder, and Client State.
- **Student 2 (Backend Lead)**: Express API development, PostgreSQL database modeling, Prisma migrations, Eligibility Engine, and TPO endpoints.
- **Joint Responsibilities**: Authentication integration, end-to-end testing, and production deployment.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
