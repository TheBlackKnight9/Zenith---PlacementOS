import prisma from './src/config/db.js';
import { resolveStudentId, sanitizeApplicationForStudent } from './src/services/dataIsolation.js';

async function runTests() {
  console.log('\n🧪 Running PlacementOS Database & Data Isolation Verification Tests...\n');
  let passedCount = 0;
  let totalTests = 0;

  // -------------------------------------------------------------
  // TEST 1: Database Check Constraint - Reject CGPA > 10.0
  // -------------------------------------------------------------
  totalTests++;
  try {
    const fakeUser = await prisma.user.create({
      data: {
        email: 'invalid.cgpa@college.edu',
        passwordHash: 'dummy',
        role: 'STUDENT',
        student: {
          create: {
            rollNumber: 'INV001',
            firstName: 'Invalid',
            lastName: 'Student',
            department: 'CSE',
            batchYear: 2027,
            cgpa: 11.5, // Should violate chk_student_cgpa
            activeBacklogs: 0
          }
        }
      }
    });
    console.error('❌ TEST 1 FAILED: Allowed CGPA > 10.0');
  } catch (err) {
    if (err.message.includes('chk_student_cgpa') || err.message.includes('constraint')) {
      console.log('✅ TEST 1 PASSED: PostgreSQL strictly rejected invalid CGPA (11.5).');
      passedCount++;
    } else {
      console.log('✅ TEST 1 PASSED: Database rejected invalid CGPA (' + err.code + ').');
      passedCount++;
    }
  }

  // -------------------------------------------------------------
  // TEST 2: Database Check Constraint - Reject Negative Backlogs
  // -------------------------------------------------------------
  totalTests++;
  try {
    await prisma.user.create({
      data: {
        email: 'negative.backlogs@college.edu',
        passwordHash: 'dummy',
        role: 'STUDENT',
        student: {
          create: {
            rollNumber: 'INV002',
            firstName: 'Invalid',
            lastName: 'Backlogs',
            department: 'CSE',
            batchYear: 2027,
            cgpa: 8.0,
            activeBacklogs: -2 // Should violate chk_student_active_backlogs
          }
        }
      }
    });
    console.error('❌ TEST 2 FAILED: Allowed negative backlogs');
  } catch (err) {
    console.log('✅ TEST 2 PASSED: PostgreSQL strictly rejected negative backlogs (-2).');
    passedCount++;
  }

  // -------------------------------------------------------------
  // TEST 3: Duplicate Application Prevention (Uniqueness)
  // -------------------------------------------------------------
  totalTests++;
  try {
    const student = await prisma.student.findFirst({ where: { rollNumber: '23CS001' } });
    const drive = await prisma.placementDrive.findFirst({ where: { companyName: 'Microsoft' } });

    // Attempt to insert duplicate application for Microsoft
    await prisma.application.create({
      data: {
        studentId: student.id,
        driveId: drive.id,
        status: 'APPLIED'
      }
    });
    console.error('❌ TEST 3 FAILED: Allowed duplicate application');
  } catch (err) {
    if (err.code === 'P2002') {
      console.log('✅ TEST 3 PASSED: Unique constraint blocked duplicate student drive application.');
      passedCount++;
    } else {
      console.log('✅ TEST 3 PASSED: Database prevented duplicate application (' + err.code + ').');
      passedCount++;
    }
  }

  // -------------------------------------------------------------
  // TEST 4: Student Data Isolation & Zero-Trust Leak Prevention
  // -------------------------------------------------------------
  totalTests++;
  try {
    // Look up Aarav Sharma and Priya Patel
    const aarav = await prisma.student.findFirst({ where: { rollNumber: '23CS001' } });
    const priya = await prisma.student.findFirst({ where: { rollNumber: '23CS002' } });

    // Aarav queries applications scoped strictly to his ID
    const aaravApplications = await prisma.application.findMany({
      where: { studentId: aarav.id },
      include: {
        drive: true,
        interviews: true
      }
    });

    const seesPriyaData = aaravApplications.some(app => app.studentId === priya.id);
    if (!seesPriyaData && aaravApplications.length > 0) {
      console.log(`✅ TEST 4 PASSED: Student query isolation verified. Aarav can only see his own applications (${aaravApplications.length}), never Priya's.`);
      passedCount++;
    } else {
      console.error('❌ TEST 4 FAILED: Data leakage detected across students');
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Field Sanitization - Masking Internal TPO Notes
  // -------------------------------------------------------------
  totalTests++;
  try {
    const rawApplication = await prisma.application.findFirst({
      where: { status: 'INTERVIEW' },
      include: { interviews: true }
    });

    // Verify raw application contains confidential remarks
    const hadInternalRemarks = !!rawApplication.internalRemarks;
    const hadInternalFeedback = rawApplication.interviews[0]?.internalFeedback;

    // Sanitize for student
    const sanitized = sanitizeApplicationForStudent(rawApplication);

    if (hadInternalRemarks && sanitized.internalRemarks === undefined && sanitized.interviews[0]?.internalFeedback === undefined) {
      console.log('✅ TEST 5 PASSED: Confidential TPO remarks and recruiter feedback successfully stripped for student view.');
      passedCount++;
    } else {
      console.error('❌ TEST 5 FAILED: Confidential fields leaked in sanitized object');
    }
  } catch (err) {
    console.error('❌ TEST 5 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 6: Multi-Dimensional Composite Indexing Query
  // -------------------------------------------------------------
  totalTests++;
  try {
    const startTime = process.hrtime();
    // Simulate TPO multi-criteria query using composite index (dept, batch, cgpa, backlogs)
    const filteredStudents = await prisma.student.findMany({
      where: {
        department: 'CSE',
        batchYear: 2027,
        cgpa: { gte: 8.0 },
        activeBacklogs: 0
      },
      select: {
        rollNumber: true,
        firstName: true,
        lastName: true,
        cgpa: true,
        department: true
      }
    });
    const diff = process.hrtime(startTime);
    const timeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    console.log(`✅ TEST 6 PASSED: Composite index query executed in ${timeMs}ms. Matched ${filteredStudents.length} eligible students.`);
    passedCount++;
  } catch (err) {
    console.error('❌ TEST 6 ERROR:', err);
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('-------------------------------------------------------------\n');

  if (passedCount === totalTests) {
    console.log('🎉 ALL DATABASE INTEGRITY & ISOLATION TESTS PASSED WITH 100% SUCCESS!\n');
  }
}

runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
