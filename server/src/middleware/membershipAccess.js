import ApiError from '../utils/ApiError.js';
import { ROLES } from '../models/index.js';
import * as membershipService from '../services/membershipService.js';

const STATUS_MESSAGES = {
  none: 'You need an active membership to use this feature. Choose a membership plan to get started.',
  created: 'Your membership application has not been submitted yet.',
  payment_pending: 'Your membership is awaiting payment verification at the front desk.',
  suspended: 'Your membership is currently on hold.',
  expired: 'Your membership has expired. Renew it to continue training.',
  cancelled: 'Your membership has been cancelled. Choose a new plan to continue.',
};

/**
 * Membership validity verification ("Verify Membership Status [checkStatus()]" in the
 * interaction overview). Members without an Active, in-date membership are blocked from
 * training features; other roles pass through.
 */
export async function requireActiveMembership(req, _res, next) {
  if (req.user?.role !== ROLES.MEMBER) return next();
  const v = await membershipService.getValidity(req.user._id);
  if (!v.isValid) {
    throw new ApiError(403, STATUS_MESSAGES[v.status] || STATUS_MESSAGES.none, { membership: v.status }, 'MEMBERSHIP_INACTIVE');
  }
  req.membership = v.membership;
  next();
}
