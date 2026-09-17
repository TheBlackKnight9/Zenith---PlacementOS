import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/apiResponse.js';
import prisma from '../config/db.js';

/**
 * Authentication Middleware
 * Validates the JWT Bearer token and attaches user context to req.user
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication token missing or invalid format', {
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return sendError(res, 401, 'Authentication token is invalid or expired', {
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // Retrieve user and their associated profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: { select: { id: true, rollNumber: true, department: true } },
        tpoProfile: { select: { id: true, fullName: true } }
      }
    });

    if (!user) {
      return sendError(res, 401, 'User account no longer exists', {
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return sendError(res, 403, 'User account has been deactivated. Please contact administrator.', {
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Inject verified user session into request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student?.id || null,
      tpoId: user.tpoProfile?.id || null,
      student: user.student || null,
      tpo: user.tpoProfile || null
    };

    next();
  } catch (error) {
    next(error);
  }
}
