import * as userRepository from '../repositories/userRepository.js';
import * as auditService from './auditService.js';
import { ROLES, GENDERS } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import {
  validate,
  pick,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX,
} from '../utils/validators.js';

const PASSWORD_MESSAGE = 'Password must be at least 8 characters and include a letter and a number';

const registerSchema = {
  name: { required: true, label: 'Name', minLength: 2, maxLength: 80 },
  email: { required: true, label: 'Email', pattern: EMAIL_REGEX, message: 'Enter a valid email address' },
  username: {
    required: true,
    label: 'Username',
    pattern: USERNAME_REGEX,
    message: 'Username must be 3–30 characters: letters, numbers, _ or .',
  },
  password: { required: true, label: 'Password', pattern: PASSWORD_REGEX, message: PASSWORD_MESSAGE },
  phone: { label: 'Phone', pattern: PHONE_REGEX, message: 'Enter a valid phone number' },
  age: { label: 'Age', type: 'number', min: 10, max: 100 },
  gender: { label: 'Gender', enum: GENDERS },
  height: { label: 'Height', type: 'number', min: 50, max: 260 },
  weight: { label: 'Weight', type: 'number', min: 20, max: 400 },
  fitnessGoal: { label: 'Fitness goal', maxLength: 200 },
};

const loginSchema = {
  identifier: { required: true, label: 'Email or username' },
  password: { required: true, label: 'Password' },
};

function buildAuthPayload(user) {
  return { token: signToken(user), user: user.toJSON() };
}

/** Public self-registration – always creates a MEMBER account. */
export async function registerMember(body, req) {
  const errors = validate(body, registerSchema);
  if (body.password && body.confirmPassword !== undefined && body.password !== body.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const [emailTaken, usernameTaken] = await Promise.all([
    userRepository.existsByEmail(body.email),
    userRepository.existsByUsername(body.username),
  ]);
  if (emailTaken || usernameTaken) {
    throw new ApiError(409, 'Account already exists', {
      ...(emailTaken && { email: 'This email is already registered' }),
      ...(usernameTaken && { username: 'This username is taken' }),
    });
  }

  const data = pick(body, ['name', 'email', 'username', 'password', 'phone', 'age', 'gender', 'height', 'weight', 'fitnessGoal']);
  const member = await userRepository.createUser(ROLES.MEMBER, data);

  await auditService.record({
    actor: member,
    action: 'AUTH_REGISTER',
    entity: 'User',
    entityId: member._id,
    description: `New member registered: ${member.email}`,
    req,
  });

  return buildAuthPayload(member);
}

export async function login(body, req) {
  const errors = validate(body, loginSchema);
  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const user = await userRepository.findByEmailOrUsername(body.identifier);
  const valid = user && (await user.comparePassword(String(body.password)));
  if (!valid) throw ApiError.unauthorized('Invalid email/username or password');

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Please contact the gym administrator.');
  }

  await userRepository.touchLastLogin(user._id);
  await auditService.record({
    actor: user,
    action: 'AUTH_LOGIN',
    entity: 'User',
    entityId: user._id,
    description: `${user.role} logged in: ${user.email}`,
    req,
  });

  return buildAuthPayload(user);
}

export async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function changePassword(userId, body, req) {
  const errors = validate(body, {
    currentPassword: { required: true, label: 'Current password' },
    newPassword: { required: true, label: 'New password', pattern: PASSWORD_REGEX, message: PASSWORD_MESSAGE },
  });
  if (!errors.newPassword && body.newPassword === body.currentPassword) {
    errors.newPassword = 'New password must be different from the current password';
  }
  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (!(await user.comparePassword(String(body.currentPassword)))) {
    throw ApiError.badRequest('Current password is incorrect', { currentPassword: 'Current password is incorrect' });
  }

  user.password = body.newPassword;
  await user.save();
  await auditService.record({ actor: user, action: 'AUTH_PASSWORD_CHANGED', entity: 'User', entityId: user._id, req });
}
