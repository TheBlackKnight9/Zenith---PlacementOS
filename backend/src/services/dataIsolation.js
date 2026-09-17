import prisma from '../config/db.js';

/**
 * =============================================================================
 * ZERO-TRUST DATA ISOLATION & LEAK PREVENTION SERVICE
 * Enforces that every student can strictly access only their own records,
 * and prevents accidental leakage of confidential marks, resumes, or TPO remarks.
 * =============================================================================
 */

/**
 * Resolves the authenticated student's profile ID directly from the verified user ID.
 * Throws 403/404 if the student profile does not exist.
 * Never trust a student ID passed in a request body or URL query.
 */
export async function resolveStudentId(userId) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, department: true, batchYear: true, cgpa: true, activeBacklogs: true }
  });

  if (!student) {
    const error = new Error('Student profile not found for authenticated user');
    error.statusCode = 404;
    throw error;
  }

  return student;
}

/**
 * Sanitizes an application object before returning it to a student.
 * Strips confidential TPO internal remarks and recruiter evaluation notes.
 */
export function sanitizeApplicationForStudent(application) {
  if (!application) return null;

  const sanitized = { ...application };

  // Strip confidential reviewer fields
  delete sanitized.internalRemarks;

  // Sanitize nested interviews if present
  if (Array.isArray(sanitized.interviews)) {
    sanitized.interviews = sanitized.interviews.map(interview => {
      const interviewCopy = { ...interview };
      delete interviewCopy.internalFeedback; // Remove private recruiter feedback
      return interviewCopy;
    });
  }

  return sanitized;
}

/**
 * Strips confidential academic metrics (CGPA, active backlogs, phone)
 * if student information is ever rendered in a peer-visible context.
 */
export function sanitizeStudentPublicProfile(student) {
  if (!student) return null;

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    department: student.department,
    batchYear: student.batchYear,
    skills: student.skills || []
    // Omit cgpa, tenthPercentage, twelfthPercentage, activeBacklogs, totalBacklogs, phone
  };
}

/**
 * Prepares scoped Prisma query criteria for student-owned collections.
 * Automatically injects the authenticated student's ID into the query.
 */
export function createStudentScope(studentId, additionalFilters = {}) {
  return {
    ...additionalFilters,
    studentId
  };
}
