import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';
import env from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return sendError(res, { statusCode: err.statusCode, message: err.message, errors: err.errors, code: err.code });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return sendError(res, { statusCode: 400, message: 'Validation failed', errors });
  }

  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, { statusCode: 400, message: `Invalid value for ${err.path}` });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, {
      statusCode: 409,
      message: `${field} already exists`,
      errors: { [field]: `This ${field} is already in use` },
    });
  }

  if (err?.type === 'entity.parse.failed') {
    return sendError(res, { statusCode: 400, message: 'Malformed JSON in request body' });
  }

  console.error('[error]', err);
  return sendError(res, {
    statusCode: 500,
    message: env.isProduction ? 'Internal server error' : err.message || 'Internal server error',
  });
}
