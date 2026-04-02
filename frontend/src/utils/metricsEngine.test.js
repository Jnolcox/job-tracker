/**
 * @file metricsEngine.test.js
 * @description Tests for the metricsEngine utility functions
 *
 * Tests cover:
 * - buildApplicationJourneys for processing audit trail events
 * - calculateTrueResponseRate for response rate calculations
 * - calculateTrueInterviewRate for interview rate calculations
 * - calculateTrueOfferRate for offer rate calculations
 * - calculateAvgDaysToResponse for average response time
 * - calculateStageConversions for funnel metrics
 * - getAllMetrics for the combined metrics output
 */

import {
  buildApplicationJourneys,
  calculateTrueResponseRate,
  calculateTrueInterviewRate,
  calculateTrueOfferRate,
  calculateAvgDaysToResponse,
  calculateStageConversions,
  getAllMetrics,
  RESPONSE_STATUSES,
  INTERVIEW_STATUSES,
  OFFER_STATUSES,
  TECHNICAL_STATUSES,
} from './metricsEngine';
import { createMockEvent, createJourneyEvents } from '../test-utils/factories';

describe('metricsEngine', () => {
  // Using shared factories from test-utils/factories
  // createMockEvent and createJourneyEvents are imported at the top

  // Local alias for backward compatibility
  const createEvent = createMockEvent;

  describe('Status Constants', () => {
    it('should export RESPONSE_STATUSES containing all response statuses', () => {
      expect(RESPONSE_STATUSES).toContain('RECRUITER_SCREEN');
      expect(RESPONSE_STATUSES).toContain('TECH_SCREEN');
      expect(RESPONSE_STATUSES).toContain('REJECTED');
      expect(RESPONSE_STATUSES).toContain('OFFER_RECEIVED');
      expect(RESPONSE_STATUSES).not.toContain('WITHDRAWN');
      expect(RESPONSE_STATUSES).not.toContain('GHOSTED');
    });

    it('should export INTERVIEW_STATUSES containing all interview stages', () => {
      expect(INTERVIEW_STATUSES).toContain('RECRUITER_SCREEN');
      expect(INTERVIEW_STATUSES).toContain('TECH_SCREEN');
      expect(INTERVIEW_STATUSES).toContain('TAKE_HOME');
      expect(INTERVIEW_STATUSES).toContain('SYSTEM_DESIGN');
      expect(INTERVIEW_STATUSES).toContain('TECHNICAL_I');
      expect(INTERVIEW_STATUSES).toContain('TECHNICAL_II');
      expect(INTERVIEW_STATUSES).toContain('REFERENCE_CHECK');
    });

    it('should export OFFER_STATUSES containing all offer stages', () => {
      expect(OFFER_STATUSES).toContain('OFFER_RECEIVED');
      expect(OFFER_STATUSES).toContain('NEGOTIATING');
      expect(OFFER_STATUSES).toContain('OFFER_ACCEPTED');
      expect(OFFER_STATUSES).toContain('OFFER_DECLINED');
      expect(OFFER_STATUSES).toContain('OFFER_RESCINDED');
    });

    it('should export TECHNICAL_STATUSES containing technical interview stages', () => {
      expect(TECHNICAL_STATUSES).toContain('TECH_SCREEN');
      expect(TECHNICAL_STATUSES).toContain('TAKE_HOME');
      expect(TECHNICAL_STATUSES).toContain('SYSTEM_DESIGN');
      expect(TECHNICAL_STATUSES).toContain('TECHNICAL_I');
      expect(TECHNICAL_STATUSES).toContain('TECHNICAL_II');
      expect(TECHNICAL_STATUSES).not.toContain('RECRUITER_SCREEN');
    });
  });

  describe('buildApplicationJourneys', () => {
    it.each([
      ['empty array', []],
      ['null', null],
      ['undefined', undefined],
    ])('should return empty Map for %s input', (_, input) => {
      const result = buildApplicationJourneys(input);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should group events by applicationId', () => {
      const events = [
        createEvent({ applicationId: 1, newValue: 'RECRUITER_SCREEN' }),
        createEvent({ applicationId: 2, newValue: 'REJECTED' }),
        createEvent({ applicationId: 1, newValue: 'TECH_SCREEN', oldValue: 'RECRUITER_SCREEN' }),
      ];

      const result = buildApplicationJourneys(events);

      expect(result.size).toBe(2);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
    });

    it('should track all statuses reached in statusesReached Set', () => {
      const events = [
        createEvent({ applicationId: 1, oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN' }),
        createEvent({ applicationId: 1, oldValue: 'RECRUITER_SCREEN', newValue: 'TECH_SCREEN' }),
        createEvent({ applicationId: 1, oldValue: 'TECH_SCREEN', newValue: 'OFFER_RECEIVED' }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      expect(journey.statusesReached).toBeInstanceOf(Set);
      expect(journey.statusesReached.has('RECRUITER_SCREEN')).toBe(true);
      expect(journey.statusesReached.has('TECH_SCREEN')).toBe(true);
      expect(journey.statusesReached.has('OFFER_RECEIVED')).toBe(true);
    });

    it('should include all events in the events array', () => {
      const events = [
        createEvent({ applicationId: 1, id: 1, newValue: 'RECRUITER_SCREEN' }),
        createEvent({ applicationId: 1, id: 2, oldValue: 'RECRUITER_SCREEN', newValue: 'TECH_SCREEN' }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      expect(journey.events).toHaveLength(2);
      expect(journey.events[0].id).toBe(1);
      expect(journey.events[1].id).toBe(2);
    });

    it('should calculate firstResponseDate from STATUS_CHANGED events', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'STATUS_CHANGED',
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          timestamp: 1737024600,
        }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      expect(journey.firstResponseDate).toBeInstanceOf(Date);
    });

    it('should set firstResponseDate to null when no response events exist', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          fieldName: null,
          oldValue: null,
          newValue: null,
        }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      expect(journey.firstResponseDate).toBeNull();
    });

    it('should handle ISO string timestamps', () => {
      const events = [
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          timestamp: '2025-01-16T10:30:00Z',
        }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      expect(journey.firstResponseDate).toBeInstanceOf(Date);
    });

    it('should track the earliest response date as firstResponseDate', () => {
      const events = [
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          timestamp: 1737200000, // Later
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'REJECTED', // Edge case: multiple from APPLIED (shouldn't happen but handle gracefully)
          timestamp: 1737024600, // Earlier
        }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      // Should use the earliest timestamp
      expect(journey.firstResponseDate.getTime()).toBeLessThan(new Date(1737200000 * 1000).getTime());
    });

    it('should only count response to RESPONSE_STATUSES for firstResponseDate', () => {
      const events = [
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'WITHDRAWN', // Not a response status
          timestamp: 1737024600,
        }),
      ];

      const result = buildApplicationJourneys(events);
      const journey = result.get(1);

      // WITHDRAWN is not a response, so firstResponseDate should be null
      expect(journey.firstResponseDate).toBeNull();
    });
  });

  describe('calculateTrueResponseRate', () => {
    it.each([
      ['empty journeys with totalApps > 0', new Map(), 10],
      ['empty journeys with totalApps = 0', new Map(), 0],
    ])('should return 0 for %s', (_, journeys, totalApps) => {
      const result = calculateTrueResponseRate(journeys, totalApps);
      expect(result).toBe(0);
    });

    it('should calculate correct percentage for applications with responses', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN']), events: [], firstResponseDate: new Date() }],
        [2, { statusesReached: new Set(['REJECTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueResponseRate(journeys, 4);

      expect(result).toBe(50); // 2 out of 4 apps got responses
    });

    it('should not count WITHDRAWN as a response', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['WITHDRAWN']), events: [], firstResponseDate: null }],
      ]);

      const result = calculateTrueResponseRate(journeys, 1);

      expect(result).toBe(0);
    });

    it('should not count GHOSTED as a response', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['GHOSTED']), events: [], firstResponseDate: null }],
      ]);

      const result = calculateTrueResponseRate(journeys, 1);

      expect(result).toBe(0);
    });

    it('should count REJECTED as a response', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['REJECTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueResponseRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should count all OFFER_* statuses as responses', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['OFFER_RECEIVED']), events: [], firstResponseDate: new Date() }],
        [2, { statusesReached: new Set(['OFFER_ACCEPTED']), events: [], firstResponseDate: new Date() }],
        [3, { statusesReached: new Set(['OFFER_DECLINED']), events: [], firstResponseDate: new Date() }],
        [4, { statusesReached: new Set(['OFFER_RESCINDED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueResponseRate(journeys, 4);

      expect(result).toBe(100);
    });

    it('should return whole number percentages', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueResponseRate(journeys, 3);

      // 1/3 = 33.333... should return a number (could be rounded or not based on implementation)
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(33.33, 1);
    });
  });

  describe('calculateTrueInterviewRate', () => {
    it.each([
      ['empty journeys with totalApps > 0', new Map(), 10],
      ['empty journeys with totalApps = 0', new Map(), 0],
    ])('should return 0 for %s', (_, journeys, totalApps) => {
      const result = calculateTrueInterviewRate(journeys, totalApps);
      expect(result).toBe(0);
    });

    it('should count RECRUITER_SCREEN as interview', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueInterviewRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should count all interview stages', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['TECH_SCREEN']), events: [], firstResponseDate: new Date() }],
        [2, { statusesReached: new Set(['TAKE_HOME']), events: [], firstResponseDate: new Date() }],
        [3, { statusesReached: new Set(['SYSTEM_DESIGN']), events: [], firstResponseDate: new Date() }],
        [4, { statusesReached: new Set(['TECHNICAL_I']), events: [], firstResponseDate: new Date() }],
        [5, { statusesReached: new Set(['TECHNICAL_II']), events: [], firstResponseDate: new Date() }],
        [6, { statusesReached: new Set(['REFERENCE_CHECK']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueInterviewRate(journeys, 6);

      expect(result).toBe(100);
    });

    it('should not count REJECTED as interview', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['REJECTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueInterviewRate(journeys, 1);

      expect(result).toBe(0);
    });

    it('should not count OFFER_RECEIVED as interview (unless interview was reached)', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['OFFER_RECEIVED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueInterviewRate(journeys, 1);

      // OFFER_RECEIVED alone does not count as interview
      expect(result).toBe(0);
    });

    it('should count application with both interview and offer stages', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['TECH_SCREEN', 'OFFER_RECEIVED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueInterviewRate(journeys, 1);

      expect(result).toBe(100);
    });
  });

  describe('calculateTrueOfferRate', () => {
    it.each([
      ['empty journeys with totalApps > 0', new Map(), 10],
      ['empty journeys with totalApps = 0', new Map(), 0],
    ])('should return 0 for %s', (_, journeys, totalApps) => {
      const result = calculateTrueOfferRate(journeys, totalApps);
      expect(result).toBe(0);
    });

    it('should count OFFER_RECEIVED as offer', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['OFFER_RECEIVED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueOfferRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should count NEGOTIATING as offer', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['NEGOTIATING']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueOfferRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should count OFFER_ACCEPTED as offer', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['OFFER_ACCEPTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueOfferRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should count OFFER_DECLINED as offer', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['OFFER_DECLINED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueOfferRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should count OFFER_RESCINDED as offer', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['OFFER_RESCINDED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueOfferRate(journeys, 1);

      expect(result).toBe(100);
    });

    it('should not count interview stages as offer', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN', 'TECH_SCREEN']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateTrueOfferRate(journeys, 1);

      expect(result).toBe(0);
    });
  });

  describe('calculateAvgDaysToResponse', () => {
    it('should return null for empty journeys', () => {
      const journeys = new Map();

      const result = calculateAvgDaysToResponse(journeys);

      expect(result).toBeNull();
    });

    it('should return null when no journeys have firstResponseDate', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['WITHDRAWN']), events: [], firstResponseDate: null }],
      ]);

      const result = calculateAvgDaysToResponse(journeys);

      expect(result).toBeNull();
    });

    it('should calculate average days from APPLIED to first response', () => {
      // Application created at timestamp 1737024600 (Jan 16, 2025 10:30 UTC)
      // Response at timestamp 1737024600 + 2 days = 1737197400
      const appliedTimestamp = 1737024600;
      const responseTimestamp = appliedTimestamp + (2 * 86400); // 2 days later

      const events = [
        {
          id: 1,
          applicationId: 1,
          eventType: 'STATUS_CHANGED',
          fieldName: 'status',
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          timestamp: responseTimestamp,
        },
      ];

      const journeys = buildApplicationJourneys(events);

      // We need to also know when the application was created (APPLIED)
      // The firstResponseDate is calculated from the STATUS_CHANGED event
      // For avgDaysToResponse, we need the APPLIED timestamp

      // Add CREATED event to establish when the application started
      const eventsWithCreated = [
        {
          id: 0,
          applicationId: 1,
          eventType: 'CREATED',
          fieldName: null,
          oldValue: null,
          newValue: null,
          timestamp: appliedTimestamp,
        },
        ...events,
      ];

      const journeysWithCreated = buildApplicationJourneys(eventsWithCreated);
      const result = calculateAvgDaysToResponse(journeysWithCreated);

      expect(result).toBeCloseTo(2, 1);
    });

    it('should average across multiple applications', () => {
      // App 1: 2 days to response
      // App 2: 4 days to response
      // Average: 3 days
      const app1AppliedTime = 1737024600;
      const app2AppliedTime = 1737024600;

      const events = [
        // App 1: Created, then response 2 days later
        { id: 1, applicationId: 1, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: app1AppliedTime },
        { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: app1AppliedTime + (2 * 86400) },
        // App 2: Created, then response 4 days later
        { id: 3, applicationId: 2, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: app2AppliedTime },
        { id: 4, applicationId: 2, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'REJECTED', timestamp: app2AppliedTime + (4 * 86400) },
      ];

      const journeys = buildApplicationJourneys(events);
      const result = calculateAvgDaysToResponse(journeys);

      expect(result).toBeCloseTo(3, 1);
    });

    it('should exclude applications without response', () => {
      const appliedTime = 1737024600;

      const events = [
        // App 1: Got a response in 2 days
        { id: 1, applicationId: 1, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: appliedTime },
        { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: appliedTime + (2 * 86400) },
        // App 2: Only created, no response (withdrawn by user)
        { id: 3, applicationId: 2, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: appliedTime },
        { id: 4, applicationId: 2, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'WITHDRAWN', timestamp: appliedTime + (10 * 86400) },
      ];

      const journeys = buildApplicationJourneys(events);
      const result = calculateAvgDaysToResponse(journeys);

      // Only app 1 counts, so average is 2 days
      expect(result).toBeCloseTo(2, 1);
    });
  });

  describe('calculateStageConversions', () => {
    it('should return all zeros for empty journeys', () => {
      const journeys = new Map();

      const result = calculateStageConversions(journeys, 10);

      expect(result.appliedToScreen).toBe(0);
      expect(result.screenToTech).toBe(0);
      expect(result.techToOffer).toBe(0);
    });

    it('should return all zeros when totalApps is 0', () => {
      const journeys = new Map();

      const result = calculateStageConversions(journeys, 0);

      expect(result.appliedToScreen).toBe(0);
      expect(result.screenToTech).toBe(0);
      expect(result.techToOffer).toBe(0);
    });

    it('should calculate appliedToScreen as percentage reaching RECRUITER_SCREEN', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN']), events: [], firstResponseDate: new Date() }],
        [2, { statusesReached: new Set(['REJECTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateStageConversions(journeys, 4);

      expect(result.appliedToScreen).toBe(25); // 1 out of 4
    });

    it('should calculate screenToTech based on apps that reached RECRUITER_SCREEN', () => {
      const journeys = new Map([
        // App 1: Reached recruiter screen and tech screen
        [1, { statusesReached: new Set(['RECRUITER_SCREEN', 'TECH_SCREEN']), events: [], firstResponseDate: new Date() }],
        // App 2: Only reached recruiter screen
        [2, { statusesReached: new Set(['RECRUITER_SCREEN']), events: [], firstResponseDate: new Date() }],
        // App 3: Rejected without interview
        [3, { statusesReached: new Set(['REJECTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateStageConversions(journeys, 3);

      // 2 out of 3 apps reached RECRUITER_SCREEN
      // 1 out of those 2 went to tech
      expect(result.screenToTech).toBe(50);
    });

    it('should calculate techToOffer based on apps that reached technical stage', () => {
      const journeys = new Map([
        // App 1: Reached tech and offer
        [1, { statusesReached: new Set(['TECH_SCREEN', 'OFFER_RECEIVED']), events: [], firstResponseDate: new Date() }],
        // App 2: Only reached tech
        [2, { statusesReached: new Set(['TAKE_HOME']), events: [], firstResponseDate: new Date() }],
        // App 3: Reached tech (different stage) and offer
        [3, { statusesReached: new Set(['SYSTEM_DESIGN', 'OFFER_ACCEPTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateStageConversions(journeys, 3);

      // 3 apps reached technical stage
      // 2 out of 3 went to offer
      expect(result.techToOffer).toBeCloseTo(66.67, 1);
    });

    it('should return 0 for screenToTech when no apps reached screen', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['REJECTED']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateStageConversions(journeys, 1);

      expect(result.screenToTech).toBe(0);
    });

    it('should return 0 for techToOffer when no apps reached tech', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateStageConversions(journeys, 1);

      expect(result.techToOffer).toBe(0);
    });

    it('should count any technical stage for screenToTech', () => {
      const journeys = new Map([
        [1, { statusesReached: new Set(['RECRUITER_SCREEN', 'TAKE_HOME']), events: [], firstResponseDate: new Date() }],
        [2, { statusesReached: new Set(['RECRUITER_SCREEN', 'SYSTEM_DESIGN']), events: [], firstResponseDate: new Date() }],
        [3, { statusesReached: new Set(['RECRUITER_SCREEN', 'TECHNICAL_I']), events: [], firstResponseDate: new Date() }],
      ]);

      const result = calculateStageConversions(journeys, 3);

      expect(result.screenToTech).toBe(100);
    });
  });

  describe('getAllMetrics', () => {
    const expectedDefaultMetrics = {
      trueResponseRate: 0,
      trueInterviewRate: 0,
      trueOfferRate: 0,
      avgDaysToResponse: null,
      stageConversions: {
        appliedToScreen: 0,
        screenToTech: 0,
        techToOffer: 0,
      },
    };

    it.each([
      ['empty arrays', [], []],
      ['null inputs', null, null],
      ['undefined inputs', undefined, undefined],
    ])('should return all zeros/null for %s', (_, events, apps) => {
      const result = getAllMetrics(events, apps);

      expect(result.trueResponseRate).toBe(expectedDefaultMetrics.trueResponseRate);
      expect(result.trueInterviewRate).toBe(expectedDefaultMetrics.trueInterviewRate);
      expect(result.trueOfferRate).toBe(expectedDefaultMetrics.trueOfferRate);
      expect(result.avgDaysToResponse).toBe(expectedDefaultMetrics.avgDaysToResponse);
      expect(result.stageConversions).toEqual(expectedDefaultMetrics.stageConversions);
    });

    it('should calculate all metrics correctly', () => {
      const appliedTime = 1737024600;

      const events = [
        // App 1: Full journey to offer (3 days to first response)
        { id: 1, applicationId: 1, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: appliedTime },
        { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: appliedTime + (3 * 86400) },
        { id: 3, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'RECRUITER_SCREEN', newValue: 'TECH_SCREEN', timestamp: appliedTime + (7 * 86400) },
        { id: 4, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'TECH_SCREEN', newValue: 'OFFER_RECEIVED', timestamp: appliedTime + (14 * 86400) },

        // App 2: Rejected at recruiter screen (5 days to first response)
        { id: 5, applicationId: 2, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: appliedTime },
        { id: 6, applicationId: 2, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: appliedTime + (5 * 86400) },
        { id: 7, applicationId: 2, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'RECRUITER_SCREEN', newValue: 'REJECTED', timestamp: appliedTime + (10 * 86400) },

        // App 3: No response (only created)
        { id: 8, applicationId: 3, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: appliedTime },
      ];

      const apps = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const result = getAllMetrics(events, apps);

      // 2 out of 3 got responses (app 1 and app 2)
      expect(result.trueResponseRate).toBeCloseTo(66.67, 1);

      // 2 out of 3 reached interview (app 1 and app 2 both reached RECRUITER_SCREEN)
      expect(result.trueInterviewRate).toBeCloseTo(66.67, 1);

      // 1 out of 3 got offer (app 1)
      expect(result.trueOfferRate).toBeCloseTo(33.33, 1);

      // Average days: (3 + 5) / 2 = 4 days
      expect(result.avgDaysToResponse).toBeCloseTo(4, 1);

      // Conversions
      expect(result.stageConversions.appliedToScreen).toBeCloseTo(66.67, 1); // 2/3 reached screen
      expect(result.stageConversions.screenToTech).toBe(50); // 1/2 of screened went to tech
      expect(result.stageConversions.techToOffer).toBe(100); // 1/1 of tech went to offer
    });

    it('should use apps.length for totalApps', () => {
      const events = [
        { id: 1, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: 1737024600 },
      ];

      // 10 total apps, only 1 has events
      const apps = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

      const result = getAllMetrics(events, apps);

      // 1 out of 10 got response
      expect(result.trueResponseRate).toBe(10);
    });
  });

  describe('Edge cases and complex scenarios', () => {
    it('should handle application that skips stages', () => {
      // Some companies skip recruiter screen and go straight to tech
      const events = [
        { id: 1, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'TECH_SCREEN', timestamp: 1737024600 },
      ];

      const journeys = buildApplicationJourneys(events);
      const journey = journeys.get(1);

      expect(journey.statusesReached.has('TECH_SCREEN')).toBe(true);
      expect(journey.firstResponseDate).not.toBeNull();
    });

    it('should handle application with multiple status changes on same day', () => {
      const baseTime = 1737024600;
      const events = [
        { id: 1, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: baseTime },
        { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'RECRUITER_SCREEN', newValue: 'TECH_SCREEN', timestamp: baseTime + 3600 }, // 1 hour later
      ];

      const journeys = buildApplicationJourneys(events);
      const journey = journeys.get(1);

      expect(journey.statusesReached.has('RECRUITER_SCREEN')).toBe(true);
      expect(journey.statusesReached.has('TECH_SCREEN')).toBe(true);
    });

    it('should handle UPDATED events (non-status changes)', () => {
      const events = [
        { id: 1, applicationId: 1, eventType: 'UPDATED', fieldName: 'notes', oldValue: 'Old note', newValue: 'New note', timestamp: 1737024600 },
        { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: 1737111000 },
      ];

      const journeys = buildApplicationJourneys(events);
      const journey = journeys.get(1);

      // Should still track the status change
      expect(journey.statusesReached.has('RECRUITER_SCREEN')).toBe(true);
      // UPDATED events should be in events array
      expect(journey.events).toHaveLength(2);
    });

    it('should handle applications with only CREATED event', () => {
      const events = [
        { id: 1, applicationId: 1, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: 1737024600 },
      ];

      const journeys = buildApplicationJourneys(events);
      const journey = journeys.get(1);

      expect(journey.statusesReached.size).toBe(0);
      expect(journey.firstResponseDate).toBeNull();
      expect(journey.events).toHaveLength(1);
    });

    it('should correctly identify first response when application goes through many stages', () => {
      const baseTime = 1737024600;
      const events = [
        { id: 1, applicationId: 1, eventType: 'CREATED', fieldName: null, oldValue: null, newValue: null, timestamp: baseTime },
        { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: baseTime + (1 * 86400) },
        { id: 3, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'RECRUITER_SCREEN', newValue: 'TECH_SCREEN', timestamp: baseTime + (3 * 86400) },
        { id: 4, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'TECH_SCREEN', newValue: 'TAKE_HOME', timestamp: baseTime + (5 * 86400) },
        { id: 5, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'TAKE_HOME', newValue: 'SYSTEM_DESIGN', timestamp: baseTime + (10 * 86400) },
        { id: 6, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'SYSTEM_DESIGN', newValue: 'OFFER_RECEIVED', timestamp: baseTime + (15 * 86400) },
      ];

      const journeys = buildApplicationJourneys(events);
      const journey = journeys.get(1);

      // First response should be at day 1 (RECRUITER_SCREEN)
      const expectedFirstResponseTime = (baseTime + (1 * 86400)) * 1000;
      expect(journey.firstResponseDate.getTime()).toBe(expectedFirstResponseTime);
    });
  });
});
