/**
 * @file stageDurationUtils.js
 * @description Utility functions for calculating stage durations from audit trail events.
 * These functions analyze STATUS_CHANGED events to compute time spent in each application stage,
 * identify bottlenecks, and provide insights for analytics.
 */

import { parseBackendDate } from './dataAdapter';
import { daysBetween, getToday } from './dateHelpers';

/**
 * @typedef {Object} StageDuration
 * @property {string} status - The application status (e.g., 'APPLIED', 'RECRUITER_SCREEN')
 * @property {number} durationDays - Number of days spent in this stage
 * @property {string} startDate - ISO date string when the stage started
 * @property {string|null} endDate - ISO date string when the stage ended, or null if current
 * @property {boolean} isCurrent - Whether this is the current/active stage
 */

/**
 * @typedef {Object} BottleneckStage
 * @property {string} status - The application status
 * @property {number} avgDays - Average number of days spent in this stage
 * @property {number} count - Number of applications that went through this stage
 */

/**
 * Parse an event timestamp from various formats into a Date object.
 *
 * @param {number|string|Array|null} timestamp - Timestamp in epoch seconds, ISO string, or array format
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
function parseEventTimestamp(timestamp) {
  return parseBackendDate(timestamp);
}

/**
 * Calculate the number of days between two dates (non-negative).
 * Wrapper around daysBetween that ensures non-negative results.
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days between the dates (floored, non-negative)
 */
function daysBetweenDates(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  return Math.max(0, daysBetween(startDate, endDate));
}

// Alias getToday as getNow for backwards compatibility
const getNow = getToday;

/**
 * Calculate how many days an application has been in its current status
 * using audit trail events instead of the statusChangedAt field.
 *
 * @param {Object|null} app - Application object
 * @param {number} app.id - Application ID
 * @param {string} app.status - Current application status
 * @param {Array|null} events - Array of audit trail events
 * @returns {number} Days in current stage (never negative)
 *
 * @example
 * const days = getTimeInStageFromAudit(
 *   { id: 1, status: 'RECRUITER_SCREEN' },
 *   [{ applicationId: 1, newValue: 'RECRUITER_SCREEN', createdAt: '2025-01-10T10:00:00Z' }]
 * );
 */
export function getTimeInStageFromAudit(app, events) {
  if (!app || !events || !Array.isArray(events) || events.length === 0) {
    return 0;
  }

  // Filter to only events for this application that are STATUS_CHANGED
  // and match the current status as newValue
  const appEvents = events.filter(
    (e) =>
      e.applicationId === app.id &&
      e.eventType === 'STATUS_CHANGED' &&
      e.fieldName === 'status' &&
      e.newValue === app.status
  );

  if (appEvents.length === 0) {
    return 0;
  }

  // Find the most recent event that transitioned TO the current status
  let latestTime = null;

  for (const event of appEvents) {
    const eventTime = parseEventTimestamp(event.createdAt);
    if (eventTime && (!latestTime || eventTime > latestTime)) {
      latestTime = eventTime;
    }
  }

  if (!latestTime) {
    return 0;
  }

  return daysBetweenDates(latestTime, getNow());
}

/**
 * Get an array of stage durations for a specific application.
 * Shows each stage the application has been in, with start/end dates and duration.
 *
 * @param {number|null} appId - Application ID
 * @param {Array|null} events - Array of audit trail events
 * @returns {StageDuration[]} Array of stage duration objects
 *
 * @example
 * const durations = getStageDurations(1, events);
 * // Returns:
 * // [
 * //   { status: 'APPLIED', durationDays: 5, startDate: '...', endDate: '...', isCurrent: false },
 * //   { status: 'RECRUITER_SCREEN', durationDays: 3, startDate: '...', endDate: null, isCurrent: true }
 * // ]
 */
export function getStageDurations(appId, events) {
  if (!appId || !events || !Array.isArray(events) || events.length === 0) {
    return [];
  }

  // Filter to only events for this application
  const appEvents = events.filter((e) => e.applicationId === appId);

  if (appEvents.length === 0) {
    return [];
  }

  // Sort events by createdAt ascending
  const sortedEvents = [...appEvents].sort((a, b) => {
    const timeA = parseEventTimestamp(a.createdAt);
    const timeB = parseEventTimestamp(b.createdAt);
    if (!timeA || !timeB) return 0;
    return timeA.getTime() - timeB.getTime();
  });

  const durations = [];
  let currentStatus = 'APPLIED';
  let stageStartTime = null;

  for (const event of sortedEvents) {
    const eventTime = parseEventTimestamp(event.createdAt);

    if (event.eventType === 'CREATED') {
      // Application created - start tracking APPLIED status
      stageStartTime = eventTime;
      currentStatus = 'APPLIED';
    } else if (event.eventType === 'STATUS_CHANGED' && event.fieldName === 'status') {
      // Status changed - close out previous stage
      if (stageStartTime && eventTime) {
        durations.push({
          status: currentStatus,
          durationDays: daysBetweenDates(stageStartTime, eventTime),
          startDate: stageStartTime.toISOString(),
          endDate: eventTime.toISOString(),
          isCurrent: false,
        });
      }

      // Start new stage
      stageStartTime = eventTime;
      currentStatus = event.newValue;
    }
  }

  // Add current/final stage (no end date yet)
  if (stageStartTime) {
    const now = getNow();
    durations.push({
      status: currentStatus,
      durationDays: daysBetweenDates(stageStartTime, now),
      startDate: stageStartTime.toISOString(),
      endDate: null,
      isCurrent: true,
    });
  }

  return durations;
}

