import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Helper to compute start and end date bounds
 */
function getDateBounds() {
  const now = new Date();
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Current week (Monday to Sunday)
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { now, startOfToday, endOfToday, startOfWeek, endOfWeek };
}

/**
 * List & Filter Interviews with Real-Time KPIs
 * GET /api/interviews
 * Access: TPO
 */
export async function getInterviews(req, res, next) {
  try {
    const {
      status,
      mode,
      department,
      dateFilter,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const { now, startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateBounds();

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (mode && mode !== 'ALL') {
      where.mode = mode;
    }

    if (department && department !== 'ALL') {
      where.application = {
        ...(where.application || {}),
        student: {
          ...(where.application?.student || {}),
          department
        }
      };
    }

    if (dateFilter && dateFilter !== 'ALL') {
      if (dateFilter === 'today') {
        where.scheduledAt = { gte: startOfToday, lte: endOfToday };
      } else if (dateFilter === 'this_week') {
        where.scheduledAt = { gte: startOfWeek, lte: endOfWeek };
      } else if (dateFilter === 'upcoming') {
        where.scheduledAt = { gte: now };
      } else if (dateFilter === 'past') {
        where.scheduledAt = { lt: now };
      } else if (dateFilter === 'feedback_pending') {
        where.status = 'COMPLETED';
        where.internalFeedback = null;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { roundName: { contains: q, mode: 'insensitive' } },
        { venueOrLink: { contains: q, mode: 'insensitive' } },
        {
          application: {
            student: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { rollNumber: { contains: q, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          application: {
            drive: {
              OR: [
                { companyName: { contains: q, mode: 'insensitive' } },
                { jobRole: { contains: q, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          application: {
            internship: {
              OR: [
                { companyName: { contains: q, mode: 'insensitive' } },
                { roleTitle: { contains: q, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Parallel fetch: filtered results, total filtered, and executive KPIs
    const [
      total,
      interviews,
      totalInterviewsKpi,
      scheduledTodayKpi,
      upcomingThisWeekKpi,
      completedKpi,
      feedbackPendingKpi
    ] = await Promise.all([
      prisma.interview.count({ where }),
      prisma.interview.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: { select: { email: true } }
                }
              },
              drive: {
                select: {
                  id: true,
                  companyName: true,
                  jobRole: true,
                  packageCtc: true,
                  location: true
                }
              },
              internship: {
                select: {
                  id: true,
                  companyName: true,
                  roleTitle: true,
                  stipendAmount: true,
                  location: true
                }
              }
            }
          }
        }
      }),
      // Executive KPIs
      prisma.interview.count(),
      prisma.interview.count({
        where: {
          scheduledAt: { gte: startOfToday, lte: endOfToday },
          status: { in: ['SCHEDULED', 'RESCHEDULED'] }
        }
      }),
      prisma.interview.count({
        where: {
          scheduledAt: { gte: now, lte: endOfWeek },
          status: { in: ['SCHEDULED', 'RESCHEDULED'] }
        }
      }),
      prisma.interview.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.interview.count({
        where: {
          status: 'COMPLETED',
          internalFeedback: null
        }
      })
    ]);

    const formatted = interviews.map((item) => {
      const app = item.application;
      const student = app?.student;
      const isDrive = !!app?.driveId;
      const target = isDrive ? app?.drive : app?.internship;
      const fullName = student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown Student';

      return {
        id: item.id,
        applicationId: item.applicationId,
        roundNumber: item.roundNumber,
        roundName: item.roundName,
        scheduledAt: item.scheduledAt,
        mode: item.mode,
        venueOrLink: item.venueOrLink,
        instructions: item.instructions,
        status: item.status,
        internalFeedback: item.internalFeedback,
        studentFeedback: item.studentFeedback,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        applicationStatus: app?.status || 'APPLIED',
        student: student
          ? {
              id: student.id,
              name: fullName,
              rollNumber: student.rollNumber,
              department: student.department,
              batchYear: student.batchYear,
              cgpa: parseFloat(student.cgpa),
              phone: student.phone,
              email: student.user?.email || '',
              activeBacklogs: student.activeBacklogs,
              placementStatus: student.placementStatus
            }
          : null,
        opportunity: target
          ? {
              id: target.id,
              type: isDrive ? 'PLACEMENT' : 'INTERNSHIP',
              companyName: target.companyName,
              title: isDrive ? app.drive?.jobRole : app.internship?.roleTitle,
              compensation: isDrive
                ? `${target.packageCtc} LPA`
                : `₹${Number(target.stipendAmount || 0).toLocaleString('en-IN')}/mo`,
              location: target.location || 'Campus'
            }
          : null
      };
    });

    return sendSuccess(res, 200, 'Interviews retrieved successfully', {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      kpis: {
        totalInterviews: totalInterviewsKpi,
        scheduledToday: scheduledTodayKpi,
        upcomingThisWeek: upcomingThisWeekKpi,
        completed: completedKpi,
        feedbackPending: feedbackPendingKpi
      },
      interviews: formatted
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Eligible Candidates for Interview Scheduling
 * GET /api/interviews/candidates
 * Access: TPO
 */
export async function getCandidatesForScheduling(req, res, next) {
  try {
    const { department, search } = req.query;

    const where = {
      status: { in: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'] }
    };

    if (department && department !== 'ALL') {
      where.student = { department };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.student = {
        ...(where.student || {}),
        OR: [
          { rollNumber: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } }
        ]
      };
    }

    const applications = await prisma.application.findMany({
      where,
      take: 100,
      orderBy: { appliedAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { email: true } }
          }
        },
        drive: {
          select: {
            id: true,
            companyName: true,
            jobRole: true,
            packageCtc: true
          }
        },
        internship: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
            stipendAmount: true
          }
        },
        interviews: {
          select: {
            id: true,
            roundNumber: true,
            roundName: true,
            status: true
          },
          orderBy: { roundNumber: 'desc' }
        }
      }
    });

    const candidates = applications.map((app) => {
      const isDrive = !!app.driveId;
      const target = isDrive ? app.drive : app.internship;
      const fullName = `${app.student.firstName} ${app.student.lastName || ''}`.trim();
      const lastRound = app.interviews[0]?.roundNumber || 0;

      return {
        applicationId: app.id,
        status: app.status,
        student: {
          id: app.student.id,
          name: fullName,
          rollNumber: app.student.rollNumber,
          department: app.student.department,
          cgpa: parseFloat(app.student.cgpa),
          email: app.student.user?.email || ''
        },
        opportunity: {
          id: target?.id,
          type: isDrive ? 'PLACEMENT' : 'INTERNSHIP',
          companyName: target?.companyName || 'Unknown Company',
          title: isDrive ? app.drive?.jobRole : app.internship?.roleTitle,
          packageCtc: isDrive ? app.drive?.packageCtc : null,
          stipend: !isDrive ? app.internship?.stipendAmount : null
        },
        lastRoundNumber: lastRound,
        suggestedNextRoundNumber: lastRound + 1,
        interviewsCount: app.interviews.length
      };
    });

    return sendSuccess(res, 200, 'Eligible candidates retrieved', {
      candidates
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Schedule a New Interview Round
 * POST /api/interviews
 * Access: TPO
 */
export async function createInterview(req, res, next) {
  try {
    const {
      applicationId,
      roundNumber = 1,
      roundName = 'Technical Round 1',
      scheduledAt,
      mode = 'ONLINE',
      venueOrLink,
      instructions,
      internalFeedback
    } = req.body;

    if (!applicationId) {
      return sendError(res, 400, 'applicationId is required', { code: 'MISSING_APPLICATION_ID' });
    }

    if (!scheduledAt) {
      return sendError(res, 400, 'scheduledAt date and time is required', { code: 'MISSING_SCHEDULED_AT' });
    }

    if (!venueOrLink || !venueOrLink.trim()) {
      return sendError(res, 400, 'Venue or meeting link is required', { code: 'MISSING_VENUE_OR_LINK' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: { user: { select: { id: true, email: true } } }
        },
        drive: { select: { companyName: true, jobRole: true } },
        internship: { select: { companyName: true, roleTitle: true } }
      }
    });

    if (!application) {
      return sendError(res, 404, 'Application not found', { code: 'APPLICATION_NOT_FOUND' });
    }

    const validModes = ['ONLINE', 'OFFLINE', 'HYBRID'];
    const selectedMode = validModes.includes(mode) ? mode : 'ONLINE';

    // Create interview record
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        roundNumber: parseInt(roundNumber, 10) || 1,
        roundName: roundName.trim(),
        scheduledAt: new Date(scheduledAt),
        mode: selectedMode,
        venueOrLink: venueOrLink.trim(),
        instructions: instructions ? instructions.trim() : null,
        status: 'SCHEDULED',
        internalFeedback: internalFeedback ? internalFeedback.trim() : null
      }
    });

    // Automatically transition application status to INTERVIEW if in prior stage
    if (['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(application.status)) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'INTERVIEW' }
      });
    }

    // Optional notification generation
    try {
      const company = application.drive?.companyName || application.internship?.companyName || 'Company';
      const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (application.student?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: application.student.user.id,
            title: 'Interview Scheduled',
            message: `Your interview for ${company} (${roundName}) has been scheduled for ${formattedDate}.`,
            type: 'INTERVIEW'
          }
        });
      }
    } catch (notifErr) {
      // Non-blocking notification error
      console.warn('Failed to dispatch interview notification:', notifErr.message);
    }

    return sendSuccess(res, 201, 'Interview scheduled successfully', {
      interview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update / Reschedule an Interview
 * PUT /api/interviews/:id
 * Access: TPO
 */
export async function updateInterview(req, res, next) {
  try {
    const { id } = req.params;
    const {
      roundNumber,
      roundName,
      scheduledAt,
      mode,
      venueOrLink,
      instructions,
      status,
      internalFeedback,
      studentFeedback
    } = req.body;

    const existing = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            student: { include: { user: { select: { id: true } } } },
            drive: { select: { companyName: true } },
            internship: { select: { companyName: true } }
          }
        }
      }
    });

    if (!existing) {
      return sendError(res, 404, 'Interview not found', { code: 'INTERVIEW_NOT_FOUND' });
    }

    const updateData = {};
    if (roundNumber !== undefined) updateData.roundNumber = parseInt(roundNumber, 10);
    if (roundName !== undefined) updateData.roundName = roundName.trim();
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (mode !== undefined) updateData.mode = mode;
    if (venueOrLink !== undefined) updateData.venueOrLink = venueOrLink.trim();
    if (instructions !== undefined) updateData.instructions = instructions ? instructions.trim() : null;
    if (internalFeedback !== undefined) updateData.internalFeedback = internalFeedback ? internalFeedback.trim() : null;
    if (studentFeedback !== undefined) updateData.studentFeedback = studentFeedback ? studentFeedback.trim() : null;

    if (status) {
      const validStatuses = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      }
    } else if (scheduledAt && new Date(scheduledAt).getTime() !== new Date(existing.scheduledAt).getTime()) {
      // Auto-set to RESCHEDULED if scheduled date changes and not explicit status
      updateData.status = 'RESCHEDULED';
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: updateData
    });

    return sendSuccess(res, 200, 'Interview updated successfully', {
      interview: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record Recruiter Evaluation & Scorecard
 * PATCH /api/interviews/:id/feedback
 * Access: TPO
 */
export async function updateInterviewFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const {
      internalFeedback,
      studentFeedback,
      status = 'COMPLETED',
      advanceApplicationStatus
    } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: true }
    });

    if (!interview) {
      return sendError(res, 404, 'Interview not found', { code: 'INTERVIEW_NOT_FOUND' });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        internalFeedback: internalFeedback !== undefined ? (internalFeedback ? internalFeedback.trim() : null) : interview.internalFeedback,
        studentFeedback: studentFeedback !== undefined ? (studentFeedback ? studentFeedback.trim() : null) : interview.studentFeedback,
        status: status || 'COMPLETED'
      }
    });

    // Optionally advance application status
    if (advanceApplicationStatus) {
      const validAppStatuses = ['INTERVIEW', 'SELECTED', 'REJECTED', 'SHORTLISTED'];
      if (validAppStatuses.includes(advanceApplicationStatus)) {
        await prisma.application.update({
          where: { id: interview.applicationId },
          data: { status: advanceApplicationStatus }
        });

        // If candidate was selected on placement drive, mark placementStatus = true
        if (advanceApplicationStatus === 'SELECTED' && interview.application.driveId) {
          await prisma.student.update({
            where: { id: interview.application.studentId },
            data: { placementStatus: true }
          });
        }
      }
    }

    return sendSuccess(res, 200, 'Interview evaluation recorded successfully', {
      interview: updatedInterview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete / Cancel an Interview
 * DELETE /api/interviews/:id
 * Access: TPO
 */
export async function deleteInterview(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.interview.findUnique({
      where: { id }
    });

    if (!existing) {
      return sendError(res, 404, 'Interview not found', { code: 'INTERVIEW_NOT_FOUND' });
    }

    await prisma.interview.delete({
      where: { id }
    });

    return sendSuccess(res, 200, 'Interview deleted successfully', {
      id
    });
  } catch (error) {
    next(error);
  }
}
