// Data adapter for converting between backend and UI formats

// Re-export status constants from consolidated location
export {
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_GROUPS,
  isStatusInGroup,
  isTerminalStatus,
  LEVEL_TYPES,
  LEVEL_LABELS,
  RTO_TYPES,
  RTO_LABELS,
} from '../constants/statuses';

// Re-export STATUS_COLORS from consolidated colors
export { STATUS_COLORS } from '../constants/colors';

/**
 * Convert date values from backend to ISO string format.
 * Backend may return dates as:
 * - Epoch seconds (e.g., 1769644800.0) - most common with java.time.Instant
 * - ISO strings (e.g., "2025-01-15T10:00:00Z")
 * - Arrays [year, month, day, hour, minute, second] - LocalDateTime serialization
 *
 * @param {string|number|Array|null} dateValue - Date in any supported format
 * @param {string|null} fallback - Value to return if dateValue is null/undefined
 * @returns {string|null} ISO date string or fallback value
 */
export function convertDate(dateValue, fallback = null) {
  if (!dateValue && dateValue !== 0) return fallback;

  // If it's already a string, return it
  if (typeof dateValue === 'string') {
    return dateValue;
  }

  // If it's a number (epoch seconds from Instant serialization)
  // Convert to milliseconds and create ISO string
  if (typeof dateValue === 'number') {
    return new Date(dateValue * 1000).toISOString();
  }

  // If it's an array (LocalDateTime serialization)
  // Format as local ISO string (no timezone conversion)
  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    const pad = (n) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  return fallback;
}

/**
 * Parse a date value from various backend formats into a JavaScript Date object.
 * This is useful when you need to perform date operations (comparisons, sorting, etc.)
 * rather than just displaying the date as a string.
 *
 * Backend may return dates as:
 * - Epoch seconds (e.g., 1769644800.0) - most common with java.time.Instant
 * - ISO strings (e.g., "2025-01-15T10:00:00Z")
 * - Arrays [year, month, day, hour, minute, second] - LocalDateTime serialization
 *
 * @param {string|number|Array|null} dateValue - Date in any supported format
 * @returns {Date|null} JavaScript Date object or null if invalid/empty
 *
 * @example
 * // Parse epoch seconds
 * const date = parseBackendDate(1737024600);
 * // Returns: Date object for Jan 16, 2025
 *
 * @example
 * // Parse ISO string
 * const date = parseBackendDate('2025-01-15T10:00:00Z');
 * // Returns: Date object
 *
 * @example
 * // Parse array format
 * const date = parseBackendDate([2025, 1, 17, 14, 45, 30]);
 * // Returns: Date object for Jan 17, 2025 14:45:30
 */
