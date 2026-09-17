import app from './server.js';
import { generateToken } from './src/utils/jwt.js';
import prisma from './src/config/db.js';

let server;
const PORT = 5001; // Use separate test port

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      resolve();
    });
  });
}

async function closeServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runAuthTests() {
  console.log('\n🔐 Running PlacementOS Authentication & RBAC Verification Tests...\n');
  await startServer();

  const baseUrl = `http://localhost:${PORT}/api/auth`;
  let passedCount = 0;
  let totalTests = 0;

  // Clean up any test candidate from previous runs
  await prisma.user.deleteMany({
    where: { email: 'test.candidate@college.edu' }
  });

  // -------------------------------------------------------------
  // TEST 1: Register New Student
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.candidate@college.edu',
        password: 'Password@123',
        role: 'STUDENT',
        firstName: 'Ananya',
        lastName: 'Iyer',
        rollNumber: '23CS999',
        department: 'CSE',
        batchYear: 2027,
        cgpa: 8.90
      })
    });
    const json = await res.json();
    if (res.status === 201 && json.success && json.data?.token && json.data?.user?.role === 'STUDENT') {
      console.log('✅ TEST 1 PASSED: Student registration returned 201 Created with valid JWT.');
      passedCount++;
    } else {
      console.error('❌ TEST 1 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Student Login & Role Redirection
  // -------------------------------------------------------------
  totalTests++;
  let studentToken = null;
  try {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@college.edu',
        password: 'Student@12345'
      })
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.token && json.data.user.dashboardUrl === '/student/dashboard') {
      studentToken = json.data.token;
      console.log('✅ TEST 2 PASSED: Student login verified; returned correct /student/dashboard redirect.');
      passedCount++;
    } else {
      console.error('❌ TEST 2 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 3: TPO Admin Login & Role Redirection
  // -------------------------------------------------------------
  totalTests++;
  let tpoToken = null;
  try {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tpo@college.edu',
        password: 'Tpo@12345'
      })
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.token && json.data.user.dashboardUrl === '/tpo/dashboard') {
      tpoToken = json.data.token;
      console.log('✅ TEST 3 PASSED: TPO login verified; returned correct /tpo/dashboard redirect.');
      passedCount++;
    } else {
      console.error('❌ TEST 3 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Invalid Password Rejection (401 Unauthorized)
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@college.edu',
        password: 'WrongPassword@999'
      })
    });
    const json = await res.json();
    if (res.status === 401 && !json.success && json.error.code === 'INVALID_CREDENTIALS') {
      console.log('✅ TEST 4 PASSED: Invalid password correctly rejected with 401 Unauthorized.');
      passedCount++;
    } else {
      console.error('❌ TEST 4 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Protected Route (GET /api/auth/me) with Bearer Token
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.user.student.rollNumber === '23CS001') {
      console.log('✅ TEST 5 PASSED: GET /api/auth/me authenticated successfully and fetched student profile.');
      passedCount++;
    } else {
      console.error('❌ TEST 5 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 5 ERROR:', err);
  }

  // -------------------------------------------------------------
  // TEST 6: Unauthenticated Request Rejection
  // -------------------------------------------------------------
  totalTests++;
  try {
    const res = await fetch(`${baseUrl}/me`, {
      method: 'GET'
    });
    const json = await res.json();
    if (res.status === 401 && !json.success && json.error.code === 'AUTH_TOKEN_MISSING') {
      console.log('✅ TEST 6 PASSED: Protected route rejected missing token with 401 AUTH_TOKEN_MISSING.');
      passedCount++;
    } else {
      console.error('❌ TEST 6 FAILED:', json);
    }
  } catch (err) {
    console.error('❌ TEST 6 ERROR:', err);
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 AUTH TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('-------------------------------------------------------------\n');

  if (passedCount === totalTests) {
    console.log('🎉 ALL AUTHENTICATION & RBAC TESTS PASSED WITH 100% SUCCESS!\n');
  }

  await closeServer();
  await prisma.$disconnect();
}

runAuthTests().catch(async (e) => {
  console.error('Test runner fatal error:', e);
  await closeServer();
  process.exit(1);
});
