/** Phase 2 – profiles, workout & diet plans, assignments, fitness records. */
import { req, createSuite, adminToken, registerMember, createTrainer, createTier, activateMembership, today } from './lib.mjs';

export async function run() {
  const s = createSuite('Fitness management');
  const A = await adminToken();
  const T1 = await createTrainer(A, 'Fitness Trainer One');
  const T2 = await createTrainer(A, 'Fitness Trainer Two');
  const m1 = await registerMember('Fitness Member', { weight: 80, height: 180 });
  const m2 = await registerMember('Other Fitness Member');
  const tier = await createTier(A);
  await activateMembership(A, m1.id, tier._id);
  await activateMembership(A, m2.id, tier._id);
  const M = m1.token;
  const M2 = m2.token;
  const memberId = m1.id;

  s.section('Profiles');
  let r = await req('PATCH', '/members/me', { name: 'Fitness Member Updated', age: 30, gender: 'male', fitnessGoal: 'Cut to 75kg', phone: '' }, M);
  s.check('member updates own profile', r.status === 200 && r.body.data.profile.age === 30, r.body);
  r = await req('PATCH', '/members/me', { age: 5, gender: 'robot' }, M);
  s.check('profile validation (400)', r.status === 400 && r.body.errors.age && r.body.errors.gender, r.body);
  r = await req('PATCH', '/members/me', { role: 'admin', email: 'hack@x.io', isActive: false, age: '' }, M);
  s.check('role/email/isActive ignored; blank clears optional field', r.status === 200 && r.body.data.profile.role === 'member' && r.body.data.profile.isActive && r.body.data.profile.age === undefined, r.body);
  r = await req('PATCH', '/trainers/me', { specialization: 'Strength & Conditioning', experience: 7, bio: 'Coach' }, T1.token);
  s.check('trainer updates own profile', r.status === 200 && r.body.data.profile.experience === 7, r.body);
  r = await req('PATCH', '/trainers/me', { specialization: '' }, T1.token);
  s.check('trainer specialization required', r.status === 400, r.body);

  s.section('Trainer assignment');
  r = await req('GET', '/members/me/trainer', undefined, M);
  s.check('no trainer yet → null', r.status === 200 && r.body.data === null, r.body);
  r = await req('POST', '/assignments', { memberId, trainerId: T1.id }, T1.token);
  s.check('trainer cannot assign trainers (403)', r.status === 403, r.body);
  r = await req('POST', '/assignments', { memberId, trainerId: T1.id }, A);
  s.check('admin assigns trainer', r.status === 201, r.body);
  r = await req('POST', '/assignments', { memberId, trainerId: T1.id }, A);
  s.check('duplicate assignment (409)', r.status === 409, r.body);
  r = await req('GET', '/members/me/trainer', undefined, M);
  s.check('member sees trainer profile', r.body.data?.trainer?.username === T1.username, r.body);
  r = await req('GET', '/trainers/me/members?search=fitness member', undefined, T1.token);
  s.check('trainer lists & searches assigned members', r.body.data.some((x) => x.member._id === memberId), r.body);
  r = await req('GET', `/trainers/me/members/${memberId}`, undefined, T2.token);
  s.check('other trainer cannot open member (403)', r.status === 403, r.body);

  s.section('Workout plans');
  const wp = { title: 'Hypertrophy Block A', description: 'Push/pull/legs', level: 'intermediate', durationInWeeks: 8, exercises: [{ name: 'Bench Press', sets: 4, repetitions: 8, restTime: 90 }, { name: 'Squat', sets: 5, repetitions: 5, restTime: 120 }] };
  r = await req('POST', '/workout-plans', { ...wp, level: 'godlike', exercises: [{ name: '', sets: 0 }] }, T1.token);
  s.check('nested exercise validation (400)', r.status === 400 && r.body.errors.level && r.body.errors['exercises.0.name'], r.body);
  r = await req('POST', '/workout-plans', wp, M);
  s.check('member cannot create plans (403)', r.status === 403, r.body);
  r = await req('POST', '/workout-plans', wp, T1.token);
  s.check('trainer creates workout plan', r.status === 201 && r.body.data.exercises.length === 2, r.body);
  const wpId = r.body.data._id;
  r = await req('GET', '/workout-plans', undefined, T2.token);
  s.check('plans are private to their trainer', !r.body.data.some((p) => p._id === wpId), r.body);
  r = await req('PUT', `/workout-plans/${wpId}`, wp, T2.token);
  s.check('other trainer cannot update (403)', r.status === 403, r.body);
  r = await req('PUT', `/workout-plans/${wpId}`, { ...wp, title: 'Hypertrophy Block A v2', exercises: [...wp.exercises, { name: 'Deadlift', sets: 3, repetitions: 5 }] }, T1.token);
  s.check('owner updates plan (rest defaults to 60s)', r.status === 200 && r.body.data.exercises[2].restTime === 60, r.body);
  r = await req('GET', `/workout-plans/${wpId}`, undefined, M);
  s.check('member cannot view unassigned plan (403)', r.status === 403, r.body);
  r = await req('POST', `/workout-plans/${wpId}/assignments`, { memberId: m2.id }, T1.token);
  s.check('cannot assign to a member the trainer does not coach (403)', r.status === 403, r.body);
  r = await req('POST', `/workout-plans/${wpId}/assignments`, { memberId }, T1.token);
  s.check('trainer assigns plan to coached member', r.status === 200, r.body);
  r = await req('GET', `/workout-plans/${wpId}`, undefined, M);
  s.check('member views assigned plan (without other members)', r.status === 200 && !('assignedMembers' in r.body.data), r.body);
  r = await req('GET', `/workout-plans/${wpId}`, undefined, M2);
  s.check('other member cannot view it (403)', r.status === 403, r.body);

  s.section('Diet plans');
  const dp = { title: 'Lean Cut 2200', goal: 'Fat loss', calorieTarget: 2200, meals: [{ mealName: 'Oats & whey', time: '07:30', calories: 550 }, { mealName: 'Chicken rice', time: '13:00', calories: 750 }] };
  r = await req('POST', '/diet-plans', { ...dp, calorieTarget: 100, meals: [{ mealName: 'x', time: '25:00', calories: -1 }] }, T1.token);
  s.check('nested meal validation (400)', r.status === 400 && r.body.errors.calorieTarget && r.body.errors['meals.0.time'], r.body);
  r = await req('POST', '/diet-plans', dp, T1.token);
  const dpId = r.body.data?._id;
  s.check('trainer creates diet plan', r.status === 201, r.body);
  r = await req('POST', `/diet-plans/${dpId}/assignments`, { memberId }, T1.token);
  s.check('trainer assigns diet plan', r.status === 200, r.body);
  r = await req('GET', '/members/me/plans', undefined, M);
  s.check('member sees both assigned plans', r.body.data.workoutPlans.length === 1 && r.body.data.dietPlans.length === 1, r.body);

  s.section('Fitness records');
  r = await req('POST', '/fitness-records', { weight: 10, bodyFatPercentage: 90, recordDate: '2099-01-01' }, M);
  s.check('record validation incl. future date (400)', r.status === 400 && r.body.errors.weight && r.body.errors.recordDate, r.body);
  const ids = [];
  for (const [d, w, bf] of [[-28, 82, 22], [-14, 80.6, 21], [0, 79.4, 19.5]]) {
    r = await req('POST', '/fitness-records', { weight: w, bodyFatPercentage: bf, waist: 90, chest: 100, recordDate: today(d) }, M);
    ids.push(r.body.data?._id);
  }
  s.check('member logs three records', ids.every(Boolean), ids);
  r = await req('POST', '/fitness-records', { weight: 80, recordDate: today() }, T1.token);
  s.check('trainers cannot log records (403)', r.status === 403, r.body);
  r = await req('GET', `/fitness-records?from=${today(-20)}`, undefined, M);
  s.check('date-range filter', r.body.data.length === 2, r.body);
  r = await req('GET', '/fitness-records/summary', undefined, M);
  s.check('summary computes change since first record', r.body.data.count === 3 && r.body.data.change.weight === -2.6, r.body);
  r = await req('PUT', `/fitness-records/${ids[1]}`, { weight: 80.2, recordDate: today(-14), chest: '' }, M);
  s.check('update record and clear a measurement', r.status === 200 && r.body.data.chest === undefined, r.body);
  r = await req('DELETE', `/fitness-records/${ids[0]}`, undefined, M2);
  s.check("cannot delete another member's record (404)", r.status === 404, r.body);
  r = await req('GET', `/trainers/me/members/${memberId}/progress`, undefined, T1.token);
  s.check('trainer monitors member progress', r.status === 200 && r.body.data.length === 3, r.body);
  r = await req('DELETE', `/fitness-records/${ids[0]}`, undefined, M);
  s.check('member deletes own record', r.status === 200, r.body);

  s.section('Reassignment');
  r = await req('POST', '/assignments', { memberId, trainerId: T2.id }, A);
  s.check('admin reassigns member', r.status === 201, r.body);
  r = await req('GET', '/members/me/plans', undefined, M);
  s.check("previous trainer's plans are detached", r.body.data.workoutPlans.length === 0 && r.body.data.dietPlans.length === 0, r.body);
  r = await req('GET', `/trainers/me/members/${memberId}`, undefined, T1.token);
  s.check('previous trainer lost access (403)', r.status === 403, r.body);
  r = await req('DELETE', `/workout-plans/${wpId}`, undefined, T1.token);
  s.check('owner deletes plan', r.status === 200, r.body);

  return s.result();
}