export function parseBackendDate(dateValue) {
  const isoString = convertDate(dateValue);
  if (!isoString) return null;

  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convert backend application to UI format
 */
export function toUIFormat(application) {
  const appliedAt = convertDate(application.appliedDate, new Date().toISOString());
  const updatedAt = convertDate(application.updatedAt);
  const statusChangedAt = convertDate(application.statusChangedAt);

  return {
    id: application.id,
    company: application.companyName,
    role: application.positionTitle,
    status: application.status,
    appliedAt: appliedAt,
    lastUpdate: updatedAt || appliedAt,
    statusChangedAt: statusChangedAt || appliedAt,  // For Status Age calculation
    notes: application.notes || "",
    jobDescription: application.jobDescription || "",
    interviewDate: convertDate(application.interviewDate),
    salaryMin: application.salaryMin,
    salaryMax: application.salaryMax,
    location: application.location || "",
    rtoType: application.rtoType || null,
    level: application.level || null,
    jobUrl: application.jobUrl || "",
    contactName: application.contactName || "",
    contactEmail: application.contactEmail || "",
    contactPhone: application.contactPhone || "",
  };
}

/**
 * Helper to compare two date values for equality.
 * Handles different ISO string formats and null/undefined values.
 *
 * @param {string|null} date1 - First date value
 * @param {string|null} date2 - Second date value
 * @returns {boolean} True if the dates represent the same moment in time
 */
function areDatesEqual(date1, date2) {
  // Both null/undefined are equal
  if (!date1 && !date2) return true;
  // One is null/undefined, other is not
  if (!date1 || !date2) return false;

  // Compare as timestamps to handle different ISO string formats
  const time1 = new Date(date1).getTime();
  const time2 = new Date(date2).getTime();

  // Handle invalid dates
  if (isNaN(time1) || isNaN(time2)) return false;

  return time1 === time2;
}

/**
 * Convert UI format back to backend format for CREATE operations.
 * Does NOT send statusChangedAt - backend will default it to now().
 *
 * @component toBackendFormat
 * @description Converts UI form data to backend format for creating new applications.
 * Only sends appliedDate, NOT statusChangedAt, to let backend handle the default.
 *
 * @param {Object} form - UI form data
 * @param {string} form.company - Company name
 * @param {string} form.role - Position title
 * @param {string} form.status - Application status
 * @param {string} [form.appliedAt] - Date when user applied
 * @param {string} [form.interviewDate] - Scheduled interview date
 * @param {string} [form.notes] - Additional notes
 * @param {string} [form.jobDescription] - Job description
 * @param {number} [form.salaryMin] - Minimum salary
 * @param {number} [form.salaryMax] - Maximum salary
 * @param {string} [form.location] - Job location
 * @param {string} [form.rtoType] - Remote/hybrid/onsite type
 * @param {string} [form.jobUrl] - URL to job posting
 * @param {string} [form.contactName] - Recruiter/contact name
 * @param {string} [form.contactEmail] - Recruiter/contact email
 * @param {string} [form.contactPhone] - Recruiter/contact phone
 *
 * @returns {Object} Backend-formatted application data for create operation
 *
 * @example
 * const backendData = toBackendFormat({
 *   company: 'Acme Corp',
 *   role: 'Software Engineer',
 *   status: 'APPLIED',
 *   appliedAt: '2025-01-15T10:00:00.000Z',
 * });
 */
export function toBackendFormat(form) {
  // For create operations, we send appliedDate but NOT statusChangedAt
  // Backend will default statusChangedAt to the current time
  return {
    companyName: form.company,
    positionTitle: form.role,
    status: form.status,
    appliedDate: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
    // statusChangedAt is intentionally NOT included - let backend default it
    interviewDate: form.interviewDate ? new Date(form.interviewDate).toISOString() : null,
    notes: form.notes || null,
    jobDescription: form.jobDescription || null,
    salaryMin: form.salaryMin || null,
    salaryMax: form.salaryMax || null,
    location: form.location || null,
    rtoType: form.rtoType || null,
    level: form.level || null,
    jobUrl: form.jobUrl || null,
    contactName: form.contactName || null,
    contactEmail: form.contactEmail || null,
    contactPhone: form.contactPhone || null,
  };
}

/**
 * Convert UI format to backend format for UPDATE operations.
 * Intelligently handles date fields to prevent unintended overwrites.
 *
 * @component toBackendFormatForUpdate
 * @description Converts UI form data to backend format for updating existing applications.
 * Only sends date fields when they have actually changed, preventing unintended overwrites.
 *
 * Key behaviors:
 * - appliedDate: Only sent if user explicitly changed it from original
 * - statusChangedAt: Only sent if user manually edited it AND status did NOT change
 * - interviewDate: Only sent if user explicitly changed it from original
 * - If status changed, statusChangedAt is NOT sent (backend auto-updates it)
 *
 * @param {Object} form - Current form data in UI format
 * @param {Object} originalData - Original application data before editing (in UI format)
 * @param {boolean} statusChanged - Whether the status field was changed by user
 *
 * @returns {Object} Backend-formatted data with only appropriate date fields
 *
 * @example
 * // User only changed notes, status stayed same
 * const backendData = toBackendFormatForUpdate(
 *   { ...originalApp, notes: 'Updated notes' },
 *   originalApp,
 *   false // status did not change
 * );
 * // Result: statusChangedAt, appliedDate, and interviewDate are NOT included
 *
 * @example
 * // User changed status
 * const backendData = toBackendFormatForUpdate(
 *   { ...originalApp, status: 'RECRUITER_SCREEN' },
 *   originalApp,
 *   true // status changed
 * );
 * // Result: statusChangedAt NOT included (backend will set it)
 */
export function toBackendFormatForUpdate(form, originalData, statusChanged) {
  const result = {
    companyName: form.company,
    positionTitle: form.role,
    status: form.status,
    notes: form.notes || null,
    jobDescription: form.jobDescription || null,
    salaryMin: form.salaryMin || null,
    salaryMax: form.salaryMax || null,
    location: form.location || null,
    rtoType: form.rtoType || null,
    level: form.level || null,
    jobUrl: form.jobUrl || null,
    contactName: form.contactName || null,
    contactEmail: form.contactEmail || null,
    contactPhone: form.contactPhone || null,
  };

  // Only include appliedDate if it was actually changed by user
  const appliedDateChanged = !areDatesEqual(form.appliedAt, originalData.appliedAt);
  if (appliedDateChanged) {
    result.appliedDate = form.appliedAt ? new Date(form.appliedAt).toISOString() : null;
  }

  // statusChangedAt handling:
  // - If status changed: DON'T send it, let backend auto-update
  // - If status didn't change but user manually edited the date: send it
  // - If status didn't change and user didn't edit the date: DON'T send it
  if (!statusChanged) {
    // Compare the status-change timestamp, not the record's last-modified timestamp.
    // The modal used to read and write lastUpdate under a "status changed" label, so it
    // both displayed the wrong value and sent an edit derived from it.
    const statusDateChanged = !areDatesEqual(form.statusChangedAt, originalData.statusChangedAt);
    if (statusDateChanged) {
      result.statusChangedAt = form.statusChangedAt ? new Date(form.statusChangedAt).toISOString() : null;
    }
  }
  // When statusChanged is true, we intentionally omit statusChangedAt

  // interviewDate handling: only send if changed
  const interviewDateChanged = !areDatesEqual(form.interviewDate, originalData.interviewDate);
  if (interviewDateChanged) {
    result.interviewDate = form.interviewDate ? new Date(form.interviewDate).toISOString() : null;
  }

  return result;
}

/**
 * Create an empty application object with default values.
 * Use this when creating a new application to ensure all fields have proper initial values.
 *
 * @returns {Object} Empty application object in UI format with default values
 *
 * @example
 * // Open create modal with empty application
 * onEdit(createEmptyApplication());
 *
 * @example
 * // Reset form to empty state
 * setForm(createEmptyApplication());
 */
export function createEmptyApplication() {
  return {
    id: null,
    company: "",
    role: "",
    status: "APPLIED",
    appliedAt: new Date().toISOString(),
    notes: "",
    jobDescription: "",
    jobUrl: "",
    salaryMin: null,
    salaryMax: null,
    location: "",
    rtoType: null,
    level: null,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    interviewDate: null,
  };
}
