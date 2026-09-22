import { AppError } from '../utils/AppError.js';

/** Use after `authenticate`: authorize('admin') lets only admins through. */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw AppError.forbidden();
    }
    next();
  };
