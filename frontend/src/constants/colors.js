/**
 * @file colors.js
 * @description Single source of truth for all color constants.
 * This module consolidates color definitions previously scattered across
 * dataAdapter.js, api.js, and dashboard.js.
 */

/**
 * Colors for application statuses, grouped by category.
 * Used for badges, charts, and status indicators.
 * @constant {Object<string, string>}
 */
export const STATUS_COLORS = {
  // Applied - Blue
  APPLIED: '#4E9AF1',
  // Recruiter - Purple
  RECRUITER_SCREEN: '#A78BFA',
  // Technical stages - Orange/Amber
  TECH_SCREEN: '#F59E0B',
  TAKE_HOME: '#F59E0B',
  SYSTEM_DESIGN: '#F59E0B',
  TECHNICAL_I: '#F59E0B',
  TECHNICAL_II: '#F59E0B',
  // Reference Check - Pink
  REFERENCE_CHECK: '#cb37a1',
  // Offer stages - Green
  OFFER_RECEIVED: '#10B981',
  NEGOTIATING: '#10B981',
  OFFER_ACCEPTED: '#059669',
  // Negative outcomes - Red
  OFFER_DECLINED: '#F87171',
  OFFER_RESCINDED: '#F87171',
  REJECTED: '#F87171',
  GHOSTED: '#F87171',
  // Inactive - Gray
  WITHDRAWN: '#6B7280',
  // Waiting - Yellow/Amber
  ON_HOLD: '#EAB308',
  WAITING_FOR_RESPONSE: '#EAB308',
};

/**
 * Colors for funnel chart groups.
 * Each key corresponds to a FUNNEL_GROUPS key in dashboard.js.
 * @constant {Object<string, string>}
 */
export const FUNNEL_COLORS = {
  APPLIED: '#4E9AF1',
  RECRUITER: '#A78BFA',
  TECHNICAL: '#F59E0B',
  REFERENCE: '#cb37a1',
  OFFER: '#10B981',
  REJECTED: '#F87171',
  WAITING: '#EAB308',
  WITHDRAWN: '#6B7280',
};

/**
 * Common colors used in charts for various purposes.
 * @constant {Object<string, string>}
 */
export const CHART_COLORS = {
  // Urgency colors (for status age visualization)
  URGENCY_LOW: '#34D399',    // Green - < 3 days
  URGENCY_MEDIUM: '#F59E0B', // Amber - 3-7 days
  URGENCY_HIGH: '#F87171',   // Red - > 7 days

  // Duration colors (for stage duration charts)
  DURATION_FAST: '#34D399',     // Green - < 5 days
  DURATION_MODERATE: '#F59E0B', // Amber - 5-10 days
  DURATION_SLOW: '#F87171',     // Red - > 10 days

  // UI Chrome colors
  BACKGROUND_PRIMARY: '#0E1117',
  BACKGROUND_SECONDARY: '#111827',
  BORDER_DEFAULT: '#1F2937',
  BORDER_SUBTLE: '#374151',
  TEXT_PRIMARY: '#F9FAFB',
  TEXT_SECONDARY: '#9CA3AF',
  TEXT_MUTED: '#6B7280',
  TEXT_DISABLED: '#4B5563',

  // Accent colors
  ACCENT_BLUE: '#4E9AF1',
  ACCENT_PURPLE: '#A78BFA',
  ACCENT_VIOLET: '#7C3AED',
  ACCENT_CYAN: '#38BDF8',
  ACCENT_GREEN: '#10B981',
  ACCENT_AMBER: '#F59E0B',
  ACCENT_RED: '#F87171',
};

/**
 * Colors for RTO (Return to Office) type visualization.
 * @constant {Object<string, string>}
 */
export const RTO_COLORS = {
  REMOTE: '#10B981',      // Green - most flexible
  HYBRID_2: '#A78BFA',    // Purple
  HYBRID_3: '#4E9AF1',    // Blue
  HYBRID_4: '#F59E0B',    // Orange
  ONSITE: '#F87171',      // Red - least flexible
  'Not Specified': '#6B7280', // Gray
};

/**
 * Colors for position level visualization.
 * Gradient from entry-level to executive.
 * @constant {Object<string, string>}
 */
export const LEVEL_COLORS = {
  JUNIOR: '#4E9AF1',      // Blue
  MID: '#38BDF8',         // Light blue
  SENIOR: '#A78BFA',      // Purple
  STAFF: '#8B5CF6',       // Violet
  PRINCIPAL: '#10B981',   // Green
  LEAD: '#F59E0B',        // Orange
  MANAGER: '#F97316',     // Deep orange
  DIRECTOR: '#EC4899',    // Pink
  VP: '#EF4444',          // Red
  'Not Specified': '#6B7280', // Gray
};

/**
 * Get urgency color based on days in stage.
 *
 * @param {number} days - Number of days in current stage
 * @returns {string} Hex color code
 *
 * @example
 * getUrgencyColor(2) // '#34D399' (green)
 * getUrgencyColor(5) // '#F59E0B' (amber)
 * getUrgencyColor(10) // '#F87171' (red)
 */
export function getUrgencyColor(days) {
  if (days > 7) return CHART_COLORS.URGENCY_HIGH;
  if (days > 3) return CHART_COLORS.URGENCY_MEDIUM;
  return CHART_COLORS.URGENCY_LOW;
}

/**
 * Get duration color based on average days in stage.
 *
 * @param {number} days - Average number of days in stage
 * @returns {string} Hex color code
 *
 * @example
 * getDurationColor(3) // '#34D399' (green)
 * getDurationColor(7) // '#F59E0B' (amber)
 * getDurationColor(15) // '#F87171' (red)
 */
export function getDurationColor(days) {
  if (days > 10) return CHART_COLORS.DURATION_SLOW;
  if (days > 5) return CHART_COLORS.DURATION_MODERATE;
  return CHART_COLORS.DURATION_FAST;
}
