/**
 * @file event.js
 * @description Factory functions for creating mock audit event objects in tests.
 *
 * Provides functions for creating various types of audit events:
 * - STATUS_CHANGED events
 * - APPLICATION_CREATED events
 * - FIELD_UPDATED events
 * - INTERVIEW_SCHEDULED events
 * - Custom event types
 *
 * @example
 * // Create a basic status change event
 * const event = createMockEvent({ newValue: 'TECH_SCREEN' });
 *
 * // Create a journey with multiple status changes
 * const events = createJourneyEvents(1, [
 *   { from: 'APPLIED', to: 'RECRUITER_SCREEN' },
 *   { from: 'RECRUITER_SCREEN', to: 'TECH_SCREEN' },
 * ]);
 */

let eventIdCounter = 1;

/**
 * Resets the event ID counter. Useful in beforeEach blocks.
 */
export const resetEventIdCounter = () => {
  eventIdCounter = 1;
};

/**
 * Creates a mock audit event object.
 *
 * @param {Object} overrides - Properties to override in the default event
 * @returns {Object} Mock audit event object
 *
 * @example
 * const event = createMockEvent({
 *   eventType: 'STATUS_CHANGED',
 *   oldValue: 'APPLIED',
 *   newValue: 'RECRUITER_SCREEN',
 * });
 */
export const createMockEvent = (overrides = {}) => ({
  id: overrides.id ?? eventIdCounter++,
  applicationId: 1,
  eventType: 'STATUS_CHANGED',
  fieldName: 'status',
  oldValue: 'APPLIED',
  newValue: 'RECRUITER_SCREEN',
  createdAt: '2025-01-15T10:00:00Z',
  timestamp: 1737024600, // Jan 16, 2025 10:30:00 UTC
  details: null,
  ...overrides,
});

/**
 * Alias for createMockEvent for backward compatibility.
 * Some test files use createEvent as the name.
 *
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock audit event object
 */
export const createEvent = createMockEvent;

/**
 * Creates a set of events representing an application journey through status changes.
 *
 * @param {number|string} applicationId - The application ID for all events
 * @param {Array<{from: string, to: string}>} statusChanges - Array of status transitions
 * @param {number} startTimestamp - Starting timestamp (defaults to Jan 16, 2025)
 * @returns {Array} Array of mock audit events
 *
 * @example
 * const events = createJourneyEvents(1, [
 *   { from: 'APPLIED', to: 'RECRUITER_SCREEN' },
 *   { from: 'RECRUITER_SCREEN', to: 'TECH_SCREEN' },
 *   { from: 'TECH_SCREEN', to: 'OFFER_RECEIVED' },
 * ]);
 */
export const createJourneyEvents = (applicationId, statusChanges, startTimestamp = 1737024600) => {
  let timestamp = startTimestamp;
  return statusChanges.map((change, index) => {
    timestamp += 86400; // Add 1 day between events
    return createMockEvent({
      id: index + 1,
      applicationId,
      eventType: 'STATUS_CHANGED',
      fieldName: 'status',
      oldValue: change.from,
      newValue: change.to,
      timestamp,
      createdAt: new Date(timestamp * 1000).toISOString(),
    });
  });
};

/**
 * Creates an APPLICATION_CREATED event.
 *
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock APPLICATION_CREATED event
 *
 * @example
 * const createdEvent = createApplicationCreatedEvent({ applicationId: 123 });
 */
export const createApplicationCreatedEvent = (overrides = {}) =>
  createMockEvent({
    eventType: 'APPLICATION_CREATED',
    fieldName: null,
    oldValue: null,
    newValue: null,
    ...overrides,
  });

/**
 * Alias for createApplicationCreatedEvent using eventType 'CREATED'.
 * Some parts of the codebase use 'CREATED' instead of 'APPLICATION_CREATED'.
 *
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock CREATED event
 */
