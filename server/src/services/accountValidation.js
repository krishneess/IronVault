import { GENDERS } from '../models/index.js';
import { EMAIL_REGEX, USERNAME_REGEX, PHONE_REGEX, PASSWORD_REGEX } from '../utils/validators.js';

export const PASSWORD_MESSAGE = 'Password must be at least 8 characters and include a letter and a number';

/** Identity fields shared by every account type. */
export const identitySchema = {
  name: { required: true, label: 'Name', minLength: 2, maxLength: 80 },
  email: { required: true, label: 'Email', pattern: EMAIL_REGEX, message: 'Enter a valid email address' },
  username: {
    required: true,
    label: 'Username',
    pattern: USERNAME_REGEX,
    message: 'Username must be 3–30 characters: letters, numbers, _ or .',
  },
  phone: { label: 'Phone', pattern: PHONE_REGEX, message: 'Enter a valid phone number' },
};

export const passwordRule = { required: true, label: 'Password', pattern: PASSWORD_REGEX, message: PASSWORD_MESSAGE };

export const memberFieldsSchema = {
  age: { label: 'Age', type: 'number', min: 10, max: 100 },
  gender: { label: 'Gender', enum: GENDERS },
  height: { label: 'Height', type: 'number', min: 50, max: 260 },
  weight: { label: 'Weight', type: 'number', min: 20, max: 400 },
  fitnessGoal: { label: 'Fitness goal', maxLength: 200 },
};

export const trainerFieldsSchema = {
  specialization: { required: true, label: 'Specialization', minLength: 2, maxLength: 80 },
  experience: { label: 'Experience', type: 'number', min: 0, max: 60 },
  bio: { label: 'Bio', maxLength: 1000 },
};

/** Makes every rule optional (for partial updates). */
export const optional = (schema) =>
  Object.fromEntries(Object.entries(schema).map(([k, rule]) => [k, { ...rule, required: false }]));

export const MEMBER_FIELDS = ['age', 'gender', 'height', 'weight', 'fitnessGoal'];
export const TRAINER_FIELDS = ['specialization', 'experience', 'bio'];
