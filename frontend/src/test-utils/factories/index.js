/**
 * @file index.js
 * @description Re-exports all factory functions for convenient importing.
 *
 * @example
 * import {
 *   createMockApplication,
 *   createMockEvent,
 *   createJourneyEvents,
 * } from '../../test-utils/factories';
 */

export {
  createMockApplication,
  createMockBackendApplication,
  createNewApplication,
  createExistingApplication,
  generateMockApplications,
  resetApplicationIdCounter,
} from './application';

export {
  createMockEvent,
  createEvent,
  createJourneyEvents,
  createApplicationCreatedEvent,
  createCreatedEvent,
  createStatusChangedEvent,
  createFieldUpdatedEvent,
  createInterviewScheduledEvent,
  createNoteAddedEvent,
  createFullJourney,
  resetEventIdCounter,
} from './event';
