/**
 * @file application.js
 * @description Factory functions for creating mock application objects in tests.
 *
 * Provides two formats:
 * - UI format: Used by frontend components (camelCase, with id, company, role, etc.)
 * - Backend format: Used by API responses (companyName, positionTitle, etc.)
 *
 * @example
 * // Create a mock application in UI format
 * const app = createMockApplication({ company: 'Acme Corp' });
 *
 * // Create a mock application in backend format
 * const backendApp = createMockBackendApplication({ companyName: 'Acme Corp' });
 *
 * // Create a new application (no id)
 * const newApp = createNewApplication();
 */

let applicationIdCounter = 1;

/**
 * Resets the application ID counter. Useful in beforeEach blocks.
 */
export const resetApplicationIdCounter = () => {
  applicationIdCounter = 1;
};

/**
 * Creates a mock application object in UI format (used by frontend components).
 *
 * @param {Object} overrides - Properties to override in the default application
 * @returns {Object} Mock application object in UI format
 *
 * @example
 * const app = createMockApplication({ company: 'Tech Corp', status: 'REJECTED' });
 */
export const createMockApplication = (overrides = {}) => ({
  id: overrides.id || `app-${applicationIdCounter++}`,
  company: 'Test Company',
  role: 'Software Engineer',
  level: 'SENIOR',
  status: 'APPLIED',
  appliedAt: '2025-01-15T10:00:00Z',
  lastUpdate: '2025-01-20T14:30:00Z',
  statusChangedAt: '2025-01-18T09:00:00Z',
  interviewDate: null,
  salaryMin: 100000,
  salaryMax: 150000,
  location: 'San Francisco, CA',
  rtoType: 'REMOTE',
  jobUrl: 'https://example.com/job',
  jobDescription: 'We are looking for a talented engineer.',
  contactName: 'Jane Smith',
  contactEmail: 'jane@example.com',
  contactPhone: '(555) 123-4567',
  notes: '',
  ...overrides,
});

/**
 * Creates a mock application object in backend API format.
 *
 * @param {Object} overrides - Properties to override in the default application
 * @returns {Object} Mock application object in backend format
 *
 * @example
 * const app = createMockBackendApplication({ companyName: 'Backend Corp' });
 */
export const createMockBackendApplication = (overrides = {}) => ({
  id: overrides.id || Math.random().toString(36).substr(2, 9),
  companyName: 'Test Company',
  positionTitle: 'Software Engineer',
  status: 'APPLIED',
  appliedDate: '2025-01-15T10:00:00',
  statusChangedAt: '2025-01-15T10:00:00',
  updatedAt: '2025-01-15T10:00:00',
  notes: '',
  jobUrl: '',
  salaryMin: null,
  salaryMax: null,
  location: '',
  rtoType: null,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  ...overrides,
});

/**
 * Creates a mock new application (empty object with default status, no id).
 * Used for testing "New Application" modal behavior.
 *
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock new application object
 *
 * @example
 * const newApp = createNewApplication();
 */
export const createNewApplication = (overrides = {}) => ({
  status: 'APPLIED',
  ...overrides,
});

/**
 * Creates a mock existing application for editing scenarios.
 * Includes an id to indicate this is an existing application.
 *
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock existing application object
 *
 * @example
 * const existingApp = createExistingApplication({ company: 'Edit Corp' });
 */
export const createExistingApplication = (overrides = {}) => ({
  id: overrides.id || 'app-123',
  company: 'Test Company',
  role: 'Software Engineer',
  status: 'APPLIED',
  appliedAt: '2025-01-15T10:00:00Z',
  ...overrides,
});

/**
 * Generates an array of mock applications.
 *
 * @param {number} count - Number of applications to generate
 * @param {Function} customizer - Optional function to customize each app (receives index)
 * @returns {Array} Array of mock application objects
 *
 * @example
 * const apps = generateMockApplications(5);
 * const customApps = generateMockApplications(3, (i) => ({ company: `Company ${i + 1}` }));
 */
export const generateMockApplications = (count, customizer = () => ({})) => {
  return Array.from({ length: count }, (_, index) =>
    createMockApplication({
      id: `app-${index + 1}`,
      company: `Company ${index + 1}`,
      role: `Role ${index + 1}`,
      ...customizer(index),
    })
  );
};
