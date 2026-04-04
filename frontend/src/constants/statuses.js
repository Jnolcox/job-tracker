/**
 * @file statuses.js
 * @description Single source of truth for all application status constants.
 * This module consolidates status definitions previously scattered across
 * api.js, dataAdapter.js, and metricsEngine.js.
 */

/**
 * Application status constants as an object (for type-safe access).
 * Keys and values are identical for easy mapping.
 * @constant {Object<string, string>}
 */
export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  RECRUITER_SCREEN: 'RECRUITER_SCREEN',
  TECH_SCREEN: 'TECH_SCREEN',
  TAKE_HOME: 'TAKE_HOME',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN',
  TECHNICAL_I: 'TECHNICAL_I',
  TECHNICAL_II: 'TECHNICAL_II',
  REFERENCE_CHECK: 'REFERENCE_CHECK',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  NEGOTIATING: 'NEGOTIATING',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_DECLINED: 'OFFER_DECLINED',
  OFFER_RESCINDED: 'OFFER_RESCINDED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  ON_HOLD: 'ON_HOLD',
  WAITING_FOR_RESPONSE: 'WAITING_FOR_RESPONSE',
  GHOSTED: 'GHOSTED',
};

/**
 * All backend ApplicationStatus values as an array.
 * Derived from APPLICATION_STATUS to ensure consistency.
 * @constant {string[]}
 */
export const APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);

/**
 * Human-readable labels for statuses.
 * Used in UI dropdowns, badges, and display text.
 * @constant {Object<string, string>}
 */
export const STATUS_LABELS = {
  APPLIED: 'Applied',
  RECRUITER_SCREEN: 'Recruiter Screen',
  TECH_SCREEN: 'Tech Screen',
  TAKE_HOME: 'Take Home',
  SYSTEM_DESIGN: 'System Design',
  TECHNICAL_I: 'Technical I',
  TECHNICAL_II: 'Technical II',
  REFERENCE_CHECK: 'Reference Check',
  OFFER_RECEIVED: 'Offer Received',
  NEGOTIATING: 'Negotiating',
  OFFER_ACCEPTED: 'Offer Accepted',
  OFFER_DECLINED: 'Offer Declined',
  OFFER_RESCINDED: 'Offer Rescinded',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  ON_HOLD: 'On Hold',
  WAITING_FOR_RESPONSE: 'Waiting for Response',
  GHOSTED: 'Ghosted',
};

/**
 * Status groupings for filtering and analytics.
 * Groups related statuses together for aggregate reporting.
 * @constant {Object<string, string[]>}
 */
export const STATUS_GROUPS = {
  REJECTED: ['REJECTED', 'OFFER_DECLINED', 'OFFER_RESCINDED', 'GHOSTED'],
  WITHDRAWN: ['WITHDRAWN'],
  WAITING: ['ON_HOLD', 'WAITING_FOR_RESPONSE'],
  OFFER: ['OFFER_RECEIVED', 'NEGOTIATING', 'OFFER_ACCEPTED'],
  TECHNICAL: ['TECH_SCREEN', 'TAKE_HOME', 'SYSTEM_DESIGN', 'TECHNICAL_I', 'TECHNICAL_II'],
  INTERVIEWING: [
    'RECRUITER_SCREEN',
    'TECH_SCREEN',
    'TAKE_HOME',
    'SYSTEM_DESIGN',
    'TECHNICAL_I',
    'TECHNICAL_II',
    'REFERENCE_CHECK',
  ],
};

/**
 * Response statuses - indicates the company responded to the application.
 * Excludes WITHDRAWN (user-initiated) and GHOSTED (no response).
 * Used by metricsEngine for calculating true response rate.
 * @constant {string[]}
 */
export const RESPONSE_STATUSES = [
  'RECRUITER_SCREEN',
  'TECH_SCREEN',
  'TAKE_HOME',
  'SYSTEM_DESIGN',
  'TECHNICAL_I',
  'TECHNICAL_II',
  'REFERENCE_CHECK',
  'OFFER_RECEIVED',
  'NEGOTIATING',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'OFFER_RESCINDED',
  'REJECTED',
];

/**
 * Interview statuses - any stage involving interviews or assessments.
 * Used by metricsEngine for calculating true interview rate.
 * @constant {string[]}
 */
export const INTERVIEW_STATUSES = [
  'RECRUITER_SCREEN',
  'TECH_SCREEN',
  'TAKE_HOME',
  'SYSTEM_DESIGN',
  'TECHNICAL_I',
  'TECHNICAL_II',
  'REFERENCE_CHECK',
];

/**
 * Offer statuses - any stage involving an offer.
 * Used by metricsEngine for calculating true offer rate.
 * @constant {string[]}
 */
export const OFFER_STATUSES = [
  'OFFER_RECEIVED',
  'NEGOTIATING',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'OFFER_RESCINDED',
];

/**
 * Technical interview statuses - stages involving technical assessment.
 * Does not include RECRUITER_SCREEN as it's typically non-technical.
 * Used by metricsEngine for stage conversion calculations.
 * @constant {string[]}
 */
export const TECHNICAL_STATUSES = [
  'TECH_SCREEN',
  'TAKE_HOME',
  'SYSTEM_DESIGN',
  'TECHNICAL_I',
  'TECHNICAL_II',
];

/**
 * Check if a status belongs to a specific group.
 *
 * @param {string|null|undefined} status - The status to check
 * @param {string} group - The group name (key in STATUS_GROUPS)
 * @returns {boolean} True if status is in the specified group
 *
 * @example
 * isStatusInGroup('REJECTED', 'REJECTED') // true
 * isStatusInGroup('APPLIED', 'REJECTED') // false
 */
export function isStatusInGroup(status, group) {
  if (!status) return false;
  return STATUS_GROUPS[group]?.includes(status) || false;
}

/**
 * Check if a status is terminal (application no longer active).
 * Terminal statuses include rejected, withdrawn, waiting, and offer accepted.
 *
 * @param {string} status - The status to check
 * @returns {boolean} True if status is terminal
 *
 * @example
 * isTerminalStatus('REJECTED') // true
 * isTerminalStatus('APPLIED') // false
 */
export function isTerminalStatus(status) {
  return (
    STATUS_GROUPS.REJECTED.includes(status) ||
    STATUS_GROUPS.WITHDRAWN.includes(status) ||
    STATUS_GROUPS.WAITING.includes(status) ||
    status === 'OFFER_ACCEPTED'
  );
}