/**
 * Calculate average time spent in each stage across all applications.
 *
 * @param {Array|null} events - Array of all audit trail events
 * @returns {Object} Object mapping status names to average days
 *
 * @example
 * const avgTimes = getAverageStageTime(events);
 * // Returns: { APPLIED: 5.2, RECRUITER_SCREEN: 7.5, TECHNICAL_I: 3.0 }
 */
export function getAverageStageTime(events) {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return {};
  }

  // Group events by applicationId
  const eventsByApp = new Map();
  for (const event of events) {
    const appId = event.applicationId;
    if (!eventsByApp.has(appId)) {
      eventsByApp.set(appId, []);
    }
    eventsByApp.get(appId).push(event);
  }

  // Calculate stage durations for each application (excluding current stages)
  const stageTotals = {};
  const stageCounts = {};

  for (const [, appEvents] of eventsByApp) {
    // Sort events by time
    const sortedEvents = [...appEvents].sort((a, b) => {
      const timeA = parseEventTimestamp(a.createdAt);
      const timeB = parseEventTimestamp(b.createdAt);
      if (!timeA || !timeB) return 0;
      return timeA.getTime() - timeB.getTime();
    });

    let currentStatus = 'APPLIED';
    let stageStartTime = null;

    for (const event of sortedEvents) {
      const eventTime = parseEventTimestamp(event.createdAt);

      if (event.eventType === 'CREATED') {
        stageStartTime = eventTime;
        currentStatus = 'APPLIED';
      } else if (event.eventType === 'STATUS_CHANGED' && event.fieldName === 'status') {
        // Only count completed stages (those that transitioned to something else)
        if (stageStartTime && eventTime) {
          const days = daysBetweenDates(stageStartTime, eventTime);

          if (!stageTotals[currentStatus]) {
            stageTotals[currentStatus] = 0;
            stageCounts[currentStatus] = 0;
          }
          stageTotals[currentStatus] += days;
          stageCounts[currentStatus] += 1;
        }

        stageStartTime = eventTime;
        currentStatus = event.newValue;
      }
    }
  }

  // Calculate averages
  const averages = {};
  for (const status of Object.keys(stageTotals)) {
    if (stageCounts[status] > 0) {
      averages[status] = Math.round(stageTotals[status] / stageCounts[status]);
    }
  }

  return averages;
}

/**
 * Identify bottleneck stages - those with the longest average duration.
 *
 * @param {Array|null} events - Array of all audit trail events
 * @param {number} [limit=5] - Maximum number of stages to return
 * @returns {BottleneckStage[]} Array of bottleneck stages sorted by avgDays descending
 *
 * @example
 * const bottlenecks = getBottleneckStages(events, 3);
 * // Returns:
 * // [
 * //   { status: 'RECRUITER_SCREEN', avgDays: 12, count: 15 },
 * //   { status: 'APPLIED', avgDays: 8, count: 50 },
 * //   { status: 'TECHNICAL_I', avgDays: 5, count: 8 }
 * // ]
 */
export function getBottleneckStages(events, limit = 5) {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return [];
  }

  // Group events by applicationId
  const eventsByApp = new Map();
  for (const event of events) {
    const appId = event.applicationId;
    if (!eventsByApp.has(appId)) {
      eventsByApp.set(appId, []);
    }
    eventsByApp.get(appId).push(event);
  }

  const stageTotals = {};
  const stageCounts = {};

  for (const [, appEvents] of eventsByApp) {
    const sortedEvents = [...appEvents].sort((a, b) => {
      const timeA = parseEventTimestamp(a.createdAt);
      const timeB = parseEventTimestamp(b.createdAt);
      if (!timeA || !timeB) return 0;
      return timeA.getTime() - timeB.getTime();
    });

    let currentStatus = 'APPLIED';
    let stageStartTime = null;

    for (const event of sortedEvents) {
      const eventTime = parseEventTimestamp(event.createdAt);

      if (event.eventType === 'CREATED') {
        stageStartTime = eventTime;
        currentStatus = 'APPLIED';
      } else if (event.eventType === 'STATUS_CHANGED' && event.fieldName === 'status') {
        if (stageStartTime && eventTime) {
          const days = daysBetweenDates(stageStartTime, eventTime);

          if (!stageTotals[currentStatus]) {
            stageTotals[currentStatus] = 0;
            stageCounts[currentStatus] = 0;
          }
          stageTotals[currentStatus] += days;
          stageCounts[currentStatus] += 1;
        }

        stageStartTime = eventTime;
        currentStatus = event.newValue;
      }
    }
  }

  // Build bottleneck array
  const bottlenecks = [];
  for (const status of Object.keys(stageTotals)) {
    if (stageCounts[status] > 0) {
      bottlenecks.push({
        status,
        avgDays: Math.round(stageTotals[status] / stageCounts[status]),
        count: stageCounts[status],
      });
    }
  }

  // Sort by avgDays descending and limit
  return bottlenecks.sort((a, b) => b.avgDays - a.avgDays).slice(0, limit);
}

/**
 * Get all stage durations for all applications in a single call.
 * Returns a Map of applicationId to stage durations array.
 *
 * @param {Array|null} events - Array of all audit trail events
 * @returns {Map<number, StageDuration[]>} Map of applicationId to stage durations
 *
 * @example
 * const allDurations = getAllStatusDurations(events);
 * const app1Durations = allDurations.get(1);
 */
export function getAllStatusDurations(events) {
  const result = new Map();

  if (!events || !Array.isArray(events) || events.length === 0) {
    return result;
  }

  // Get unique application IDs
  const appIds = new Set(events.map((e) => e.applicationId));

  for (const appId of appIds) {
    const durations = getStageDurations(appId, events);
    result.set(appId, durations);
  }

  return result;
}
