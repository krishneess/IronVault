export const METRICS = [
  { key: 'weight', label: 'Weight', unit: 'kg', short: 'Weight' },
  { key: 'bodyFatPercentage', label: 'Body fat', unit: '%', short: 'Body fat' },
  { key: 'chest', label: 'Chest', unit: 'cm', short: 'Chest' },
  { key: 'waist', label: 'Waist', unit: 'cm', short: 'Waist' },
  { key: 'arms', label: 'Arms', unit: 'cm', short: 'Arms' },
  { key: 'legs', label: 'Legs', unit: 'cm', short: 'Legs' },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m]));

export const RANGES = [
  { key: '30', label: '30 days', days: 30 },
  { key: '90', label: '90 days', days: 90 },
  { key: '365', label: '1 year', days: 365 },
  { key: 'all', label: 'All time', days: null },
];

export function formatMetric(value, unit) {
  if (value === undefined || value === null) return '—';
  return `${value}${unit === '%' ? '%' : ` ${unit}`}`;
}

/** Signed change, e.g. "−2.6 kg" / "+1.0 cm". */
export function formatChange(value, unit) {
  if (value === undefined || value === null) return null;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${Math.abs(value)}${unit === '%' ? ' pts' : ` ${unit}`}`;
}

export const LEVEL_VARIANT = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };
