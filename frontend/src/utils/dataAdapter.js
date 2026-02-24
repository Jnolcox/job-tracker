// Data adapter for converting between backend and UI formats

// UI stage constants
export const UI_STAGES = ["Applied", "Phone Screen", "Tech Screen", "Technical", "Onsite", "Offer", "Rejected", "Withdrawn"];

// RTO type constants
export const RTO_TYPES = ["REMOTE", "HYBRID_2", "HYBRID_3", "HYBRID_4", "ONSITE"];

export const RTO_LABELS = {
  REMOTE: "Remote",
  HYBRID_2: "Hybrid (2 days)",
  HYBRID_3: "Hybrid (3 days)",
  HYBRID_4: "Hybrid (4 days)",
  ONSITE: "On-site",
};

export const STAGE_COLORS = {
  Applied: "#4E9AF1",
  "Phone Screen": "#A78BFA",
    "Tech Screen": "#1ddac4",
  Technical: "#F59E0B",
  Onsite: "#34D399",
  Offer: "#10B981",
  Rejected: "#F87171",
  Withdrawn: "#6B7280",
};

// Map backend ApplicationStatus to UI stage
const STATUS_TO_STAGE = {
  APPLIED: "Applied",
  RECRUITER_SCREEN: "Phone Screen",
  TECH_SCREEN: "Technical Screen",
  TAKE_HOME: "Technical",
  SYSTEM_DESIGN: "Technical",
  TECHNICAL_I: "Technical",
  TECHNICAL_II: "Technical",
  ONSITE: "Onsite",
  OFFER_RECEIVED: "Offer",
  NEGOTIATING: "Offer",
  OFFER_ACCEPTED: "Offer",
  OFFER_DECLINED: "Rejected",
  OFFER_RESCINDED: "Rejected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ON_HOLD: "Withdrawn",
  GHOSTED: "Rejected",
};

// Map UI stage back to backend status (default status for each stage)
const STAGE_TO_STATUS = {
  Applied: "APPLIED",
  "Phone Screen": "RECRUITER_SCREEN",
  Technical: "TECH_SCREEN",
  Onsite: "ONSITE",
  Offer: "OFFER_RECEIVED",
  Rejected: "REJECTED",
  Withdrawn: "WITHDRAWN",
};

/**
 * Map backend status to UI stage
 */
export function mapStatusToStage(status) {
  return STATUS_TO_STAGE[status] || "Applied";
}

/**
 * Map UI stage to backend status
 */
export function mapStageToStatus(stage) {
  return STAGE_TO_STATUS[stage] || "APPLIED";
}

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
    stage: mapStatusToStage(application.status),
    appliedAt: appliedAt,
    lastUpdate: statusChangedAt || updatedAt || appliedAt,
    notes: application.notes || "",
    // Keep additional backend fields for full edit capability
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
    status: mapStageToStatus(form.stage),
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
