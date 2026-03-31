/**
 * @file dateHelpers.js
 * @description Date utility functions for job application tracking.
 * Provides helpers for calculating time durations and date comparisons.
 */

import { isTerminalStatus } from "./dataAdapter";

/**
 * Calculate the number of days between two dates.
 *
 * @param {string|Date} a - Start date (ISO string or Date object)
 * @param {string|Date} b - End date (ISO string or Date object)
 * @returns {number} Number of full days between the dates, or 0 if invalid
 *
 * @example
 * daysBetween('2025-01-01', '2025-01-10') // Returns 9
 * daysBetween(null, '2025-01-10') // Returns 0
 */
export function daysBetween(a, b) {
  if (!a || !b) return 0;
  const dateA = new Date(a);
  const dateB = new Date(b);
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
  return Math.floor((dateB - dateA) / 86400000);
}

/**
 * Get the current date as a new Date object.
 * Uses a function to ensure fresh date on each call.
 *
 * @returns {Date} Current date/time
 *
 * @example
 * const today = getToday();
 */
export function getToday() {
  return new Date();
}

/**
 * Calculate how many days an application has been in its current status.
 *
 * @param {Object} app - Application object
 * @param {string} app.statusChangedAt - ISO date string of when status last changed
 * @returns {number} Days in current stage (never negative)
 *
 * @example
 * timeInStage({ statusChangedAt: '2025-01-01T00:00:00Z' }) // Days since Jan 1
 */
export function timeInStage(app) {
  if (!app || !app.statusChangedAt) return 0;
  const days = daysBetween(app.statusChangedAt, getToday().toISOString());
  return Math.max(0, days); // Never show negative days
}

/**
 * Calculate total days an application has been active.
 * For terminal statuses (rejected, withdrawn, etc.), uses lastUpdate date.
 * For active applications, calculates from appliedAt to today.
 *
 * @param {Object} app - Application object
 * @param {string} app.appliedAt - ISO date string of when application was submitted
 * @param {string} app.status - Current application status
 * @param {string} [app.lastUpdate] - ISO date string of last update (for terminal statuses)
 * @returns {number} Total days active (never negative)
 *
 * @example
 * // Active application
 * totalDaysActive({ appliedAt: '2025-01-01', status: 'APPLIED' }) // Days since Jan 1
 *
 * // Rejected application
 * totalDaysActive({ appliedAt: '2025-01-01', status: 'REJECTED', lastUpdate: '2025-01-15' }) // 14 days
 */
export function totalDaysActive(app) {
  if (!app || !app.appliedAt) return 0;
  if (isTerminalStatus(app.status)) {
    return Math.max(0, daysBetween(app.appliedAt, app.lastUpdate || app.appliedAt));
  }
  return Math.max(0, daysBetween(app.appliedAt, getToday().toISOString()));
}
