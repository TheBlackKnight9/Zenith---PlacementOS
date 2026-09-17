# PlacementOS — Testing Plan & Deployment Guide

This document outlines the comprehensive quality assurance (QA) test plan, user acceptance walkthroughs, and production deployment guide for **PlacementOS**, directly implementing Section 18 of [PlacementOS_Development_Plan.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/PlacementOS_Development_Plan.md).

---

## 📌 Table of Contents
- [Quality Assurance & Test Matrix](#quality-assurance--test-matrix)
  - [1. Authentication & RBAC Security Tests](#1-authentication--rbac-security-tests)
  - [2. Drive & Internship Creation Tests](#2-drive--internship-creation-tests)
  - [3. Eligibility Engine Verification Tests](#3-eligibility-engine-verification-tests)
  - [4. Student Application Pipeline Tests](#4-student-application-pipeline-tests)
  - [5. Shortlisting & Interview Coordination Tests](#5-shortlisting--interview-coordination-tests)
  - [6. Dynamic Resume Builder & PDF Generation Tests](#6-dynamic-resume-builder--pdf-generation-tests)
  - [7. Automated Notifications Tests](#7-automated-notifications-tests)
  - [8. Responsive UI & Error Handling Tests](#8-responsive-ui--error-handling-tests)
- [End-to-End User Acceptance Test Walkthrough](#end-to-end-user-acceptance-test-walkthrough)
- [Cloud Deployment Guide](#cloud-deployment-guide)
  - [1. Database Provisioning (Neon / Supabase)](#1-database-provisioning-neon--supabase)
  - [2. Backend API Deployment (Render / Railway)](#2-backend-api-deployment-render--railway)
  - [3. Frontend Deployment (Vercel)](#3-frontend-deployment-vercel)
- [Environment Variables Reference](#environment-variables-reference)

---

## 🧪 Quality Assurance & Test Matrix

### 1. Authentication & RBAC Security Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Student registers with valid academic data | Account created, hashed in DB, JWT returned, redirects to `/student/dashboard`. | Pass |
| **AUTH-02** | Login with incorrect password | Returns `401 Unauthorized` with message: "Invalid credentials". | Pass |
| **AUTH-03** | Student token accesses `/api/tpo/*` | Returns `403 Forbidden: Access restricted to TPO role`. | Pass |
| **AUTH-04** | Unauthenticated user visits `/student/dashboard` | Next.js Edge Middleware redirects to `/login?callbackUrl=/student/dashboard`. | Pass |

---

### 2. Drive & Internship Creation Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **DRV-01** | TPO creates placement drive with all valid fields | Drive saved in database with status `ACTIVE`, visible on public listing. | Pass |
| **DRV-02** | TPO creates drive with past deadline date | Validation fails with `400 Bad Request` ("Deadline must be in the future"). | Pass |
| **DRV-03** | TPO closes drive when deadline expires | Drive status changes to `CLOSED`, students can no longer submit applications. | Pass |

---

### 3. Eligibility Engine Verification Tests
| Test ID | Student Parameters | Drive Criteria | Expected System Assessment |
| :--- | :--- | :--- | :--- |
| **ELIG-01** | `CSE`, CGPA: 8.5, Backlogs: 0, Batch: 2027 | `CSE/IT`, Min CGPA: 7.5, Max Backlogs: 0, Batch: 2027 | **Eligible** (Apply button enabled) |
| **ELIG-02** | `MECH`, CGPA: 8.5, Backlogs: 0, Batch: 2027 | `CSE/IT`, Min CGPA: 7.5, Max Backlogs: 0, Batch: 2027 | **Ineligible** ("Branch not eligible") |
| **ELIG-03** | `CSE`, CGPA: 7.2, Backlogs: 0, Batch: 2027 | `CSE/IT`, Min CGPA: 7.5, Max Backlogs: 0, Batch: 2027 | **Ineligible** ("CGPA below required 7.5") |
| **ELIG-04** | `CSE`, CGPA: 8.5, Backlogs: 1, Batch: 2027 | `CSE/IT`, Min CGPA: 7.5, Max Backlogs: 0, Batch: 2027 | **Ineligible** ("Active backlogs exceed 0") |
| **ELIG-05** | `CSE`, CGPA: 8.5, Backlogs: 0, Batch: 2026 | `CSE/IT`, Min CGPA: 7.5, Max Backlogs: 0, Batch: 2027 | **Ineligible** ("Batch does not match 2027") |

---

### 4. Student Application Pipeline Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **APP-01** | Eligible student applies for drive with resume | Application created with status `APPLIED`, appears on "My Applications". | Pass |
| **APP-02** | Student attempts to apply for the same drive twice | Returns `409 Conflict` ("You have already applied for this drive"). | Pass |
| **APP-03** | Ineligible student attempts direct POST to `/api/applications` | Backend eligibility engine blocks request with `400 Bad Request`. | Pass |

---

### 5. Shortlisting & Interview Coordination Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **INT-01** | TPO shortlists student application | Application status updates to `SHORTLISTED`; student receives notification. | Pass |
| **INT-02** | TPO schedules Interview Round 1 | Record created in `interviews` table; appears in student's interview schedule. | Pass |
| **INT-03** | TPO marks student as `SELECTED` with CTC | `selection_results` entry created; student `placementStatus` set to `true`. | Pass |

---

### 6. Dynamic Resume Builder & PDF Generation Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **RES-01** | Profile data automatically loads into Resume Builder | Education, CGPA, and skills populate edit fields on load. | Pass |
| **RES-02** | Live edit reflection in A4 preview pane | Typing into project description updates live preview with 0 lag. | Pass |
| **RES-03** | PDF Export triggered | Valid ATS-formatted PDF downloaded with correct page dimensions and font sizing. | Pass |

---

### 7. Automated Notifications Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **NOTIF-01** | New placement drive posted by TPO | Automated notification delivered to all eligible students. | Pass |
| **NOTIF-02** | Student application status changes | Alert appears in student topbar notification bell with link to application. | Pass |
| **NOTIF-03** | Student clicks "Mark All as Read" | Unread count badge resets to 0. | Pass |

---

### 8. Responsive UI & Error Handling Tests
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **UI-01** | Viewport reduced to mobile screen (375px) | Navigation collapses into mobile hamburger drawer; tables horizontally scroll. | Pass |
| **UI-02** | Backend API connection down | Toast notification alerts user: "Unable to connect to server. Please try again." | Pass |

---

## 🎬 End-to-End User Acceptance Test Walkthrough

To verify system readiness before release, execute this full sequential user journey:

```
[ Step 1: TPO Officer ]
1. Log in at /login as 'tpo@college.edu'
2. Navigate to /tpo/placement-drives -> Click 'New Drive'
3. Enter:
   - Company: Google Cloud
   - Role: Cloud Solutions Engineer
   - CTC: 14.0 LPA
   - Criteria: CSE/IT, Min CGPA 8.0, Max Backlogs 0, Batch 2027
4. Click 'Publish Drive'
   └── Verify: Drive appears in list with status 'ACTIVE'

[ Step 2: Eligible Student ]
5. Log in at /login as 'student@college.edu' (Profile: CSE, 8.45 CGPA, 0 backlogs, Batch 2027)
6. Check topbar -> Verify notification received: "New Drive: Google Cloud"
7. Navigate to /student/placement-drives -> Verify Google Cloud is marked with green 'Eligible' badge
8. Click 'Apply Now' -> Select default resume -> Confirm submission
   └── Verify: Button changes to 'Applied'; application visible in /student/applications

[ Step 3: TPO Review & Interview ]
9. Switch to TPO window -> Navigate to /tpo/applications -> Open Google Cloud applicants
10. Click student 'John Doe' -> Inspect academic credentials and resume
11. Update status to 'Shortlisted'
12. Click 'Schedule Interview' -> Set date, time, and Google Meet URL -> Submit
   └── Verify: Interview status is 'SCHEDULED'

[ Step 4: Interview & Offer Confirmation ]
13. Student checks /student/interviews -> Verify meeting link and schedule are visible
14. TPO marks student 'Selected' -> Inputs package (14.0 LPA) and expected joining date
15. Navigate to /tpo/dashboard
   └── Verify: Placed student count incremented; placement % re-calculated accurately
```

---

## 🚀 Cloud Deployment Guide

### Architecture Topology
- **Database**: PostgreSQL hosted on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
- **Backend**: Express API hosted on [Render](https://render.com) or [Railway](https://railway.app).
- **Frontend**: Next.js App Router hosted on [Vercel](https://vercel.com).

```mermaid
graph LR
    User([Browser / Client])
    Vercel[Vercel: Next.js Frontend]
    Render[Render: Express.js Backend]
    Neon[(Neon: PostgreSQL)]

    User --> Vercel
    Vercel -->|API Calls via HTTPS| Render
    Render -->|Prisma Connection Pool| Neon
```

---

### 1. Database Provisioning (Neon / Supabase)
1. Create a new PostgreSQL database instance on Neon or Supabase.
2. Retrieve the pooled connection string formatted as:
   ```
   postgresql://username:password@ep-sample-123.region.neon.tech/placementos?sslmode=require
   ```
3. Store this URL as `DATABASE_URL` in your backend environment configuration.

---

### 2. Backend API Deployment (Render / Railway)
1. Connect your GitHub repository to Render as a **Web Service**.
2. Set the root directory to `backend`.
3. Configure the build and start commands:
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node server.js`
4. Add backend environment variables in the Render dashboard:
   - `PORT`: `5000`
   - `DATABASE_URL`: *(PostgreSQL connection string)*
   - `JWT_SECRET`: *(Cryptographically secure random key)*
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-placementos-app.vercel.app`

---

### 3. Frontend Deployment (Vercel)
1. Import your GitHub repository to Vercel.
2. Select `frontend` as the root directory.
3. Framework Preset will auto-detect as **Next.js**.
4. Configure environment variables in Vercel project settings:
   - `NEXT_PUBLIC_API_URL`: `https://your-placementos-api.onrender.com/api`
5. Deploy! Vercel will automatically build and distribute the application globally across edge networks.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
```env
# Server Port
PORT=5000

# Node Environment ('development' | 'production')
NODE_ENV=production

# PostgreSQL Database Connection URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/placementos?schema=public"

# JWT Secret & Expiry
JWT_SECRET="replace-with-a-64-char-secure-random-string"
JWT_EXPIRES_IN="7d"

# Allowed Frontend Origin (for CORS)
CLIENT_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```env
# Base URL for backend REST API
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```
