/**
 * @file metricsEngine.js
 * @description Pure functions for calculating metrics from audit trail events.
 * These functions process application journey data to compute response rates,
 * interview rates, offer rates, and funnel conversion metrics.
 */

import { parseBackendDate } from './dataAdapter';
import {
  RESPONSE_STATUSES,
  INTERVIEW_STATUSES,
  OFFER_STATUSES,
  TECHNICAL_STATUSES,
} from '../constants/statuses';

// Re-export status arrays for consumers that import from metricsEngine
export { RESPONSE_STATUSES, INTERVIEW_STATUSES, OFFER_STATUSES, TECHNICAL_STATUSES };

/**
 * @typedef {Object} AuditEvent
 * @property {number} id - Unique event identifier
 * @property {number} applicationId - ID of the associated application
 * @property {'STATUS_CHANGED'|'CREATED'|'UPDATED'} eventType - Type of event
 * @property {string|null} fieldName - Field that was changed (e.g., 'status')
 * @property {string|null} oldValue - Previous value before the change
 * @property {string|null} newValue - New value after the change
 * @property {number|string} timestamp - Event timestamp (epoch seconds or ISO string)
 */

/**
 * @typedef {Object} ApplicationJourney
 * @property {Set<string>} statusesReached - All statuses this application has reached
 * @property {AuditEvent[]} events - All events for this application
 * @property {Date|null} firstResponseDate - Date of first response from company
 * @property {Date|null} createdDate - Date the application was created
 */

/**
 * @typedef {Object} StageConversions
 * @property {number} appliedToScreen - Percentage of apps going from APPLIED to RECRUITER_SCREEN
 * @property {number} screenToTech - Percentage of screened apps going to any technical stage
 * @property {number} techToOffer - Percentage of tech-interviewed apps receiving an offer
 */

/**
 * @typedef {Object} AllMetrics
 * @property {number} trueResponseRate - Percentage of apps that received any response
 * @property {number} trueInterviewRate - Percentage of apps that reached any interview stage
 * @property {number} trueOfferRate - Percentage of apps that reached any offer stage
 * @property {number|null} avgDaysToResponse - Average days from application to first response
 * @property {StageConversions} stageConversions - Funnel conversion metrics
 */

/**
 * Parse a timestamp value from various formats into a JavaScript Date object.
 * Handles both epoch seconds (number) and ISO strings.
 *
 * @param {number|string|null} timestamp - Timestamp in epoch seconds or ISO string
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
function parseTimestamp(timestamp) {
  return parseBackendDate(timestamp);
}

/**
 * Check if a status is a response status (company responded).
 *
 * @param {string} status - The status to check
 * @returns {boolean} True if status indicates a response
 */
function isResponseStatus(status) {
  return RESPONSE_STATUSES.includes(status);
}

/**
 * Check if a Set contains any status from a list.
 *
 * @param {Set<string>} statusSet - Set of statuses to check
 * @param {string[]} statusList - List of statuses to look for
 * @returns {boolean} True if any status from the list is in the set
 */
function hasAnyStatus(statusSet, statusList) {
  for (const status of statusList) {
    if (statusSet.has(status)) {
      return true;
    }
  }
  return false;
}

/**
 * Process audit trail events grouped by applicationId.
 * Builds a comprehensive journey for each application including all statuses
 * reached, all events, and the first response date.
 *
 * @param {AuditEvent[]|null} events - Array of audit events to process
 * @returns {Map<number, ApplicationJourney>} Map of applicationId to journey data
 *
 * @example
 * const events = [
 *   { applicationId: 1, eventType: 'STATUS_CHANGED', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: 1737024600 },
 *   { applicationId: 1, eventType: 'STATUS_CHANGED', oldValue: 'RECRUITER_SCREEN', newValue: 'TECH_SCREEN', timestamp: 1737111000 },
 * ];
 * const journeys = buildApplicationJourneys(events);
 * // journeys.get(1).statusesReached contains Set(['RECRUITER_SCREEN', 'TECH_SCREEN'])
 */
