/**
 * =============================================================================
 * PLACEMENTOS AUTOMATED ELIGIBILITY ENGINE
 * Evaluates whether a student qualifies for a placement drive or internship.
 * =============================================================================
 */

/**
 * Evaluates eligibility based on:
 * 1. Branch / Department matching
 * 2. CGPA threshold
 * 3. Maximum allowed active backlogs
 * 4. Eligible graduation batch year
 *
 * @param {Object} student - Student profile with department, cgpa, activeBacklogs, batchYear
 * @param {Object} opportunity - Drive or Internship with eligibleBranches, minCgpa, maxBacklogs, eligibleBatch
 * @returns {Object} { isEligible, reasons, breakdown }
 */
export function evaluateEligibility(student, opportunity) {
  if (!student || !opportunity) {
    return {
      isEligible: false,
      reasons: ['Invalid student or opportunity details provided'],
      breakdown: {}
    };
  }

  const studentDept = (student.department || '').trim().toUpperCase();
  const allowedBranches = Array.isArray(opportunity.eligibleBranches)
    ? opportunity.eligibleBranches.map(b => b.trim().toUpperCase())
    : [];

  // Check 1: Department Match
  const branchPassed = allowedBranches.includes(studentDept);

  // Check 2: CGPA Threshold
  const studentCgpa = parseFloat(student.cgpa) || 0;
  const cutoffCgpa = parseFloat(opportunity.minCgpa) || 0;
  const cgpaPassed = studentCgpa >= cutoffCgpa;

  // Check 3: Active Backlogs
  const studentBacklogs = parseInt(student.activeBacklogs, 10) || 0;
  const maxBacklogsAllowed = parseInt(opportunity.maxBacklogs, 10) ?? 0;
  const backlogsPassed = studentBacklogs <= maxBacklogsAllowed;

  // Check 4: Batch Year Match
  const studentBatch = parseInt(student.batchYear, 10);
  const targetBatch = parseInt(opportunity.eligibleBatch, 10);
  const batchPassed = studentBatch === targetBatch;

  const isEligible = branchPassed && cgpaPassed && backlogsPassed && batchPassed;

  const reasons = [];
  if (!branchPassed) {
    reasons.push(`Your branch (${studentDept}) is not among the eligible departments (${allowedBranches.join(', ')}).`);
  }
  if (!cgpaPassed) {
    reasons.push(`Your CGPA (${studentCgpa.toFixed(2)}) is below the required cutoff of ${cutoffCgpa.toFixed(2)}.`);
  }
  if (!backlogsPassed) {
    reasons.push(`You have ${studentBacklogs} active backlogs; maximum allowed is ${maxBacklogsAllowed}.`);
  }
  if (!batchPassed) {
    reasons.push(`Your graduation batch (${studentBatch}) does not match target batch ${targetBatch}.`);
  }

  return {
    isEligible,
    reasons,
    breakdown: {
      branch: {
        passed: branchPassed,
        studentValue: studentDept,
        requiredValue: allowedBranches
      },
      cgpa: {
        passed: cgpaPassed,
        studentValue: studentCgpa,
        requiredValue: cutoffCgpa
      },
      backlogs: {
        passed: backlogsPassed,
        studentValue: studentBacklogs,
        requiredValue: maxBacklogsAllowed
      },
      batch: {
        passed: batchPassed,
        studentValue: studentBatch,
        requiredValue: targetBatch
      }
    }
  };
}
