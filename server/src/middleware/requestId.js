import crypto from 'node:crypto';

/** Tags every request so a user-reported error can be matched to a log line. */
export function requestId(req, res, next) {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
