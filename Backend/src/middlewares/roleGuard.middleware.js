import { ApiError } from '../utils/apiError.js';
import { ROLES } from '../constants/index.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, _, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ApiError(403, 'Access denied: insufficient permissions');
    }

    next();
  };
};
