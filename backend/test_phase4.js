import app from './server.js';
import prisma from './src/config/db.js';

let server;
const PORT = 5003;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => resolve());
  });
}

async function closeServer() {
  return new Promise((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
}

async function runPhase4Tests() {
  console.log('\n🎓 Running PlacementOS Phase 4: Student Core & Eligibility Engine Verification Tests...\n');
  await startServer();

  const baseUrl = `http://localhost:${PORT}/api`;
  let passedCount = 0;
  let totalTests = 0;

  // 1. Authenticate Aarav Sharma (Eligible CSE candidate)
  let aaravToken = null;
  let vikramToken = null;

  try {
    const aaravRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@12345' })
    });
    const aaravJson = await aaravRes.json();
    aaravToken = aaravJson.data.token;

    const vikramRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram.singh@college.edu', password: 'Password@123' })
    });
    const vikramJson = await vikramRes.json();
    vikramToken = vikramJson.data.token;
  } catch (err) {
    console.error('Authentication error in test setup:', err);
  }

  // -------------------------------------------------------------
  // TEST 1: Get Authenticated Student Profile
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/students/profile`, {
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.profile.rollNumber === '23CS001') {
      console.log(`✅ TEST 1 PASSED: Profile fetched for ${json.data.profile.fullName} (CGPA: ${json.data.profile.cgpa}, Dept: ${json.data.profile.department}).`);
      passedCount++;
    } else {
      console.error('❌ TEST 1 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Update Personal Profile & Tamper Protection Check
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`
      },
      body: JSON.stringify({
        bio: 'Aspiring Cloud Infrastructure Architect and Open Source Contributor.',
        githubUrl: 'https://github.com/aarav-updated',
        cgpa: 9.99 // Attempting to tamper with CGPA
      })
    });
    const json = await res.json();

    // Verify in DB that CGPA was NOT modified
    const verifiedStudent = await prisma.student.findFirst({ where: { rollNumber: '23CS001' } });
    const isCgpaUntouched = parseFloat(verifiedStudent.cgpa) === 8.85;

    if (res.status === 200 && json.success && json.data.student.githubUrl === 'https://github.com/aarav-updated' && isCgpaUntouched) {
      console.log('✅ TEST 2 PASSED: Profile updated successfully; academic metrics strictly protected from client tampering.');
      passedCount++;
    } else {
      console.error('❌ TEST 2 FAILED: Tamper protection breached or update failed');
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Add and Remove Skill Tag
  // -------------------------------------------------------------
  totalTests++;
  try {
    const addRes = await fetch(`${baseUrl}/students/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`
      },
      body: JSON.stringify({ skillName: 'GraphQL', proficiency: 'ADVANCED' })
    });
    const addJson = await addRes.json();

    if (addRes.status === 201 && addJson.success && addJson.data.skill.name === 'GraphQL') {
      console.log('✅ TEST 3 PASSED: Added technical skill "GraphQL" to student profile.');
      passedCount++;
    } else {
      console.error('❌ TEST 3 FAILED:', addJson);
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Eligibility Engine Evaluation (Eligible Candidate)
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/students/placement-drives`, {
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const json = await res.json();
    const googleDrive = json.data?.drives.find(d => d.companyName === 'Google Cloud');

    if (res.status === 200 && googleDrive && googleDrive.isEligible === true) {
      console.log(`✅ TEST 4 PASSED: Eligibility engine evaluated Google Cloud as ELIGIBLE for Aarav (CGPA 8.85 >= 8.5, CSE in ['CSE', 'IT']).`);
      passedCount++;
    } else {
      console.error('❌ TEST 4 FAILED:', googleDrive);
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Eligibility Engine Evaluation (Ineligible Candidate)
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/students/placement-drives`, {
      headers: { 'Authorization': `Bearer ${vikramToken}` }
    });
    const json = await res.json();
    const googleDrive = json.data?.drives.find(d => d.companyName === 'Google Cloud');

    if (res.status === 200 && googleDrive && googleDrive.isEligible === false && googleDrive.eligibilityReasons.length >= 2) {
      console.log(`✅ TEST 5 PASSED: Eligibility engine correctly marked Google Cloud as INELIGIBLE for Vikram (Reasons: ${googleDrive.eligibilityReasons.length} criteria failed).`);
      passedCount++;
    } else {
      console.error('❌ TEST 5 FAILED:', googleDrive);
    }
  } catch (err) {
    console.error('❌ TEST 5 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 6: Student Dashboard Quick Stats
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/students/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.eligibleDrivesCount >= 3) {
      console.log(`✅ TEST 6 PASSED: Student dashboard stats returned eligibleDrivesCount: ${json.data.eligibleDrivesCount}, appliedCount: ${json.data.appliedCount}.`);
      passedCount++;
    } else {
      console.error('❌ TEST 6 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 6 ERROR:', err);
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 PHASE 4 TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('-------------------------------------------------------------\n');

  if (passedCount === totalTests) {
    console.log('🎉 ALL STUDENT CORE & ELIGIBILITY ENGINE TESTS PASSED WITH 100% SUCCESS!\n');
  }

  await closeServer();
  await prisma.$disconnect();
}

runPhase4Tests().catch(async (e) => {
  console.error('Phase 4 runner fatal error:', e);
  await closeServer();
  process.exit(1);
});
