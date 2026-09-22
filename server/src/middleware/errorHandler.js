import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { isProduction, isTest } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { formatZodIssues } from './validate.js';

/** Maps any thrown value to { statusCode, code, message, details }. */
function normalizeError(err) {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      details: formatZodIssues(err),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, code: 'INVALID_ID', message: `Invalid value for ${err.path}` };
  }

  // Duplicate key from a unique index (also catches the race between "check" and "create").
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0] ?? 'field';
    return {
      statusCode: 409,
      code: 'DUPLICATE',
      message: `That ${field} is already in use`,
      details: [{ field, message: `That ${field} is already in use` }],
    };
  }

  // body-parser errors (malformed JSON, payload too large)
  if (err?.type === 'entity.parse.failed') {
    return { statusCode: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err?.type === 'entity.too.large') {
    return { statusCode: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }

  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong on our side' };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const { statusCode, code, message, details } = normalizeError(err);

  if (!isTest) {
    const line = `[${req.id}] ${req.method} ${req.originalUrl} -> ${statusCode} ${code}`;
    if (statusCode >= 500) console.error(line, err);
    else console.warn(line, message);
  }

  const error = { code, message, requestId: req.id };
  if (details?.length) error.details = details;
  // Never leak stack traces in production; useful when debugging locally.
  if (!isProduction && statusCode >= 500) error.stack = err?.stack;

  res.status(statusCode).json({ success: false, error });
}
