/**
 * @file colors.test.js
 * @description Tests for consolidated color constants.
 */

import {
  STATUS_COLORS,
  FUNNEL_COLORS,
  CHART_COLORS,
} from './colors';

describe('Color Constants', () => {
  describe('STATUS_COLORS', () => {
    it('should have colors for all standard statuses', () => {
      expect(STATUS_COLORS.APPLIED).toBeDefined();
      expect(STATUS_COLORS.RECRUITER_SCREEN).toBeDefined();
      expect(STATUS_COLORS.TECH_SCREEN).toBeDefined();
      expect(STATUS_COLORS.REJECTED).toBeDefined();
      expect(STATUS_COLORS.OFFER_RECEIVED).toBeDefined();
      expect(STATUS_COLORS.WITHDRAWN).toBeDefined();
      expect(STATUS_COLORS.GHOSTED).toBeDefined();
    });

    it('should use consistent blue for Applied', () => {
      expect(STATUS_COLORS.APPLIED).toBe('#4E9AF1');
    });

    it('should use consistent purple for Recruiter Screen', () => {
      expect(STATUS_COLORS.RECRUITER_SCREEN).toBe('#A78BFA');
    });

    it('should use consistent orange for technical stages', () => {
      expect(STATUS_COLORS.TECH_SCREEN).toBe('#F59E0B');
      expect(STATUS_COLORS.TAKE_HOME).toBe('#F59E0B');
      expect(STATUS_COLORS.SYSTEM_DESIGN).toBe('#F59E0B');
      expect(STATUS_COLORS.TECHNICAL_I).toBe('#F59E0B');
      expect(STATUS_COLORS.TECHNICAL_II).toBe('#F59E0B');
    });

    it('should use consistent green for offer stages', () => {
      expect(STATUS_COLORS.OFFER_RECEIVED).toBe('#10B981');
      expect(STATUS_COLORS.NEGOTIATING).toBe('#10B981');
    });

    it('should use consistent red for negative outcomes', () => {
      expect(STATUS_COLORS.REJECTED).toBe('#F87171');
      expect(STATUS_COLORS.OFFER_DECLINED).toBe('#F87171');
      expect(STATUS_COLORS.GHOSTED).toBe('#F87171');
    });

    it('should use consistent gray for withdrawn', () => {
      expect(STATUS_COLORS.WITHDRAWN).toBe('#6B7280');
    });

    it('should use consistent yellow for waiting statuses', () => {
      expect(STATUS_COLORS.ON_HOLD).toBe('#EAB308');
      expect(STATUS_COLORS.WAITING_FOR_RESPONSE).toBe('#EAB308');
    });
  });

  describe('FUNNEL_COLORS', () => {
    it('should have colors for all funnel groups', () => {
      expect(FUNNEL_COLORS.APPLIED).toBeDefined();
      expect(FUNNEL_COLORS.RECRUITER).toBeDefined();
      expect(FUNNEL_COLORS.TECHNICAL).toBeDefined();
      expect(FUNNEL_COLORS.REFERENCE).toBeDefined();
      expect(FUNNEL_COLORS.OFFER).toBeDefined();
      expect(FUNNEL_COLORS.REJECTED).toBeDefined();
      expect(FUNNEL_COLORS.WAITING).toBeDefined();
      expect(FUNNEL_COLORS.WITHDRAWN).toBeDefined();
    });

    it('should use blue for Applied group', () => {
      expect(FUNNEL_COLORS.APPLIED).toBe('#4E9AF1');
    });

    it('should use green for Offer group', () => {
      expect(FUNNEL_COLORS.OFFER).toBe('#10B981');
    });

    it('should use red for Rejected group', () => {
      expect(FUNNEL_COLORS.REJECTED).toBe('#F87171');
    });
  });

  describe('CHART_COLORS', () => {
    it('should have urgency colors for status age visualization', () => {
      expect(CHART_COLORS.URGENCY_LOW).toBeDefined();
      expect(CHART_COLORS.URGENCY_MEDIUM).toBeDefined();
      expect(CHART_COLORS.URGENCY_HIGH).toBeDefined();
    });

    it('should use green for low urgency', () => {
      expect(CHART_COLORS.URGENCY_LOW).toBe('#34D399');
    });

    it('should use amber for medium urgency', () => {
      expect(CHART_COLORS.URGENCY_MEDIUM).toBe('#F59E0B');
    });

    it('should use red for high urgency', () => {
      expect(CHART_COLORS.URGENCY_HIGH).toBe('#F87171');
    });
  });
});
