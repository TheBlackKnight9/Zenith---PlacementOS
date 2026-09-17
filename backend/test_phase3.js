import app from './server.js';
import prisma from './src/config/db.js';

let server;
const PORT = 5002;

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

async function runPhase3Tests() {
  console.log('\n🏛️ Running PlacementOS Phase 3: TPO Core Operations Verification Tests...\n');
  await startServer();

  const baseUrl = `http://localhost:${PORT}/api`;
  let passedCount = 0;
  let totalTests = 0;

  // 1. Authenticate as TPO and Student
  let tpoToken = null;
  let studentToken = null;

  try {
    const tpoRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tpo@college.edu', password: 'Tpo@12345' })
    });
    const tpoJson = await tpoRes.json();
    tpoToken = tpoJson.data.token;

    const studentRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@12345' })
    });
    const studentJson = await studentRes.json();
    studentToken = studentJson.data.token;
  } catch (err) {
    console.error('Authentication pre-test failure:', err);
  }

  // -------------------------------------------------------------
  // TEST 1: TPO Dashboard Stats API
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/tpo/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${tpoToken}` }
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.totalStudents >= 5 && json.data.activePlacementDrives >= 1) {
      console.log(`✅ TEST 1 PASSED: TPO stats returned totalStudents: ${json.data.totalStudents}, activeDrives: ${json.data.activePlacementDrives}, placementRate: ${json.data.placementRate}%.`);
      passedCount++;
    } else {
      console.error('❌ TEST 1 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 2: RBAC Protection - Student Blocked from TPO Stats
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/tpo/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const json = await res.json();
    if (res.status === 403 && !json.success && json.error.code === 'FORBIDDEN_ROLE') {
      console.log('✅ TEST 2 PASSED: Student token blocked from TPO endpoint with 403 FORBIDDEN_ROLE.');
      passedCount++;
    } else {
      console.error('❌ TEST 2 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Students Directory Multi-Filter Query
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/tpo/students?department=CSE&minCgpa=8.0`, {
      headers: { 'Authorization': `Bearer ${tpoToken}` }
    });
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data.students) && json.data.students.length >= 2) {
      console.log(`✅ TEST 3 PASSED: Multi-filter query returned ${json.data.students.length} CSE students with CGPA >= 8.0.`);
      passedCount++;
    } else {
      console.error('❌ TEST 3 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Students Search by Roll Number
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/tpo/students?search=23CS001`, {
      headers: { 'Authorization': `Bearer ${tpoToken}` }
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.students[0]?.rollNumber === '23CS001') {
      console.log(`✅ TEST 4 PASSED: Student search accurately found roll number 23CS001 (${json.data.students[0].name}).`);
      passedCount++;
    } else {
      console.error('❌ TEST 4 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Create Placement Drive API (TPO)
  // -------------------------------------------------------------
  totalTests++;
  let createdDriveId = null;
  try {
    const res = await fetch(`${baseUrl}/placement-drives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpoToken}`
      },
      body: JSON.stringify({
        companyName: 'Amazon AWS',
        jobRole: 'Cloud DevOps Engineer',
        jobDescription: 'Build high-scale CI/CD cloud pipelines.',
        packageCtc: 20.0,
        location: 'Hyderabad, India',
        eligibleBranches: ['CSE', 'IT'],
        minCgpa: 8.0,
        maxBacklogs: 0,
        eligibleBatch: 2027,
        skillsRequired: ['Docker', 'AWS', 'Python'],
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
    const json = await res.json();
    if (res.status === 201 && json.success && json.data.drive.id) {
      createdDriveId = json.data.drive.id;
      console.log(`✅ TEST 5 PASSED: TPO successfully created new drive (Amazon AWS - 20 LPA).`);
      passedCount++;
    } else {
      console.error('❌ TEST 5 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 5 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 6: Update Drive Status API
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/placement-drives/${createdDriveId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpoToken}`
      },
      body: JSON.stringify({ status: 'CLOSED' })
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.drive.status === 'CLOSED') {
      console.log('✅ TEST 6 PASSED: TPO successfully updated drive status to CLOSED.');
      passedCount++;
    } else {
      console.error('❌ TEST 6 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 6 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 7: Create Internship Opportunity API
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpoToken}`
      },
      body: JSON.stringify({
        companyName: 'Flipkart',
        roleTitle: 'Frontend Engineering Intern',
        description: 'React and Next.js design systems intern.',
        durationMonths: 6,
        stipendAmount: 40000.0,
        location: 'Bangalore, India',
        eligibleBranches: ['CSE', 'IT', 'ECE'],
        minCgpa: 7.5,
        maxBacklogs: 0,
        eligibleBatch: 2027,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        hasPpoOpportunity: true
      })
    });
    const json = await res.json();
    if (res.status === 201 && json.success && json.data.internship.id) {
      console.log('✅ TEST 7 PASSED: TPO successfully created internship (Flipkart - ₹40,000/mo).');
      passedCount++;
    } else {
      console.error('❌ TEST 7 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 7 ERROR:', err);
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 PHASE 3 TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('-------------------------------------------------------------\n');

  if (passedCount === totalTests) {
    console.log('🎉 ALL TPO CORE OPERATIONS TESTS PASSED WITH 100% SUCCESS!\n');
  }

  await closeServer();
  await prisma.$disconnect();
}

runPhase3Tests().catch(async (e) => {
  console.error('Phase 3 runner fatal error:', e);
  await closeServer();
  process.exit(1);
});
