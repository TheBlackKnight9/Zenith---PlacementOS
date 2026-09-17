import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Create a new Placement Drive
 * POST /api/placement-drives
 */
export async function createPlacementDrive(req, res, next) {
  try {
    const {
      companyName,
      companyLogo,
      jobRole,
      jobDescription = '',
      packageCtc,
      location,
      eligibleBranches,
      minCgpa = 6.0,
      maxBacklogs = 0,
      eligibleBatch,
      skillsRequired = [],
      deadline,
      driveDate
    } = req.body;

    if (!companyName || !jobRole || !packageCtc || !location || !eligibleBranches || !eligibleBatch || !deadline) {
      return sendError(res, 400, 'Missing required placement drive fields', {
        code: 'MISSING_FIELDS'
      });
    }

    if (!Array.isArray(eligibleBranches) || eligibleBranches.length === 0) {
      return sendError(res, 400, 'At least one eligible branch must be specified', {
        code: 'INVALID_BRANCHES'
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return sendError(res, 400, 'Invalid deadline timestamp', { code: 'INVALID_DATE' });
    }

    // Resolve TPO profile ID
    let tpoProfileId = req.user.tpoId;
    if (!tpoProfileId) {
      const profile = await prisma.tpoProfile.findUnique({ where: { userId: req.user.id } });
      tpoProfileId = profile?.id;
    }

    if (!tpoProfileId) {
      return sendError(res, 403, 'User does not possess an active TPO profile', { code: 'TPO_PROFILE_MISSING' });
    }

    const drive = await prisma.placementDrive.create({
      data: {
        tpoId: tpoProfileId,
        companyName: companyName.trim(),
        companyLogo: companyLogo || null,
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.trim(),
        packageCtc: parseFloat(packageCtc),
        location: location.trim(),
        eligibleBranches: eligibleBranches.map(b => b.trim().toUpperCase()),
        minCgpa: parseFloat(minCgpa),
        maxBacklogs: parseInt(maxBacklogs, 10),
        eligibleBatch: parseInt(eligibleBatch, 10),
        skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
        deadline: deadlineDate,
        driveDate: driveDate ? new Date(driveDate) : null,
        status: 'ACTIVE'
      }
    });

    return sendSuccess(res, 201, 'Placement drive published successfully', { drive });
  } catch (error) {
    next(error);
  }
}

/**
 * Get All Placement Drives
 * GET /api/placement-drives
 */
export async function getAllPlacementDrives(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const drives = await prisma.placementDrive.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { applications: true } }
      }
    });

    return sendSuccess(res, 200, 'Placement drives fetched', {
      drives: drives.map(d => ({
        id: d.id,
        companyName: d.companyName,
        companyLogo: d.companyLogo,
        jobRole: d.jobRole,
        packageCtc: parseFloat(d.packageCtc),
        location: d.location,
        eligibleBranches: d.eligibleBranches,
        minCgpa: parseFloat(d.minCgpa),
        maxBacklogs: d.maxBacklogs,
        eligibleBatch: d.eligibleBatch,
        skillsRequired: d.skillsRequired,
        deadline: d.deadline,
        driveDate: d.driveDate,
        status: d.status,
        applicantCount: d._count.applications,
        createdAt: d.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Placement Drive by ID
 * GET /api/placement-drives/:id
 */
export async function getDriveById(req, res, next) {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
        tpo: { select: { fullName: true, designation: true } }
      }
    });

    if (!drive) {
      return sendError(res, 404, 'Placement drive not found', { code: 'DRIVE_NOT_FOUND' });
    }

    return sendSuccess(res, 200, 'Placement drive fetched', { drive });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Placement Drive Status
 * PATCH /api/placement-drives/:id/status
 */
export async function updateDriveStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid drive status. Allowed: [${validStatuses.join(', ')}]`, {
        code: 'INVALID_STATUS'
      });
    }

    const updated = await prisma.placementDrive.update({
      where: { id },
      data: { status }
    });

    return sendSuccess(res, 200, `Placement drive status updated to ${status}`, { drive: updated });
  } catch (error) {
    next(error);
  }
}
