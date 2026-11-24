import * as tierRepository from '../repositories/membershipTierRepository.js';
import * as membershipRepository from '../repositories/membershipRepository.js';
import * as auditService from './auditService.js';
import ApiError from '../utils/ApiError.js';
import { validate, hasErrors, isValidId } from '../utils/validators.js';

const tierSchema = {
  name: { required: true, label: 'Name', minLength: 2, maxLength: 60 },
  description: { label: 'Description', maxLength: 500 },
  durationInDays: { required: true, label: 'Duration', type: 'number', min: 1, max: 1825 },
  price: { required: true, label: 'Price', type: 'number', min: 0, max: 1000000 },
  maxHoldDays: { label: 'Maximum hold', type: 'number', min: 0, max: 365 },
  features: { label: 'Features', type: 'array' },
};

function validated(body = {}) {
  const errors = validate(body, tierSchema);
  const features = Array.isArray(body.features) ? body.features.map((f) => String(f).trim()).filter(Boolean) : [];
  if (features.length > 12) errors.features = 'At most 12 features';
  if (features.some((f) => f.length > 120)) errors.features = 'Each feature must be at most 120 characters';
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') errors.isActive = 'Must be true or false';
  if (hasErrors(errors)) throw ApiError.badRequest('Please correct the highlighted fields', errors);
  return {
    name: String(body.name).trim(),
    description: body.description ? String(body.description).trim() : '',
    durationInDays: Number(body.durationInDays),
    price: Number(body.price),
    maxHoldDays: body.maxHoldDays === undefined || body.maxHoldDays === '' ? 0 : Number(body.maxHoldDays),
    features,
    ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }),
  };
}

async function load(id) {
  if (!isValidId(id)) throw ApiError.badRequest('Invalid tier id');
  const tier = await tierRepository.findById(id);
  if (!tier) throw ApiError.notFound('Membership tier not found');
  return tier;
}

/** Public list shows only active tiers; admins can include inactive ones. */
export const list = ({ includeInactive = false } = {}) => tierRepository.findAll({ activeOnly: !includeInactive });

export async function create(admin, body, req) {
  const data = validated(body);
  if (await tierRepository.existsByName(data.name)) throw new ApiError(409, 'A tier with this name already exists', { name: 'Name already in use' });
  const tier = await tierRepository.create(data);
  await auditService.record({ actor: admin, action: 'TIER_CREATED', entity: 'MembershipTier', entityId: tier._id, description: `Membership tier created: ${tier.name}`, req });
  return tier;
}

export async function update(admin, id, body, req) {
  await load(id);
  const data = validated(body);
  if (await tierRepository.existsByName(data.name, id)) throw new ApiError(409, 'A tier with this name already exists', { name: 'Name already in use' });
  const tier = await tierRepository.updateById(id, data);
  await auditService.record({ actor: admin, action: 'TIER_UPDATED', entity: 'MembershipTier', entityId: tier._id, description: `Membership tier updated: ${tier.name}`, req });
  return tier;
}

export async function setActive(admin, id, isActive, req) {
  if (typeof isActive !== 'boolean') throw ApiError.badRequest('isActive must be true or false');
  await load(id);
  const tier = await tierRepository.updateById(id, { isActive });
  await auditService.record({
    actor: admin,
    action: isActive ? 'TIER_ACTIVATED' : 'TIER_DEACTIVATED',
    entity: 'MembershipTier',
    entityId: tier._id,
    description: `Membership tier ${isActive ? 'activated' : 'deactivated'}: ${tier.name}`,
    req,
  });
  return tier;
}

/** Tiers referenced by any membership are kept for history – deactivate them instead. */
export async function remove(admin, id, req) {
  const tier = await load(id);
  if (await membershipRepository.existsForTier(id)) {
    throw ApiError.conflict('This tier has memberships on record. Deactivate it instead of deleting it.');
  }
  await tierRepository.deleteById(id);
  await auditService.record({ actor: admin, action: 'TIER_DELETED', entity: 'MembershipTier', entityId: tier._id, description: `Membership tier deleted: ${tier.name}`, req });
}
