import { sendError } from '../utils/apiResponse.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles
 * @param  {...string} allowedRoles (e.g. 'STUDENT', 'TPO')
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'Authentication required before checking permissions', {
        code: 'UNAUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, `Access denied. This action requires one of the following roles: [${allowedRoles.join(', ')}]`, {
        code: 'FORBIDDEN_ROLE',
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}
