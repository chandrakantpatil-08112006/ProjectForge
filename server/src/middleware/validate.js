import { AppError } from '../utils/AppError.js';

const SOURCES = ['params', 'query', 'body'];

export function formatZodIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * validate({ body, query, params }) with Zod schemas.
 * Parsed (typed, trimmed, unknown-keys-stripped) values are stored on req.validated.
 * We never mutate req.query because it is read-only in Express 5.
 */
export const validate = (schemas) => (req, _res, next) => {
  const validated = {};
  const details = [];

  for (const source of SOURCES) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source] ?? {});
    if (result.success) {
      validated[source] = result.data;
    } else {
      details.push(...formatZodIssues(result.error));
    }
  }

  if (details.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', details);
  }

  req.validated = validated;
  next();
};
