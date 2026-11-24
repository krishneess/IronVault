/**
 * ValidationUtils – small declarative validator shared by all modules.
 *
 * Schema format: { field: { required, type, min, max, minLength, maxLength, pattern, enum, label, message } }
 * Returns an object of { field: errorMessage } (empty when valid).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;
export const PHONE_REGEX = /^[+]?[\d\s-]{7,20}$/;
// At least 8 chars, one letter and one number.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export function validate(data = {}, schema = {}) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const label = rules.label || field;

    if (isEmpty(value)) {
      if (rules.required) errors[field] = `${label} is required`;
      continue;
    }

    if (rules.type === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors[field] = `${label} must be a number`;
        continue;
      }
      if (rules.min !== undefined && num < rules.min) errors[field] = `${label} must be at least ${rules.min}`;
      else if (rules.max !== undefined && num > rules.max) errors[field] = `${label} must be at most ${rules.max}`;
      continue;
    }

    if (rules.type === 'date') {
      if (Number.isNaN(new Date(value).getTime())) errors[field] = `${label} must be a valid date`;
      continue;
    }

    if (rules.type === 'array') {
      if (!Array.isArray(value)) errors[field] = `${label} must be a list`;
      else if (rules.minLength && value.length < rules.minLength) errors[field] = `${label} must contain at least ${rules.minLength} item(s)`;
      continue;
    }

    if (rules.type === 'boolean') {
      if (typeof value !== 'boolean') errors[field] = `${label} must be true or false`;
      continue;
    }

    const str = String(value).trim();
    if (rules.minLength && str.length < rules.minLength) errors[field] = `${label} must be at least ${rules.minLength} characters`;
    else if (rules.maxLength && str.length > rules.maxLength) errors[field] = `${label} must be at most ${rules.maxLength} characters`;
    else if (rules.pattern && !rules.pattern.test(str)) errors[field] = rules.message || `${label} is invalid`;
    else if (rules.enum && !rules.enum.includes(str)) errors[field] = `${label} must be one of: ${rules.enum.join(', ')}`;
  }
  return errors;
}

/** Copy only the allowed keys from an object (prevents mass-assignment). */
export function pick(source = {}, keys = []) {
  return keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});
}

export const isValidId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

export const hasErrors = (errors) => Object.keys(errors).length > 0;

/**
 * Validates each item of an array against a schema; errors are keyed `${prefix}.${index}.${field}`.
 */
export function validateItems(items, schema, prefix) {
  const errors = {};
  (items || []).forEach((item, index) => {
    const itemErrors = validate(item || {}, schema);
    for (const [field, message] of Object.entries(itemErrors)) errors[`${prefix}.${index}.${field}`] = message;
  });
  return errors;
}

/**
 * Splits optional profile fields into values to $set and blank values to $unset.
 * Numbers are converted; strings are trimmed.
 */
export function buildUpdate(body, { strings = [], numbers = [], optional = [] }) {
  const set = {};
  const unset = [];
  const blank = (v) => v === null || (typeof v === 'string' && v.trim() === '');
  for (const key of [...strings, ...numbers]) {
    if (body[key] === undefined) continue;
    if (blank(body[key])) {
      if (optional.includes(key)) unset.push(key);
      continue;
    }
    set[key] = numbers.includes(key) ? Number(body[key]) : String(body[key]).trim();
  }
  return { set, unset };
}

export function escapeRegex(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
