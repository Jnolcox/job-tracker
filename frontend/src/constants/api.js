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
      REGISTER: '/auth/register'
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