import axios from 'axios';
import { API_CONFIG, AUTH, HTTP_STATUS } from '../constants';

// Base API configuration
const API_BASE_URL = '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.REQUEST.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH.TOKEN_KEY);
  if (token) {
    config.headers[API_CONFIG.REQUEST.HEADERS.AUTHORIZATION] = `${AUTH.BEARER_PREFIX}${token}`;
  }
  return config;
});

/**
 * Requests whose own 401 means "these credentials are wrong", not "your session ended".
 * A 401 from one of these must reach the calling component so it can show the message,
 * rather than triggering the session-expiry redirect below.
 */
const CREDENTIAL_ENDPOINTS = [
  API_CONFIG.ENDPOINTS.AUTH.LOGIN,
  API_CONFIG.ENDPOINTS.AUTH.REGISTER,
];

/**
 * True when the failed request was an attempt to authenticate.
 *
 * @param {Object|undefined} config - the Axios request config from the error
 * @returns {boolean} whether this was a credential submission
 */
function isCredentialRequest(config) {
  const url = config?.url ?? '';
  return CREDENTIAL_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 anywhere else means the session is gone, so clear it and send the user to
    // the login screen. Doing that for a failed login too would reload the page and
    // destroy the error message the login form is about to render.
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !isCredentialRequest(error.config)
    ) {
      localStorage.removeItem(AUTH.TOKEN_KEY);
      localStorage.removeItem(AUTH.USER_KEY);
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData),
  login: (credentials) => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
};

