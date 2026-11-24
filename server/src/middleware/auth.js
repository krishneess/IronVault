import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import * as userRepository from '../repositories/userRepository.js';

/**
 * AuthFilter – verifies the JWT from `Authorization: Bearer <token>`,
 * loads the account and rejects deactivated users.
 */
export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized('Authentication required. Please log in.');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid authentication token'
    );
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('The account for this session no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  req.user = user;
  next();
}

/**
 * AccessManager – role-based authorization. Usage: authorize('admin', 'trainer')
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!allowedRoles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}
