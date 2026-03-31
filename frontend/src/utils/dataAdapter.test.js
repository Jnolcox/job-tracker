/**
 * @file dataAdapter.test.js
 * @description Tests for the dataAdapter utility functions
 *
 * Tests cover:
 * - toBackendFormat for creating new applications
 * - toBackendFormatForUpdate for updating existing applications
 * - Proper date handling to prevent all dates from being the same
 */

import {
  toBackendFormat,
  toBackendFormatForUpdate,
  toUIFormat,
  parseBackendDate,
} from './dataAdapter';

describe('dataAdapter', () => {
  describe('parseBackendDate', () => {
    it('should parse ISO string dates to Date objects', () => {
      const isoString = '2025-01-15T10:30:00Z';
      const result = parseBackendDate(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-01-15T10:30:00.000Z');
    });

    it('should parse epoch seconds (number) to Date objects', () => {
      // 1737024600 = Jan 16, 2025 10:30:00 UTC
      const epochSeconds = 1737024600;
      const result = parseBackendDate(epochSeconds);

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(0); // January
      expect(result.getUTCDate()).toBe(16);
    });

    it('should parse array format from Java LocalDateTime', () => {
      // [year, month, day, hour, minute, second]
      const arrayFormat = [2025, 1, 17, 14, 45, 30];
      const result = parseBackendDate(arrayFormat);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January (0-indexed in JS)
      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(45);
    });

    it('should return null for null input', () => {
      expect(parseBackendDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseBackendDate(undefined)).toBeNull();
    });

    it('should return null for invalid date strings', () => {
      expect(parseBackendDate('not-a-date')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseBackendDate('')).toBeNull();
    });

    it('should handle epoch value of 0 (1970-01-01)', () => {
      const result = parseBackendDate(0);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    });

    it('should handle ISO strings without timezone indicator', () => {
      const localDateString = '2025-01-15T10:00:00';
      const result = parseBackendDate(localDateString);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });
  });

  describe('toUIFormat', () => {
    it('should convert backend application to UI format', () => {
      const backendApp = {
        id: 1,
        companyName: 'Test Company',
        positionTitle: 'Software Engineer',
        status: 'APPLIED',
        appliedDate: '2025-01-15T10:00:00',
        statusChangedAt: '2025-01-20T14:30:00',
        updatedAt: '2025-01-21T09:00:00',
        notes: 'Some notes',
        jobDescription: 'Job description',
        salaryMin: 100000,
        salaryMax: 150000,
        location: 'San Francisco',
        rtoType: 'HYBRID_2',
        jobUrl: 'https://example.com/job',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '555-1234',
      };

      const result = toUIFormat(backendApp);

      expect(result).toEqual({
        id: 1,
        company: 'Test Company',
        role: 'Software Engineer',
        status: 'APPLIED',
        appliedAt: '2025-01-15T10:00:00',
        lastUpdate: '2025-01-21T09:00:00', // updatedAt is used for lastUpdate
        statusChangedAt: '2025-01-20T14:30:00', // statusChangedAt for Status Age
        notes: 'Some notes',
        jobDescription: 'Job description',
        interviewDate: null,
        salaryMin: 100000,
        salaryMax: 150000,
        location: 'San Francisco',
        rtoType: 'HYBRID_2',
        level: null,
        jobUrl: 'https://example.com/job',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '555-1234',
      });
    });

    it('should use appliedAt as fallback when updatedAt/statusChangedAt are null', () => {
      const backendApp = {
        id: 1,
        companyName: 'Test Company',
        positionTitle: 'Engineer',
        status: 'APPLIED',
        appliedDate: '2025-01-15T10:00:00',
        statusChangedAt: null,
        updatedAt: null,
      };

      const result = toUIFormat(backendApp);

      expect(result.lastUpdate).toBe('2025-01-15T10:00:00');
      expect(result.statusChangedAt).toBe('2025-01-15T10:00:00');
    });
  });

  describe('toBackendFormat for create', () => {
    it('should send appliedDate for new application', () => {
      const form = {
        company: 'New Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: '2025-02-15T10:00:00.000Z',
        notes: 'New notes',
      };

      const result = toBackendFormat(form);

      expect(result.companyName).toBe('New Company');
      expect(result.positionTitle).toBe('Developer');
      expect(result.appliedDate).toBeDefined();
      expect(result.appliedDate).toContain('2025-02-15');
    });

    it('should NOT send statusChangedAt for new application (backend defaults it)', () => {
      const form = {
        company: 'New Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: '2025-02-15T10:00:00.000Z',
        lastUpdate: '2025-02-15T10:00:00.000Z', // Even if UI has this value
      };

      const result = toBackendFormat(form);

      // statusChangedAt should NOT be sent for creates - let backend default it
      expect(result.statusChangedAt).toBeUndefined();
    });

    it('should handle null appliedAt by sending null', () => {
      const form = {
        company: 'Test Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: null,
      };

      const result = toBackendFormat(form);

      expect(result.appliedDate).toBeNull();
    });

    it('should include interviewDate for new application when provided', () => {
      const form = {
        company: 'Test Company',
        role: 'Developer',
        status: 'TECH_SCREEN',
        appliedAt: '2025-01-15T10:00:00.000Z',
        interviewDate: '2025-02-20T14:00:00.000Z',
      };

      const result = toBackendFormat(form);

      expect(result.interviewDate).toBeDefined();
      expect(result.interviewDate).toBe('2025-02-20T14:00:00.000Z');
    });

    it('should handle null interviewDate for new application', () => {
      const form = {
        company: 'Test Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: '2025-01-15T10:00:00.000Z',
        interviewDate: null,
      };

      const result = toBackendFormat(form);

      expect(result.interviewDate).toBeNull();
    });

    it('should include all standard fields', () => {
      const form = {
        company: 'Test Company',
        role: 'Developer',
        status: 'TECH_SCREEN',
        appliedAt: '2025-02-15T10:00:00.000Z',
        notes: 'Some notes',
        jobDescription: 'Description',
        salaryMin: 100000,
        salaryMax: 150000,
        location: 'NYC',
        rtoType: 'REMOTE',
        jobUrl: 'https://example.com',
        contactName: 'Jane',
        contactEmail: 'jane@example.com',
        contactPhone: '555-0000',
      };

      const result = toBackendFormat(form);

      expect(result.companyName).toBe('Test Company');
      expect(result.positionTitle).toBe('Developer');
      expect(result.status).toBe('TECH_SCREEN');
      expect(result.notes).toBe('Some notes');
      expect(result.jobDescription).toBe('Description');
      expect(result.salaryMin).toBe(100000);
      expect(result.salaryMax).toBe(150000);
      expect(result.location).toBe('NYC');
      expect(result.rtoType).toBe('REMOTE');
      expect(result.jobUrl).toBe('https://example.com');
      expect(result.contactName).toBe('Jane');
      expect(result.contactEmail).toBe('jane@example.com');
      expect(result.contactPhone).toBe('555-0000');
    });
  });

  describe('toBackendFormatForUpdate', () => {
    const createOriginalData = () => ({
      id: 1,
      company: 'Original Company',
      role: 'Original Role',
      status: 'APPLIED',
      appliedAt: '2025-01-15T10:00:00.000Z',
      lastUpdate: '2025-01-15T10:00:00.000Z',
      notes: 'Original notes',
      salaryMin: 100000,
      salaryMax: 150000,
    });

    describe('when status has NOT changed', () => {
      it('should NOT include statusChangedAt if user did not edit it', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          notes: 'Updated notes', // Only notes changed
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.statusChangedAt).toBeUndefined();
      });

      it('should include statusChangedAt if user manually edited it', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          lastUpdate: '2025-02-20T14:00:00.000Z', // User changed this
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.statusChangedAt).toBeDefined();
        expect(result.statusChangedAt).toContain('2025-02-20');
      });

      it('should include statusChangedAt even for small time differences when user edited it', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          lastUpdate: '2025-01-15T11:00:00.000Z', // 1 hour later
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        // User explicitly changed the time, so we should send it
        expect(result.statusChangedAt).toBeDefined();
      });
    });

    describe('when status HAS changed', () => {
      it('should NOT include statusChangedAt even if user edited it (backend will set it)', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          status: 'RECRUITER_SCREEN', // Status changed
          lastUpdate: '2025-02-25T10:00:00.000Z', // User also changed this
        };
        const statusChanged = true;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        // When status changes, let backend handle statusChangedAt
        expect(result.statusChangedAt).toBeUndefined();
      });

      it('should NOT include statusChangedAt when status changes to any value', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          status: 'REJECTED',
        };
        const statusChanged = true;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.statusChangedAt).toBeUndefined();
      });
    });

    describe('appliedDate handling', () => {
      it('should NOT include appliedDate if it has not changed', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          notes: 'Updated notes',
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.appliedDate).toBeUndefined();
      });

      it('should include appliedDate if user changed it', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          appliedAt: '2025-02-01T10:00:00.000Z', // User backdated it
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.appliedDate).toBeDefined();
        expect(result.appliedDate).toContain('2025-02-01');
      });

      it('should detect date change when only time portion differs', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          appliedAt: '2025-01-15T14:30:00.000Z', // Same day, different time
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        // Time change should be detected
        expect(result.appliedDate).toBeDefined();
      });
    });

    describe('always included fields', () => {
      it('should always include core required fields', () => {
        const originalData = createOriginalData();
        const form = { ...originalData };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.companyName).toBe('Original Company');
        expect(result.positionTitle).toBe('Original Role');
        expect(result.status).toBe('APPLIED');
      });

      it('should include all editable fields', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          notes: 'Updated notes',
          jobDescription: 'Updated description',
          salaryMin: 120000,
          salaryMax: 180000,
          location: 'Remote',
          rtoType: 'REMOTE',
          jobUrl: 'https://newurl.com',
          contactName: 'New Contact',
          contactEmail: 'new@example.com',
          contactPhone: '555-9999',
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.notes).toBe('Updated notes');
        expect(result.jobDescription).toBe('Updated description');
        expect(result.salaryMin).toBe(120000);
        expect(result.salaryMax).toBe(180000);
        expect(result.location).toBe('Remote');
        expect(result.rtoType).toBe('REMOTE');
        expect(result.jobUrl).toBe('https://newurl.com');
        expect(result.contactName).toBe('New Contact');
        expect(result.contactEmail).toBe('new@example.com');
        expect(result.contactPhone).toBe('555-9999');
      });
    });

    describe('edge cases', () => {
      it('should handle null originalData.appliedAt', () => {
        const originalData = {
          ...createOriginalData(),
          appliedAt: null,
        };
        const form = {
          ...originalData,
          appliedAt: '2025-02-15T10:00:00.000Z',
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.appliedDate).toBeDefined();
      });

      it('should handle null originalData.lastUpdate', () => {
        const originalData = {
          ...createOriginalData(),
          lastUpdate: null,
        };
        const form = {
          ...originalData,
          lastUpdate: '2025-02-15T10:00:00.000Z',
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.statusChangedAt).toBeDefined();
      });

      it('should handle empty strings as null', () => {
        const originalData = createOriginalData();
        const form = {
          ...originalData,
          notes: '',
          jobDescription: '',
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.notes).toBeNull();
        expect(result.jobDescription).toBeNull();
      });

      it('should NOT include interviewDate if it has not changed', () => {
        const originalData = {
          ...createOriginalData(),
          interviewDate: '2025-02-20T14:00:00.000Z',
        };
        const form = { ...originalData }; // No changes
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.interviewDate).toBeUndefined();
      });

      it('should include interviewDate if user changed it', () => {
        const originalData = {
          ...createOriginalData(),
          interviewDate: '2025-02-20T14:00:00.000Z',
        };
        const form = {
          ...originalData,
          interviewDate: '2025-02-25T10:00:00.000Z', // User changed the date
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.interviewDate).toBeDefined();
        expect(result.interviewDate).toBe('2025-02-25T10:00:00.000Z');
      });

      it('should include interviewDate if user sets it from null', () => {
        const originalData = {
          ...createOriginalData(),
          interviewDate: null,
        };
        const form = {
          ...originalData,
          interviewDate: '2025-02-25T10:00:00.000Z', // User set a new date
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.interviewDate).toBeDefined();
        expect(result.interviewDate).toBe('2025-02-25T10:00:00.000Z');
      });

      it('should include interviewDate as null if user clears it', () => {
        const originalData = {
          ...createOriginalData(),
          interviewDate: '2025-02-20T14:00:00.000Z',
        };
        const form = {
          ...originalData,
          interviewDate: null, // User cleared the date
        };
        const statusChanged = false;

        const result = toBackendFormatForUpdate(form, originalData, statusChanged);

        expect(result.interviewDate).toBeDefined();
        expect(result.interviewDate).toBeNull();
      });
    });
  });

  describe('date comparison edge cases', () => {
    it('should treat different ISO string formats of same date as equal', () => {
      const originalData = {
        id: 1,
        company: 'Test',
        role: 'Dev',
        status: 'APPLIED',
        appliedAt: '2025-01-15T10:00:00.000Z',
        lastUpdate: '2025-01-15T10:00:00.000Z',
      };

      // Same moment but potentially different string representation
      const form = {
        ...originalData,
        appliedAt: '2025-01-15T10:00:00Z', // Without milliseconds
      };
      const statusChanged = false;

      const result = toBackendFormatForUpdate(form, originalData, statusChanged);

      // Same date should not trigger appliedDate to be sent
      expect(result.appliedDate).toBeUndefined();
    });

    it('should handle LocalDateTime array format from backend', () => {
      // Backend might return dates as arrays
      const backendApp = {
        id: 1,
        companyName: 'Test',
        positionTitle: 'Dev',
        status: 'APPLIED',
        appliedDate: [2025, 1, 15, 10, 0, 0], // LocalDateTime array format
        statusChangedAt: [2025, 1, 20, 14, 30, 0],
        updatedAt: [2025, 1, 21, 9, 0, 0],
      };

      const uiFormat = toUIFormat(backendApp);

      expect(uiFormat.appliedAt).toBe('2025-01-15T10:00:00');
      expect(uiFormat.lastUpdate).toBe('2025-01-21T09:00:00'); // updatedAt
      expect(uiFormat.statusChangedAt).toBe('2025-01-20T14:30:00'); // statusChangedAt
    });

    it('should handle epoch seconds format from backend (java.time.Instant)', () => {
      // Backend returns dates as epoch seconds when using Instant type
      // 1769644800 = 2026-01-29T00:00:00.000Z
      // 1771993345 = 2026-02-25T04:22:25.000Z
      // 1772079745 = 2026-02-26T04:22:25.000Z
      const backendApp = {
        id: 1,
        companyName: 'Test',
        positionTitle: 'Dev',
        status: 'APPLIED',
        appliedDate: 1769644800.0, // Epoch seconds
        statusChangedAt: 1771993345.0,
        updatedAt: 1772079745.0,
      };

      const uiFormat = toUIFormat(backendApp);

      // Should convert epoch seconds to ISO string
      expect(uiFormat.appliedAt).toBe('2026-01-29T00:00:00.000Z');
      expect(uiFormat.lastUpdate).toBe('2026-02-26T04:22:25.000Z'); // updatedAt
      expect(uiFormat.statusChangedAt).toBe('2026-02-25T04:22:25.000Z'); // statusChangedAt
    });

    it('should handle epoch seconds with fractional values', () => {
      const backendApp = {
        id: 1,
        companyName: 'Test',
        positionTitle: 'Dev',
        status: 'APPLIED',
        appliedDate: 1769644800.5, // Epoch seconds with fractional part
        statusChangedAt: null,
        updatedAt: null,
      };

      const uiFormat = toUIFormat(backendApp);

      // Should still convert correctly (fractional seconds become milliseconds)
      expect(uiFormat.appliedAt).toContain('2026-01-29');
    });

    it('should handle epoch value of 0 (1970-01-01)', () => {
      const backendApp = {
        id: 1,
        companyName: 'Test',
        positionTitle: 'Dev',
        status: 'APPLIED',
        appliedDate: 0, // Edge case: Unix epoch
        statusChangedAt: null,
        updatedAt: null,
      };

      const uiFormat = toUIFormat(backendApp);

      // 0 should be treated as a valid date, not as falsy
      expect(uiFormat.appliedAt).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  /**
   * Bug fix tests: Date editing in Modal not persisting
   * Issue: When user edits dates in the Modal, changes don't persist
   */
  describe('Bug: Date editing in Modal should persist', () => {
    // Helper to simulate toLocalDateTimeInput from newUI.jsx
    const toLocalDateTimeInput = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Helper to simulate how the Modal converts datetime-local input value
    const convertDateTimeInputToISO = (inputValue) => {
      return inputValue ? new Date(inputValue).toISOString() : null;
    };

    it('should include appliedDate when user changes the date in Modal', () => {
      // Original data from backend (simulating what toUIFormat returns)
      const originalData = {
        id: 1,
        company: 'Test Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: '2025-01-15T10:00:00.000Z',
        lastUpdate: '2025-01-15T10:00:00.000Z',
      };

      // User opens Modal, sees date displayed via toLocalDateTimeInput
      const displayedDate = toLocalDateTimeInput(originalData.appliedAt);

      // User changes the date in the datetime-local input
      const newInputValue = '2025-01-20T14:30'; // User picks a new date
      const newAppliedAt = convertDateTimeInputToISO(newInputValue);

      const formData = {
        ...originalData,
        appliedAt: newAppliedAt,
      };

      const statusChanged = false;
      const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

      // appliedDate MUST be included since user changed it
      expect(backendData.appliedDate).toBeDefined();
      expect(backendData.appliedDate).not.toBeNull();
    });

    it('should include statusChangedAt (lastUpdate) when user changes the date in Modal', () => {
      const originalData = {
        id: 1,
        company: 'Test Company',
        role: 'Developer',
        status: 'RECRUITER_SCREEN',
        appliedAt: '2025-01-15T10:00:00.000Z',
        lastUpdate: '2025-01-20T10:00:00.000Z',
      };

      // User changes the status changed date (lastUpdate)
      const newInputValue = '2025-01-25T16:00';
      const newLastUpdate = convertDateTimeInputToISO(newInputValue);

      const formData = {
        ...originalData,
        lastUpdate: newLastUpdate,
      };

      // Status did NOT change, so user's date edit should be respected
      const statusChanged = false;
      const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

      // statusChangedAt MUST be included since user manually edited it
      expect(backendData.statusChangedAt).toBeDefined();
      expect(backendData.statusChangedAt).not.toBeNull();
    });

    it('should correctly detect date change even when original has no timezone indicator', () => {
      // Backend might return dates without 'Z' suffix (LocalDateTime format)
      const originalData = {
        id: 1,
        company: 'Test Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: '2025-01-15T10:00:00', // No 'Z' - common format from backend
        lastUpdate: '2025-01-15T10:00:00',
      };

      // User changes date
      const newInputValue = '2025-01-20T14:30';
      const newAppliedAt = convertDateTimeInputToISO(newInputValue);

      const formData = {
        ...originalData,
        appliedAt: newAppliedAt,
      };

      const statusChanged = false;
      const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

      // appliedDate MUST be included
      expect(backendData.appliedDate).toBeDefined();
    });

    it('should NOT include appliedDate when user does not change it (just opens and saves)', () => {
      const originalData = {
        id: 1,
        company: 'Test Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: '2025-01-15T10:00:00.000Z',
        lastUpdate: '2025-01-15T10:00:00.000Z',
        notes: 'Original notes',
      };

      // User only changes notes, not the date
      const formData = {
        ...originalData,
        notes: 'Updated notes',
      };

      const statusChanged = false;
      const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

      // appliedDate should NOT be included since it wasn't changed
      expect(backendData.appliedDate).toBeUndefined();
    });

    it('BUG SCENARIO: should handle date format mismatch between backend and UI conversion', () => {
      // This tests the EXACT scenario causing the bug:
      // 1. Backend returns date WITHOUT 'Z' suffix (LocalDateTime format)
      // 2. toUIFormat keeps it as-is: '2025-01-15T10:00:00'
      // 3. User edits date, onChange converts via toISOString() which adds 'Z'
      // 4. areDatesEqual compares them - but timezone interpretation differs!

      // Simulating backend response via toUIFormat (no Z suffix)
      const backendDateWithoutZ = '2025-01-15T10:00:00';

      // User changes to a NEW date
      const userEditedDate = '2025-01-20T14:30';
      const convertedUserDate = new Date(userEditedDate).toISOString();

      const originalData = {
        id: 1,
        company: 'Test Company',
        role: 'Developer',
        status: 'APPLIED',
        appliedAt: backendDateWithoutZ,
        lastUpdate: backendDateWithoutZ,
      };

      const formData = {
        ...originalData,
        appliedAt: convertedUserDate, // User changed the date
      };

      const statusChanged = false;
      const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

      // appliedDate MUST be included since user changed it
      expect(backendData.appliedDate).toBeDefined();
      expect(backendData.appliedDate).toContain('2025-01-20');
    });

    it('CRITICAL: should properly compare dates with different timezone formats', () => {
      // The most subtle bug case: same logical date, different string formats
      // Backend: '2025-01-15T10:00:00' (interpreted as LOCAL)
      // After UI conversion: '2025-01-15T18:00:00.000Z' (UTC, assuming PST offset)
      // These are the SAME moment in time, but different strings

      // This test verifies the comparison handles this correctly
      // The user should NOT see a false positive "date changed" when they didn't change it

      const backendDate = '2025-01-15T10:00:00'; // No Z - local time
      const sameTimeAsUTC = new Date('2025-01-15T10:00:00').toISOString(); // Converts to UTC

      const originalData = {
        id: 1,
        company: 'Test',
        role: 'Dev',
        status: 'APPLIED',
        appliedAt: backendDate,
        lastUpdate: backendDate,
      };

      // Form has the same date but in ISO format (as would happen if user clicks input)
      const formData = {
        ...originalData,
        appliedAt: sameTimeAsUTC, // Same moment, different format
      };

      const statusChanged = false;
      const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

      // appliedDate should NOT be included - the dates represent the same moment
      expect(backendData.appliedDate).toBeUndefined();
    });
  });

  /**
   * Integration scenarios testing the full flow
   */
  describe('Integration scenarios', () => {
    describe('Create flow', () => {
      it('should produce correct backend data for new application creation', () => {
        // Simulate what happens when user creates a new application
        const newApplicationForm = {
          company: 'Acme Corp',
          role: 'Senior Developer',
          status: 'APPLIED',
          appliedAt: '2025-02-15T10:00:00.000Z',
          lastUpdate: '2025-02-15T10:00:00.000Z', // UI might set this, but it should be ignored
          notes: 'Great opportunity',
          salaryMin: 150000,
          salaryMax: 200000,
          location: 'Remote',
          rtoType: 'REMOTE',
        };

        const backendData = toBackendFormat(newApplicationForm);

        // Verify appliedDate is sent
        expect(backendData.appliedDate).toContain('2025-02-15');

        // Verify statusChangedAt is NOT sent (backend will default it)
        expect(backendData.statusChangedAt).toBeUndefined();

        // Verify other fields are correct
        expect(backendData.companyName).toBe('Acme Corp');
        expect(backendData.positionTitle).toBe('Senior Developer');
        expect(backendData.status).toBe('APPLIED');
      });
    });

    describe('Update flow - only notes changed', () => {
      it('should not send any dates when only notes are updated', () => {
        const originalData = {
          id: 123,
          company: 'Acme Corp',
          role: 'Developer',
          status: 'APPLIED',
          appliedAt: '2025-01-15T10:00:00.000Z',
          lastUpdate: '2025-01-15T10:00:00.000Z',
          notes: 'Original note',
        };

        const formData = {
          ...originalData,
          notes: 'Updated note with more details',
        };

        const statusChanged = formData.status !== originalData.status;
        const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

        // Neither date should be sent
        expect(backendData.appliedDate).toBeUndefined();
        expect(backendData.statusChangedAt).toBeUndefined();

        // Notes should be updated
        expect(backendData.notes).toBe('Updated note with more details');
      });
    });

    describe('Update flow - status changed', () => {
      it('should not send statusChangedAt when status changes (let backend handle it)', () => {
        const originalData = {
          id: 123,
          company: 'Acme Corp',
          role: 'Developer',
          status: 'APPLIED',
          appliedAt: '2025-01-15T10:00:00.000Z',
          lastUpdate: '2025-01-15T10:00:00.000Z',
        };

        const formData = {
          ...originalData,
          status: 'RECRUITER_SCREEN',
          // User might have also edited lastUpdate, but it should be ignored
          lastUpdate: '2025-02-20T14:00:00.000Z',
        };

        const statusChanged = formData.status !== originalData.status;
        expect(statusChanged).toBe(true);

        const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

        // statusChangedAt should NOT be sent
        expect(backendData.statusChangedAt).toBeUndefined();

        // Status should be updated
        expect(backendData.status).toBe('RECRUITER_SCREEN');
      });
    });

    describe('Update flow - manual backfill of statusChangedAt', () => {
      it('should send statusChangedAt when user manually edits it without changing status', () => {
        // Use case: User is backfilling historical data
        const originalData = {
          id: 123,
          company: 'Acme Corp',
          role: 'Developer',
          status: 'RECRUITER_SCREEN',
          appliedAt: '2025-01-15T10:00:00.000Z',
          lastUpdate: '2025-01-20T10:00:00.000Z',
        };

        const formData = {
          ...originalData,
          // User manually backdates when the status actually changed
          lastUpdate: '2025-01-18T14:30:00.000Z',
        };

        const statusChanged = formData.status !== originalData.status;
        expect(statusChanged).toBe(false);

        const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

        // statusChangedAt SHOULD be sent since user manually edited it
        expect(backendData.statusChangedAt).toBeDefined();
        expect(backendData.statusChangedAt).toContain('2025-01-18');
      });
    });

    describe('Update flow - backdating appliedDate', () => {
      it('should send appliedDate when user backdates when they applied', () => {
        const originalData = {
          id: 123,
          company: 'Acme Corp',
          role: 'Developer',
          status: 'APPLIED',
          appliedAt: '2025-01-15T10:00:00.000Z',
          lastUpdate: '2025-01-15T10:00:00.000Z',
        };

        const formData = {
          ...originalData,
          // User realizes they applied a week earlier
          appliedAt: '2025-01-08T10:00:00.000Z',
        };

        const statusChanged = false;
        const backendData = toBackendFormatForUpdate(formData, originalData, statusChanged);

        // appliedDate should be sent
        expect(backendData.appliedDate).toBeDefined();
        expect(backendData.appliedDate).toContain('2025-01-08');
      });
    });

    describe('Round-trip conversion', () => {
      it('should preserve data through UI->backend->UI conversion for create', () => {
        const initialForm = {
          company: 'Test Corp',
          role: 'Engineer',
          status: 'APPLIED',
          appliedAt: '2025-02-15T10:00:00.000Z',
          notes: 'Test notes',
          salaryMin: 100000,
          salaryMax: 150000,
        };

        const backendData = toBackendFormat(initialForm);

        // Simulate backend response (add id and statusChangedAt)
        const backendResponse = {
          id: 999,
          ...backendData,
          statusChangedAt: '2025-02-15T10:00:00.000Z', // Backend sets this
          updatedAt: '2025-02-15T10:00:00.000Z',
        };

        const uiData = toUIFormat(backendResponse);

        expect(uiData.company).toBe(initialForm.company);
        expect(uiData.role).toBe(initialForm.role);
        expect(uiData.status).toBe(initialForm.status);
        expect(uiData.notes).toBe(initialForm.notes);
        expect(uiData.salaryMin).toBe(initialForm.salaryMin);
        expect(uiData.salaryMax).toBe(initialForm.salaryMax);
      });
    });
  });
});
