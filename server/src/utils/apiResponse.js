/** Every successful response goes through here so the shape never drifts. */
export function sendSuccess(res, data = null, { status = 200, meta } = {}) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendCreated(res, data) {
  return sendSuccess(res, data, { status: 201 });
}