export function buildApplicationJourneys(events) {
  const journeys = new Map();

  if (!events || !Array.isArray(events)) {
    return journeys;
  }

  for (const event of events) {
    const appId = event.applicationId;

    // Initialize journey if not exists
    if (!journeys.has(appId)) {
      journeys.set(appId, {
        statusesReached: new Set(),
        events: [],
        firstResponseDate: null,
        createdDate: null,
      });
    }

    const journey = journeys.get(appId);
    journey.events.push(event);

    // Track CREATED event timestamp
    if (event.eventType === 'CREATED') {
      const createdDate = parseTimestamp(event.timestamp);
      if (createdDate && (!journey.createdDate || createdDate < journey.createdDate)) {
        journey.createdDate = createdDate;
      }
    }

    // Process STATUS_CHANGED events
    if (event.eventType === 'STATUS_CHANGED' && event.fieldName === 'status' && event.newValue) {
      journey.statusesReached.add(event.newValue);

      // Track first response date (transition from APPLIED to a response status)
      if (event.oldValue === 'APPLIED' && isResponseStatus(event.newValue)) {
        const eventDate = parseTimestamp(event.timestamp);
        if (eventDate) {
          if (!journey.firstResponseDate || eventDate < journey.firstResponseDate) {
            journey.firstResponseDate = eventDate;
          }
        }
      }
    }
  }

  return journeys;
}

/**
 * Calculate the percentage of applications that received any response.
 * Response statuses include interview invitations, rejections, and offers.
 * Excludes WITHDRAWN (user-initiated) and GHOSTED (no response).
 *
 * @param {Map<number, ApplicationJourney>} journeys - Map of application journeys
 * @param {number} totalApps - Total number of applications
 * @returns {number} Percentage (0-100) of apps that received a response
 *
 * @example
 * const rate = calculateTrueResponseRate(journeys, 100);
 * // Returns 45.5 if 45.5% of applications got responses
 */
export function calculateTrueResponseRate(journeys, totalApps) {
  if (!totalApps || totalApps === 0) {
    return 0;
  }

  let appsWithResponse = 0;

  for (const [, journey] of journeys) {
    if (hasAnyStatus(journey.statusesReached, RESPONSE_STATUSES)) {
      appsWithResponse++;
    }
  }

  return (appsWithResponse / totalApps) * 100;
}

/**
 * Calculate the percentage of applications that reached any interview stage.
 * Interview stages include recruiter screens, technical interviews, take-homes,
 * and reference checks.
 *
 * @param {Map<number, ApplicationJourney>} journeys - Map of application journeys
 * @param {number} totalApps - Total number of applications
 * @returns {number} Percentage (0-100) of apps that reached an interview stage
 *
 * @example
 * const rate = calculateTrueInterviewRate(journeys, 100);
 * // Returns 30.0 if 30% of applications got interviews
 */
export function calculateTrueInterviewRate(journeys, totalApps) {
  if (!totalApps || totalApps === 0) {
    return 0;
  }

  let appsWithInterview = 0;

  for (const [, journey] of journeys) {
    if (hasAnyStatus(journey.statusesReached, INTERVIEW_STATUSES)) {
      appsWithInterview++;
    }
  }

  return (appsWithInterview / totalApps) * 100;
}

/**
 * Calculate the percentage of applications that reached any offer stage.
 * Offer stages include offer received, negotiating, accepted, declined, and rescinded.
 *
 * @param {Map<number, ApplicationJourney>} journeys - Map of application journeys
 * @param {number} totalApps - Total number of applications
 * @returns {number} Percentage (0-100) of apps that reached an offer stage
 *
 * @example
 * const rate = calculateTrueOfferRate(journeys, 100);
 * // Returns 5.0 if 5% of applications resulted in offers
 */
export function calculateTrueOfferRate(journeys, totalApps) {
  if (!totalApps || totalApps === 0) {
    return 0;
  }

  let appsWithOffer = 0;

  for (const [, journey] of journeys) {
    if (hasAnyStatus(journey.statusesReached, OFFER_STATUSES)) {
      appsWithOffer++;
    }
  }

  return (appsWithOffer / totalApps) * 100;
}

