import axios from 'axios';

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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
};

// Job Applications API
export const jobApplicationsAPI = {
  getAll: (page = 0, size = 20) => 
    api.get('/job-applications', { params: { page, size } }),
  getById: (id) => api.get(`/job-applications/${id}`),
  create: (applicationData) => api.post('/job-applications', applicationData),
  update: (id, applicationData) => api.put(`/job-applications/${id}`, applicationData),
  delete: (id) => api.delete(`/job-applications/${id}`),
};

export default api;