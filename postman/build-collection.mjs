/**
 * Generates the IronVault Postman collection (v2.1) – run: node postman/build-collection.mjs
 * The collection runs top-to-bottom as one journey through all three roles; every request has tests,
 * and IDs / tokens flow between requests through collection variables.
 * Test data is marked (emails @e2e.ironvault.test, tier names "E2E …") so `npm run test:cleanup` removes it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const status = (code) => `pm.test('status is ${code}', () => pm.response.to.have.status(${code}));`;
const json = 'const body = pm.response.json();';
const envelope = "pm.test('consistent response envelope', () => pm.expect(body).to.have.property('success'));";
const save = (name, expr) => `pm.collectionVariables.set('${name}', ${expr});`;
const expect = (label, expr) => `pm.test(${JSON.stringify(label)}, () => pm.expect(${expr}).to.be.true);`;

function item(name, method, urlPath, { token, body, tests = [], pre = [], description } = {}) {
  const header = [{ key: 'Content-Type', value: 'application/json' }];
  if (token) header.push({ key: 'Authorization', value: `Bearer {{${token}}}` });
  return {
    name,
    request: {
      method,
      header,
      url: `{{baseUrl}}${urlPath}`,
      ...(body !== undefined && { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } }),
      ...(description && { description }),
    },
    event: [
      ...(pre.length ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } }] : []),
      { listen: 'test', script: { type: 'text/javascript', exec: [json, envelope, ...tests] } },
    ],
  };
}

const folder = (name, description, items) => ({ name, description, item: items });

const collection = {
  info: {
    name: 'IronVault API',
    description:
      'IronVault – Gym Fitness Repository Management System.\n\nRun the whole collection in order (Collection Runner or Newman). Set `baseUrl`, `adminIdentifier` and `adminPassword` in an environment first. Created data uses `@e2e.ironvault.test` emails and `E2E` tier names – remove it with `npm run test:cleanup` in /server.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'runId', value: '' },
    ...['adminToken', 'memberToken', 'trainerToken', 'memberId', 'memberUsername', 'trainerId', 'tierId', 'membershipId', 'workoutPlanId', 'dietPlanId', 'recordId'].map((key) => ({ key, value: '' })),
  ],
  item: [
    folder('0 · Health', 'API and database status.', [
      item('Health check', 'GET', '/health', {
        pre: [save('runId', 'Date.now().toString(36)')],
        tests: [status(200), expect('database connected', "body.data.database === 'connected'")],
      }),
    ]),

    folder('1 · Authentication', 'JWT login, registration and validation.', [
      item('Admin login', 'POST', '/auth/login', {
        body: { identifier: '{{adminIdentifier}}', password: '{{adminPassword}}' },
        tests: [status(200), expect('role is admin', "body.data.user.role === 'admin'"), save('adminToken', 'body.data.token')],
      }),
      item('Register member', 'POST', '/auth/register', {
        body: { name: 'Postman Member', email: 'pm_{{runId}}@e2e.ironvault.test', username: 'pm_{{runId}}', password: 'Passw0rd!pm', age: 28, height: 175, weight: 78, fitnessGoal: 'Build strength' },
        tests: [status(201), expect('member role', "body.data.user.role === 'member'"), expect('password not returned', "!('password' in body.data.user)"), save('memberToken', 'body.data.token'), save('memberId', 'body.data.user._id'), save('memberUsername', 'body.data.user.username')],
      }),
      item('Register duplicate (409)', 'POST', '/auth/register', {
        body: { name: 'Dup', email: 'pm_{{runId}}@e2e.ironvault.test', username: 'pm_{{runId}}', password: 'Passw0rd!pm' },
        tests: [status(409), expect('field errors returned', 'Boolean(body.errors.email && body.errors.username)')],
      }),
      item('Register validation (400)', 'POST', '/auth/register', {
        body: { name: 'x', email: 'not-an-email', username: '!', password: '123' },
        tests: [status(400), expect('errors for each field', 'Object.keys(body.errors).length >= 4')],
      }),
      item('Login wrong password (401)', 'POST', '/auth/login', { body: { identifier: '{{memberUsername}}', password: 'wrong-pass1' }, tests: [status(401)] }),
      item('Current user (member)', 'GET', '/auth/me', { token: 'memberToken', tests: [status(200), expect('same user', "body.data.user._id === pm.collectionVariables.get('memberId')")] }),
      item('Current user without token (401)', 'GET', '/auth/me', { tests: [status(401)] }),
    ]),

    folder('2 · Admin – accounts', 'Member and trainer management (admin only).', [
      item('Create trainer', 'POST', '/admin/trainers', {
        token: 'adminToken',
        body: { name: 'Postman Trainer', email: 'pmt_{{runId}}@e2e.ironvault.test', username: 'pmt_{{runId}}', password: 'Trainer123pm', specialization: 'Strength & Conditioning', experience: 6 },
        tests: [status(201), expect('trainer role', "body.data.role === 'trainer'"), save('trainerId', 'body.data._id')],
      }),
      item('Trainer login', 'POST', '/auth/login', {
        body: { identifier: 'pmt_{{runId}}', password: 'Trainer123pm' },
        tests: [status(200), save('trainerToken', 'body.data.token')],
      }),
      item('List members (search)', 'GET', '/admin/members?search=pm_{{runId}}', {
        token: 'adminToken',
        tests: [status(200), expect('found the new member', 'body.data.length === 1'), expect('paginated', "typeof body.meta.total === 'number'")],
      }),
      item('Get member overview', 'GET', '/admin/members/{{memberId}}', { token: 'adminToken', tests: [status(200), expect('has membership section', "'membership' in body.data")] }),
      item('Update member', 'PATCH', '/admin/members/{{memberId}}', { token: 'adminToken', body: { phone: '+91 90000 11111' }, tests: [status(200), expect('phone updated', "body.data.phone === '+91 90000 11111'")] }),
      item('List trainers', 'GET', '/admin/trainers?search=pmt_{{runId}}', { token: 'adminToken', tests: [status(200), expect('load stats present', "body.data[0].stats.activeMembers === 0")] }),
      item('Trainer options (allocation picker)', 'GET', '/admin/trainers/options', { token: 'adminToken', tests: [status(200), expect('includes new trainer', "body.data.some(t => t._id === pm.collectionVariables.get('trainerId'))")] }),
      item('Member cannot access admin API (403)', 'GET', '/admin/members', { token: 'memberToken', tests: [status(403)] }),
    ]),

    folder('3 · Memberships', 'Tiers and the membership lifecycle (state chart).', [
      item('Create tier', 'POST', '/membership-tiers', {
        token: 'adminToken',
        body: { name: 'E2E Postman {{runId}}', description: 'Postman test tier', durationInDays: 30, price: 1999, maxHoldDays: 14, features: ['Trainer', 'Diet plan'] },
        tests: [status(201), save('tierId', 'body.data._id')],
      }),
      item('Public tier catalogue', 'GET', '/membership-tiers', { tests: [status(200), expect('new tier listed', "body.data.some(t => t._id === pm.collectionVariables.get('tierId'))")] }),
      item('Training blocked without membership (403)', 'GET', '/members/me/plans', {
        token: 'memberToken',
        tests: [status(403), expect('MEMBERSHIP_INACTIVE code', "body.code === 'MEMBERSHIP_INACTIVE'")],
      }),
      item('Member selects plan → Created', 'POST', '/memberships/me', {
        token: 'memberToken',
        body: { tierId: '{{tierId}}' },
        tests: [status(201), expect('status created', "body.data.status === 'created'"), save('membershipId', 'body.data._id')],
      }),
      item('Member submits → Payment pending', 'POST', '/memberships/{{membershipId}}/transitions', {
        token: 'memberToken',
        body: { action: 'submit' },
        tests: [status(200), expect('payment_pending', "body.data.status === 'payment_pending'")],
      }),
      item('Member cannot verify payment (403)', 'POST', '/memberships/{{membershipId}}/transitions', { token: 'memberToken', body: { action: 'verify_payment', paymentMethod: 'cash' }, tests: [status(403)] }),
      item('Admin verifies payment → Active', 'POST', '/memberships/{{membershipId}}/transitions', {
        token: 'adminToken',
        body: { action: 'verify_payment', paymentMethod: 'upi', paymentReference: 'PM-{{runId}}' },
        tests: [status(200), expect('active', "body.data.status === 'active'"), expect('30 days validity', 'body.data.validity.daysRemaining === 30')],
      }),
      item('My membership', 'GET', '/memberships/me', { token: 'memberToken', tests: [status(200), expect('valid', 'body.data.validity.isValid === true')] }),
      item('Assign trainer to member', 'POST', '/assignments', { token: 'adminToken', body: { memberId: '{{memberId}}', trainerId: '{{trainerId}}' }, tests: [status(201)] }),
    ]),

    folder('4 · Trainer – coaching', 'Profiles, plans and assignments (trainer).', [
      item('Update trainer profile', 'PATCH', '/trainers/me', { token: 'trainerToken', body: { bio: 'Postman-tested coach' }, tests: [status(200)] }),
      item('My members', 'GET', '/trainers/me/members', { token: 'trainerToken', tests: [status(200), expect('member assigned', "body.data.some(r => r.member._id === pm.collectionVariables.get('memberId'))")] }),
      item('Create workout plan', 'POST', '/workout-plans', {
        token: 'trainerToken',
        body: { title: 'Postman Strength Block', description: 'Three sessions a week', level: 'intermediate', durationInWeeks: 6, exercises: [{ name: 'Back Squat', sets: 4, repetitions: 6, restTime: 120 }, { name: 'Bench Press', sets: 4, repetitions: 8, restTime: 90 }] },
        tests: [status(201), expect('two exercises', 'body.data.exercises.length === 2'), save('workoutPlanId', 'body.data._id')],
      }),
      item('Workout plan validation (400)', 'POST', '/workout-plans', {
        token: 'trainerToken',
        body: { title: 'x', level: 'expert', durationInWeeks: 0, exercises: [{ name: '', sets: 0, repetitions: 0 }] },
        tests: [status(400), expect('nested exercise errors', "'exercises.0.name' in body.errors")],
      }),
      item('Assign workout plan', 'POST', '/workout-plans/{{workoutPlanId}}/assignments', { token: 'trainerToken', body: { memberId: '{{memberId}}' }, tests: [status(200)] }),
      item('Create diet plan', 'POST', '/diet-plans', {
        token: 'trainerToken',
        body: { title: 'Postman Lean 2000', goal: 'Fat loss', calorieTarget: 2000, meals: [{ mealName: 'Oats & whey', time: '07:30', calories: 520 }, { mealName: 'Chicken rice bowl', time: '13:00', calories: 700 }] },
        tests: [status(201), save('dietPlanId', 'body.data._id')],
      }),
      item('Assign diet plan', 'POST', '/diet-plans/{{dietPlanId}}/assignments', { token: 'trainerToken', body: { memberId: '{{memberId}}' }, tests: [status(200)] }),
      item('Member cannot create plans (403)', 'POST', '/workout-plans', { token: 'memberToken', body: {}, tests: [status(403)] }),
    ]),

    folder('5 · Member – training', 'Plans and progress tracking (member).', [
      item('My trainer', 'GET', '/members/me/trainer', { token: 'memberToken', tests: [status(200), expect('trainer assigned', "body.data.trainer._id === pm.collectionVariables.get('trainerId')")] }),
      item('My plans', 'GET', '/members/me/plans', { token: 'memberToken', tests: [status(200), expect('one of each', 'body.data.workoutPlans.length === 1 && body.data.dietPlans.length === 1')] }),
      item('View workout plan', 'GET', '/workout-plans/{{workoutPlanId}}', { token: 'memberToken', tests: [status(200), expect('member list hidden', "!('assignedMembers' in body.data)")] }),
      item('Log progress', 'POST', '/fitness-records', {
        token: 'memberToken',
        pre: [save('today', 'new Date().toISOString().slice(0, 10)')],
        body: { recordDate: '{{today}}', weight: 77.4, bodyFatPercentage: 18.5, chest: 101, waist: 84, arms: 37, legs: 59, notes: 'Postman check-in' },
        tests: [status(201), save('recordId', 'body.data._id')],
      }),
      item('Progress validation (400)', 'POST', '/fitness-records', { token: 'memberToken', body: { weight: 5, recordDate: '2099-01-01' }, tests: [status(400)] }),
      item('Progress history', 'GET', '/fitness-records', { token: 'memberToken', tests: [status(200), expect('one record', 'body.data.length === 1')] }),
      item('Update progress record', 'PUT', '/fitness-records/{{recordId}}', { token: 'memberToken', body: { recordDate: '{{today}}', weight: 77.1 }, tests: [status(200), expect('weight updated', 'body.data.weight === 77.1')] }),
      item('Progress summary', 'GET', '/fitness-records/summary', { token: 'memberToken', tests: [status(200), expect('count 1', 'body.data.count === 1')] }),
      item('Member dashboard', 'GET', '/dashboard/member', { token: 'memberToken', tests: [status(200), expect('unlocked', 'body.data.locked === false')] }),
      item('Trainer monitors progress', 'GET', '/trainers/me/members/{{memberId}}/progress', { token: 'trainerToken', tests: [status(200), expect('sees record', 'body.data.length === 1')] }),
    ]),

    folder('6 · Admin – lifecycle & insights', 'Holds, subscriptions, reports and audit.', [
      item('Hold requires a reason (400)', 'POST', '/memberships/{{membershipId}}/transitions', { token: 'adminToken', body: { action: 'suspend' }, tests: [status(400)] }),
      item('Place on hold → Suspended', 'POST', '/memberships/{{membershipId}}/transitions', { token: 'adminToken', body: { action: 'suspend', note: 'Postman hold' }, tests: [status(200), expect('suspended', "body.data.status === 'suspended'")] }),
      item('Suspended member is gated (403)', 'GET', '/fitness-records', { token: 'memberToken', tests: [status(403)] }),
      item('Resume → Active', 'POST', '/memberships/{{membershipId}}/transitions', { token: 'adminToken', body: { action: 'resume' }, tests: [status(200), expect('active', "body.data.status === 'active'")] }),
      item('Subscriptions list', 'GET', '/memberships?status=active&search=Postman Member', { token: 'adminToken', tests: [status(200), expect('found', 'body.data.length >= 1')] }),
      item('Subscription summary', 'GET', '/memberships/summary', { token: 'adminToken', tests: [status(200), expect('has counts', "typeof body.data.counts.active === 'number'")] }),
      item('Operational report', 'GET', '/admin/reports/operational', { token: 'adminToken', tests: [status(200), expect('12-month series', 'body.data.signupsByMonth.length === 12')] }),
      item('Audit log', 'GET', '/admin/audit-logs?action=MEMBERSHIP_VERIFY_PAYMENT&limit=5', { token: 'adminToken', tests: [status(200), expect('filtered', "body.data.every(a => a.action === 'MEMBERSHIP_VERIFY_PAYMENT')")] }),
      item('Admin dashboard', 'GET', '/dashboard/admin', { token: 'adminToken', tests: [status(200)] }),
    ]),

    folder('7 · Teardown', 'Closes everything this run created.', [
      item('Delete progress record', 'DELETE', '/fitness-records/{{recordId}}', { token: 'memberToken', tests: [status(200)] }),
      item('Delete workout plan', 'DELETE', '/workout-plans/{{workoutPlanId}}', { token: 'trainerToken', tests: [status(200)] }),
      item('Delete diet plan', 'DELETE', '/diet-plans/{{dietPlanId}}', { token: 'trainerToken', tests: [status(200)] }),
      item('Terminate membership', 'POST', '/memberships/{{membershipId}}/transitions', { token: 'adminToken', body: { action: 'terminate', note: 'Postman teardown' }, tests: [status(200)] }),
      item('Deactivate member', 'PATCH', '/admin/members/{{memberId}}/status', { token: 'adminToken', body: { isActive: false }, tests: [status(200)] }),
      item('Deactivate trainer', 'PATCH', '/admin/trainers/{{trainerId}}/status', { token: 'adminToken', body: { isActive: false }, tests: [status(200)] }),
      item('Deactivate tier', 'PATCH', '/membership-tiers/{{tierId}}/status', { token: 'adminToken', body: { isActive: false }, tests: [status(200)] }),
    ]),
  ],
};

const environment = {
  name: 'IronVault – Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:5000/api', enabled: true },
    { key: 'adminIdentifier', value: 'admin', enabled: true },
    { key: 'adminPassword', value: '', type: 'secret', enabled: true },
  ],
};

fs.writeFileSync(path.join(here, 'IronVault.postman_collection.json'), `${JSON.stringify(collection, null, 2)}\n`);
fs.writeFileSync(path.join(here, 'IronVault-Local.postman_environment.json'), `${JSON.stringify(environment, null, 2)}\n`);
const count = collection.item.reduce((n, f) => n + f.item.length, 0);
console.log(`Wrote IronVault.postman_collection.json (${collection.item.length} folders, ${count} requests) and the Local environment.`);
