import app from './server.js';
import prisma from './src/config/db.js';

let server;
const PORT = 5004;

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

async function runPhase5Tests() {
  console.log('\n📝 Running PlacementOS Phase 5: Application Engine & Status Pipeline Tests...\n');
  await startServer();

  const baseUrl = `http://localhost:${PORT}/api`;
  let passedCount = 0;
  let totalTests = 0;

  let tpoToken = null;
  let aaravToken = null;
  let vikramToken = null;

  try {
    // Authenticate TPO
    const tpoRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tpo@college.edu', password: 'Tpo@12345' })
    });
    const tpoJson = await tpoRes.json();
    tpoToken = tpoJson.data.token;

    // Authenticate Aarav (Eligible CSE candidate, CGPA 8.85)
    const aaravRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@12345' })
    });
    const aaravJson = await aaravRes.json();
    aaravToken = aaravJson.data.token;

    // Authenticate Vikram (Ineligible MECH candidate, CGPA 6.8)
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

  // Resolve test opportunities
  const googleDrive = await prisma.placementDrive.findFirst({ where: { companyName: 'Google Cloud' } });
  const amazonInternship = await prisma.internshipOpportunity.findFirst({ where: { companyName: 'Amazon' } });
  const aaravStudent = await prisma.student.findFirst({ where: { rollNumber: '23CS001' } });

  // Clean up any test applications from previous runs
  if (aaravStudent && googleDrive) {
    await prisma.application.deleteMany({
      where: { studentId: aaravStudent.id, driveId: googleDrive.id }
    });
  }
  if (aaravStudent && amazonInternship) {
    await prisma.application.deleteMany({
      where: { studentId: aaravStudent.id, internshipId: amazonInternship.id }
    });
  }

  let createdDriveAppId = null;
  let createdInternAppId = null;

  // -------------------------------------------------------------
  // TEST 1: Eligible Student Submits Application for Placement Drive
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`
      },
      body: JSON.stringify({ driveId: googleDrive.id })
    });
    const json = await res.json();

    if (res.status === 201 && json.success && json.data.application.status === 'APPLIED') {
      createdDriveAppId = json.data.application.id;
      console.log(`✅ TEST 1 PASSED: Aarav successfully applied to Google Cloud drive (Status: APPLIED, App ID: ${createdDriveAppId}).`);
      passedCount++;
    } else {
      console.error('❌ TEST 1 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 1 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Duplicate Application Prevention
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`
      },
      body: JSON.stringify({ driveId: googleDrive.id })
    });
    const json = await res.json();

    if (res.status === 409 && json.error?.code === 'APPLICATION_ALREADY_SUBMITTED') {
      console.log('✅ TEST 2 PASSED: Duplicate application blocked with 409 APPLICATION_ALREADY_SUBMITTED.');
      passedCount++;
    } else {
      console.error('❌ TEST 2 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 2 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Ineligible Student Blocked by Server-Side Eligibility Guard
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vikramToken}`
      },
      body: JSON.stringify({ driveId: googleDrive.id })
    });
    const json = await res.json();

    if (res.status === 400 && json.error?.code === 'ELIGIBILITY_FAILED') {
      console.log(`✅ TEST 3 PASSED: Server-side eligibility engine blocked ineligible applicant (Reasons: ${json.error.details.length} criteria violated).`);
      passedCount++;
    } else {
      console.error('❌ TEST 3 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 3 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Student Fetches My-Applications with Strict Data Isolation
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const json = await res.json();

    const googleApp = json.data.applications.find(a => a.id === createdDriveAppId);
    const hasNoInternalRemarks = json.data.applications.every(a => a.internalRemarks === undefined);

    if (res.status === 200 && googleApp && googleApp.status === 'APPLIED' && hasNoInternalRemarks) {
      console.log('✅ TEST 4 PASSED: My-applications retrieved; confidential internalRemarks strictly stripped for data isolation.');
      passedCount++;
    } else {
      console.error('❌ TEST 4 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 4 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 5: TPO Lists Applications with Drive Filter
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications/tpo?driveId=${googleDrive.id}`, {
      headers: { 'Authorization': `Bearer ${tpoToken}` }
    });
    const json = await res.json();

    const appFound = json.data.applications.find(a => a.id === createdDriveAppId);
    if (res.status === 200 && appFound && appFound.student.rollNumber === '23CS001') {
      console.log(`✅ TEST 5 PASSED: TPO retrieved applications for Google Cloud; candidate Aarav Sharma (CGPA: ${appFound.student.cgpa}) identified.`);
      passedCount++;
    } else {
      console.error('❌ TEST 5 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 5 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 6: TPO Advances Status to SHORTLISTED with Remarks
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications/${createdDriveAppId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpoToken}`
      },
      body: JSON.stringify({
        status: 'SHORTLISTED',
        internalRemarks: 'Outstanding GitHub repositories and DSA score.',
        studentRemarks: 'Shortlisted for Round 1: Online Technical Assessment.'
      })
    });
    const json = await res.json();

    if (res.status === 200 && json.data.application.status === 'SHORTLISTED') {
      console.log('✅ TEST 6 PASSED: TPO successfully updated status to SHORTLISTED with internal and student remarks.');
      passedCount++;
    } else {
      console.error('❌ TEST 6 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 6 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 7: Student Sees Updated Status & Remarks (Internal Still Isolated)
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const json = await res.json();

    const googleApp = json.data.applications.find(a => a.id === createdDriveAppId);
    if (
      res.status === 200 &&
      googleApp.status === 'SHORTLISTED' &&
      googleApp.studentRemarks === 'Shortlisted for Round 1: Online Technical Assessment.' &&
      googleApp.internalRemarks === undefined
    ) {
      console.log('✅ TEST 7 PASSED: Student sees updated SHORTLISTED status and studentRemarks; internal notes remain hidden.');
      passedCount++;
    } else {
      console.error('❌ TEST 7 FAILED:', res.status, googleApp);
    }
  } catch (err) {
    console.error('❌ TEST 7 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 8: Apply for Internship and Successfully Withdraw
  // -------------------------------------------------------------
  totalTests++;
  try {
    // 1. Submit internship application
    const applyRes = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`
      },
      body: JSON.stringify({ internshipId: amazonInternship.id })
    });
    const applyJson = await applyRes.json();
    createdInternAppId = applyJson.data.application.id;

    // 2. Withdraw the application
    const withdrawRes = await fetch(`${baseUrl}/applications/${createdInternAppId}/withdraw`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const withdrawJson = await withdrawRes.json();

    if (withdrawRes.status === 200 && withdrawJson.data.application.status === 'WITHDRAWN') {
      console.log(`✅ TEST 8 PASSED: Successfully withdrew application in APPLIED stage (App ID: ${createdInternAppId}).`);
      passedCount++;
    } else {
      console.error('❌ TEST 8 FAILED:', withdrawRes.status, withdrawJson);
    }
  } catch (err) {
    console.error('❌ TEST 8 EXCEPTION:', err);
  }

  // -------------------------------------------------------------
  // TEST 9: Attempt Withdrawal on Shortlisted Application Blocked
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/applications/${createdDriveAppId}/withdraw`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${aaravToken}` }
    });
    const json = await res.json();

    if (res.status === 400 && json.error?.code === 'WITHDRAWAL_NOT_ALLOWED') {
      console.log('✅ TEST 9 PASSED: Withdrawal blocked with 400 WITHDRAWAL_NOT_ALLOWED once application is SHORTLISTED.');
      passedCount++;
    } else {
      console.error('❌ TEST 9 FAILED:', res.status, json);
    }
  } catch (err) {
    console.error('❌ TEST 9 EXCEPTION:', err);
  }

  // Clean up test records
  if (createdDriveAppId) {
    await prisma.application.delete({ where: { id: createdDriveAppId } }).catch(() => {});
  }
  if (createdInternAppId) {
    await prisma.application.delete({ where: { id: createdInternAppId } }).catch(() => {});
  }

  await closeServer();

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 PHASE 5 TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('-------------------------------------------------------------\n');

  if (passedCount === totalTests) {
    console.log('🎉 ALL APPLICATION ENGINE & STATUS PIPELINE TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.error(`💥 ${totalTests - passedCount} TESTS FAILED.`);
    process.exit(1);
  }
}

runPhase5Tests();
