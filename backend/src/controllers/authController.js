import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Register a new Student or TPO user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const {
      email,
      password,
      role = 'STUDENT',
      // Student specific fields
      firstName,
      lastName,
      rollNumber,
      department,
      batchYear,
      cgpa,
      phone,
      // TPO specific fields
      fullName,
      designation
    } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required', { code: 'MISSING_FIELDS' });
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long', { code: 'WEAK_PASSWORD' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return sendError(res, 409, 'An account with this email already exists', { code: 'EMAIL_ALREADY_EXISTS' });
    }

    const passwordHash = await hashPassword(password);

    // 3. Handle role-specific registration
    if (role === 'STUDENT') {
      if (!firstName || !lastName || !rollNumber || !department || !batchYear || cgpa === undefined) {
        return sendError(res, 400, 'All student academic fields are required (First name, Last name, Roll number, Department, Batch year, CGPA)', {
          code: 'MISSING_STUDENT_FIELDS'
        });
      }

      const normalizedRollNumber = rollNumber.toUpperCase().trim();

      // Check roll number uniqueness
      const existingStudent = await prisma.student.findUnique({
        where: { rollNumber: normalizedRollNumber }
      });
      if (existingStudent) {
        return sendError(res, 409, 'A student with this roll number is already registered', {
          code: 'ROLL_NUMBER_ALREADY_EXISTS'
        });
      }

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'STUDENT',
          student: {
            create: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              rollNumber: normalizedRollNumber,
              department: department.trim().toUpperCase(),
              batchYear: parseInt(batchYear, 10),
              cgpa: parseFloat(cgpa),
              phone: phone ? phone.trim() : null
            }
          }
        },
        include: { student: true }
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return sendSuccess(res, 201, 'Student account registered successfully', {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          dashboardUrl: '/student/dashboard',
          profile: {
            id: user.student.id,
            rollNumber: user.student.rollNumber,
            firstName: user.student.firstName,
            lastName: user.student.lastName,
            department: user.student.department,
            cgpa: user.student.cgpa
          }
        }
      });
    } else if (role === 'TPO') {
      if (!fullName || !designation) {
        return sendError(res, 400, 'Full name and designation are required for TPO accounts', {
          code: 'MISSING_TPO_FIELDS'
        });
      }

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'TPO',
          tpoProfile: {
            create: {
              fullName: fullName.trim(),
              designation: designation.trim(),
              phone: phone ? phone.trim() : null
            }
          }
        },
        include: { tpoProfile: true }
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return sendSuccess(res, 201, 'TPO account registered successfully', {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          dashboardUrl: '/tpo/dashboard',
          profile: {
            id: user.tpoProfile.id,
            fullName: user.tpoProfile.fullName,
            designation: user.tpoProfile.designation
          }
        }
      });
    } else {
      return sendError(res, 400, `Invalid role '${role}'. Role must be STUDENT or TPO.`, { code: 'INVALID_ROLE' });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * User Login
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required', { code: 'MISSING_CREDENTIALS' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        student: true,
        tpoProfile: true
      }
    });

    if (!user) {
      return sendError(res, 401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Account is inactive. Please contact administration.', {
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // 2. Compare password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
    }

    // 3. Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const dashboardUrl = user.role === 'TPO' ? '/tpo/dashboard' : '/student/dashboard';

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        dashboardUrl,
        profile: user.role === 'STUDENT' ? {
          id: user.student?.id,
          rollNumber: user.student?.rollNumber,
          firstName: user.student?.firstName,
          lastName: user.student?.lastName,
          department: user.student?.department,
          cgpa: user.student?.cgpa
        } : {
          id: user.tpoProfile?.id,
          fullName: user.tpoProfile?.fullName,
          designation: user.tpoProfile?.designation
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Authenticated User Profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            rollNumber: true,
            firstName: true,
            lastName: true,
            department: true,
            batchYear: true,
            cgpa: true,
            placementStatus: true
          }
        },
        tpoProfile: {
          select: {
            id: true,
            fullName: true,
            designation: true,
            department: true
          }
        }
      }
    });

    if (!user) {
      return sendError(res, 404, 'User profile not found', { code: 'USER_NOT_FOUND' });
    }

    return sendSuccess(res, 200, 'User profile fetched successfully', { user });
  } catch (error) {
    next(error);
  }
}

/**
 * User Logout
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  return sendSuccess(res, 200, 'Logged out successfully');
}
