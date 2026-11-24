/**
 * Consistent response envelope used by every endpoint:
 *   { success: true,  message, data, meta? }
 *   { success: false, message, errors? }
 */
export function sendSuccess(res, { statusCode = 200, message = 'OK', data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendError(res, { statusCode = 500, message = 'Internal server error', errors } = {}) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}
