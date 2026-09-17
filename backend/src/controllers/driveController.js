import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Create a new Placement Drive (with rich college-format data)
 * POST /api/placement-drives
 */
export async function createPlacementDrive(req, res, next) {
  try {
    const {
      companyName,
      companyLogo,
      companyWebsite,
      companyDescription,
      roleResponsibilities = '',
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
      driveDate,
      // Rich drive fields
      driveType = 'INTERNSHIP_FT',
      jobRoles,
      internshipDuration,
      internshipStipend,
      bondAmount,
      bondConditions,
      joiningTimeline,
      workMode = 'OFFICE',
      selectionProcess,
    } = req.body;

    if (!companyName || !location || !eligibleBranches || !eligibleBatch || !deadline) {
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

    // Derive headline jobRole and packageCtc from jobRoles array if provided
    let headlineJobRole = jobRole || '';
    let headlinePackageCtc = packageCtc || 0;

    if (Array.isArray(jobRoles) && jobRoles.length > 0) {
      // Use the role with highest CTC as headline
      const highestRole = jobRoles.reduce((best, r) => {
        const total = r.ctcBreakdown?.total || 0;
        return total > (best.ctcBreakdown?.total || 0) ? r : best;
      }, jobRoles[0]);

      if (!headlineJobRole) {
        headlineJobRole = highestRole.title || jobRoles[0].title || 'Multiple Roles';
      }
      if (!headlinePackageCtc || headlinePackageCtc === 0) {
        // Convert total CTC from INR to LPA
        const totalInr = highestRole.ctcBreakdown?.total || 0;
        headlinePackageCtc = totalInr >= 100000 ? (totalInr / 100000).toFixed(2) : totalInr;
      }
    }

    if (!headlineJobRole) {
      return sendError(res, 400, 'Either jobRole or at least one entry in jobRoles is required', {
        code: 'MISSING_ROLE'
      });
    }

    const drive = await prisma.placementDrive.create({
      data: {
        tpoId: tpoProfileId,
        companyName: companyName.trim(),
        companyLogo: companyLogo || null,
        companyWebsite: companyWebsite?.trim() || null,
        companyDescription: companyDescription?.trim() || null,
        roleResponsibilities: roleResponsibilities?.trim() || null,
        jobRole: headlineJobRole.trim(),
        jobDescription: jobDescription.trim(),
        packageCtc: parseFloat(headlinePackageCtc),
        location: location.trim(),
        eligibleBranches: eligibleBranches.map(b => b.trim().toUpperCase()),
        minCgpa: parseFloat(minCgpa),
        maxBacklogs: parseInt(maxBacklogs, 10),
        eligibleBatch: parseInt(eligibleBatch, 10),
        skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
        deadline: deadlineDate,
        driveDate: driveDate ? new Date(driveDate) : null,
        status: 'ACTIVE',
        // Rich fields
        driveType: driveType || 'INTERNSHIP_FT',
        jobRoles: Array.isArray(jobRoles) && jobRoles.length > 0 ? jobRoles : undefined,
        internshipDuration: internshipDuration ? parseInt(internshipDuration, 10) : null,
        internshipStipend: internshipStipend ? parseFloat(internshipStipend) : null,
        bondAmount: bondAmount ? parseFloat(bondAmount) : null,
        bondConditions: bondConditions?.trim() || null,
        joiningTimeline: joiningTimeline?.trim() || null,
        workMode: workMode || 'OFFICE',
        selectionProcess: Array.isArray(selectionProcess) && selectionProcess.length > 0 ? selectionProcess : undefined,
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
        companyWebsite: d.companyWebsite,
        companyDescription: d.companyDescription,
        roleResponsibilities: d.roleResponsibilities || null,
        jobRole: d.jobRole,
        jobDescription: d.jobDescription,
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
        // Rich fields
        driveType: d.driveType || 'INTERNSHIP_FT',
        jobRoles: d.jobRoles || null,
        internshipDuration: d.internshipDuration,
        internshipStipend: d.internshipStipend ? parseFloat(d.internshipStipend) : null,
        bondAmount: d.bondAmount ? parseFloat(d.bondAmount) : null,
        bondConditions: d.bondConditions,
        joiningTimeline: d.joiningTimeline,
        workMode: d.workMode || 'OFFICE',
        selectionProcess: d.selectionProcess || null,
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

    return sendSuccess(res, 200, 'Placement drive fetched', {
      drive: {
        ...drive,
        packageCtc: parseFloat(drive.packageCtc),
        minCgpa: parseFloat(drive.minCgpa),
        internshipStipend: drive.internshipStipend ? parseFloat(drive.internshipStipend) : null,
        bondAmount: drive.bondAmount ? parseFloat(drive.bondAmount) : null,
        applicantCount: drive._count.applications,
      }
    });
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

/**
 * Update / Edit a Placement Drive (all fields)
 * PUT /api/placement-drives/:id
 */
export async function updatePlacementDrive(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.placementDrive.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 404, 'Placement drive not found', { code: 'DRIVE_NOT_FOUND' });
    }

    const {
      companyName,
      companyLogo,
      companyWebsite,
      companyDescription,
      roleResponsibilities,
      jobRole,
      jobDescription,
      packageCtc,
      location,
      eligibleBranches,
      minCgpa,
      maxBacklogs,
      eligibleBatch,
      skillsRequired,
      deadline,
      driveDate,
      status,
      driveType,
      jobRoles,
      internshipDuration,
      internshipStipend,
      bondAmount,
      bondConditions,
      joiningTimeline,
      workMode,
      selectionProcess,
    } = req.body;

    // Derive headline from jobRoles if provided
    let headlineJobRole = jobRole;
    let headlinePackageCtc = packageCtc;

    if (Array.isArray(jobRoles) && jobRoles.length > 0) {
      const highestRole = jobRoles.reduce((best, r) => {
        const total = r.ctcBreakdown?.total || 0;
        return total > (best.ctcBreakdown?.total || 0) ? r : best;
      }, jobRoles[0]);

      if (!headlineJobRole) {
        headlineJobRole = highestRole.title || jobRoles[0].title;
      }
      if (headlinePackageCtc === undefined || headlinePackageCtc === null) {
        const totalInr = highestRole.ctcBreakdown?.total || 0;
        headlinePackageCtc = totalInr >= 100000 ? (totalInr / 100000).toFixed(2) : totalInr;
      }
    }

    const updateData = {};

    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (companyLogo !== undefined) updateData.companyLogo = companyLogo || null;
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite?.trim() || null;
    if (companyDescription !== undefined) updateData.companyDescription = companyDescription?.trim() || null;
    if (roleResponsibilities !== undefined) updateData.roleResponsibilities = roleResponsibilities?.trim() || null;
    if (headlineJobRole !== undefined) updateData.jobRole = headlineJobRole.trim();
    if (jobDescription !== undefined) updateData.jobDescription = jobDescription.trim();
    if (headlinePackageCtc !== undefined) updateData.packageCtc = parseFloat(headlinePackageCtc);
    if (location !== undefined) updateData.location = location.trim();
    if (eligibleBranches !== undefined) updateData.eligibleBranches = eligibleBranches.map(b => b.trim().toUpperCase());
    if (minCgpa !== undefined) updateData.minCgpa = parseFloat(minCgpa);
    if (maxBacklogs !== undefined) updateData.maxBacklogs = parseInt(maxBacklogs, 10);
    if (eligibleBatch !== undefined) updateData.eligibleBatch = parseInt(eligibleBatch, 10);
    if (skillsRequired !== undefined) updateData.skillsRequired = Array.isArray(skillsRequired) ? skillsRequired : [];
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (driveDate !== undefined) updateData.driveDate = driveDate ? new Date(driveDate) : null;
    if (status !== undefined) updateData.status = status;
    if (driveType !== undefined) updateData.driveType = driveType;
    if (jobRoles !== undefined) updateData.jobRoles = Array.isArray(jobRoles) && jobRoles.length > 0 ? jobRoles : null;
    if (internshipDuration !== undefined) updateData.internshipDuration = internshipDuration ? parseInt(internshipDuration, 10) : null;
    if (internshipStipend !== undefined) updateData.internshipStipend = internshipStipend ? parseFloat(internshipStipend) : null;
    if (bondAmount !== undefined) updateData.bondAmount = bondAmount ? parseFloat(bondAmount) : null;
    if (bondConditions !== undefined) updateData.bondConditions = bondConditions?.trim() || null;
    if (joiningTimeline !== undefined) updateData.joiningTimeline = joiningTimeline?.trim() || null;
    if (workMode !== undefined) updateData.workMode = workMode;
    if (selectionProcess !== undefined) updateData.selectionProcess = Array.isArray(selectionProcess) && selectionProcess.length > 0 ? selectionProcess : null;

    const updated = await prisma.placementDrive.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { applications: true } }
      }
    });

    return sendSuccess(res, 200, 'Placement drive updated successfully', {
      drive: {
        ...updated,
        packageCtc: parseFloat(updated.packageCtc),
        minCgpa: parseFloat(updated.minCgpa),
        internshipStipend: updated.internshipStipend ? parseFloat(updated.internshipStipend) : null,
        bondAmount: updated.bondAmount ? parseFloat(updated.bondAmount) : null,
        applicantCount: updated._count.applications,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete / Remove a Placement Drive
 * DELETE /api/placement-drives/:id
 */
export async function deletePlacementDrive(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } }
      }
    });

    if (!existing) {
      return sendError(res, 404, 'Placement drive not found', { code: 'DRIVE_NOT_FOUND' });
    }

    await prisma.placementDrive.delete({
      where: { id }
    });

    return sendSuccess(res, 200, `Placement drive for "${existing.companyName}" removed successfully`, {
      deletedId: id,
      deletedCompany: existing.companyName,
      applicantCount: existing._count.applications
    });
  } catch (error) {
    next(error);
  }
}

