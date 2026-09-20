import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { evaluateEligibility } from '../services/eligibilityService.js';
import { normalizeDepartment } from '../utils/departmentHelper.js';

/**
 * Submit an Application for a Placement Drive or Internship Opportunity
 * POST /api/applications
 * Access: Student
 */
export async function apply(req, res, next) {
  try {
    const { driveId, internshipId, resumeId } = req.body;

    // Validate mutually exclusive target constraint
    if ((!driveId && !internshipId) || (driveId && internshipId)) {
      return sendError(res, 400, 'Application must target either a placement drive or an internship opportunity, but not both', {
        code: 'INVALID_APPLICATION_TARGET'
      });
    }

    // Resolve authenticated student
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return sendError(res, 404, 'Student profile not found', { code: 'STUDENT_NOT_FOUND' });
    }

    // Check for duplicate application
    const existing = await prisma.application.findFirst({
      where: {
        studentId: student.id,
        ...(driveId ? { driveId } : { internshipId })
      }
    });

    if (existing) {
      return sendError(res, 409, 'You have already submitted an application for this opportunity', {
        code: 'APPLICATION_ALREADY_SUBMITTED'
      });
    }

    // Verify opportunity and evaluate eligibility dynamically
    if (driveId) {
      const drive = await prisma.placementDrive.findUnique({
        where: { id: driveId }
      });

      if (!drive) {
        return sendError(res, 404, 'Placement drive not found', { code: 'DRIVE_NOT_FOUND' });
      }

      if (drive.status !== 'ACTIVE') {
        return sendError(res, 400, 'This placement drive is no longer active or accepting applications', {
          code: 'DRIVE_INACTIVE'
        });
      }

      if (new Date(drive.deadline) < new Date()) {
        return sendError(res, 400, 'The application deadline for this drive has already passed', {
          code: 'DEADLINE_EXPIRED'
        });
      }

      const evaluation = evaluateEligibility(student, drive);
      if (!evaluation.isEligible) {
        return sendError(res, 400, 'You are not eligible to apply for this placement drive', {
          code: 'ELIGIBILITY_FAILED',
          details: evaluation.reasons
        });
      }
    } else {
      const internship = await prisma.internshipOpportunity.findUnique({
        where: { id: internshipId }
      });

      if (!internship) {
        return sendError(res, 404, 'Internship opportunity not found', { code: 'INTERNSHIP_NOT_FOUND' });
      }

      if (internship.status !== 'ACTIVE') {
        return sendError(res, 400, 'This internship opportunity is no longer active or accepting applications', {
          code: 'INTERNSHIP_INACTIVE'
        });
      }

      if (new Date(internship.deadline) < new Date()) {
        return sendError(res, 400, 'The application deadline for this internship has already passed', {
          code: 'DEADLINE_EXPIRED'
        });
      }

      const evaluation = evaluateEligibility(student, internship);
      if (!evaluation.isEligible) {
        return sendError(res, 400, 'You are not eligible to apply for this internship opportunity', {
          code: 'ELIGIBILITY_FAILED',
          details: evaluation.reasons
        });
      }
    }

    // Create application record
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        driveId: driveId || null,
        internshipId: internshipId || null,
        resumeId: resumeId || null,
        status: 'APPLIED'
      },
      include: {
        drive: {
          select: { id: true, companyName: true, jobRole: true, packageCtc: true, location: true }
        },
        internship: {
          select: { id: true, companyName: true, roleTitle: true, stipendAmount: true, location: true }
        }
      }
    });

    return sendSuccess(res, 201, 'Application submitted successfully', { application });
  } catch (error) {
    next(error);
  }
}

/**
 * Get All Applications for the Authenticated Student
 * GET /api/applications/my-applications
 * Access: Student
 * Note: Strictly omits confidential internalRemarks for complete data isolation.
 */
