/**
 * @file date.js
 * @description Utilities for mocking Date in tests.
 *
 * Provides a clean API for mocking the current date/time in tests,
 * with automatic cleanup support.
 *
 * @example
 * // In a test file
 * import { mockDate, restoreDate, withMockedDate } from '../../test-utils/helpers/date';
 *
 * describe('MyComponent', () => {
 *   afterEach(() => {
 *     restoreDate();
 *   });
 *
 *   it('should show correct date', () => {
 *     mockDate('2025-01-15T10:00:00Z');
 *     // ... test code
 *   });
 * });
 *
 * // Or use the helper that auto-restores
 * it('should work', () => {
 *   withMockedDate('2025-01-15T10:00:00Z', () => {
 *     // ... test code
 *   });
 * });
 */

// Store reference to the real Date constructor
const RealDate = global.Date;

// Track if Date is currently mocked
let isMocked = false;

/**
 * Mocks the global Date to return a fixed date for `new Date()` and `Date.now()`.
 *
 * @param {string|Date} mockDateValue - The date to mock (ISO string or Date object)
 * @returns {Date} The mocked Date instance for reference
 *
 * @example
 * mockDate('2025-01-15T10:00:00Z');
 * console.log(new Date()); // Always returns Jan 15, 2025
 * console.log(Date.now()); // Always returns the timestamp for Jan 15, 2025
 */
export const mockDate = (mockDateValue) => {
  const mockDateInstance =
    mockDateValue instanceof RealDate ? mockDateValue : new RealDate(mockDateValue);

  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        // new Date() - return the mocked date
        return new RealDate(mockDateInstance);
      }
      // new Date(args) - use the real Date constructor
      return new RealDate(...args);
    }

    static now() {
      return mockDateInstance.getTime();
    }
  }

  // Copy static methods from RealDate
  MockDate.UTC = RealDate.UTC;
  MockDate.parse = RealDate.parse;

  global.Date = MockDate;
  isMocked = true;

  return mockDateInstance;
};

/**
 * Restores the global Date to the original implementation.
 * Safe to call even if Date was not mocked.
 *
 * @example
 * afterEach(() => {
 *   restoreDate();
 * });
 */
export const restoreDate = () => {
  if (isMocked) {
    global.Date = RealDate;
    isMocked = false;
  }
};

/**
 * Executes a callback with a mocked date, then restores the original Date.
 * Useful for one-off date mocking in a single test.
 *
 * @param {string|Date} mockDateValue - The date to mock
 * @param {Function} callback - The function to execute with the mocked date
 * @returns {*} The return value of the callback
 *
 * @example
 * const result = withMockedDate('2025-01-15T10:00:00Z', () => {
 *   return someFunction();
 * });
 */
export const withMockedDate = (mockDateValue, callback) => {
  mockDate(mockDateValue);
  try {
    return callback();
  } finally {
    restoreDate();
  }
};

/**
 * Creates a beforeAll/afterAll pair for mocking dates in a describe block.
 * Returns an object with setup and teardown functions.
 *
 * @param {string|Date} mockDateValue - The date to mock
 * @returns {Object} Object with beforeAll and afterAll functions
 *
 * @example
 * describe('MyComponent', () => {
 *   const dateMock = createDateMock('2025-01-20T10:00:00Z');
 *
 *   beforeAll(() => dateMock.setup());
 *   afterAll(() => dateMock.teardown());
 *
 *   it('should work', () => {
 *     // Date is mocked for all tests in this describe block
 *   });
 * });
 */
export const createDateMock = (mockDateValue) => {
  return {
    setup: () => mockDate(mockDateValue),
    teardown: () => restoreDate(),
  };
};

/**
 * Gets the real Date constructor, useful when you need to create
 * a real Date while Date is mocked.
 *
 * @returns {DateConstructor} The original Date constructor
 *
 * @example
 * mockDate('2025-01-15T10:00:00Z');
 * const realDate = getRealDate();
 * const now = new realDate(); // Gets the actual current time
 */
export const getRealDate = () => RealDate;
