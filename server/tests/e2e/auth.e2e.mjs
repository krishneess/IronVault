/** Phase 1 – authentication, JWT, role-based authorization. */
import { req, createSuite, adminToken, registerMember, createTrainer, login, uid, E2E_DOMAIN } from './lib.mjs';

export async function run() {
  const s = createSuite('Auth & RBAC');
  const A = await adminToken();

  s.section('Health & registration');
  let r = await req('GET', '/health');
  s.check('health reports database connected', r.status === 200 && r.body.data.database === 'connected', r.body);

  r = await req('POST', '/auth/register', { name: 'A', email: 'bad', username: 'x', password: '123' });
  s.check('register validates fields (400)', r.status === 400 && r.body.errors.email && r.body.errors.password && r.body.errors.name, r.body);

  const username = uid('e2e_m');
  const email = `${username}@${E2E_DOMAIN}`;
  r = await req('POST', '/auth/register', { name: 'Auth Member', email, username, password: 'Passw0rd!', confirmPassword: 'Passw0rd!', age: 25, gender: 'male', height: 180, weight: 80 });
  s.check('register creates a member with token, no password leaked', r.status === 201 && r.body.data.token && r.body.data.user.role === 'member' && !('password' in r.body.data.user), r.body);
  const M = r.body.data.token;

  r = await req('POST', '/auth/register', { name: 'Dup', email, username, password: 'Passw0rd!' });
  s.check('duplicate email/username rejected (409)', r.status === 409 && r.body.errors.email && r.body.errors.username, r.body);

  const sneaky = await registerMember('Sneaky', { role: 'admin' });
  r = await req('GET', '/auth/me', undefined, sneaky.token);
  s.check('role in registration body is ignored', r.body.data.user.role === 'member', r.body);

  s.section('Login');
  r = await req('POST', '/auth/login', { identifier: username, password: 'wrong123' });
  s.check('wrong password → 401', r.status === 401, r.body);
  r = await req('POST', '/auth/login', {});
  s.check('empty login → 400', r.status === 400, r.body);
  r = await req('POST', '/auth/login', '{bad json');
  s.check('malformed JSON → 400', r.status === 400, r.body);
  r = await req('POST', '/auth/login', { identifier: email.toUpperCase(), password: 'Passw0rd!' });
  s.check('login by email is case-insensitive', r.status === 200 && r.body.data.token, r.body);

  s.section('Tokens');
  r = await req('GET', '/auth/me');
  s.check('no token → 401', r.status === 401, r.body);
  r = await req('GET', '/auth/me', undefined, 'garbage');
  s.check('invalid token → 401', r.status === 401, r.body);
  r = await req('GET', '/auth/me', undefined, M);
  s.check('valid token → current user', r.status === 200 && r.body.data.user.username === username, r.body);

  s.section('Role-based access');
  const T = await createTrainer(A, 'Auth Trainer');
  const checks = [
    ['member → member dashboard 200', M, '/dashboard/member', 200],
    ['member → admin dashboard 403', M, '/dashboard/admin', 403],
    ['member → trainer dashboard 403', M, '/dashboard/trainer', 403],
    ['trainer → trainer dashboard 200', T.token, '/dashboard/trainer', 200],
    ['trainer → admin dashboard 403', T.token, '/dashboard/admin', 403],
    ['admin → admin dashboard 200', A, '/dashboard/admin', 200],
    ['admin → member dashboard 403', A, '/dashboard/member', 403],
    ['member → admin API 403', M, '/admin/members', 403],
    ['trainer → admin API 403', T.token, '/admin/audit-logs', 403],
  ];
  for (const [label, token, url, expected] of checks) {
    r = await req('GET', url, undefined, token);
    s.check(label, r.status === expected, { status: r.status, body: r.body });
  }

  s.section('Password change & deactivation');
  r = await req('PATCH', '/auth/change-password', { currentPassword: 'nope', newPassword: 'NewPassw0rd' }, M);
  s.check('wrong current password → 400', r.status === 400, r.body);
  r = await req('PATCH', '/auth/change-password', { currentPassword: 'Passw0rd!', newPassword: 'NewPassw0rd' }, M);
  s.check('password changed', r.status === 200, r.body);
  s.check('can log in with the new password', Boolean(await login(username, 'NewPassw0rd')), null);

  await req('PATCH', `/admin/trainers/${T.id}/status`, { isActive: false }, A);
  r = await req('POST', '/auth/login', { identifier: T.username, password: T.password });
  s.check('deactivated account cannot log in (403)', r.status === 403, r.body);
  r = await req('GET', '/auth/me', undefined, T.token);
  s.check('existing token of deactivated account rejected (403)', r.status === 403, r.body);

  r = await req('GET', '/does-not-exist');
  s.check('unknown route → JSON 404', r.status === 404 && r.body.success === false, r.body);

  return s.result();
}
