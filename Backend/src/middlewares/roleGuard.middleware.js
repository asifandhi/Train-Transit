import apiError from '../utils/apiError.js';
import { ROLES } from '../constant.js';
export const authorizeRoles = (...allowedRoles) => {
  return (req, _, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new apiError(403, 'Access denied: insufficient permissions');
    }

    next();
  };
};