/**
 * Calculate the average number of days from application to first response.
 * Only includes applications that received a response (have firstResponseDate).
 * Uses the CREATED event timestamp as the application date.
 *
 * @param {Map<number, ApplicationJourney>} journeys - Map of application journeys
 * @returns {number|null} Average days to response, or null if no data
 *
 * @example
 * const avgDays = calculateAvgDaysToResponse(journeys);
 * // Returns 7.5 if average time to first response is 7.5 days
 */
export function calculateAvgDaysToResponse(journeys) {
  if (!journeys || journeys.size === 0) {
    return null;
  }

  let totalDays = 0;
  let count = 0;

  for (const [, journey] of journeys) {
    if (journey.firstResponseDate && journey.createdDate) {
      const diffMs = journey.firstResponseDate.getTime() - journey.createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      totalDays += diffDays;
      count++;
    }
  }

  if (count === 0) {
    return null;
  }

  return totalDays / count;
}

/**
 * Calculate funnel conversion metrics between stages.
 *
 * - appliedToScreen: % of all apps that reached RECRUITER_SCREEN
 * - screenToTech: % of screened apps that reached any technical stage
 * - techToOffer: % of tech-interviewed apps that reached any offer stage
 *
 * @param {Map<number, ApplicationJourney>} journeys - Map of application journeys
 * @param {number} totalApps - Total number of applications
 * @returns {StageConversions} Object with conversion percentages
 *
 * @example
 * const conversions = calculateStageConversions(journeys, 100);
 * // Returns { appliedToScreen: 40, screenToTech: 75, techToOffer: 20 }
 */
export function calculateStageConversions(journeys, totalApps) {
  const result = {
    appliedToScreen: 0,
    screenToTech: 0,
    techToOffer: 0,
  };

  if (!totalApps || totalApps === 0 || !journeys || journeys.size === 0) {
    return result;
  }

  let appsReachedScreen = 0;
  let appsReachedTech = 0;
  let appsReachedOffer = 0;

  for (const [, journey] of journeys) {
    const reachedScreen = journey.statusesReached.has('RECRUITER_SCREEN');
    const reachedTech = hasAnyStatus(journey.statusesReached, TECHNICAL_STATUSES);
    const reachedOffer = hasAnyStatus(journey.statusesReached, OFFER_STATUSES);

    if (reachedScreen) {
      appsReachedScreen++;
    }
    if (reachedTech) {
      appsReachedTech++;
    }
    if (reachedOffer) {
      appsReachedOffer++;
    }
  }

  // Applied to Screen: % of all apps that reached recruiter screen
  result.appliedToScreen = (appsReachedScreen / totalApps) * 100;

  // Screen to Tech: % of screened apps that went to technical
  if (appsReachedScreen > 0) {
    result.screenToTech = (appsReachedTech / appsReachedScreen) * 100;
  }

  // Tech to Offer: % of tech-interviewed apps that got offers
  if (appsReachedTech > 0) {
    result.techToOffer = (appsReachedOffer / appsReachedTech) * 100;
  }

  return result;
}

/**
 * Calculate all metrics from audit events and applications.
 * This is the main entry point that combines all metric calculations.
 *
 * @param {AuditEvent[]|null} events - Array of audit trail events
 * @param {Array<{id: number}>|null} apps - Array of applications (used for total count)
 * @returns {AllMetrics} Object containing all calculated metrics
 *
 * @example
 * const events = await fetchAuditEvents();
 * const apps = await fetchApplications();
 * const metrics = getAllMetrics(events, apps);
 * // Returns: {
 * //   trueResponseRate: 45.5,
 * //   trueInterviewRate: 30.0,
 * //   trueOfferRate: 5.0,
 * //   avgDaysToResponse: 7.5,
 * //   stageConversions: { appliedToScreen: 40, screenToTech: 75, techToOffer: 20 }
 * // }
 */
export function getAllMetrics(events, apps) {
  const totalApps = apps?.length || 0;
  const journeys = buildApplicationJourneys(events);

  return {
    trueResponseRate: calculateTrueResponseRate(journeys, totalApps),
    trueInterviewRate: calculateTrueInterviewRate(journeys, totalApps),
    trueOfferRate: calculateTrueOfferRate(journeys, totalApps),
    avgDaysToResponse: calculateAvgDaysToResponse(journeys),
    stageConversions: calculateStageConversions(journeys, totalApps),
  };
}
