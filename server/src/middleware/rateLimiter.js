import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, _res, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please wait a bit and try again.')),
    ...options,
  });

/** Broad safety net for the whole API. */
export const globalLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 500 });

/** Register/login: only failed attempts count, so normal use is never blocked. */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
});

/** Creating content: stops a single account from flooding the platform. */
export const createContentLimiter = createLimiter({ windowMs: 60 * 60 * 1000, limit: 30 });
