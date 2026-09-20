/**
 * Placement Status Resolver Helper
 * Resolves comprehensive 3-tier placement status for a student based on:
 * - Student placementStatus flag
 * - Applications (status, currentStep, stepStatus)
 * - PlacementDrive / Internship details
 * - Interviews (scheduled rounds, round names)
 * - SelectionResult (offered package, accepted company, offer date)
 * 
 * Returns:
 * {
 *   statusType: 'SUCCESS' | 'PROCESSING' | 'NOT_APPLIED',
 *   statusLabel: 'Success' | 'Processing' | 'Not Applied',
 *   companyName: string | null,
 *   jobRole: string | null,
 *   stepName: string | null,
 *   detailText: string,
 *   packageCtc: number | null,
 *   offerDate: string | null,
 *   totalApplications: number,
 *   activeApplications: number
 * }
 */

export function resolveStudentPlacementStatus(student) {
  if (!student) {
    return {
      statusType: 'NOT_APPLIED',
      statusLabel: 'Not Applied',
      companyName: null,
      jobRole: null,
      stepName: null,
      detailText: 'No applications submitted',
      packageCtc: null,
      offerDate: null,
      totalApplications: 0,
      activeApplications: 0,
    };
  }

  const applications = student.applications || [];
  const totalApplications = student.applicationsCount ?? applications.length;

  // 1. Check for SUCCESS (Placed)
  const selectedApp = applications.find(
    (a) => a.status === 'SELECTED' || !!a.selectionResult
  );

  if (selectedApp || student.placementStatus) {
    const company =
      selectedApp?.selectionResult?.companyName ||
      selectedApp?.drive?.companyName ||
      selectedApp?.internship?.companyName ||
      (typeof student.placedCompany === 'string' && student.placedCompany ? student.placedCompany : null) ||
      'Placement Confirmed';

    const role =
      selectedApp?.drive?.jobRole ||
      selectedApp?.internship?.roleTitle ||
      'Recruited Candidate';

    const pkg =
      selectedApp?.selectionResult?.offeredPackage
        ? Number(selectedApp.selectionResult.offeredPackage)
        : selectedApp?.drive?.packageCtc
        ? Number(selectedApp.drive.packageCtc)
        : (typeof student.placedPackage === 'number' ? student.placedPackage : null);

    const offerDate = selectedApp?.selectionResult?.offerDate || null;

    let detailText = company;
    if (pkg && pkg > 0) {
      detailText = `${company} • ₹${pkg} LPA`;
    }

    return {
      statusType: 'SUCCESS',
      statusLabel: 'Success',
      companyName: company,
      jobRole: role,
      stepName: 'Offer Accepted / Placed',
      detailText,
      packageCtc: pkg,
      offerDate,
      totalApplications,
      activeApplications: 0,
    };
  }

  // 2. Check for PROCESSING (Has active applications in pipeline)
  // Active applications are those not yet REJECTED or WITHDRAWN
  const activeApps = applications.filter(
    (a) => a.status !== 'REJECTED' && a.status !== 'WITHDRAWN'
  );

  // If student has applications, they are in Processing
  const candidateApps = activeApps.length > 0 ? activeApps : applications;

  if (candidateApps.length > 0) {
    // Prioritize stage depth: INTERVIEW > SHORTLISTED > UNDER_REVIEW > APPLIED
    const stagePriority = {
      INTERVIEW: 4,
      SHORTLISTED: 3,
      UNDER_REVIEW: 2,
      APPLIED: 1,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    const primaryApp = [...candidateApps].sort((a, b) => {
      const pA = stagePriority[a.status] || 0;
      const pB = stagePriority[b.status] || 0;
      if (pB !== pA) return pB - pA;
      const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return dateB - dateA;
    })[0];

    const company =
      primaryApp.drive?.companyName ||
      primaryApp.internship?.companyName ||
      'Recruiting Partner';

    const role =
      primaryApp.drive?.jobRole ||
      primaryApp.internship?.roleTitle ||
      '';

    // Derive current step name
    let stepName = '';

    // Check if interviews exist
    const interviews = primaryApp.interviews || [];
    const scheduledOrRecentInterview = interviews.find(
      (i) => i.status === 'SCHEDULED' || i.status === 'RESCHEDULED' || i.status === 'COMPLETED'
    ) || interviews[0];

    if (scheduledOrRecentInterview?.roundName) {
      stepName = scheduledOrRecentInterview.roundName;
    } else if (primaryApp.drive?.selectionProcess && Array.isArray(primaryApp.drive.selectionProcess)) {
      const currentStepNum = primaryApp.currentStep || 1;
      const matchedStep = primaryApp.drive.selectionProcess.find((sp) => sp.step === currentStepNum);
      stepName = matchedStep?.name || `Step ${currentStepNum}`;
    } else {
      switch (primaryApp.status) {
        case 'INTERVIEW':
          stepName = 'Technical Round';
          break;
        case 'SHORTLISTED':
          stepName = 'Shortlisted';
          break;
        case 'UNDER_REVIEW':
          stepName = 'Under Review';
          break;
        case 'APPLIED':
          stepName = 'Application Submitted';
          break;
        default:
          stepName = 'In Review';
      }
    }

    const detailText = `${stepName} • ${company}`;

    return {
      statusType: 'PROCESSING',
      statusLabel: 'Processing',
      companyName: company,
      jobRole: role,
      stepName,
      detailText,
      packageCtc: primaryApp.drive?.packageCtc ? Number(primaryApp.drive.packageCtc) : null,
      offerDate: null,
      totalApplications,
      activeApplications: activeApps.length,
    };
  }

  // 3. NOT_APPLIED (0 applications and not placed)
  return {
    statusType: 'NOT_APPLIED',
    statusLabel: 'Not Applied',
    companyName: null,
    jobRole: null,
    stepName: null,
    detailText: 'No applications yet',
    packageCtc: null,
    offerDate: null,
    totalApplications: 0,
    activeApplications: 0,
  };
}
