/**
 * @file useApplicationMetrics.test.js
 * @description Tests for the useApplicationMetrics hook.
 * Tests follow TDD methodology - written before implementation.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useApplicationMetrics } from './useApplicationMetrics';
import { jobApplicationsAPI } from '../services/api';
import { getAllMetrics } from '../utils/metricsEngine';

// Mock the dependencies
jest.mock('../services/api', () => ({
  jobApplicationsAPI: {
    getAllEvents: jest.fn(),
  },
}));

jest.mock('../utils/metricsEngine', () => ({
  getAllMetrics: jest.fn(),
}));

describe('useApplicationMetrics', () => {
  const mockApps = [
    { id: 1, company: 'Company A', status: 'APPLIED' },
    { id: 2, company: 'Company B', status: 'RECRUITER_SCREEN' },
  ];

  const mockEvents = [
    { id: 1, applicationId: 1, eventType: 'CREATED', timestamp: 1737024600 },
    { id: 2, applicationId: 1, eventType: 'STATUS_CHANGED', fieldName: 'status', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', timestamp: 1737111000 },
    { id: 3, applicationId: 2, eventType: 'CREATED', timestamp: 1737200000 },
  ];

  const mockMetrics = {
    trueResponseRate: 50,
    trueInterviewRate: 50,
    trueOfferRate: 0,
    avgDaysToResponse: 1,
    stageConversions: {
      appliedToScreen: 50,
      screenToTech: 0,
      techToOffer: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return loading true initially', async () => {
      jobApplicationsAPI.getAllEvents.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useApplicationMetrics(mockApps));

      expect(result.current.loading).toBe(true);
      expect(result.current.metrics).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful fetch', () => {
    it('should fetch events and compute metrics', async () => {
      jobApplicationsAPI.getAllEvents.mockResolvedValue(mockEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useApplicationMetrics(mockApps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobApplicationsAPI.getAllEvents).toHaveBeenCalledWith(mockApps);
      expect(getAllMetrics).toHaveBeenCalledWith(mockEvents, mockApps);
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.error).toBeNull();
    });

    it('should return correct metric properties', async () => {
      jobApplicationsAPI.getAllEvents.mockResolvedValue(mockEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useApplicationMetrics(mockApps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toHaveProperty('trueResponseRate');
      expect(result.current.metrics).toHaveProperty('trueInterviewRate');
      expect(result.current.metrics).toHaveProperty('trueOfferRate');
      expect(result.current.metrics).toHaveProperty('avgDaysToResponse');
      expect(result.current.metrics).toHaveProperty('stageConversions');
    });
  });

  describe('empty apps array', () => {
    it('should handle empty apps array without calling API', async () => {
      // Use a stable empty array reference
      const emptyApps = [];
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useApplicationMetrics(emptyApps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobApplicationsAPI.getAllEvents).not.toHaveBeenCalled();
    });

    it('should handle null apps without calling API', async () => {
      const { result } = renderHook(() => useApplicationMetrics(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobApplicationsAPI.getAllEvents).not.toHaveBeenCalled();
    });

    it('should handle undefined apps without calling API', async () => {
      const { result } = renderHook(() => useApplicationMetrics(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobApplicationsAPI.getAllEvents).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should set error state when fetch fails', async () => {
      const mockError = new Error('Network error');
      jobApplicationsAPI.getAllEvents.mockRejectedValue(mockError);

      const { result } = renderHook(() => useApplicationMetrics(mockApps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.metrics).toBeNull();
    });

    it('should clear previous error on successful refetch', async () => {
      const mockError = new Error('Network error');
      jobApplicationsAPI.getAllEvents.mockRejectedValueOnce(mockError);

      const { result, rerender } = renderHook(
        ({ apps }) => useApplicationMetrics(apps),
        { initialProps: { apps: mockApps } }
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      // Now mock a successful response
      jobApplicationsAPI.getAllEvents.mockResolvedValue(mockEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      // Trigger refetch with new apps (different IDs to change the key)
      const newApps = [...mockApps, { id: 3, company: 'Company C', status: 'APPLIED' }];
      rerender({ apps: newApps });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.metrics).toEqual(mockMetrics);
      });
    });
  });

  describe('refetch on apps change', () => {
    it('should refetch events when apps array changes (different IDs)', async () => {
      jobApplicationsAPI.getAllEvents.mockResolvedValue(mockEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result, rerender } = renderHook(
        ({ apps }) => useApplicationMetrics(apps),
        { initialProps: { apps: mockApps } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobApplicationsAPI.getAllEvents).toHaveBeenCalledTimes(1);

      // Update apps with different IDs (should trigger refetch)
      const newApps = [...mockApps, { id: 3, company: 'Company C', status: 'APPLIED' }];
      rerender({ apps: newApps });

      await waitFor(() => {
        expect(jobApplicationsAPI.getAllEvents).toHaveBeenCalledTimes(2);
      });

      expect(jobApplicationsAPI.getAllEvents).toHaveBeenLastCalledWith(newApps);
    });

    it('should not refetch when apps have same IDs but different reference', async () => {
      jobApplicationsAPI.getAllEvents.mockResolvedValue(mockEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result, rerender } = renderHook(
        ({ apps }) => useApplicationMetrics(apps),
        { initialProps: { apps: mockApps } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(jobApplicationsAPI.getAllEvents).toHaveBeenCalledTimes(1);

      // Create new array with same IDs (should NOT trigger refetch)
      const sameApps = [
        { id: 1, company: 'Company A Updated', status: 'APPLIED' },
        { id: 2, company: 'Company B Updated', status: 'RECRUITER_SCREEN' },
      ];
      rerender({ apps: sameApps });

      // Should still be 1 call since IDs are the same
      expect(jobApplicationsAPI.getAllEvents).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('should cancel pending fetch on unmount', async () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      jobApplicationsAPI.getAllEvents.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useApplicationMetrics(mockApps));

      expect(result.current.loading).toBe(true);

      unmount();

      // Resolve after unmount - should not cause state update
      await act(async () => {
        resolvePromise(mockEvents);
      });

      // No error should be thrown (React would warn about state update on unmounted component)
    });

    it('should cancel pending fetch when apps change before previous fetch completes', async () => {
      let resolveFirst;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      jobApplicationsAPI.getAllEvents.mockReturnValueOnce(firstPromise);

      const secondEvents = [...mockEvents, { id: 4, applicationId: 3, eventType: 'CREATED' }];
      jobApplicationsAPI.getAllEvents.mockResolvedValueOnce(secondEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result, rerender } = renderHook(
        ({ apps }) => useApplicationMetrics(apps),
        { initialProps: { apps: mockApps } }
      );

      // Update apps before first fetch completes (different IDs to trigger new fetch)
      const newApps = [...mockApps, { id: 3, company: 'Company C', status: 'APPLIED' }];
      rerender({ apps: newApps });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Resolve first promise after second completes - should be ignored
      await act(async () => {
        resolveFirst(mockEvents);
      });

      // Metrics should be from second fetch
      expect(getAllMetrics).toHaveBeenLastCalledWith(secondEvents, newApps);
    });
  });

  describe('memoization', () => {
    it('should memoize metrics computation based on events', async () => {
      jobApplicationsAPI.getAllEvents.mockResolvedValue(mockEvents);
      getAllMetrics.mockReturnValue(mockMetrics);

      const { result, rerender } = renderHook(
        ({ apps }) => useApplicationMetrics(apps),
        { initialProps: { apps: mockApps } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstMetrics = result.current.metrics;

      // Rerender with same apps IDs (should not refetch or recompute)
      const sameApps = [...mockApps]; // New reference but same IDs
      rerender({ apps: sameApps });

      // Metrics object should be the same reference (memoized)
      expect(result.current.metrics).toBe(firstMetrics);
    });
  });
});
