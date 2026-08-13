/**
 * @file useAnalytics.test.js
 * @description Tests for useAnalytics hook - provides backend analytics data to components
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';
import { analyticsAPI } from '../services/api';

// Mock the analyticsAPI
jest.mock('../services/api', () => ({
  analyticsAPI: {
    getMetrics: jest.fn(),
    getCountsByStatus: jest.fn(),
    getSalaryDistribution: jest.fn(),
    getActivityHeatmap: jest.fn(),
    getTimePatterns: jest.fn(),
    getStageDurations: jest.fn(),
    getTransitionMatrix: jest.fn(),
    getFunnel: jest.fn(),
    getHealth: jest.fn(),
  },
}));

describe('useAnalytics', () => {
  const mockMetricsResponse = {
    data: {
      trueResponseRate: 45.5,
      trueInterviewRate: 30.0,
      trueOfferRate: 5.0,
      avgDaysToResponse: 7.5,
      weeklyPace: 3.2,
      totalApplications: 50,
      stageConversions: {
        appliedToScreen: 40,
        screenToTech: 75,
        techToOffer: 20,
      },
    },
  };

  const mockCountsByStatusResponse = {
    data: {
      APPLIED: 20,
      RECRUITER_SCREEN: 10,
      TECH_SCREEN: 5,
      OFFER_RECEIVED: 2,
    },
  };

  const mockSalaryResponse = {
    data: {
      globalMin: 80000,
      globalMax: 250000,
      avgMin: 120000,
      avgMax: 180000,
      avgMid: 150000,
      activeAppsWithSalary: 15,
    },
  };

  const mockHeatmapResponse = {
    data: {
      data: { '2025-01-15': 3, '2025-01-16': 1 },
      maxCount: 3,
      year: 2025,
    },
  };

  const mockTimePatternsResponse = {
    data: {
      byDayOfWeek: { Monday: 10, Tuesday: 8, Wednesday: 12 },
      byHour: { 9: 5, 10: 8, 14: 6 },
    },
  };

  const mockStageDurationsResponse = {
    data: {
      averageTimeByStage: {
        APPLIED: 5.2,
        RECRUITER_SCREEN: 7.5,
        TECH_SCREEN: 3.0,
      },
      bottleneckStages: [
        { stage: 'RECRUITER_SCREEN', avgDays: 7.5 },
        { stage: 'APPLIED', avgDays: 5.2 },
      ],
    },
  };

  const mockTransitionMatrixResponse = {
    data: {
      transitions: [
        { fromStatus: 'APPLIED', toStatus: 'RECRUITER_SCREEN', count: 15 },
        { fromStatus: 'APPLIED', toStatus: 'REJECTED', count: 8 },
      ],
      statuses: ['APPLIED', 'RECRUITER_SCREEN', 'REJECTED'],
      totalTransitions: 23,
    },
  };

  const mockFunnelResponse = {
    data: {
      stageConversionRates: { APPLIED: 65.5 },
      dropOffPoints: [
        { status: 'REJECTED', count: 12, percentage: 24.0 },
        { status: 'GHOSTED', count: 8, percentage: 16.0 },
      ],
      successRateByCompany: [
        { companyName: 'Google', totalApplications: 3, offersReceived: 1, successRate: 33.3 },
      ],
      successRateByPositionType: [
        { positionType: 'Senior', totalApplications: 15, offersReceived: 2, successRate: 13.3 },
      ],
      overallSuccessRate: 8.5,
      totalApplicationsAnalyzed: 50,
    },
  };

  const mockHealthResponse = {
    data: {
      staleApplications: [
        {
          applicationId: 1,
          companyName: 'Meta',
          positionTitle: 'SWE',
          currentStatus: 'APPLIED',
          lastEventAt: '2024-01-15T10:00:00Z',
          daysSinceLastEvent: 20,
        },
      ],
      hotApplications: [
        {
          applicationId: 2,
          companyName: 'Google',
          positionTitle: 'Senior SWE',
          currentStatus: 'TECHNICAL_I',
          recentEventCount: 5,
          lastEventAt: '2024-02-01T15:00:00Z',
        },
      ],
      quickWins: [
        {
          applicationId: 3,
          companyName: 'Startup',
          positionTitle: 'Lead',
          finalStatus: 'OFFER_RECEIVED',
          appliedAt: '2024-01-01T00:00:00Z',
          resolvedAt: '2024-01-06T00:00:00Z',
          daysToResolution: 5,
        },
      ],
      quickLosses: [],
      staleDaysThreshold: 14,
      summary: {
        staleCount: 5,
        hotCount: 2,
        quickWinCount: 1,
        quickLossCount: 3,
        activeCount: 25,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with loading state', () => {
    // Make API calls hang
    analyticsAPI.getMetrics.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getCountsByStatus.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getSalaryDistribution.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getActivityHeatmap.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getTimePatterns.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getStageDurations.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getTransitionMatrix.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getFunnel.mockImplementation(() => new Promise(() => {}));
    analyticsAPI.getHealth.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBeNull();
    expect(result.current.countsByStatus).toBeNull();
    expect(result.current.transitionMatrix).toBeNull();
    expect(result.current.funnelAnalytics).toBeNull();
    expect(result.current.healthIndicators).toBeNull();
  });

  // Helper to setup all mocks with default responses
  const setupAllMocks = () => {
    analyticsAPI.getMetrics.mockResolvedValue(mockMetricsResponse);
    analyticsAPI.getCountsByStatus.mockResolvedValue(mockCountsByStatusResponse);
    analyticsAPI.getSalaryDistribution.mockResolvedValue(mockSalaryResponse);
    analyticsAPI.getActivityHeatmap.mockResolvedValue(mockHeatmapResponse);
    analyticsAPI.getTimePatterns.mockResolvedValue(mockTimePatternsResponse);
    analyticsAPI.getStageDurations.mockResolvedValue(mockStageDurationsResponse);
    analyticsAPI.getTransitionMatrix.mockResolvedValue(mockTransitionMatrixResponse);
    analyticsAPI.getFunnel.mockResolvedValue(mockFunnelResponse);
    analyticsAPI.getHealth.mockResolvedValue(mockHealthResponse);
  };

  it('should fetch metrics data', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockMetricsResponse.data);
    expect(result.current.metrics.trueResponseRate).toBe(45.5);
    expect(result.current.metrics.weeklyPace).toBe(3.2);
  });

  it('should fetch counts by status', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.countsByStatus).toEqual(mockCountsByStatusResponse.data);
    expect(result.current.countsByStatus.APPLIED).toBe(20);
  });

  it('should fetch salary distribution', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.salaryDistribution).toEqual(mockSalaryResponse.data);
    expect(result.current.salaryDistribution.avgMid).toBe(150000);
  });

  it('should fetch activity heatmap', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activityHeatmap).toEqual(mockHeatmapResponse.data);
    expect(result.current.activityHeatmap.maxCount).toBe(3);
  });

  it('should fetch time patterns', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.timePatterns).toEqual(mockTimePatternsResponse.data);
    expect(result.current.timePatterns.byDayOfWeek.Monday).toBe(10);
  });

  it('should not fetch stage durations, which nothing renders', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stageDurations).toBeUndefined();
    expect(analyticsAPI.getStageDurations).not.toHaveBeenCalled();
  });

  it('should fetch transition matrix', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transitionMatrix).toEqual(mockTransitionMatrixResponse.data);
    expect(result.current.transitionMatrix.transitions[0].fromStatus).toBe('APPLIED');
    expect(result.current.transitionMatrix.totalTransitions).toBe(23);
  });

  it('should fetch funnel analytics', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.funnelAnalytics).toEqual(mockFunnelResponse.data);
    expect(result.current.funnelAnalytics.overallSuccessRate).toBe(8.5);
    expect(result.current.funnelAnalytics.dropOffPoints[0].status).toBe('REJECTED');
  });

  it('should fetch health indicators', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.healthIndicators).toEqual(mockHealthResponse.data);
    expect(result.current.healthIndicators.summary.staleCount).toBe(5);
    expect(result.current.healthIndicators.staleApplications[0].companyName).toBe('Meta');
  });

  it('should pass staleDays parameter to health endpoint', async () => {
    setupAllMocks();

    renderHook(() => useAnalytics({ staleDays: 7 }));

    await waitFor(() => {
      expect(analyticsAPI.getHealth).toHaveBeenCalledWith(7);
    });
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    analyticsAPI.getMetrics.mockRejectedValue(error);
    analyticsAPI.getCountsByStatus.mockRejectedValue(error);
    analyticsAPI.getSalaryDistribution.mockRejectedValue(error);
    analyticsAPI.getActivityHeatmap.mockRejectedValue(error);
    analyticsAPI.getTimePatterns.mockRejectedValue(error);
    analyticsAPI.getStageDurations.mockRejectedValue(error);
    analyticsAPI.getTransitionMatrix.mockRejectedValue(error);
    analyticsAPI.getFunnel.mockRejectedValue(error);
    analyticsAPI.getHealth.mockRejectedValue(error);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.metrics).toBeNull();
    expect(result.current.transitionMatrix).toBeNull();
    expect(result.current.funnelAnalytics).toBeNull();
    expect(result.current.healthIndicators).toBeNull();
  });

  it('should provide refetch function', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(analyticsAPI.getMetrics).toHaveBeenCalledTimes(1);

    // Update mock to return different data
    const updatedMetrics = {
      data: { ...mockMetricsResponse.data, trueResponseRate: 50.0 },
    };
    analyticsAPI.getMetrics.mockResolvedValue(updatedMetrics);

    // Trigger refetch
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.metrics.trueResponseRate).toBe(50.0);
    });

    expect(analyticsAPI.getMetrics).toHaveBeenCalledTimes(2);
  });

  it('should pass year parameter to activity heatmap', async () => {
    setupAllMocks();

    const { result } = renderHook(() => useAnalytics({ year: 2024 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(analyticsAPI.getActivityHeatmap).toHaveBeenCalledWith(2024);
  });

  it('should handle partial data gracefully', async () => {
    // Some endpoints succeed, some fail
    analyticsAPI.getMetrics.mockResolvedValue(mockMetricsResponse);
    analyticsAPI.getCountsByStatus.mockResolvedValue(mockCountsByStatusResponse);
    analyticsAPI.getSalaryDistribution.mockRejectedValue(new Error('Salary API error'));
    analyticsAPI.getActivityHeatmap.mockResolvedValue(mockHeatmapResponse);
    analyticsAPI.getTimePatterns.mockRejectedValue(new Error('Time patterns API error'));
    analyticsAPI.getStageDurations.mockResolvedValue(mockStageDurationsResponse);
    analyticsAPI.getTransitionMatrix.mockResolvedValue(mockTransitionMatrixResponse);
    analyticsAPI.getFunnel.mockRejectedValue(new Error('Funnel API error'));
    analyticsAPI.getHealth.mockResolvedValue(mockHealthResponse);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Successful endpoints should have data
    expect(result.current.metrics).toEqual(mockMetricsResponse.data);
    expect(result.current.countsByStatus).toEqual(mockCountsByStatusResponse.data);
    expect(result.current.activityHeatmap).toEqual(mockHeatmapResponse.data);
    expect(result.current.transitionMatrix).toEqual(mockTransitionMatrixResponse.data);
    expect(result.current.healthIndicators).toEqual(mockHealthResponse.data);

    // Failed endpoints should be null
    expect(result.current.salaryDistribution).toBeNull();
    expect(result.current.timePatterns).toBeNull();
    expect(result.current.funnelAnalytics).toBeNull();
  });
});
