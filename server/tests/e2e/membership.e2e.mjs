/** Phase 3 – tiers, membership lifecycle, access gating, admin management, reports, audit. */
import mongoose from 'mongoose';
import { req, createSuite, adminToken, registerMember, createTrainer, createTier, activateMembership, login, uid, E2E_DOMAIN, E2E_TIER_PREFIX } from './lib.mjs';

const DAY = 86400000;
const tr = (id, action, extra, token) => req('POST', `/memberships/${id}/transitions`, { action, ...extra }, token);

/** Moves a membership's dates directly in the database to simulate the passage of time. */
async function shiftDates(membershipId, set) {
  await mongoose.connection.collection('memberships').updateOne({ _id: new mongoose.Types.ObjectId(membershipId) }, { $set: set });
}

export async function run() {
  const s = createSuite('Membership & administration');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const A = await adminToken();
    const T = await createTrainer(A, 'Membership Trainer');

    s.section('Tiers');
    let r = await req('POST', '/membership-tiers', { name: 'x', durationInDays: 0, price: -1 }, A);
    s.check('tier validation (400)', r.status === 400 && r.body.errors.durationInDays && r.body.errors.price, r.body);
    r = await req('POST', '/membership-tiers', { name: `${E2E_TIER_PREFIX}x`, durationInDays: 30, price: 1 }, T.token);
    s.check('trainer cannot create tiers (403)', r.status === 403, r.body);
    const gold = await createTier(A, { price: 2999, maxHoldDays: 10, features: ['Trainer', ' ', 'Diet plan'] });
    s.check('blank features are dropped', gold.features.length === 2, gold);
    r = await req('POST', '/membership-tiers', { name: gold.name.toLowerCase(), durationInDays: 30, price: 1 }, A);
    s.check('tier names unique, case-insensitive (409)', r.status === 409, r.body);
    const basic = await createTier(A, { price: 1099, maxHoldDays: 0 });
    const retired = await createTier(A, { price: 500 });
    await req('PATCH', `/membership-tiers/${retired._id}/status`, { isActive: false }, A);
    r = await req('GET', '/membership-tiers');
    s.check('public catalogue lists active tiers only', r.body.data.some((t) => t._id === gold._id) && !r.body.data.some((t) => t._id === retired._id), null);

    s.section('Access gating');
    const m = await registerMember('Membership Member');
    r = await req('GET', '/members/me/plans', undefined, m.token);
    s.check('no membership → 403 MEMBERSHIP_INACTIVE', r.status === 403 && r.body.code === 'MEMBERSHIP_INACTIVE', r.body);
    r = await req('GET', '/fitness-records', undefined, m.token);
    s.check('progress tracking gated too', r.status === 403 && r.body.code === 'MEMBERSHIP_INACTIVE', r.body);
    r = await req('GET', '/dashboard/member', undefined, m.token);
    s.check('dashboard returns locked view', r.body.data.locked === true, r.body);

    s.section('Lifecycle: Created → PaymentPending → Active');
    r = await req('POST', '/memberships/me', { tierId: retired._id }, m.token);
    s.check('cannot select inactive tier', r.status === 400, r.body);
    r = await req('POST', '/memberships/me', { tierId: gold._id }, m.token);
    s.check('select plan → created (fee snapshotted)', r.status === 201 && r.body.data.status === 'created' && r.body.data.fee === 2999, r.body);
    const ms1 = r.body.data._id;
    r = await req('POST', '/memberships/me', { tierId: basic._id }, m.token);
    s.check('only one open membership (409)', r.status === 409, r.body);
    r = await tr(ms1, 'verify_payment', { paymentMethod: 'cash' }, m.token);
    s.check('member cannot verify payment (403)', r.status === 403, r.body);
    r = await tr(ms1, 'verify_payment', { paymentMethod: 'cash' }, A);
    s.check('verify not allowed from Created (409)', r.status === 409, r.body);
    r = await tr(ms1, 'expire', {}, A);
    s.check('system-only transitions rejected (400)', r.status === 400, r.body);
    r = await tr(ms1, 'submit', {}, m.token);
    s.check('submit → payment_pending', r.body.data?.status === 'payment_pending', r.body);
    r = await tr(ms1, 'verify_payment', { paymentMethod: 'crypto' }, A);
    s.check('payment method validated', r.status === 400, r.body);
    r = await tr(ms1, 'verify_payment', { paymentMethod: 'upi', paymentReference: 'UPI-1' }, A);
    s.check('verify → active with 30-day validity', r.body.data?.status === 'active' && r.body.data.validity.daysRemaining === 30, r.body);
    r = await req('GET', '/members/me/plans', undefined, m.token);
    s.check('active membership unlocks training features', r.status === 200, r.body);

    s.section('Holds and expiry');
    r = await tr(ms1, 'suspend', {}, A);
    s.check('hold requires a reason', r.status === 400, r.body);
    r = await tr(ms1, 'suspend', { note: 'Travel' }, A);
    s.check('suspend → suspended', r.body.data?.status === 'suspended', r.body);
    r = await req('GET', '/fitness-records', undefined, m.token);
    s.check('suspended → gated', r.status === 403, r.body);
    await shiftDates(ms1, { suspendedAt: new Date(Date.now() - 3 * DAY) });
    const before = (await req('GET', `/memberships/${ms1}`, undefined, A)).body.data.endDate;
    r = await tr(ms1, 'resume', {}, A);
    const extended = Math.round((new Date(r.body.data.endDate) - new Date(before)) / DAY);
    s.check('resume extends end date by hold length (3 days)', r.body.data.status === 'active' && extended === 3 && r.body.data.totalSuspendedDays === 3, { extended, d: r.body.data });
    await tr(ms1, 'suspend', { note: 'Injury' }, A);
    await shiftDates(ms1, { suspendedAt: new Date(Date.now() - 8 * DAY) }); // 3 used + 8 > 10 allowed
    r = await req('GET', '/memberships/me', undefined, m.token);
    s.check('maximum hold exceeded → expired by system', r.body.data.current.status === 'expired' && r.body.data.current.statusHistory.some((h) => h.byRole === 'system'), r.body.data.current);

    r = await req('POST', '/memberships/me', { tierId: basic._id }, m.token);
    s.check('renewal allowed after expiry', r.status === 201, r.body);
    const ms2 = r.body.data._id;
    r = await tr(ms1, 'decline_renewal', {}, m.token);
    s.check('decline renewal → cancelled', r.body.data?.status === 'cancelled', r.body);
    await tr(ms2, 'submit', {}, m.token);
    await tr(ms2, 'verify_payment', { paymentMethod: 'card' }, A);
    r = await tr(ms2, 'suspend', { note: 'x' }, A);
    s.check('tier without holds cannot be suspended (409)', r.status === 409, r.body);
    await shiftDates(ms2, { endDate: new Date(Date.now() - 60000) });
    r = await req('GET', '/members/me/plans', undefined, m.token);
    s.check('end date reached → expired and gated', r.status === 403 && r.body.errors.membership === 'expired', r.body);

    s.section('Cancellation paths');
    let id = (await req('POST', '/memberships/me', { tierId: gold._id }, m.token)).body.data._id;
    r = await tr(id, 'cancel_application', {}, m.token);
    s.check('cancel application → cancelled', r.body.data?.status === 'cancelled', r.body);
    id = (await req('POST', '/memberships/me', { tierId: gold._id }, m.token)).body.data._id;
    await tr(id, 'submit', {}, m.token);
    r = await tr(id, 'abandon_payment', {}, m.token);
    s.check('abandon payment → cancelled', r.body.data?.status === 'cancelled', r.body);
    id = await activateMembership(A, m.id, gold._id);
    r = await tr(id, 'terminate', { note: 'Policy breach' }, A);
    s.check('terminate → cancelled with reason', r.body.data?.status === 'cancelled' && r.body.data.closedReason === 'Policy breach', r.body);
    const other = await registerMember('Other Membership Member');
    const otherMs = (await req('POST', '/memberships/me', { tierId: gold._id }, other.token)).body.data._id;
    r = await tr(otherMs, 'submit', {}, m.token);
    s.check("member cannot act on another member's membership (404)", r.status === 404, r.body);
    r = await req('DELETE', `/membership-tiers/${gold._id}`, undefined, A);
    s.check('tier in use cannot be deleted (409)', r.status === 409, r.body);
    r = await req('DELETE', `/membership-tiers/${retired._id}`, undefined, A);
    s.check('unused tier can be deleted', r.status === 200, r.body);

    s.section('Account administration');
    const wu = uid('e2e_w');
    r = await req('POST', '/admin/members', { name: 'Walk In', email: `${wu}@${E2E_DOMAIN}`, username: wu, password: 'Walk12345', age: 40 }, A);
    s.check('admin creates member account', r.status === 201 && r.body.data.age === 40, r.body);
    const walkId = r.body.data._id;
    r = await req('PATCH', `/admin/members/${walkId}`, { newPassword: 'Changed123', phone: '+91 90000 00000' }, A);
    s.check('admin updates member and resets password', r.status === 200, r.body);
    s.check('member signs in with reset password', Boolean(await login(wu, 'Changed123')), null);
    r = await req('PATCH', `/admin/members/${walkId}`, { username: process.env.ADMIN_USERNAME || 'admin' }, A);
    s.check('username uniqueness enforced on update (409)', r.status === 409, r.body);

    await req('POST', '/assignments', { memberId: other.id, trainerId: T.id }, A);
    await tr(otherMs, 'submit', {}, A);
    await tr(otherMs, 'verify_payment', { paymentMethod: 'cash' }, A);
    r = await req('PATCH', `/admin/members/${other.id}/status`, { isActive: false }, A);
    s.check('deactivating a member ends assignment and closes membership', r.body.data?.effects.trainerUnassigned && r.body.data.effects.membershipClosed, r.body);
    r = await req('POST', '/auth/login', { identifier: other.username, password: other.password });
    s.check('deactivated member cannot sign in', r.status === 403, r.body);
    r = await req('PATCH', `/admin/members/${other.id}/status`, { isActive: true }, A);
    s.check('member can be reactivated', r.body.data?.user.isActive === true, r.body);

    await req('POST', '/assignments', { memberId: walkId, trainerId: T.id }, A);
    r = await req('PATCH', `/admin/trainers/${T.id}/status`, { isActive: false }, A);
    s.check('deactivating a trainer unassigns their members', r.body.data?.effects.membersUnassigned === 1, r.body);
    r = await req('GET', '/admin/trainers/options', undefined, A);
    s.check('inactive trainers excluded from allocation picker', !r.body.data.some((t) => t._id === T.id), null);
    r = await req('GET', `/admin/members?search=${wu}`, undefined, A);
    s.check('member list search returns membership and trainer info', r.body.data.length === 1 && 'membership' in r.body.data[0] && 'trainer' in r.body.data[0], r.body);
    r = await req('GET', '/admin/members?assignment=unassigned&status=active&limit=100', undefined, A);
    s.check('unassigned filter', r.body.data.every((x) => !x.trainer), r.body.meta);

    s.section('Reports & audit');
    r = await req('GET', '/admin/reports/operational', undefined, A);
    s.check('operational report', r.status === 200 && r.body.data.signupsByMonth.length === 12 && r.body.data.revenue.total > 0, r.body);
    r = await req('GET', '/admin/reports/operational?from=2026-12-01&to=2026-01-01', undefined, A);
    s.check('invalid report range (400)', r.status === 400, r.body);
    r = await req('GET', '/admin/audit-logs?action=MEMBERSHIP_VERIFY_PAYMENT&limit=5', undefined, A);
    s.check('audit log filter + pagination', r.body.data.length >= 1 && r.body.data.every((a) => a.action === 'MEMBERSHIP_VERIFY_PAYMENT') && r.body.meta.limit === 5, r.body);
    r = await req('GET', '/admin/audit-logs?actorRole=system', undefined, A);
    s.check('system events are audited', r.body.data.some((a) => a.action === 'MEMBERSHIP_EXPIRED'), null);
  } finally {
    await mongoose.disconnect();
  }
  return s.result();
}
