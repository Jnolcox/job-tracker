// Data adapter for converting between backend and UI formats

// All backend ApplicationStatus values
export const APPLICATION_STATUSES = [
  "APPLIED",
  "RECRUITER_SCREEN",
  "TECH_SCREEN",
  "TAKE_HOME",
  "SYSTEM_DESIGN",
  "TECHNICAL_I",
  "TECHNICAL_II",
  "REFERENCE_CHECK",
  "OFFER_RECEIVED",
  "NEGOTIATING",
  "OFFER_ACCEPTED",
  "OFFER_DECLINED",
  "OFFER_RESCINDED",
  "REJECTED",
  "WITHDRAWN",
  "ON_HOLD",
  "GHOSTED",
];

// Human-readable labels for statuses
export const STATUS_LABELS = {
  APPLIED: "Applied",
  RECRUITER_SCREEN: "Recruiter Screen",
  TECH_SCREEN: "Tech Screen",
  TAKE_HOME: "Take Home",
  SYSTEM_DESIGN: "System Design",
  TECHNICAL_I: "Technical I",
  TECHNICAL_II: "Technical II",
  REFERENCE_CHECK: "Reference Check",
  OFFER_RECEIVED: "Offer Received",
  NEGOTIATING: "Negotiating",
  OFFER_ACCEPTED: "Offer Accepted",
  OFFER_DECLINED: "Offer Declined",
  OFFER_RESCINDED: "Offer Rescinded",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ON_HOLD: "On Hold",
  GHOSTED: "Ghosted",
};

// Colors grouped by category
export const STATUS_COLORS = {
  // Applied - Blue
  APPLIED: "#4E9AF1",
  // Recruiter - Purple
  RECRUITER_SCREEN: "#A78BFA",
  // Technical stages - Orange/Amber
  TECH_SCREEN: "#F59E0B",
  TAKE_HOME: "#F59E0B",
  SYSTEM_DESIGN: "#F59E0B",
  TECHNICAL_I: "#F59E0B",
  TECHNICAL_II: "#F59E0B",
  // Reference Check - Pink
  REFERENCE_CHECK: "#cb37a1",
  // Offer stages - Green
  OFFER_RECEIVED: "#10B981",
  NEGOTIATING: "#10B981",
  OFFER_ACCEPTED: "#059669",
  // Negative outcomes - Red
  OFFER_DECLINED: "#F87171",
  OFFER_RESCINDED: "#F87171",
  REJECTED: "#F87171",
  GHOSTED: "#F87171",
  // Inactive - Gray
  WITHDRAWN: "#6B7280",
  ON_HOLD: "#6B7280",
};

// Status groupings for filtering/stats
export const STATUS_GROUPS = {
  REJECTED: ["REJECTED", "OFFER_DECLINED", "OFFER_RESCINDED", "GHOSTED"],
  WITHDRAWN: ["WITHDRAWN", "ON_HOLD"],
  OFFER: ["OFFER_RECEIVED", "NEGOTIATING", "OFFER_ACCEPTED"],
  TECHNICAL: ["TECH_SCREEN", "TAKE_HOME", "SYSTEM_DESIGN", "TECHNICAL_I", "TECHNICAL_II"],
  INTERVIEWING: ["RECRUITER_SCREEN", "TECH_SCREEN", "TAKE_HOME", "SYSTEM_DESIGN", "TECHNICAL_I", "TECHNICAL_II", "REFERENCE_CHECK"],
};

// Helper to check if status is in a group
export const isStatusInGroup = (status, group) => STATUS_GROUPS[group]?.includes(status) || false;

// Helper to check if status is terminal (not active)
export const isTerminalStatus = (status) =>
  STATUS_GROUPS.REJECTED.includes(status) ||
  STATUS_GROUPS.WITHDRAWN.includes(status) ||
  status === "OFFER_ACCEPTED";

// RTO type constants
export const RTO_TYPES = ["REMOTE", "HYBRID_2", "HYBRID_3", "HYBRID_4", "ONSITE"];

export const RTO_LABELS = {
  REMOTE: "Remote",
  HYBRID_2: "Hybrid (2 days)",
  HYBRID_3: "Hybrid (3 days)",
  HYBRID_4: "Hybrid (4 days)",
  ONSITE: "On-site",
};

/**
 * Convert date values from backend to ISO string format.
 * Backend may return dates as:
 * - Epoch seconds (e.g., 1769644800.0) - most common with java.time.Instant
 * - ISO strings (e.g., "2025-01-15T10:00:00Z")
 * - Arrays [year, month, day, hour, minute, second] - LocalDateTime serialization
 */
function convertDate(dateValue, fallback = null) {
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
 * Convert backend application to UI format
 */
export function toUIFormat(application) {
  const appliedAt = convertDate(application.appliedDate, new Date().toISOString());
  const statusChangedAt = convertDate(application.statusChangedAt);
  const updatedAt = convertDate(application.updatedAt);

  return {
    id: application.id,
    company: application.companyName,
    role: application.positionTitle,
    status: application.status,
    appliedAt: appliedAt,
    lastUpdate: statusChangedAt || updatedAt || appliedAt,
    notes: application.notes || "",
    jobDescription: application.jobDescription || "",
    interviewDate: convertDate(application.interviewDate),
    salaryMin: application.salaryMin,
    salaryMax: application.salaryMax,
    location: application.location || "",
    rtoType: application.rtoType || null,
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
    const statusDateChanged = !areDatesEqual(form.lastUpdate, originalData.lastUpdate);
    if (statusDateChanged) {
      result.statusChangedAt = form.lastUpdate ? new Date(form.lastUpdate).toISOString() : null;
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
 * Convert list of backend applications to UI format
 */
export function toUIFormatList(applications) {
  return applications.map(toUIFormat);
}