export async function getMyApplications(req, res, next) {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return sendError(res, 404, 'Student profile not found', { code: 'STUDENT_NOT_FOUND' });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: student.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        drive: {
          select: {
            id: true,
            companyName: true,
            jobRole: true,
            packageCtc: true,
            location: true,
            deadline: true,
            status: true
          }
        },
        internship: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
            stipendAmount: true,
            location: true,
            durationMonths: true,
            deadline: true,
            hasPpoOpportunity: true,
            status: true
          }
        },
        interviews: {
          select: {
            id: true,
            roundNumber: true,
            roundName: true,
            scheduledAt: true,
            mode: true,
            venueOrLink: true,
            instructions: true,
            status: true,
            studentFeedback: true
            // internalFeedback is strictly omitted
          },
          orderBy: { scheduledAt: 'asc' }
        },
        selectionResult: {
          select: {
            id: true,
            companyName: true,
            offeredPackage: true,
            offerDate: true,
            joiningDate: true,
            offerLetterUrl: true
          }
        }
      }
    });

    // Format and sanitize for student consumption
    const sanitized = applications.map(app => {
      const isDrive = !!app.driveId;
      const target = isDrive ? app.drive : app.internship;

      return {
        id: app.id,
        type: isDrive ? 'PLACEMENT' : 'INTERNSHIP',
        targetId: app.driveId || app.internshipId,
        companyName: target?.companyName || 'Unknown Company',
        role: isDrive ? app.drive?.jobRole : app.internship?.roleTitle,
        compensation: isDrive
          ? `₹${app.drive?.packageCtc} LPA`
          : `₹${Number(app.internship?.stipendAmount || 0).toLocaleString('en-IN')}/mo`,
        location: target?.location || 'Not Specified',
        durationMonths: app.internship?.durationMonths || null,
        hasPpoOpportunity: app.internship?.hasPpoOpportunity || false,
        deadline: target?.deadline || null,
        status: app.status,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        studentRemarks: app.studentRemarks,
        // Notice internalRemarks is strictly absent
        interviews: app.interviews,
        selectionResult: app.selectionResult
      };
    });

    return sendSuccess(res, 200, 'Applications retrieved successfully', {
      applications: sanitized
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Withdraw an Application (Only allowed in early stages: APPLIED or UNDER_REVIEW)
 * POST /api/applications/:id/withdraw
 * Access: Student
 */
export async function withdrawApplication(req, res, next) {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return sendError(res, 404, 'Student profile not found', { code: 'STUDENT_NOT_FOUND' });
    }

    const application = await prisma.application.findUnique({
      where: { id }
    });

    if (!application || application.studentId !== student.id) {
      return sendError(res, 404, 'Application not found', { code: 'APPLICATION_NOT_FOUND' });
    }

    if (application.status !== 'APPLIED' && application.status !== 'UNDER_REVIEW') {
      return sendError(res, 400, 'Application cannot be withdrawn once shortlisted or scheduled for interviews', {
        code: 'WITHDRAWAL_NOT_ALLOWED'
      });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        studentRemarks: 'Application voluntarily withdrawn by candidate'
      }
    });

    return sendSuccess(res, 200, 'Application withdrawn successfully', {
      application: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List & Filter Applications for TPO Command Desk
 * GET /api/applications/tpo
 * Access: TPO
 */
export async function getTpoApplications(req, res, next) {
  try {
    const {
      driveId,
      internshipId,
      status,
      department,
      search,
      page = 1,
      limit = 25
    } = req.query;

    const where = {};

    if (driveId) where.driveId = driveId;
    if (internshipId) where.internshipId = internshipId;
    if (status && status !== 'ALL') where.status = status;

    const normDept = normalizeDepartment(department);
    if (normDept) {
      where.student = { ...(where.student || {}), department: { equals: normDept, mode: 'insensitive' } };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { student: { rollNumber: { contains: q, mode: 'insensitive' } } },
        { student: { firstName: { contains: q, mode: 'insensitive' } } },
        { student: { lastName: { contains: q, mode: 'insensitive' } } },
        { student: { user: { email: { contains: q, mode: 'insensitive' } } } },
        { drive: { companyName: { contains: q, mode: 'insensitive' } } },
        { internship: { companyName: { contains: q, mode: 'insensitive' } } },
        { drive: { jobRole: { contains: q, mode: 'insensitive' } } },
        { internship: { roleTitle: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { appliedAt: 'desc' },
        include: {
          drive: {
            select: { id: true, companyName: true, jobRole: true, packageCtc: true, selectionProcess: true }
          },
          internship: {
            select: { id: true, companyName: true, roleTitle: true, stipendAmount: true }
          },
          student: {
            include: {
              user: {
                select: {
                  email: true
                }
              },
              skills: {
                include: { skill: true }
              }
            }
          },
          interviews: {
            select: { id: true, roundNumber: true, roundName: true, scheduledAt: true, status: true, internalFeedback: true }
          },
          selectionResult: true
        }
      })
    ]);

    const formatted = applications.map(app => {
      const fullName = `${app.student.firstName} ${app.student.lastName || ''}`.trim();

      const defaultSelectionProcess = [
        { step: 1, name: 'Resume Shortlisting', description: 'Initial resume and academic screening' },
        { step: 2, name: 'Online Test', description: 'Aptitude, problem-solving & coding assessment' },
        { step: 3, name: 'Technical Interview', description: 'In-depth domain & system design interview' },
        { step: 4, name: 'HR Interview', description: 'Culture fit, behavioral & offer discussion' }
      ];

      const selectionProcess = app.drive?.selectionProcess && Array.isArray(app.drive.selectionProcess) && app.drive.selectionProcess.length > 0
        ? app.drive.selectionProcess
        : defaultSelectionProcess;

      const currentStep = app.currentStep || 1;
      const stepStatus = app.stepStatus || (app.status === 'SELECTED' ? 'CLEARED' : app.status === 'REJECTED' ? 'ELIMINATED' : 'IN_PROGRESS');

      return {
        id: app.id,
        status: app.status,
        currentStep,
        stepStatus,
        selectionProcess,
        internalRemarks: app.internalRemarks,
        studentRemarks: app.studentRemarks,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        targetType: app.driveId ? 'PLACEMENT' : 'INTERNSHIP',
        opportunity: app.drive
          ? { id: app.drive.id, companyName: app.drive.companyName, title: app.drive.jobRole, packageCtc: app.drive.packageCtc }
          : { id: app.internship.id, companyName: app.internship.companyName, title: app.internship.roleTitle, stipend: app.internship.stipendAmount },
        student: {
          id: app.student.id,
          rollNumber: app.student.rollNumber,
          name: fullName,
          email: app.student.user.email,
          department: app.student.department,
          batchYear: app.student.batchYear,
          cgpa: parseFloat(app.student.cgpa),
          activeBacklogs: app.student.activeBacklogs,
          placementStatus: app.student.placementStatus,
          githubUrl: app.student.githubUrl,
          linkedinUrl: app.student.linkedinUrl,
          portfolioUrl: app.student.portfolioUrl,
          skills: app.student.skills.map(s => s.skill.name)
        },
        interviews: app.interviews,
        selectionResult: app.selectionResult
      };
    });

    return sendSuccess(res, 200, 'TPO applications retrieved', {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      applications: formatted
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Application Status & Remarks (TPO Action)
 * PATCH /api/applications/:id/status
 * Access: TPO
 */
export async function updateApplicationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const {
      status,
      internalRemarks,
      studentRemarks,
      currentStep,
      stepStatus
    } = req.body;

    const validStatuses = [
      'APPLIED',
      'UNDER_REVIEW',
      'SHORTLISTED',
      'INTERVIEW',
      'SELECTED',
      'REJECTED',
      'WITHDRAWN'
    ];

    if (status && !validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status value. Allowed: ${validStatuses.join(', ')}`, {
        code: 'INVALID_STATUS'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { drive: true }
    });

    if (!application) {
      return sendError(res, 404, 'Application not found', { code: 'APPLICATION_NOT_FOUND' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (currentStep !== undefined) updateData.currentStep = parseInt(currentStep, 10);
    if (stepStatus !== undefined) updateData.stepStatus = stepStatus;

    // Automatic synchronization of application status with step status
    if (stepStatus === 'ELIMINATED') {
      updateData.status = 'REJECTED';
    } else if (stepStatus === 'CLEARED' && status === 'SELECTED') {
      updateData.status = 'SELECTED';
    }

    if (internalRemarks !== undefined) updateData.internalRemarks = internalRemarks ? internalRemarks.trim() : null;
    if (studentRemarks !== undefined) updateData.studentRemarks = studentRemarks ? studentRemarks.trim() : null;

    const updated = await prisma.application.update({
      where: { id },
      data: updateData
    });

    // If candidate was SELECTED on a placement drive, automatically update student placementStatus and selectionResult
    if (updated.status === 'SELECTED') {
      const company = application.drive?.companyName || 'Campus Partner';
      const pkg = application.drive?.packageCtc ? Number(application.drive.packageCtc) : 10;
      await prisma.selectionResult.upsert({
        where: { applicationId: application.id },
        update: {
          companyName: company,
          offeredPackage: pkg,
          isAccepted: true,
        },
        create: {
          applicationId: application.id,
          companyName: company,
          offeredPackage: pkg,
          offerDate: new Date(),
          isAccepted: true,
        },
      });

      await prisma.student.update({
        where: { id: application.studentId },
        data: { placementStatus: true }
      });
    } else if (application.status === 'SELECTED' && updated.status !== 'SELECTED') {
      // If reverted from SELECTED, remove selection result and check other offers
      await prisma.selectionResult.delete({ where: { applicationId: application.id } }).catch(() => {});
      const otherSelected = await prisma.application.findFirst({
        where: { studentId: application.studentId, status: 'SELECTED', id: { not: application.id } }
      });
      if (!otherSelected) {
        await prisma.student.update({
          where: { id: application.studentId },
          data: { placementStatus: false }
        });
      }
    }

    return sendSuccess(res, 200, 'Application status updated successfully', {
      application: {
        id: updated.id,
        status: updated.status,
        currentStep: updated.currentStep,
        stepStatus: updated.stepStatus,
        internalRemarks: updated.internalRemarks,
        studentRemarks: updated.studentRemarks,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}
