/**
 * @file api.test.js
 * @description Tests for API service functions
 */

import api, { analyticsAPI, configAPI } from './api';

// Mock the api instance
jest.mock('./api', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();

  const mockApi = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: mockApi,
    analyticsAPI: {
      getMetrics: () => mockApi.get('/job-applications/metrics'),
      getCountsByStatus: () => mockApi.get('/job-applications/counts-by-status'),
      getSalaryDistribution: () => mockApi.get('/job-applications/analytics/salary-distribution'),
      getActivityHeatmap: (year = new Date().getFullYear()) =>
        mockApi.get('/job-applications/analytics/activity-heatmap', { params: { year } }),
      getTimePatterns: () => mockApi.get('/job-applications/analytics/time-patterns'),
      getStageDurations: () => mockApi.get('/job-applications/analytics/stage-durations'),
    },
    configAPI: {
      getStatuses: () => mockApi.get('/config/statuses'),
      getOptions: () => mockApi.get('/config/options'),
    },
  };
});

describe('analyticsAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should call the metrics endpoint', async () => {
      const mockResponse = {
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
      api.get.mockResolvedValue(mockResponse);

      const result = await analyticsAPI.getMetrics();

      expect(api.get).toHaveBeenCalledWith('/job-applications/metrics');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCountsByStatus', () => {
    it('should call the counts-by-status endpoint', async () => {
      const mockResponse = {
        data: {
          APPLIED: 20,
          RECRUITER_SCREEN: 10,
          TECH_SCREEN: 5,
          OFFER_RECEIVED: 2,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await analyticsAPI.getCountsByStatus();

      expect(api.get).toHaveBeenCalledWith('/job-applications/counts-by-status');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSalaryDistribution', () => {
    it('should call the salary-distribution endpoint', async () => {
      const mockResponse = {
        data: {
          globalMin: 80000,
          globalMax: 250000,
          avgMin: 120000,
          avgMax: 180000,
          avgMid: 150000,
          activeAppsWithSalary: 15,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await analyticsAPI.getSalaryDistribution();

      expect(api.get).toHaveBeenCalledWith('/job-applications/analytics/salary-distribution');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getActivityHeatmap', () => {
    it('should call the activity-heatmap endpoint with year parameter', async () => {
      const mockResponse = {
        data: {
          data: { '2025-01-15': 3, '2025-01-16': 1 },
          maxCount: 3,
          year: 2025,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await analyticsAPI.getActivityHeatmap(2025);

      expect(api.get).toHaveBeenCalledWith('/job-applications/analytics/activity-heatmap', {
        params: { year: 2025 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use current year when no year is provided', async () => {
      const mockResponse = { data: {} };
      api.get.mockResolvedValue(mockResponse);
      const currentYear = new Date().getFullYear();

      await analyticsAPI.getActivityHeatmap();

      expect(api.get).toHaveBeenCalledWith('/job-applications/analytics/activity-heatmap', {
        params: { year: currentYear },
      });
    });
  });

  describe('getTimePatterns', () => {
    it('should call the time-patterns endpoint', async () => {
      const mockResponse = {
        data: {
          byDayOfWeek: { Monday: 10, Tuesday: 8, Wednesday: 12 },
          byHour: { 9: 5, 10: 8, 14: 6 },
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await analyticsAPI.getTimePatterns();

      expect(api.get).toHaveBeenCalledWith('/job-applications/analytics/time-patterns');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStageDurations', () => {
    it('should call the stage-durations endpoint', async () => {
      const mockResponse = {
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
      api.get.mockResolvedValue(mockResponse);

      const result = await analyticsAPI.getStageDurations();

      expect(api.get).toHaveBeenCalledWith('/job-applications/analytics/stage-durations');
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('configAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatuses', () => {
    it('should call the statuses config endpoint', async () => {
      const mockResponse = {
        data: {
          statuses: [
            { key: 'APPLIED', label: 'Applied', color: '#4E9AF1', group: 'ACTIVE' },
            { key: 'RECRUITER_SCREEN', label: 'Recruiter Screen', color: '#A78BFA', group: 'INTERVIEWING' },
          ],
          groups: {
            ACTIVE: ['APPLIED'],
            INTERVIEWING: ['RECRUITER_SCREEN'],
          },
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await configAPI.getStatuses();

      expect(api.get).toHaveBeenCalledWith('/config/statuses');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOptions', () => {
    it('should call the options config endpoint', async () => {
      const mockResponse = {
        data: {
          rtoTypes: [
            { key: 'REMOTE', label: 'Remote' },
            { key: 'HYBRID_2', label: 'Hybrid (2 days)' },
          ],
          levels: [
            { key: 'JUNIOR', label: 'Junior' },
            { key: 'SENIOR', label: 'Senior' },
          ],
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await configAPI.getOptions();

      expect(api.get).toHaveBeenCalledWith('/config/options');
      expect(result).toEqual(mockResponse);
    });
  });
});
