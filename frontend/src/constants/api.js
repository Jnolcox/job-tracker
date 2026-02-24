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
  RECRUITER_SCREEN: 'RECRUITER_SCREEN',
  TECH_SCREEN: 'TECH_SCREEN',
  TAKE_HOME: 'TAKE_HOME',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN',
  TECHNICAL_I: 'TECHNICAL_I',
  TECHNICAL_II: 'TECHNICAL_II',
  REFERENCE_CHECK: 'REFERENCE_CHECK',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  NEGOTIATING: 'NEGOTIATING',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_DECLINED: 'OFFER_DECLINED',
  OFFER_RESCINDED: 'OFFER_RESCINDED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  ON_HOLD: 'ON_HOLD',
  GHOSTED: 'GHOSTED'
};

// UI Stage constants for new UI
export const UI_STAGES = ["Applied", "Phone Screen", "Tech Screen", "Technical", "Onsite", "Offer", "Rejected", "Withdrawn"];

export const STAGE_COLORS = {
  Applied: "#4E9AF1",
  "Phone Screen": "#A78BFA",
  "Tech Screen": "#1ddac4",
  Technical: "#F59E0B",
  Onsite: "#34D399",
  Offer: "#10B981",
  Rejected: "#F87171",
  Withdrawn: "#6B7280",
};

// Status display configuration
export const STATUS_CONFIG = {
  [APPLICATION_STATUS.APPLIED]: {
    label: 'Applied',
    className: 'status-applied',
    color: '#4E9AF1'
  },
  [APPLICATION_STATUS.RECRUITER_SCREEN]: {
    label: 'Recruiter Screen',
    className: 'status-phone-screen',
    color: '#A78BFA'
  },
  [APPLICATION_STATUS.TECH_SCREEN]: {
    label: 'Tech Screen',
    className: 'status-technical',
    color: '#F59E0B'
  },
  [APPLICATION_STATUS.TAKE_HOME]: {
    label: 'Take Home',
    className: 'status-technical',
    color: '#F59E0B'
  },
  [APPLICATION_STATUS.SYSTEM_DESIGN]: {
    label: 'System Design',
    className: 'status-technical',
    color: '#F59E0B'
  },
  [APPLICATION_STATUS.TECHNICAL_I]: {
    label: 'Technical I',
    className: 'status-technical',
    color: '#F59E0B'
  },
  [APPLICATION_STATUS.TECHNICAL_II]: {
    label: 'Technical II',
    className: 'status-technical',
    color: '#F59E0B'
  },
  [APPLICATION_STATUS.REFERENCE_CHECK]: {
    label: 'Reference Check',
    className: 'status-onsite',
    color: '#34D399'
  },
  [APPLICATION_STATUS.OFFER_RECEIVED]: {
    label: 'Offer Received',
    className: 'status-offer',
    color: '#10B981'
  },
  [APPLICATION_STATUS.NEGOTIATING]: {
    label: 'Negotiating',
    className: 'status-offer',
    color: '#10B981'
  },
  [APPLICATION_STATUS.OFFER_ACCEPTED]: {
    label: 'Offer Accepted',
    className: 'status-offer',
    color: '#10B981'
  },
  [APPLICATION_STATUS.OFFER_DECLINED]: {
    label: 'Offer Declined',
    className: 'status-rejected',
    color: '#F87171'
  },
  [APPLICATION_STATUS.OFFER_RESCINDED]: {
    label: 'Offer Rescinded',
    className: 'status-rejected',
    color: '#F87171'
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: 'Rejected',
    className: 'status-rejected',
    color: '#F87171'
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    label: 'Withdrawn',
    className: 'status-withdrawn',
    color: '#6B7280'
  },
  [APPLICATION_STATUS.ON_HOLD]: {
    label: 'On Hold',
    className: 'status-withdrawn',
    color: '#6B7280'
  },
  [APPLICATION_STATUS.GHOSTED]: {
    label: 'Ghosted',
    className: 'status-rejected',
    color: '#F87171'
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