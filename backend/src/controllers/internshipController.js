import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { normalizeDepartment } from '../utils/departmentHelper.js';

/**
 * Create a new Internship Opportunity
 * POST /api/internships
 */
export async function createInternship(req, res, next) {
  try {
    const {
      companyName,
      companyLogo,
      roleTitle,
      description = '',
      durationMonths,
      stipendAmount = 0.0,
      location,
      eligibleBranches,
      minCgpa = 6.0,
      maxBacklogs = 0,
      eligibleBatch,
      deadline,
      hasPpoOpportunity = false
    } = req.body;

    if (!companyName || !roleTitle || !durationMonths || !location || !eligibleBranches || !eligibleBatch || !deadline) {
      return sendError(res, 400, 'Missing required internship opportunity fields', {
        code: 'MISSING_FIELDS'
      });
    }

    let tpoProfileId = req.user.tpoId;
    if (!tpoProfileId) {
      const profile = await prisma.tpoProfile.findUnique({ where: { userId: req.user.id } });
      tpoProfileId = profile?.id;
    }

    if (!tpoProfileId) {
      return sendError(res, 403, 'User does not possess an active TPO profile', { code: 'TPO_PROFILE_MISSING' });
    }

    const internship = await prisma.internshipOpportunity.create({
      data: {
        tpoId: tpoProfileId,
        companyName: companyName.trim(),
        companyLogo: companyLogo || null,
        roleTitle: roleTitle.trim(),
        description: description.trim(),
        durationMonths: parseInt(durationMonths, 10),
        stipendAmount: parseFloat(stipendAmount),
        location: location.trim(),
        eligibleBranches: eligibleBranches.map(b => b.trim().toUpperCase()),
        minCgpa: parseFloat(minCgpa),
        maxBacklogs: parseInt(maxBacklogs, 10),
        eligibleBatch: parseInt(eligibleBatch, 10),
        deadline: new Date(deadline),
        hasPpoOpportunity: !!hasPpoOpportunity,
        status: 'ACTIVE'
      }
    });

    return sendSuccess(res, 201, 'Internship opportunity published successfully', { internship });
  } catch (error) {
    next(error);
  }
}

/**
 * Get All Internship Opportunities
 * GET /api/internships
 */
export async function getAllInternships(req, res, next) {
  try {
    const { status, department } = req.query;
    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const normDept = normalizeDepartment(department);
    if (normDept) {
      where.OR = [
        { eligibleBranches: { has: normDept } },
        { eligibleBranches: { has: 'ALL' } },
        { eligibleBranches: { has: 'All' } },
        { eligibleBranches: { hasSome: [normDept, 'ALL', 'All'] } }
      ];
    }

    const internships = await prisma.internshipOpportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { applications: true } }
      }
    });

    return sendSuccess(res, 200, 'Internship opportunities fetched', {
      internships: internships.map(i => ({
        id: i.id,
        companyName: i.companyName,
        companyLogo: i.companyLogo,
        roleTitle: i.roleTitle,
        durationMonths: i.durationMonths,
        stipendAmount: parseFloat(i.stipendAmount),
        location: i.location,
        eligibleBranches: i.eligibleBranches,
        minCgpa: parseFloat(i.minCgpa),
        maxBacklogs: i.maxBacklogs,
        eligibleBatch: i.eligibleBatch,
        deadline: i.deadline,
        hasPpoOpportunity: i.hasPpoOpportunity,
        status: i.status,
        applicantCount: i._count.applications,
        createdAt: i.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Internship by ID
 * GET /api/internships/:id
 */
export async function getInternshipById(req, res, next) {
  try {
    const { id } = req.params;

    const internship = await prisma.internshipOpportunity.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
        tpo: { select: { fullName: true, designation: true } }
      }
    });

    if (!internship) {
      return sendError(res, 404, 'Internship opportunity not found', { code: 'INTERNSHIP_NOT_FOUND' });
    }

    return sendSuccess(res, 200, 'Internship fetched', { internship });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Internship Status
 * PATCH /api/internships/:id/status
 */
export async function updateInternshipStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Allowed: [${validStatuses.join(', ')}]`, {
        code: 'INVALID_STATUS'
      });
    }

    const updated = await prisma.internshipOpportunity.update({
      where: { id },
      data: { status }
    });

    return sendSuccess(res, 200, `Internship status updated to ${status}`, { internship: updated });
  } catch (error) {
    next(error);
  }
}
