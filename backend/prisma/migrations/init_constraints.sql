-- =============================================================================
-- PLACEMENTOS: POSTGRESQL INTEGRITY & CHECK CONSTRAINTS
-- Guarantees absolute accuracy and prevents corrupted or invalid academic data
-- =============================================================================

-- 1. Student Academic Metric Constraints
ALTER TABLE students
  ADD CONSTRAINT chk_student_cgpa
    CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
  ADD CONSTRAINT chk_student_tenth_pct
    CHECK (tenth_percentage IS NULL OR (tenth_percentage >= 0.00 AND tenth_percentage <= 100.00)),
  ADD CONSTRAINT chk_student_twelfth_pct
    CHECK (twelfth_percentage IS NULL OR (twelfth_percentage >= 0.00 AND twelfth_percentage <= 100.00)),
  ADD CONSTRAINT chk_student_active_backlogs
    CHECK (active_backlogs >= 0),
  ADD CONSTRAINT chk_student_total_backlogs
    CHECK (total_backlogs >= active_backlogs);

-- 2. Placement Drive Value Constraints
ALTER TABLE placement_drives
  ADD CONSTRAINT chk_drive_min_cgpa
    CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
  ADD CONSTRAINT chk_drive_max_backlogs
    CHECK (max_backlogs >= 0),
  ADD CONSTRAINT chk_drive_package_positive
    CHECK (package_ctc > 0.00);

-- 3. Internship Opportunity Value Constraints
ALTER TABLE internship_opportunities
  ADD CONSTRAINT chk_internship_min_cgpa
    CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
  ADD CONSTRAINT chk_internship_max_backlogs
    CHECK (max_backlogs >= 0),
  ADD CONSTRAINT chk_internship_stipend_non_negative
    CHECK (stipend_amount >= 0.00),
  ADD CONSTRAINT chk_internship_duration_positive
    CHECK (duration_months > 0);

-- 4. Application Target Mutual Exclusivity Constraint
-- (An application must link to either a placement drive OR an internship, never both or neither)
ALTER TABLE applications
  ADD CONSTRAINT chk_application_target_exclusive
    CHECK (
      (drive_id IS NOT NULL AND internship_id IS NULL) OR
      (drive_id IS NULL AND internship_id IS NOT NULL)
    );

-- 5. Assessment Score Constraint
ALTER TABLE assessment_results
  ADD CONSTRAINT chk_assessment_score_range
    CHECK (score >= 0 AND score <= 100);

-- 6. Selection Result Constraints
ALTER TABLE selection_results
  ADD CONSTRAINT chk_selection_package_positive
    CHECK (offered_package > 0.00);