export const createCreatedEvent = (overrides = {}) =>
  createMockEvent({
    eventType: 'CREATED',
    fieldName: null,
    oldValue: null,
    newValue: null,
    ...overrides,
  });

/**
 * Creates a STATUS_CHANGED event.
 *
 * @param {string} from - The old status value
 * @param {string} to - The new status value
 * @param {Object} overrides - Additional properties to override
 * @returns {Object} Mock STATUS_CHANGED event
 *
 * @example
 * const event = createStatusChangedEvent('APPLIED', 'RECRUITER_SCREEN', {
 *   applicationId: 1,
 *   createdAt: '2025-01-20T10:00:00Z',
 * });
 */
export const createStatusChangedEvent = (from, to, overrides = {}) =>
  createMockEvent({
    eventType: 'STATUS_CHANGED',
    fieldName: 'status',
    oldValue: from,
    newValue: to,
    ...overrides,
  });

/**
 * Creates a FIELD_UPDATED event.
 *
 * @param {string} fieldName - The name of the field that was updated
 * @param {string} oldValue - The old value
 * @param {string} newValue - The new value
 * @param {Object} overrides - Additional properties to override
 * @returns {Object} Mock FIELD_UPDATED event
 *
 * @example
 * const event = createFieldUpdatedEvent('salaryMin', '100000', '120000');
 */
export const createFieldUpdatedEvent = (fieldName, oldValue, newValue, overrides = {}) =>
  createMockEvent({
    eventType: 'FIELD_UPDATED',
    fieldName,
    oldValue,
    newValue,
    ...overrides,
  });

/**
 * Creates an INTERVIEW_SCHEDULED event.
 *
 * @param {string|number|Array} interviewDate - The scheduled interview date
 * @param {Object} overrides - Additional properties to override
 * @returns {Object} Mock INTERVIEW_SCHEDULED event
 *
 * @example
 * const event = createInterviewScheduledEvent('2025-02-01T14:00:00Z');
 */
export const createInterviewScheduledEvent = (interviewDate, overrides = {}) =>
  createMockEvent({
    eventType: 'INTERVIEW_SCHEDULED',
    fieldName: 'interviewDate',
    oldValue: null,
    newValue: interviewDate,
    ...overrides,
  });

/**
 * Creates a NOTE_ADDED event.
 *
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock NOTE_ADDED event
 *
 * @example
 * const event = createNoteAddedEvent({ applicationId: 1 });
 */
export const createNoteAddedEvent = (overrides = {}) =>
  createMockEvent({
    eventType: 'NOTE_ADDED',
    fieldName: 'notes',
    oldValue: null,
    newValue: null,
    ...overrides,
  });

/**
 * Creates a complete application journey from APPLIED through multiple stages.
 * Includes CREATED event at the start.
 *
 * @param {number|string} applicationId - The application ID
 * @param {Array<string>} stages - Array of stages to progress through (e.g., ['RECRUITER_SCREEN', 'TECH_SCREEN'])
 * @param {number} startTimestamp - Starting timestamp for the CREATED event
 * @returns {Array} Array of events representing the complete journey
 *
 * @example
 * const events = createFullJourney(1, ['RECRUITER_SCREEN', 'TECH_SCREEN', 'OFFER_RECEIVED']);
 */
export const createFullJourney = (applicationId, stages, startTimestamp = 1737024600) => {
  const events = [
    createCreatedEvent({
      id: 0,
      applicationId,
      timestamp: startTimestamp,
      createdAt: new Date(startTimestamp * 1000).toISOString(),
    }),
  ];

  let previousStatus = 'APPLIED';
  let timestamp = startTimestamp;

  stages.forEach((stage, index) => {
    timestamp += 86400; // Add 1 day between events
    events.push(
      createStatusChangedEvent(previousStatus, stage, {
        id: index + 1,
        applicationId,
        timestamp,
        createdAt: new Date(timestamp * 1000).toISOString(),
      })
    );
    previousStatus = stage;
  });

  return events;
};
