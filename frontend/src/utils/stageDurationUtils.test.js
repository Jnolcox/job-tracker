/**
 * @file stageDurationUtils.test.js
 * @description Unit tests for stage duration calculation utilities.
 */

import {
  getTimeInStageFromAudit,
  getStageDurations,
  getAverageStageTime,
  getBottleneckStages,
  getAllStatusDurations,
} from './stageDurationUtils';

describe('stageDurationUtils', () => {
  // Helper to create mock events
  const createEvent = (overrides = {}) => ({
    id: 1,
    applicationId: 1,
    eventType: 'STATUS_CHANGED',
    fieldName: 'status',
    oldValue: 'APPLIED',
    newValue: 'RECRUITER_SCREEN',
    createdAt: '2025-01-15T10:00:00Z',
    ...overrides,
  });

  describe('getTimeInStageFromAudit', () => {
    it('returns 0 for null or missing app', () => {
      expect(getTimeInStageFromAudit(null, [])).toBe(0);
      expect(getTimeInStageFromAudit(undefined, [])).toBe(0);
    });

    it('returns 0 when no events exist', () => {
      const app = { id: 1, status: 'APPLIED', statusChangedAt: '2025-01-15T10:00:00Z' };
      expect(getTimeInStageFromAudit(app, [])).toBe(0);
      expect(getTimeInStageFromAudit(app, null)).toBe(0);
    });

    it('calculates time from the most recent status change to now', () => {
      const app = { id: 1, status: 'RECRUITER_SCREEN' };
      const events = [
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-10T10:00:00Z',
        }),
      ];

      // Mock current date to be 5 days later
      const originalDate = Date;
      const mockDate = new Date('2025-01-15T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getTimeInStageFromAudit(app, events);
      expect(result).toBe(5);

      global.Date = originalDate;
    });

    it('uses the latest event for the current status', () => {
      const app = { id: 1, status: 'TECHNICAL_I' };
      const events = [
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'TECHNICAL_I',
          createdAt: '2025-01-10T10:00:00Z',
        }),
      ];

      const originalDate = Date;
      const mockDate = new Date('2025-01-13T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getTimeInStageFromAudit(app, events);
      expect(result).toBe(3);

      global.Date = originalDate;
    });

    it('filters events to only those for the given application', () => {
      const app = { id: 2, status: 'RECRUITER_SCREEN' };
      const events = [
        createEvent({
          applicationId: 1,
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 2,
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-10T10:00:00Z',
        }),
      ];

      const originalDate = Date;
      const mockDate = new Date('2025-01-15T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getTimeInStageFromAudit(app, events);
      expect(result).toBe(5);

      global.Date = originalDate;
    });

    it('handles epoch timestamp format', () => {
      const app = { id: 1, status: 'RECRUITER_SCREEN' };
      const events = [
        createEvent({
          applicationId: 1,
          newValue: 'RECRUITER_SCREEN',
          createdAt: 1736503200, // Jan 10, 2025 10:00 UTC as epoch seconds
        }),
      ];

      const originalDate = Date;
      const mockDate = new Date('2025-01-15T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getTimeInStageFromAudit(app, events);
      expect(result).toBe(5);

      global.Date = originalDate;
    });
  });

  describe('getStageDurations', () => {
    it('returns empty array for null or missing inputs', () => {
      expect(getStageDurations(null, [])).toEqual([]);
      expect(getStageDurations(1, null)).toEqual([]);
      expect(getStageDurations(1, [])).toEqual([]);
    });

    it('calculates durations for each stage transition', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          oldValue: null,
          newValue: null,
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'TECHNICAL_I',
          createdAt: '2025-01-10T10:00:00Z',
        }),
      ];

      // Set current date for active stage calculation
      const originalDate = Date;
      const mockDate = new Date('2025-01-15T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getStageDurations(1, events);

      expect(result).toHaveLength(3);

      // APPLIED stage: Jan 1 to Jan 5
      expect(result[0].status).toBe('APPLIED');
      expect(result[0].durationDays).toBe(4);
      expect(result[0].isCurrent).toBe(false);

      // RECRUITER_SCREEN stage: Jan 5 to Jan 10
      expect(result[1].status).toBe('RECRUITER_SCREEN');
      expect(result[1].durationDays).toBe(5);
      expect(result[1].isCurrent).toBe(false);

      // TECHNICAL_I stage: Jan 10 to now (Jan 15)
      expect(result[2].status).toBe('TECHNICAL_I');
      expect(result[2].durationDays).toBe(5);
      expect(result[2].isCurrent).toBe(true);

      global.Date = originalDate;
    });

    it('filters events to only the specified application', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 2,
          eventType: 'CREATED',
          createdAt: '2025-01-02T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
      ];

      const originalDate = Date;
      const mockDate = new Date('2025-01-10T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getStageDurations(1, events);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('APPLIED');
      expect(result[1].status).toBe('RECRUITER_SCREEN');

      global.Date = originalDate;
    });

    it('handles single CREATED event only', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          oldValue: null,
          newValue: null,
          createdAt: '2025-01-01T10:00:00Z',
        }),
      ];

      const originalDate = Date;
      const mockDate = new Date('2025-01-06T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getStageDurations(1, events);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('APPLIED');
      expect(result[0].durationDays).toBe(5);
      expect(result[0].isCurrent).toBe(true);

      global.Date = originalDate;
    });
  });

  describe('getAverageStageTime', () => {
    it('returns empty object for null or empty events', () => {
      expect(getAverageStageTime(null)).toEqual({});
      expect(getAverageStageTime([])).toEqual({});
    });

    it('calculates average time per stage across all applications', () => {
      const events = [
        // App 1: APPLIED 4 days, RECRUITER_SCREEN 5 days
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'REJECTED',
          createdAt: '2025-01-10T10:00:00Z',
        }),
        // App 2: APPLIED 6 days, RECRUITER_SCREEN 3 days
        createEvent({
          applicationId: 2,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 2,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-07T10:00:00Z',
        }),
        createEvent({
          applicationId: 2,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'REJECTED',
          createdAt: '2025-01-10T10:00:00Z',
        }),
      ];

      const result = getAverageStageTime(events);

      // APPLIED avg: (4 + 6) / 2 = 5 days
      expect(result.APPLIED).toBe(5);
      // RECRUITER_SCREEN avg: (5 + 3) / 2 = 4 days
      expect(result.RECRUITER_SCREEN).toBe(4);
    });

    it('handles applications with different stage paths', () => {
      const events = [
        // App 1: APPLIED -> RECRUITER_SCREEN -> REJECTED
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'REJECTED',
          createdAt: '2025-01-10T10:00:00Z',
        }),
        // App 2: APPLIED -> GHOSTED (never got to screen)
        createEvent({
          applicationId: 2,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 2,
          oldValue: 'APPLIED',
          newValue: 'GHOSTED',
          createdAt: '2025-01-15T10:00:00Z',
        }),
      ];

      const result = getAverageStageTime(events);

      // APPLIED avg: (4 + 14) / 2 = 9 days
      expect(result.APPLIED).toBe(9);
      // RECRUITER_SCREEN only from app 1: 5 days
      expect(result.RECRUITER_SCREEN).toBe(5);
    });
  });

  describe('getBottleneckStages', () => {
    it('returns empty array for null or empty events', () => {
      expect(getBottleneckStages(null)).toEqual([]);
      expect(getBottleneckStages([])).toEqual([]);
    });

    it('returns stages sorted by average duration descending', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z', // 4 days in APPLIED
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'TECHNICAL_I',
          createdAt: '2025-01-15T10:00:00Z', // 10 days in RECRUITER_SCREEN
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'TECHNICAL_I',
          newValue: 'OFFER_RECEIVED',
          createdAt: '2025-01-17T10:00:00Z', // 2 days in TECHNICAL_I
        }),
      ];

      const result = getBottleneckStages(events);

      expect(result[0].status).toBe('RECRUITER_SCREEN');
      expect(result[0].avgDays).toBe(10);
      expect(result[1].status).toBe('APPLIED');
      expect(result[1].avgDays).toBe(4);
      expect(result[2].status).toBe('TECHNICAL_I');
      expect(result[2].avgDays).toBe(2);
    });

    it('limits results to specified count', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'RECRUITER_SCREEN',
          newValue: 'TECHNICAL_I',
          createdAt: '2025-01-15T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'TECHNICAL_I',
          newValue: 'OFFER_RECEIVED',
          createdAt: '2025-01-17T10:00:00Z',
        }),
      ];

      const result = getBottleneckStages(events, 2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getAllStatusDurations', () => {
    it('returns empty map for null or empty events', () => {
      expect(getAllStatusDurations(null).size).toBe(0);
      expect(getAllStatusDurations([]).size).toBe(0);
    });

    it('returns a map of applicationId to stage durations', () => {
      const events = [
        createEvent({
          applicationId: 1,
          eventType: 'CREATED',
          createdAt: '2025-01-01T10:00:00Z',
        }),
        createEvent({
          applicationId: 1,
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-05T10:00:00Z',
        }),
        createEvent({
          applicationId: 2,
          eventType: 'CREATED',
          createdAt: '2025-01-02T10:00:00Z',
        }),
      ];

      const originalDate = Date;
      const mockDate = new Date('2025-01-10T10:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) return mockDate;
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };

      const result = getAllStatusDurations(events);

      expect(result.size).toBe(2);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);

      const app1Durations = result.get(1);
      expect(app1Durations).toHaveLength(2);

      const app2Durations = result.get(2);
      expect(app2Durations).toHaveLength(1);

      global.Date = originalDate;
    });
  });
});
