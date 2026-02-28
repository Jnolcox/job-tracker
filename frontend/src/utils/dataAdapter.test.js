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
} from './dataAdapter';

describe('dataAdapter', () => {
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
        lastUpdate: '2025-01-20T14:30:00', // statusChangedAt takes precedence
        notes: 'Some notes',
        jobDescription: 'Job description',
        interviewDate: null,
        salaryMin: 100000,
        salaryMax: 150000,
        location: 'San Francisco',
        rtoType: 'HYBRID_2',
        jobUrl: 'https://example.com/job',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '555-1234',
      });
    });

    it('should use appliedAt as lastUpdate fallback when statusChangedAt is null', () => {
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
        updatedAt: null,
      };

      const uiFormat = toUIFormat(backendApp);

      expect(uiFormat.appliedAt).toBe('2025-01-15T10:00:00');
      expect(uiFormat.lastUpdate).toBe('2025-01-20T14:30:00');
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