// Job Applications API
export const jobApplicationsAPI = {
  getAll: (page = API_CONFIG.PAGINATION.DEFAULT_PAGE, size = API_CONFIG.PAGINATION.DEFAULT_SIZE) =>
    api.get(API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BASE, { params: { page, size } }),
  getById: (id) => api.get(API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BY_ID(id)),
  create: (applicationData) => api.post(API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BASE, applicationData),
  update: (id, applicationData) => api.put(API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BY_ID(id), applicationData),
  delete: (id) => api.delete(API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BY_ID(id)),
  /**
   * Fetch audit trail events for a specific job application.
   * @param {string|number} id - The job application ID
   * @returns {Promise} Axios promise resolving to events array
   */
  getEvents: (id) => api.get(`${API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BY_ID(id)}/events`),
  /**
   * Fetch all audit trail events for the current user's applications.
   * Uses bulk endpoint for efficiency (single request vs N parallel requests).
   * @returns {Promise<Array>} All events for current user's applications
   */
  getAllEvents: async () => {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.JOB_APPLICATIONS.BASE}/events/all`);
    return response.data || [];
  },
};

/**
 * Analytics API - Backend analytics endpoints (requires auth)
 * These endpoints provide pre-computed metrics and analytics data.
 */
export const analyticsAPI = {
  /**
   * Fetch application metrics including response rates, interview rates, and stage conversions.
   * @returns {Promise} Axios promise resolving to metrics object
   * @example
   * const { data } = await analyticsAPI.getMetrics();
   * // data: { trueResponseRate, trueInterviewRate, trueOfferRate, avgDaysToResponse, weeklyPace, totalApplications, stageConversions }
   */
  getMetrics: () => api.get('/job-applications/metrics'),

  /**
   * Fetch counts of applications by status.
   * @returns {Promise} Axios promise resolving to counts object keyed by status
   * @example
   * const { data } = await analyticsAPI.getCountsByStatus();
   * // data: { APPLIED: 20, RECRUITER_SCREEN: 10, ... }
   */
  getCountsByStatus: () => api.get('/job-applications/counts-by-status'),

  /**
   * Fetch salary distribution analytics for active applications.
   * @returns {Promise} Axios promise resolving to salary stats
   * @example
   * const { data } = await analyticsAPI.getSalaryDistribution();
   * // data: { globalMin, globalMax, avgMin, avgMax, avgMid, activeAppsWithSalary }
   */
  getSalaryDistribution: () => api.get('/job-applications/analytics/salary-distribution'),

  /**
   * Fetch activity heatmap data for a specific year.
   * @param {number} [year] - Year to fetch data for (defaults to current year)
   * @returns {Promise} Axios promise resolving to heatmap data
   * @example
   * const { data } = await analyticsAPI.getActivityHeatmap(2025);
   * // data: { data: { '2025-01-15': 3, ... }, maxCount: 5, year: 2025 }
   */
  getActivityHeatmap: (year = new Date().getFullYear()) =>
    api.get('/job-applications/analytics/activity-heatmap', { params: { year } }),

  /**
   * Fetch time patterns (applications by day of week and hour).
   * @returns {Promise} Axios promise resolving to time pattern data
   * @example
   * const { data } = await analyticsAPI.getTimePatterns();
   * // data: { byDayOfWeek: { Monday: 10, ... }, byHour: { 9: 5, 10: 8, ... } }
   */
  getTimePatterns: () => api.get('/job-applications/analytics/time-patterns'),

  /**
   * Fetch stage duration analytics (average time in each stage).
   * @returns {Promise} Axios promise resolving to stage duration data
   * @example
   * const { data } = await analyticsAPI.getStageDurations();
   * // data: { averageTimeByStage: { APPLIED: 5.2, ... }, bottleneckStages: [...] }
   */
  getStageDurations: () => api.get('/job-applications/analytics/stage-durations'),

  /**
   * Fetch status transition matrix for heatmap visualization.
   * Shows how applications move between different statuses.
   * @returns {Promise} Axios promise resolving to transition matrix data
   * @example
   * const { data } = await analyticsAPI.getTransitionMatrix();
   * // data: { transitions: [{fromStatus, toStatus, count}], statuses: [...], totalTransitions: 23 }
   */
  getTransitionMatrix: () => api.get('/job-applications/analytics/transition-matrix'),

  /**
   * Fetch funnel/conversion analytics including drop-off points and success rates.
   * @returns {Promise} Axios promise resolving to funnel analytics data
   * @example
   * const { data } = await analyticsAPI.getFunnel();
   * // data: { stageConversionRates, dropOffPoints, successRateByCompany, successRateByPositionType, overallSuccessRate, totalApplicationsAnalyzed }
   */
  getFunnel: () => api.get('/job-applications/analytics/funnel'),

  /**
   * Fetch application health indicators including stale and hot applications.
   * @param {number} [staleDays=14] - Number of days to consider an application stale
   * @returns {Promise} Axios promise resolving to health indicator data
   * @example
   * const { data } = await analyticsAPI.getHealth(14);
   * // data: { staleApplications, hotApplications, quickWins, quickLosses, staleDaysThreshold, summary }
   */
  getHealth: (staleDays = 14) =>
    api.get('/job-applications/analytics/health', { params: { staleDays } }),

  /**
   * Fetch company-level analytics insights.
   * @param {number} [topN=10] - Maximum number of companies to return
   * @returns {Promise} Axios promise resolving to company insights data
   * @example
   * const { data } = await analyticsAPI.getCompanyInsights(10);
   * // data: { companies: [...], totalCompaniesAnalyzed, totalApplicationsAnalyzed }
   */
  getCompanyInsights: (topN = 10) =>
    api.get('/job-applications/analytics/company-insights', { params: { topN } }),

  /**
   * Fetch location and RTO type analytics insights.
   * @returns {Promise} Axios promise resolving to location insights data
   * @example
   * const { data } = await analyticsAPI.getLocationInsights();
   * // data: { byLocation: [...], byRtoType: [...], totalApplicationsAnalyzed }
   */
  getLocationInsights: () =>
    api.get('/job-applications/analytics/location-insights'),

  /**
   * Fetch position level analytics insights.
   * @returns {Promise} Axios promise resolving to position insights data
   * @example
   * const { data } = await analyticsAPI.getPositionInsights();
   * // data: { byLevel: [...], totalApplicationsAnalyzed }
   */
  getPositionInsights: () =>
    api.get('/job-applications/analytics/position-insights'),
};

/**
 * Config API - Backend configuration endpoints (public, no auth required)
 * These endpoints provide configuration data for statuses, options, etc.
 */
export const configAPI = {
  /**
   * Fetch status configuration including labels, colors, and groups.
   * @returns {Promise} Axios promise resolving to status config
   * @example
   * const { data } = await configAPI.getStatuses();
   * // data: { statuses: [{ key, label, color, group }], groups: { INTERVIEWING: [...] } }
   */
  getStatuses: () => api.get('/config/statuses'),

  /**
   * Fetch options configuration (RTO types, levels, etc.).
   * @returns {Promise} Axios promise resolving to options config
   * @example
   * const { data } = await configAPI.getOptions();
   * // data: { rtoTypes: [{ key, label }], levels: [{ key, label }] }
   */
  getOptions: () => api.get('/config/options'),
};

export default api;