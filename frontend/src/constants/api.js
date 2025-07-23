// API Configuration Constants
export const API_CONFIG = {
  // Base configuration
  BASE_PATH: '/api',
  VERSION: 'v1',
  
  // Construct full base URL
  get BASE_URL() {
    return `${this.BASE_PATH}/${this.VERSION}`;
  },
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout'
    },
    
    // Job Applications endpoints
    JOB_APPLICATIONS: {
      BASE: '/job-applications',
      BY_ID: (id) => `/job-applications/${id}`
    }
  },
  
  // Request configuration
  REQUEST: {
    TIMEOUT: 30000, // 30 seconds
    HEADERS: {
      CONTENT_TYPE: 'Content-Type',
      AUTHORIZATION: 'Authorization'
    }
  },
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 0,
    DEFAULT_SIZE: 20,
    MAX_SIZE: 100
  }
};

// Authentication constants
export const AUTH = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  BEARER_PREFIX: 'Bearer '
};

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Application status constants (matching backend)
export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEWED: 'INTERVIEWED',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  ACCEPTED: 'ACCEPTED'
};

// Status display configuration
export const STATUS_CONFIG = {
  [APPLICATION_STATUS.APPLIED]: {
    label: 'Applied',
    className: 'status-applied',
    color: '#f39c12'
  },
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: {
    label: 'Interview Scheduled',
    className: 'status-interviewed',
    color: '#9b59b6'
  },
  [APPLICATION_STATUS.INTERVIEWED]: {
    label: 'Interviewed',
    className: 'status-interviewed',
    color: '#9b59b6'
  },
  [APPLICATION_STATUS.OFFER_RECEIVED]: {
    label: 'Offer Received',
    className: 'status-offer',
    color: '#27ae60'
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: 'Rejected',
    className: 'status-rejected',
    color: '#e74c3c'
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    label: 'Withdrawn',
    className: 'status-rejected',
    color: '#e74c3c'
  },
  [APPLICATION_STATUS.ACCEPTED]: {
    label: 'Accepted',
    className: 'status-offer',
    color: '#27ae60'
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.'
};