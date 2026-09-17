PLACEMENTOS

Complete Project Development Plan

Placement & Internship Management System

Final Scope: Student Dashboard + TPO / Institution Dashboard

1. Project Overview

PlacementOS is a web-based placement and internship management system for colleges. The main purpose is to make placement activities easier to manage and easier for students to follow. Students can manage their profile, skills, resume, placement applications and internship opportunities. TPOs can manage students, placement drives, internships, applications, interviews, selections and reports.

The project will be kept simple and practical. Only two dashboards will be developed: Student and TPO/Institution. A separate Industry or Academician dashboard is not included in the current version.

2. Final Technology Stack

Frontend

Next.js + TypeScript

UI

Tailwind CSS + shadcn/ui + Lucide Icons

Backend

Node.js + Express.js

Database

PostgreSQL

ORM

Prisma

Authentication

JWT + bcrypt

Tools

Git, GitHub, Postman

3. Main Project Structure

The project will contain two main folders so frontend and backend remain separate and easy to maintain.

PlacementOS/

• frontend/ – Next.js application

• backend/ – Node.js + Express API

• README.md – project information

• .gitignore – files not pushed to GitHub

4. Frontend Structure

The frontend will contain separate routes for Student and TPO pages.

• app/login and app/register

• app/student/dashboard

• app/student/profile

• app/student/resume-builder

• app/student/skill-assessment

• app/student/placement-drives

• app/student/internships

• app/student/applications

• app/student/interviews

• app/student/progress

• app/student/notifications

• app/tpo/dashboard

• app/tpo/students

• app/tpo/placement-drives

• app/tpo/internships

• app/tpo/applications

• app/tpo/interviews

• app/tpo/selection

• app/tpo/analytics

• app/tpo/reports

• components/

• lib/

• types/

• public/

5. Backend Structure

The backend will expose REST APIs and contain separate routes, controllers, services and middleware.

• src/config/ – database and environment configuration

• src/controllers/ – request handling

• src/routes/ – API routes

• src/middleware/ – authentication, roles and error handling

• src/services/ – business logic such as eligibility

• src/utils/ – helper functions

• prisma/schema.prisma – database schema

• app.js / server.js – Express server setup

6. User Roles

• Student – uses the Student Dashboard.

• TPO / Institution – uses the TPO Dashboard.

Backend role checking will make sure that a Student cannot access TPO APIs or pages, and TPO-only operations are protected.

7. Student Dashboard

The Student Dashboard will use the approved blue-purple, white and light background theme with rounded cards, clean typography and simple navigation.

Student Sidebar

• Dashboard

• My Profile

• Resume Builder

• Skill Assessment

• Placement Drives

• Internship Opportunities

• My Applications

• Interviews

• My Progress

• Notifications

• Settings

• Logout

Student Features

• Dashboard cards for Eligible Drives, Applied, Interviews and Selected.

• My Profile for personal, academic, skills, projects and certification details.

• Skill Assessment using a simple questionnaire.

• Resume Builder using profile information with preview and PDF download.

• Placement Drives with eligibility, company details and Apply option.

• Internship Opportunities with search, filters, details and Apply option.

• My Applications to track placement and internship status.

• Interviews to view date, time, mode and details.

• My Progress for placement and internship activity.

• Notifications for drives, applications and interviews.

8. TPO / Institution Dashboard

The TPO Dashboard will use the same approved blue-purple and white theme and will focus on managing college placement and internship activities.

TPO Sidebar

• Dashboard

• Students

• Placement Drives

• Internship Opportunities

• Applications

• Interviews

• Selection & Joining

• Analytics & Reports

• Notifications

• Settings

• Logout

TPO Features

• Dashboard cards for Total Students, Active Placement Drives, Internship Opportunities and Applications.

• Students section with search and filters such as department, batch, CGPA and placement status.

• Placement Drive creation with company, role, package, eligibility, skills and deadlines.

• Internship Opportunity creation with company, role, duration, stipend, skills and deadline.

• Application review and candidate shortlisting.

• Interview scheduling and status updates.

• Selection and Joining tracking.

• Basic placement and internship analytics.

• Reports for placement and internship activities.

• Notifications for important student updates.

9. Main Workflow

TPO creates a placement drive or internship opportunity → system stores the opportunity → eligible students can see it → student applies → TPO reviews application → student is shortlisted → interview is scheduled → result is updated → selected student is marked as selected/joined → data appears in reports and analytics.

10. Eligibility System

Eligibility will be based on simple rules entered by the TPO. Examples include branch, minimum CGPA, maximum backlogs and batch.

• Example: CSE / IT + CGPA 7.0 or above + no active backlog + Batch 2027.

• The backend will check these rules before showing the opportunity as eligible to a student.

11. Application Status

• Applied

• Under Review

• Shortlisted

• Interview

• Selected

• Rejected

• Withdrawn

12. Database – Main Tables

• users

• students

• tpo_profiles

• skills

• student_skills

• skill_assessments

• assessment_questions

• assessment_results

• placement_drives

• internship_opportunities

• applications

• interviews

• selection_results

• resumes

• notifications

13. Authentication Flow

User enters email and password → backend verifies the password using bcrypt → backend creates a JWT → frontend stores the login state → user is sent to the correct dashboard based on role.

Authentication and role checking will be handled on the backend as well as the frontend. Protected APIs will reject requests from unauthorized roles.

14. API Planning

• /api/auth

• /api/students

• /api/placement-drives

• /api/internships

• /api/applications

• /api/interviews

• /api/selections

• /api/notifications

• /api/analytics

15. UI Design Rules

• Use the approved blue-purple and white theme throughout the application.

• Keep cards, buttons, forms and tables visually consistent.

• Use clean spacing and readable typography.

• Keep the interface simple and suitable for a college project.

• Use responsive layouts for desktop and mobile.

• Avoid unnecessary animations and advanced visual effects.

16. Development Sequence

Step

Development Task

1

Project setup – frontend and backend

2

PostgreSQL and Prisma setup

3

Database schema

4

Authentication and role-based access

5

TPO Dashboard

6

TPO Students module

7

TPO Placement Drives

8

TPO Internship Opportunities

9

Student Dashboard

10

Student Profile

11

Skill Assessment

12

Resume Builder

13

Student Placement Drives and Internships

14

Applications

15

Interviews and Selection

16

Notifications

17

Analytics and Reports

18

Testing and deployment

17. Team Development Approach

• Student 1 can mainly handle Next.js frontend and Student-side pages.

• Student 2 can mainly handle Node/Express backend, PostgreSQL and TPO APIs.

• Both members will work together on API integration, testing, debugging and deployment.

• GitHub will be used for version control and collaboration.

18. Testing Plan

• Test login and role permissions.

• Test placement and internship creation.

• Test eligibility rules.

• Test student applications.

• Test shortlisting and interview status.

• Test resume creation and PDF download.

• Test notifications.

• Test responsive UI and common errors.

19. Future Scope

Future versions may include a separate industry portal, academician portal, advanced skill matching, learning recommendations, external certification integration and more advanced analytics. These features are outside the current version.

20. Final Project Scope Summary

PlacementOS will be a simple and practical placement and internship management platform. The current version will contain two dashboards only: Student and TPO/Institution. The main focus will remain placement management, supported by internship opportunities, skill assessment, student profiles and a resume builder.

The complete development will follow a module-by-module approach: Setup → Database → Backend → Authentication → TPO → Student → Integration → Testing → Deployment.