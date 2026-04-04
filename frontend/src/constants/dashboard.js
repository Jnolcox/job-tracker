/**
 * @file dashboard.js
 * @description Dashboard-specific constants for the JobTracker application.
 * Contains display configuration for funnel charts, filters, and time-based groupings.
 */

import { STATUS_GROUPS } from "../utils/dataAdapter";
import { FUNNEL_COLORS } from "./colors";

// Re-export FUNNEL_COLORS for backwards compatibility
export { FUNNEL_COLORS };

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
 * Days of the week starting with Monday for display in charts.
 * Use getDayIndex() to convert from Date.getDay() to this array's index.
 * @constant {string[]}
 */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Days of the week starting with Sunday (matches JavaScript Date.getDay()).
 * Use this array when you need to index directly with Date.getDay().
 * @constant {string[]}
 */
export const DAYS_SUNDAY_START = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Convert JavaScript's Date.getDay() (0=Sunday) to DAYS array index (0=Monday).
 * This fixes the mismatch between JS getDay() and the Monday-first DAYS array.
 *
 * @param {number} jsDay - Day from Date.getDay() (0=Sunday, 6=Saturday)
 * @returns {number} Index into DAYS array (0=Monday, 6=Sunday)
 *
 * @example
 * const date = new Date('2025-01-05'); // Sunday
 * const dayIndex = getDayIndex(date.getDay()); // Returns 6 (DAYS[6] = "Sun")
 */
export function getDayIndex(jsDay) {
  // getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // DAYS:    0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}
