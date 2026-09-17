# PlacementOS — REST API Specification

This document provides the definitive REST API contracts for the **PlacementOS** backend server built with Node.js and Express.js. It details request headers, body schemas, authentication roles, query parameters, and responses for all modules outlined in [PlacementOS_Development_Plan.md](file:///c:/Web%20Development/Web%20Development/Project%202.0/Placement%20OS/Zenith/PlacementOS_Development_Plan.md).

---

## 📌 Table of Contents
- [Global Conventions](#global-conventions)
  - [Base URL & Protocol](#base-url--protocol)
  - [Authentication & JWT Headers](#authentication--jwt-headers)
  - [Standard Response Formats](#standard-response-formats)
  - [HTTP Status Codes](#http-status-codes)
- [Module 1: Authentication (`/api/auth`)](#module-1-authentication-apiauth)
- [Module 2: Student Profile & Skills (`/api/students`)](#module-2-student-profile--skills-apistudents)
- [Module 3: TPO Student Directory (`/api/tpo`)](#module-3-tpo-student-directory-apitpo)
- [Module 4: Placement Drives (`/api/placement-drives`)](#module-4-placement-drives-apiplacement-drives)
- [Module 5: Internship Opportunities (`/api/internships`)](#module-5-internship-opportunities-apiinternships)
- [Module 6: Application Pipeline (`/api/applications`)](#module-6-application-pipeline-apiapplications)
- [Module 7: Interview Scheduling (`/api/interviews`)](#module-7-interview-scheduling-apiinterviews)
- [Module 8: Selection & Joining (`/api/selections`)](#module-8-selection--joining-apiselections)
- [Module 9: Skill Assessments (`/api/assessments`)](#module-9-skill-assessments-apiassessments)
- [Module 10: Resume Builder (`/api/resumes`)](#module-10-resume-builder-apiresumes)
- [Module 11: Notifications (`/api/notifications`)](#module-11-notifications-apinotifications)
- [Module 12: Analytics & Reports (`/api/analytics`)](#module-12-analytics--reports-apianalytics)

---

## 🌐 Global Conventions

### Base URL & Protocol
- Development: `http://localhost:5000/api`
- Content Type: `application/json` (except file uploads using `multipart/form-data`)

### Authentication & JWT Headers
Every protected endpoint requires the `Authorization` HTTP header with a Bearer token:
```http
Authorization: Bearer <jwt_token>
```
Role authorization is strictly enforced on the server:
- `Public`: No token required.
- `Student`: Requires valid JWT with role `STUDENT`.
- `TPO`: Requires valid JWT with role `TPO`.
- `Authenticated`: Any valid token (`STUDENT` or `TPO`).

### Standard Response Formats

#### Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Resource fetched successfully",
  "data": {
    "item": "value"
  }
}
```

#### Error Envelope (`400`, `401`, `403`, `404`, `500`)
```json
{
  "success": false,
  "message": "Error description message",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "details": [
      {
        "field": "cgpa",
        "issue": "CGPA must be between 0.0 and 10.0"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or missing parameters.
- `401 Unauthorized`: Missing, invalid, or expired JWT token.
- `403 Forbidden`: User role lacks required permission (e.g., student calling TPO route).
- `404 Not Found`: Target entity does not exist.
- `409 Conflict`: Unique constraint violation (e.g., email or duplicate application).
- `500 Internal Server Error`: Unhandled server exception.

---

## 🔐 Module 1: Authentication (`/api/auth`)

### 1.1 Register User
- **Method & Route**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Registers a new user (`STUDENT` or `TPO`). For students, initial academic fields are captured.

#### Request Body
```json
{
  "email": "student@college.edu",
  "password": "Password@123",
  "role": "STUDENT",
  "firstName": "John",
  "lastName": "Doe",
  "rollNumber": "21CS045",
  "department": "CSE",
  "batchYear": 2027,
  "cgpa": 8.45
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e9b21f3a-928d-4b82-9cb7-123456789abc",
      "email": "student@college.edu",
      "role": "STUDENT"
    }
  }
}
```

---

### 1.2 User Login
- **Method & Route**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticates email and password using bcrypt, returns JWT.

#### Request Body
```json
{
  "email": "student@college.edu",
  "password": "Password@123"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e9b21f3a-928d-4b82-9cb7-123456789abc",
      "email": "student@college.edu",
      "role": "STUDENT",
      "dashboardUrl": "/student/dashboard"
    }
  }
}
```

---

### 1.3 Get Current User Session
- **Method & Route**: `GET /api/auth/me`
- **Access**: Authenticated
- **Description**: Returns profile and role of currently logged-in token owner.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Current session retrieved",
  "data": {
    "id": "e9b21f3a-928d-4b82-9cb7-123456789abc",
    "email": "student@college.edu",
    "role": "STUDENT",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "rollNumber": "21CS045",
      "department": "CSE"
    }
  }
}
```

---

## 👨‍🎓 Module 2: Student Profile & Skills (`/api/students`)

### 2.1 Get Student Profile
- **Method & Route**: `GET /api/students/profile`
- **Access**: Student
- **Description**: Returns complete student profile with academics, links, and skills.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "f5a11c2b-4231-4a11-b0e9-aabbccddeeff",
    "rollNumber": "21CS045",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91 9876543210",
    "department": "CSE",
    "batchYear": 2027,
    "cgpa": 8.45,
    "tenthPercentage": 92.4,
    "twelfthPercentage": 89.6,
    "activeBacklogs": 0,
    "totalBacklogs": 0,
    "placementStatus": false,
    "githubUrl": "https://github.com/johndoe",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "portfolioUrl": "https://johndoe.dev",
    "skills": [
      { "id": "skill-1", "name": "React", "proficiency": "ADVANCED" },
      { "id": "skill-2", "name": "Node.js", "proficiency": "INTERMEDIATE" }
    ]
  }
}
```

---

### 2.2 Update Student Profile
- **Method & Route**: `PUT /api/students/profile`
- **Access**: Student
- **Description**: Updates personal, academic, and portfolio links.

#### Request Body
```json
{
  "phone": "+91 9876543210",
  "cgpa": 8.52,
  "activeBacklogs": 0,
  "githubUrl": "https://github.com/johndoe",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "portfolioUrl": "https://johndoe.dev"
}
```

---

### 2.3 Add / Update Skills
- **Method & Route**: `POST /api/students/skills`
- **Access**: Student
- **Description**: Links skill to student profile with proficiency.

#### Request Body
```json
{
  "skillName": "PostgreSQL",
  "proficiency": "INTERMEDIATE"
}
```

---

### 2.4 Student Dashboard Quick Stats
- **Method & Route**: `GET /api/students/dashboard-stats`
- **Access**: Student
- **Description**: Returns quick metric counts for the 4 student summary cards.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Dashboard stats fetched",
  "data": {
    "eligibleDrivesCount": 5,
    "appliedCount": 3,
    "interviewsScheduledCount": 1,
    "selectionStatus": "IN_PROGRESS"
  }
}
```

---

## 🏛️ Module 3: TPO Student Directory (`/api/tpo`)

### 3.1 Search & Filter Students
- **Method & Route**: `GET /api/tpo/students`
- **Access**: TPO
- **Query Parameters**:
  - `department` (e.g. `CSE`)
  - `batchYear` (e.g. `2027`)
  - `minCgpa` (e.g. `7.5`)
  - `maxBacklogs` (e.g. `0`)
  - `placed` (e.g. `true` or `false`)
  - `search` (name or roll number search string)
  - `page` (default: 1)
  - `limit` (default: 20)

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Students directory retrieved",
  "data": {
    "total": 142,
    "page": 1,
    "totalPages": 8,
    "students": [
      {
        "id": "f5a11c2b-4231-4a11-b0e9-aabbccddeeff",
        "rollNumber": "21CS045",
        "name": "John Doe",
        "department": "CSE",
        "batchYear": 2027,
        "cgpa": 8.45,
        "activeBacklogs": 0,
        "placementStatus": false
      }
    ]
  }
}
```

---

### 3.2 TPO Dashboard Quick Metrics
- **Method & Route**: `GET /api/tpo/dashboard-stats`
- **Access**: TPO
- **Description**: Returns metric cards for Total Students, Active Drives, Active Internships, Total Applications, and Placement Rate.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "TPO dashboard stats fetched",
  "data": {
    "totalStudents": 480,
    "activePlacementDrives": 6,
    "activeInternships": 4,
    "totalApplications": 312,
    "totalPlacedStudents": 185,
    "overallPlacementRate": 74.2
  }
}
```

---

## 💼 Module 4: Placement Drives (`/api/placement-drives`)

### 4.1 List Placement Drives
- **Method & Route**: `GET /api/placement-drives`
- **Access**: Authenticated
- **Description**:
  - For **TPO**: Returns all drives with status (`ACTIVE`, `CLOSED`, etc.).
  - For **Student**: Returns drives annotated with `isEligible: boolean` based on student's department, CGPA, backlogs, and batch.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Placement drives retrieved",
  "data": [
    {
      "id": "drive-uuid-1",
      "companyName": "TechCorp Global",
      "jobRole": "Software Development Engineer",
      "packageCtc": 12.0,
      "location": "Bangalore / Hybrid",
      "eligibleBranches": ["CSE", "IT", "ECE"],
      "minCgpa": 7.5,
      "maxBacklogs": 0,
      "eligibleBatch": 2027,
      "deadline": "2026-10-15T18:00:00.000Z",
      "status": "ACTIVE",
      "isEligible": true,
      "hasApplied": false
    }
  ]
}
```

---

### 4.2 Create Placement Drive
- **Method & Route**: `POST /api/placement-drives`
- **Access**: TPO
- **Description**: TPO publishes a new placement drive. Triggers notifications to eligible students.

#### Request Body
```json
{
  "companyName": "TechCorp Global",
  "jobRole": "Software Development Engineer",
  "jobDescription": "We are seeking talented SDEs to join our core cloud platform team...",
  "packageCtc": 12.0,
  "location": "Bangalore / Hybrid",
  "eligibleBranches": ["CSE", "IT", "ECE"],
  "minCgpa": 7.5,
  "maxBacklogs": 0,
  "eligibleBatch": 2027,
  "skillsRequired": ["Java", "Spring Boot", "AWS"],
  "deadline": "2026-10-15T18:00:00.000Z",
  "driveDate": "2026-10-25T09:00:00.000Z"
}
```

---

### 4.3 Check Specific Eligibility
- **Method & Route**: `GET /api/placement-drives/:id/eligibility-check`
- **Access**: Student
- **Description**: Returns detailed pass/fail breakdown across all criteria.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Eligibility check complete",
  "data": {
    "isEligible": false,
    "checks": {
      "department": { "required": ["CSE", "IT"], "studentValue": "CSE", "passed": true },
      "cgpa": { "minRequired": 8.0, "studentValue": 7.8, "passed": false },
      "backlogs": { "maxAllowed": 0, "studentValue": 0, "passed": true },
      "batch": { "required": 2027, "studentValue": 2027, "passed": true }
    },
    "failureReason": "CGPA 7.8 is below required minimum of 8.0"
  }
}
```

---

## 🎯 Module 5: Internship Opportunities (`/api/internships`)

### 5.1 List Internships
- **Method & Route**: `GET /api/internships`
- **Access**: Authenticated
- **Description**: Returns internship postings with stipend, duration, and eligibility flags.

---

### 5.2 Create Internship
- **Method & Route**: `POST /api/internships`
- **Access**: TPO
- **Description**: TPO publishes an internship opportunity.

#### Request Body
```json
{
  "companyName": "InnoTech Labs",
  "roleTitle": "Full Stack Intern",
  "description": "6 months internship working on Next.js and Node.js microservices.",
  "durationMonths": 6,
  "stipendAmount": 30000.0,
  "location": "Pune / Remote",
  "eligibleBranches": ["CSE", "IT"],
  "minCgpa": 7.0,
  "maxBacklogs": 0,
  "eligibleBatch": 2027,
  "deadline": "2026-10-10T23:59:59.000Z",
  "hasPpoOpportunity": true
}
```

---

## 📝 Module 6: Application Pipeline (`/api/applications`)

### 6.1 Submit Application
- **Method & Route**: `POST /api/applications`
- **Access**: Student
- **Description**: Submits application for a drive or internship. The backend checks eligibility before accepting.

#### Request Body
```json
{
  "driveId": "drive-uuid-1",
  "resumeId": "resume-uuid-99"
}
```

#### Error Response (If Ineligible) (`400 Bad Request`)
```json
{
  "success": false,
  "message": "You are not eligible for this placement drive",
  "error": {
    "code": "ELIGIBILITY_FAILED",
    "details": "Your CGPA (7.4) does not satisfy the minimum threshold (7.5)"
  }
}
```

---

### 6.2 Get Student Applications
- **Method & Route**: `GET /api/applications/my-applications`
- **Access**: Student
- **Description**: Lists all drives and internships applied to by the logged-in student with live status.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Applications retrieved",
  "data": [
    {
      "applicationId": "app-101",
      "companyName": "TechCorp Global",
      "role": "Software Development Engineer",
      "type": "PLACEMENT",
      "appliedAt": "2026-09-18T10:30:00.000Z",
      "status": "SHORTLISTED",
      "nextStep": "Technical Interview 1 scheduled on Oct 5"
    }
  ]
}
```

---

### 6.3 Update Application Status (Shortlist / Reject)
- **Method & Route**: `PATCH /api/applications/:id/status`
- **Access**: TPO
- **Description**: TPO advances application status (`UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`).

#### Request Body
```json
{
  "status": "SHORTLISTED",
  "remarks": "Strong problem-solving background in Data Structures."
}
```

---

## 📅 Module 7: Interview Scheduling (`/api/interviews`)

### 7.1 Schedule Interview Round
- **Method & Route**: `POST /api/interviews`
- **Access**: TPO
- **Description**: Creates interview schedule for a shortlisted candidate and triggers an alert.

#### Request Body
```json
{
  "applicationId": "app-101",
  "roundNumber": 1,
  "roundName": "Technical Round 1 (System Design & DSA)",
  "scheduledAt": "2026-10-05T14:30:00.000Z",
  "mode": "ONLINE",
  "venueOrLink": "https://meet.google.com/xyz-abcd-efg",
  "instructions": "Please be prepared with a functional code editor and stable connection."
}
```

---

### 7.2 Get Student Interviews
- **Method & Route**: `GET /api/interviews/student`
- **Access**: Student
- **Description**: Returns all scheduled and past interviews for the student.

---

## 🏆 Module 8: Selection & Joining (`/api/selections`)

### 8.1 Record Selection Result
- **Method & Route**: `POST /api/selections`
- **Access**: TPO
- **Description**: Records official selection of a candidate, package amount, and updates student's `placementStatus` to `true`.

#### Request Body
```json
{
  "applicationId": "app-101",
  "companyName": "TechCorp Global",
  "offeredPackage": 12.5,
  "offerDate": "2026-10-18",
  "joiningDate": "2027-07-01",
  "offerLetterUrl": "https://storage.college.edu/offers/21CS045_TechCorp.pdf"
}
```

---

## 🧠 Module 9: Skill Assessments (`/api/assessments`)

### 9.1 List Available Assessments
- **Method & Route**: `GET /api/assessments`
- **Access**: Student
- **Description**: Returns available tests with time limit and question count.

---

### 9.2 Fetch Assessment Questions
- **Method & Route**: `GET /api/assessments/:id`
- **Access**: Student
- **Description**: Returns question list and 4 options per question. *(Omits correct answer index)*.

---

### 9.3 Submit Assessment
- **Method & Route**: `POST /api/assessments/:id/submit`
- **Access**: Student
- **Description**: Evaluates submitted answers on server, returns score and pass status.

#### Request Body
```json
{
  "answers": [
    { "questionId": "q-1", "selectedOptionIndex": 2 },
    { "questionId": "q-2", "selectedOptionIndex": 0 }
  ]
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Assessment evaluated",
  "data": {
    "score": 80,
    "passingScore": 60,
    "passed": true,
    "totalQuestions": 10,
    "correctCount": 8
  }
}
```

---

## 📄 Module 10: Resume Builder (`/api/resumes`)

### 10.1 Save / Update Resume Structure
- **Method & Route**: `POST /api/resumes`
- **Access**: Student
- **Description**: Persists JSON layout of sections (summary, experience, education, projects, skills).

---

### 10.2 Get Resume Data for PDF Generation
- **Method & Route**: `GET /api/resumes/:id/export-data`
- **Access**: Student
- **Description**: Aggregates student verified academic data, skills, and custom resume text into a structured schema ready for PDF rendering.

---

## 🔔 Module 11: Notifications (`/api/notifications`)

### 11.1 Get Notifications
- **Method & Route**: `GET /api/notifications`
- **Access**: Authenticated
- **Description**: Fetches alerts with read/unread status.

---

### 11.2 Mark Notification as Read
- **Method & Route**: `PATCH /api/notifications/:id/read`
- **Access**: Authenticated

---

## 📊 Module 12: Analytics & Reports (`/api/analytics`)

### 12.1 TPO Institutional Analytics
- **Method & Route**: `GET /api/analytics/tpo/summary`
- **Access**: TPO
- **Description**: Returns department-wise placement percentages, average CTC, and top recruiting companies for chart visualization.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Analytics summary retrieved",
  "data": {
    "departmentWisePlacement": [
      { "department": "CSE", "total": 120, "placed": 98, "percentage": 81.6 },
      { "department": "IT", "total": 60, "placed": 47, "percentage": 78.3 },
      { "department": "ECE", "total": 90, "placed": 62, "percentage": 68.8 }
    ],
    "averageCtcLpa": 7.85,
    "highestCtcLpa": 24.0,
    "topRecruiters": [
      { "company": "TechCorp Global", "hires": 18 },
      { "company": "CloudNative Labs", "hires": 12 }
    ]
  }
}
```
