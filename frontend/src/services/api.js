import axios from 'axios';
import { API_CONFIG, AUTH, HTTP_STATUS } from '../constants';

// Base API configuration
const API_BASE_URL = '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      localStorage.removeItem(AUTH.TOKEN_KEY);
      localStorage.removeItem(AUTH.USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData),
  login: (credentials) => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
  logout: () => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT),
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
};

export default api;