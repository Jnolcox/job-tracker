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
 * Convert ISO date string or LocalDateTime array to local ISO-like string
 * Backend may return dates as arrays [year, month, day, hour, minute, second]
 */
function convertDate(dateValue, fallback = null) {
  if (!dateValue) return fallback;

  // If it's already a string, return it
  if (typeof dateValue === 'string') {
    return dateValue;
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
 * Convert UI format back to backend format for API calls
 */
export function toBackendFormat(form) {
  return {
    companyName: form.company,
    positionTitle: form.role,
    status: form.status,
    appliedDate: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
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
 * Convert list of backend applications to UI format
 */
export function toUIFormatList(applications) {
  return applications.map(toUIFormat);
}
