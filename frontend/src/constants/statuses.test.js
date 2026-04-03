/**
 * @file statuses.test.js
 * @description Tests for consolidated application status constants.
 */

import {
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_GROUPS,
  RESPONSE_STATUSES,
  INTERVIEW_STATUSES,
  OFFER_STATUSES,
  TECHNICAL_STATUSES,
  isStatusInGroup,
  isTerminalStatus,
} from './statuses';

describe('Application Status Constants', () => {
  describe('APPLICATION_STATUS object', () => {
    it('should contain all expected status keys', () => {
      expect(APPLICATION_STATUS.APPLIED).toBe('APPLIED');
      expect(APPLICATION_STATUS.RECRUITER_SCREEN).toBe('RECRUITER_SCREEN');
      expect(APPLICATION_STATUS.TECH_SCREEN).toBe('TECH_SCREEN');
      expect(APPLICATION_STATUS.TAKE_HOME).toBe('TAKE_HOME');
      expect(APPLICATION_STATUS.SYSTEM_DESIGN).toBe('SYSTEM_DESIGN');
      expect(APPLICATION_STATUS.TECHNICAL_I).toBe('TECHNICAL_I');
      expect(APPLICATION_STATUS.TECHNICAL_II).toBe('TECHNICAL_II');
      expect(APPLICATION_STATUS.REFERENCE_CHECK).toBe('REFERENCE_CHECK');
      expect(APPLICATION_STATUS.OFFER_RECEIVED).toBe('OFFER_RECEIVED');
      expect(APPLICATION_STATUS.NEGOTIATING).toBe('NEGOTIATING');
      expect(APPLICATION_STATUS.OFFER_ACCEPTED).toBe('OFFER_ACCEPTED');
      expect(APPLICATION_STATUS.OFFER_DECLINED).toBe('OFFER_DECLINED');
      expect(APPLICATION_STATUS.OFFER_RESCINDED).toBe('OFFER_RESCINDED');
      expect(APPLICATION_STATUS.REJECTED).toBe('REJECTED');
      expect(APPLICATION_STATUS.WITHDRAWN).toBe('WITHDRAWN');
      expect(APPLICATION_STATUS.ON_HOLD).toBe('ON_HOLD');
      expect(APPLICATION_STATUS.WAITING_FOR_RESPONSE).toBe('WAITING_FOR_RESPONSE');
      expect(APPLICATION_STATUS.GHOSTED).toBe('GHOSTED');
    });
  });

  describe('APPLICATION_STATUSES array', () => {
    it('should contain all status values', () => {
      expect(APPLICATION_STATUSES).toContain('APPLIED');
      expect(APPLICATION_STATUSES).toContain('RECRUITER_SCREEN');
      expect(APPLICATION_STATUSES).toContain('REJECTED');
      expect(APPLICATION_STATUSES).toContain('GHOSTED');
    });

    it('should match APPLICATION_STATUS object values', () => {
      const objectValues = Object.values(APPLICATION_STATUS);
      expect(APPLICATION_STATUSES.length).toBe(objectValues.length);
      APPLICATION_STATUSES.forEach(status => {
        expect(objectValues).toContain(status);
      });
    });
  });

  describe('STATUS_LABELS', () => {
    it('should have human-readable labels for all statuses', () => {
      APPLICATION_STATUSES.forEach(status => {
        expect(STATUS_LABELS[status]).toBeDefined();
        expect(typeof STATUS_LABELS[status]).toBe('string');
        expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
      });
    });

    it('should have correct label for specific statuses', () => {
      expect(STATUS_LABELS.APPLIED).toBe('Applied');
      expect(STATUS_LABELS.RECRUITER_SCREEN).toBe('Recruiter Screen');
      expect(STATUS_LABELS.TECH_SCREEN).toBe('Tech Screen');
      expect(STATUS_LABELS.OFFER_RECEIVED).toBe('Offer Received');
    });
  });

  describe('STATUS_GROUPS', () => {
    it('should contain expected groups', () => {
      expect(STATUS_GROUPS.REJECTED).toBeDefined();
      expect(STATUS_GROUPS.WITHDRAWN).toBeDefined();
      expect(STATUS_GROUPS.WAITING).toBeDefined();
      expect(STATUS_GROUPS.OFFER).toBeDefined();
      expect(STATUS_GROUPS.TECHNICAL).toBeDefined();
      expect(STATUS_GROUPS.INTERVIEWING).toBeDefined();
    });

    it('should have REJECTED group contain rejection-related statuses', () => {
      expect(STATUS_GROUPS.REJECTED).toContain('REJECTED');
      expect(STATUS_GROUPS.REJECTED).toContain('OFFER_DECLINED');
      expect(STATUS_GROUPS.REJECTED).toContain('OFFER_RESCINDED');
      expect(STATUS_GROUPS.REJECTED).toContain('GHOSTED');
    });

    it('should have OFFER group contain offer-related statuses', () => {
      expect(STATUS_GROUPS.OFFER).toContain('OFFER_RECEIVED');
      expect(STATUS_GROUPS.OFFER).toContain('NEGOTIATING');
      expect(STATUS_GROUPS.OFFER).toContain('OFFER_ACCEPTED');
    });
  });

  describe('Metrics Status Arrays', () => {
    describe('RESPONSE_STATUSES', () => {
      it('should contain statuses indicating company response', () => {
        expect(RESPONSE_STATUSES).toContain('RECRUITER_SCREEN');
        expect(RESPONSE_STATUSES).toContain('REJECTED');
        expect(RESPONSE_STATUSES).toContain('OFFER_RECEIVED');
      });

      it('should not contain WITHDRAWN (user-initiated)', () => {
        expect(RESPONSE_STATUSES).not.toContain('WITHDRAWN');
      });

      it('should not contain GHOSTED (no response)', () => {
        expect(RESPONSE_STATUSES).not.toContain('GHOSTED');
      });
    });

    describe('INTERVIEW_STATUSES', () => {
      it('should contain interview-related statuses', () => {
        expect(INTERVIEW_STATUSES).toContain('RECRUITER_SCREEN');
        expect(INTERVIEW_STATUSES).toContain('TECH_SCREEN');
        expect(INTERVIEW_STATUSES).toContain('TECHNICAL_I');
        expect(INTERVIEW_STATUSES).toContain('REFERENCE_CHECK');
      });
    });

    describe('OFFER_STATUSES', () => {
      it('should contain offer-related statuses', () => {
        expect(OFFER_STATUSES).toContain('OFFER_RECEIVED');
        expect(OFFER_STATUSES).toContain('NEGOTIATING');
        expect(OFFER_STATUSES).toContain('OFFER_ACCEPTED');
        expect(OFFER_STATUSES).toContain('OFFER_DECLINED');
        expect(OFFER_STATUSES).toContain('OFFER_RESCINDED');
      });
    });

    describe('TECHNICAL_STATUSES', () => {
      it('should contain technical interview stages', () => {
        expect(TECHNICAL_STATUSES).toContain('TECH_SCREEN');
        expect(TECHNICAL_STATUSES).toContain('TAKE_HOME');
        expect(TECHNICAL_STATUSES).toContain('SYSTEM_DESIGN');
        expect(TECHNICAL_STATUSES).toContain('TECHNICAL_I');
        expect(TECHNICAL_STATUSES).toContain('TECHNICAL_II');
      });

      it('should not contain RECRUITER_SCREEN (typically non-technical)', () => {
        expect(TECHNICAL_STATUSES).not.toContain('RECRUITER_SCREEN');
      });
    });
  });

  describe('isStatusInGroup helper', () => {
    it('should return true for status in group', () => {
      expect(isStatusInGroup('REJECTED', 'REJECTED')).toBe(true);
      expect(isStatusInGroup('OFFER_DECLINED', 'REJECTED')).toBe(true);
      expect(isStatusInGroup('OFFER_RECEIVED', 'OFFER')).toBe(true);
    });

    it('should return false for status not in group', () => {
      expect(isStatusInGroup('APPLIED', 'REJECTED')).toBe(false);
      expect(isStatusInGroup('RECRUITER_SCREEN', 'OFFER')).toBe(false);
    });

    it('should return false for invalid group', () => {
      expect(isStatusInGroup('APPLIED', 'INVALID_GROUP')).toBe(false);
    });

    it('should return false for null/undefined status', () => {
      expect(isStatusInGroup(null, 'REJECTED')).toBe(false);
      expect(isStatusInGroup(undefined, 'REJECTED')).toBe(false);
    });
  });

  describe('isTerminalStatus helper', () => {
    it('should return true for rejected statuses', () => {
      expect(isTerminalStatus('REJECTED')).toBe(true);
      expect(isTerminalStatus('OFFER_DECLINED')).toBe(true);
      expect(isTerminalStatus('OFFER_RESCINDED')).toBe(true);
      expect(isTerminalStatus('GHOSTED')).toBe(true);
    });

    it('should return true for withdrawn status', () => {
      expect(isTerminalStatus('WITHDRAWN')).toBe(true);
    });

    it('should return true for waiting statuses', () => {
      expect(isTerminalStatus('ON_HOLD')).toBe(true);
      expect(isTerminalStatus('WAITING_FOR_RESPONSE')).toBe(true);
    });

    it('should return true for OFFER_ACCEPTED', () => {
      expect(isTerminalStatus('OFFER_ACCEPTED')).toBe(true);
    });

    it('should return false for active statuses', () => {
      expect(isTerminalStatus('APPLIED')).toBe(false);
      expect(isTerminalStatus('RECRUITER_SCREEN')).toBe(false);
      expect(isTerminalStatus('TECHNICAL_I')).toBe(false);
      expect(isTerminalStatus('OFFER_RECEIVED')).toBe(false);
      expect(isTerminalStatus('NEGOTIATING')).toBe(false);
    });
  });
});
