/**
 * @file dashboard.js
 * @description Dashboard-specific constants for the JobTracker application.
 * Contains display configuration for funnel charts, filters, and time-based groupings.
 */

import { STATUS_GROUPS } from "../utils/dataAdapter";

/**
 * Display groups for the pipeline funnel chart.
 * Each group aggregates related statuses into a simplified view.
 * @constant {Array<{key: string, label: string, statuses: string[]}>}
 */
export const FUNNEL_GROUPS = [
  { key: "APPLIED", label: "Applied", statuses: ["APPLIED"] },
  { key: "RECRUITER", label: "Recruiter", statuses: ["RECRUITER_SCREEN"] },
  { key: "TECHNICAL", label: "Technical", statuses: STATUS_GROUPS.TECHNICAL },
  { key: "REFERENCE", label: "Reference", statuses: ["REFERENCE_CHECK"] },
  { key: "OFFER", label: "Offer", statuses: STATUS_GROUPS.OFFER },
  { key: "REJECTED", label: "Rejected", statuses: STATUS_GROUPS.REJECTED },
  { key: "WAITING", label: "Waiting", statuses: STATUS_GROUPS.WAITING },
  { key: "WITHDRAWN", label: "Withdrawn", statuses: STATUS_GROUPS.WITHDRAWN },
];

/**
 * Color mapping for funnel groups.
 * Colors are coordinated with the status colors in dataAdapter.js.
 * @constant {Object<string, string>}
 */
export const FUNNEL_COLORS = {
  APPLIED: "#4E9AF1",
  RECRUITER: "#A78BFA",
  TECHNICAL: "#F59E0B",
  REFERENCE: "#cb37a1",
  OFFER: "#10B981",
  REJECTED: "#F87171",
  WAITING: "#EAB308",
  WITHDRAWN: "#6B7280",
};

/**
 * Filter options for the applications table.
 * "Active" shows all applications EXCEPT those in REJECTED status group.
 * @constant {string[]}
 */
export const FILTER_OPTIONS = ["All", "Active", ...FUNNEL_GROUPS.map(g => g.key)];

/**
 * Array of hours (0-23) for hour-based charts.
 * @constant {number[]}
 */
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Days of the week starting with Monday for day-based charts.
 * Note: This differs from JavaScript's Date.getDay() which starts with Sunday.
 * @constant {string[]}
 */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
