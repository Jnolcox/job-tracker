/**
 * @file formatters.js
 * @description Standardized formatting functions for dates, currency, and other values.
 * This module consolidates formatting logic previously scattered across components.
 */

/**
 * Format a date string to a human-readable format with time.
 *
 * @param {string|Date|null} dateValue - ISO date string, Date object, or null
 * @returns {string|null} Formatted date string (e.g., "Jan 15, 2025 at 10:00 AM") or null if invalid
 *
 * @example
 * formatDateDisplay('2025-01-15T10:00:00Z') // "Jan 15, 2025, 10:00 AM"
 * formatDateDisplay(null) // null
 */
export function formatDateDisplay(dateValue) {
  if (!dateValue) return null;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a date string to just the date portion (no time).
 *
 * @param {string|Date|null} dateValue - ISO date string, Date object, or null
 * @returns {string|null} Formatted date string (e.g., "Jan 15, 2025") or null if invalid
 *
 * @example
 * formatDateOnly('2025-01-15T10:00:00Z') // "Jan 15, 2025"
 * formatDateOnly(null) // null
 */
export function formatDateOnly(dateValue) {
  if (!dateValue) return null;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date to a short format (month and day only).
 *
 * @param {string|Date|null} dateValue - ISO date string, Date object, or null
 * @returns {string} Formatted date string (e.g., "Jan 15") or empty string if invalid
 *
 * @example
 * formatDateShort('2025-01-15T10:00:00Z') // "Jan 15"
 * formatDateShort(null) // ""
 */
export function formatDateShort(dateValue) {
  if (!dateValue) return '';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as YYYY-MM-DD for use as a key or for date inputs.
 *
 * @param {string|Date|null} dateValue - ISO date string, Date object, or null
 * @returns {string} Formatted date string (e.g., "2025-01-15") or empty string if invalid
 *
 * @example
 * formatDateKey('2025-01-15T10:00:00Z') // "2025-01-15"
 * formatDateKey(new Date(2025, 0, 15)) // "2025-01-15"
 */
export function formatDateKey(dateValue) {
  if (!dateValue) return '';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date to the format required for datetime-local input fields.
 *
 * @param {string|Date|null} dateValue - ISO date string, Date object, or null
 * @returns {string} Formatted string for datetime-local input (YYYY-MM-DDTHH:mm) or empty string
 *
 * @example
 * toDateTimeLocalInput('2025-01-15T10:30:00Z') // "2025-01-15T10:30" (in local time)
 * toDateTimeLocalInput(null) // ""
 */
export function toDateTimeLocalInput(dateValue) {
  if (!dateValue) return '';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get current local datetime formatted for datetime-local input.
 *
 * @returns {string} Current datetime in YYYY-MM-DDTHH:mm format
 *
 * @example
 * getCurrentLocalDateTime() // "2025-01-15T10:30"
 */
export function getCurrentLocalDateTime() {
  return toDateTimeLocalInput(new Date());
}

/**
 * Format a salary number to a currency string.
 *
 * @param {number|null} salary - Salary amount
 * @returns {string|null} Formatted salary (e.g., "$150,000") or null if invalid
 *
 * @example
 * formatSalary(150000) // "$150,000"
 * formatSalary(null) // null
 */
export function formatSalary(salary) {
  if (salary == null || isNaN(salary)) return null;
  return `$${salary.toLocaleString()}`;
}

/**
 * Format a salary to a short format (in thousands).
 *
 * @param {number|null} salary - Salary amount
 * @returns {string} Formatted salary (e.g., "$150k") or empty string if invalid
 *
 * @example
 * formatSalaryShort(150000) // "$150k"
 * formatSalaryShort(1200000) // "$1,200k"
 */
export function formatSalaryShort(salary) {
  if (salary == null || isNaN(salary)) return '';
  const thousands = Math.round(salary / 1000);
  return `$${thousands.toLocaleString()}k`;
}

/**
 * Format a duration in days to a human-readable string.
 *
 * @param {number} days - Number of days
 * @returns {string} Formatted duration (e.g., "5 days", "1 day", "< 1 day")
 *
 * @example
 * formatDuration(5) // "5 days"
 * formatDuration(1) // "1 day"
 * formatDuration(0) // "< 1 day"
 */
export function formatDuration(days) {
  if (days === 0) return '< 1 day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Extract domain from a URL for display.
 *
 * @param {string} url - Full URL
 * @returns {string} Domain name (e.g., "example.com") or the original string if invalid
 *
 * @example
 * extractDomain('https://www.example.com/job/123') // "example.com"
 * extractDomain('invalid-url') // "invalid-url"
 */
export function extractDomain(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Format a salary to a compact display format.
 * Used for chart labels and compact displays.
 *
 * @param {number|null|undefined} salary - Salary amount
 * @returns {string} Formatted salary (e.g., "$150k") or "—" if invalid
 *
 * @example
 * formatSalaryCompact(150000) // "$150k"
 * formatSalaryCompact(500) // "$500"
 * formatSalaryCompact(null) // "—"
 */
export function formatSalaryCompact(salary) {
  if (salary === null || salary === undefined) return '—';
  if (salary >= 1000) {
    return `$${Math.round(salary / 1000)}k`;
  }
  return `$${Math.round(salary)}`;
}

/**
 * Get color for rate visualization based on value and thresholds.
 *
 * @param {number} rate - Rate value (0-100)
 * @param {Object} [config] - Configuration options
 * @param {boolean} [config.inverted=false] - If true, lower is better (e.g., ghost rate)
 * @param {Object} [config.thresholds] - Custom thresholds for color bands
 * @param {number} [config.thresholds.excellent=60] - Threshold for green (excellent)
 * @param {number} [config.thresholds.good=40] - Threshold for purple (good)
 * @param {number} [config.thresholds.moderate=20] - Threshold for blue (moderate)
 * @returns {string} Hex color code
 *
 * @example
 * // Default thresholds (60/40/20)
 * getRateColor(70) // '#10B981' (green)
 * getRateColor(50) // '#A78BFA' (purple)
 *
 * // Inverted (lower is better)
 * getRateColor(10, { inverted: true }) // '#10B981' (green, because 100-10=90 >= 60)
 *
 * // Custom thresholds for position insights (25/15/8)
 * getRateColor(20, { thresholds: { excellent: 25, good: 15, moderate: 8 } }) // '#A78BFA' (purple)
 */
export function getRateColor(rate, config = {}) {
  const { inverted = false, thresholds = {} } = config;
  const { excellent = 60, good = 40, moderate = 20 } = thresholds;

  const effectiveRate = inverted ? 100 - rate : rate;

  if (effectiveRate >= excellent) return '#10B981'; // Green - excellent
  if (effectiveRate >= good) return '#A78BFA';      // Purple - good
  if (effectiveRate >= moderate) return '#4E9AF1';  // Blue - moderate
  return '#6B7280';                                  // Gray - low
}
