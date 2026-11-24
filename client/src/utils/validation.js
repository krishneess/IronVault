// Client-side validation – mirrors the backend rules (the backend remains the authority).
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;
export const PHONE_REGEX = /^[+]?[\d\s-]{7,20}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;
export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

export function validateRegister(values) {
  const e = {};
  if (isBlank(values.name) || values.name.trim().length < 2) e.name = 'Enter your full name';
  if (!EMAIL_REGEX.test(values.email || '')) e.email = 'Enter a valid email address';
  if (!USERNAME_REGEX.test(values.username || '')) e.username = '3–30 characters: letters, numbers, _ or .';
  if (!isBlank(values.phone) && !PHONE_REGEX.test(values.phone)) e.phone = 'Enter a valid phone number';
  if (!PASSWORD_REGEX.test(values.password || '')) e.password = PASSWORD_HINT;
  if (values.confirmPassword !== values.password) e.confirmPassword = 'Passwords do not match';
  if (!isBlank(values.age) && (values.age < 10 || values.age > 100)) e.age = 'Age must be between 10 and 100';
  if (!isBlank(values.height) && (values.height < 50 || values.height > 260)) e.height = 'Height must be 50–260 cm';
  if (!isBlank(values.weight) && (values.weight < 20 || values.weight > 400)) e.weight = 'Weight must be 20–400 kg';
  return e;
}

export function validateLogin(values) {
  const e = {};
  if (isBlank(values.identifier)) e.identifier = 'Enter your email or username';
  if (isBlank(values.password)) e.password = 'Enter your password';
  return e;
}

export function validateChangePassword(values) {
  const e = {};
  if (isBlank(values.currentPassword)) e.currentPassword = 'Enter your current password';
  if (!PASSWORD_REGEX.test(values.newPassword || '')) e.newPassword = PASSWORD_HINT;
  else if (values.newPassword === values.currentPassword) e.newPassword = 'Choose a different password';
  if (values.confirmPassword !== values.newPassword) e.confirmPassword = 'Passwords do not match';
  return e;
}
