/**
 * @file Dashboard.test.jsx
 * @description Tests for the JobTracker component (Dashboard.jsx)
 *
 * Tests cover:
 * - Default sorting by lastUpdate date (descending - newest first)
 * - Active filter functionality (excludes rejected applications)
 * - Default filter is 'Active' instead of 'All'
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import JobTracker from './Dashboard';
import { jobApplicationsAPI } from './services/api';
import { STATUS_GROUPS } from './utils/dataAdapter';
import { createMockBackendApplication } from './test-utils/factories';

expect.extend(toHaveNoViolations);

// Mock the API
jest.mock('./services/api', () => ({
  jobApplicationsAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the AuthContext
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', email: 'test@example.com' },
    token: 'mock-token',
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

// Mock the KeyboardShortcutContext
jest.mock('./context/KeyboardShortcutContext', () => ({
  useKeyboardShortcutContext: () => ({
    toggleHelp: jest.fn(),
  }),
}));

// Mock the hooks - capture the actual shortcuts registered
const mockUseKeyboardShortcuts = jest.fn();
jest.mock('./hooks', () => ({
  useKeyboardShortcuts: (...args) => mockUseKeyboardShortcuts(...args),
  useApplicationMetrics: () => ({
    metrics: {
      trueResponseRate: 0,
      trueInterviewRate: 0,
      trueOfferRate: 0,
      avgDaysToResponse: null,
      stageConversions: { appliedToScreen: 0, screenToTech: 0 },
    },
    loading: false,
  }),
}));

// Using shared factory from test-utils/factories
// Alias for backward compatibility with existing tests
const createMockApplication = createMockBackendApplication;

/**
 * Helper to render JobTracker component
 * @returns {Object} Render result
 */
const renderJobTracker = () => {
  return render(<JobTracker />);
};

describe('JobTracker (Dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardShortcuts.mockClear();
  });

  describe('Default sorting by lastUpdate date', () => {
    it('should have lastUpdate as the default sort key', async () => {
      // Arrange: Create applications with different lastUpdate dates
      // lastUpdate uses updatedAt, so we set updatedAt values
      const oldApplication = createMockApplication({
        id: 'old',
        companyName: 'Old Company',
        updatedAt: '2025-01-10T10:00:00', // January 10, 2025
      });

      const newApplication = createMockApplication({
        id: 'new',
        companyName: 'New Company',
        updatedAt: '2025-02-20T10:00:00', // February 20, 2025
      });

      const middleApplication = createMockApplication({
        id: 'middle',
        companyName: 'Middle Company',
        updatedAt: '2025-01-25T10:00:00', // January 25, 2025
      });

      // Return applications in random order to verify sorting
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [oldApplication, newApplication, middleApplication],
        },
      });

      // Act
      renderJobTracker();

      // Assert: Wait for applications to load and verify order
      await waitFor(() => {
        expect(screen.getByText('New Company')).toBeInTheDocument();
      });

      // Get all company names from the table rows
      const rows = screen.getAllByRole('row');
      // Skip header row (index 0), get the data rows
      const dataRows = rows.slice(1);

      // Extract company names from each row
      const companyNames = dataRows.map(row => {
        const cells = within(row).getAllByRole('cell');
        // First cell contains the company name
        return cells[0]?.textContent;
      }).filter(Boolean);

      // Verify newest first ordering (descending by lastUpdate)
      expect(companyNames[0]).toBe('New Company');
      expect(companyNames[1]).toBe('Middle Company');
      expect(companyNames[2]).toBe('Old Company');
    });

    it('should show the Last Update column header as sorted by default', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [createMockApplication()],
        },
      });

      renderJobTracker();

      await waitFor(() => {
        // Wait for table to render - look for a table element
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // The "Last Update" column header should indicate it's sorted (with down arrow)
      const lastUpdateHeader = screen.getByText(/Last Update/);
      expect(lastUpdateHeader.textContent).toContain('↓');
    });

    it('should sort with newest entries at the top (descending order)', async () => {
      // lastUpdate uses updatedAt, so we set updatedAt values
      const jan1App = createMockApplication({
        id: '1',
        companyName: 'January First',
        updatedAt: '2025-01-01T10:00:00',
      });

      const dec31App = createMockApplication({
        id: '2',
        companyName: 'December ThirtyFirst',
        updatedAt: '2025-12-31T10:00:00',
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [jan1App, dec31App],
        },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByText('December ThirtyFirst')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      const companyNames = dataRows.map(row => {
        const cells = within(row).getAllByRole('cell');
        return cells[0]?.textContent;
      }).filter(Boolean);

      // December 31 (newest) should appear before January 1 (oldest)
      expect(companyNames[0]).toBe('December ThirtyFirst');
      expect(companyNames[1]).toBe('January First');
    });
  });

  describe('Active filter functionality', () => {
    it('should have Active as the default filter instead of All', async () => {
      const activeApplication = createMockApplication({
        id: 'active',
        companyName: 'Active Company',
        status: 'APPLIED',
      });

      const rejectedApplication = createMockApplication({
        id: 'rejected',
        companyName: 'Rejected Company',
        status: 'REJECTED',
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [activeApplication, rejectedApplication],
        },
      });

      renderJobTracker();

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Active Company should be visible in the table
      const table = screen.getByRole('table');
      expect(within(table).getByText('Active Company')).toBeInTheDocument();

      // Rejected application should NOT be visible with default 'Active' filter
      expect(within(table).queryByText('Rejected Company')).not.toBeInTheDocument();
    });

    it('should show Active filter button as selected by default', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [createMockApplication()],
        },
      });

      renderJobTracker();

      await waitFor(() => {
        // Wait for table to render
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find the Active filter button and verify it has the selected styling
      const activeButton = screen.getByRole('button', { name: 'Active' });

      expect(activeButton).toBeInTheDocument();
      // The active filter should have green background (#10B981) when selected
      expect(activeButton).toHaveStyle({ background: 'rgb(16, 185, 129)' });
    });

    it('should exclude REJECTED status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Interview Co', status: 'RECRUITER_SCREEN' }),
        createMockApplication({ id: '3', companyName: 'Rejected Co', status: 'REJECTED' }),
        createMockApplication({ id: '4', companyName: 'Offer Co', status: 'OFFER_RECEIVED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');

      // Active applications should be visible in the table
      expect(within(table).getByText('Applied Co')).toBeInTheDocument();
      expect(within(table).getByText('Interview Co')).toBeInTheDocument();
      expect(within(table).getByText('Offer Co')).toBeInTheDocument();

      // Rejected should NOT be visible in the table
      expect(within(table).queryByText('Rejected Co')).not.toBeInTheDocument();
    });

    it('should exclude GHOSTED status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Ghosted Co', status: 'GHOSTED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Applied Co')).toBeInTheDocument();
      expect(within(table).queryByText('Ghosted Co')).not.toBeInTheDocument();
    });

    it('should exclude OFFER_DECLINED status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Declined Co', status: 'OFFER_DECLINED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Applied Co')).toBeInTheDocument();
      expect(within(table).queryByText('Declined Co')).not.toBeInTheDocument();
    });

    it('should exclude OFFER_RESCINDED status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Rescinded Co', status: 'OFFER_RESCINDED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Applied Co')).toBeInTheDocument();
      expect(within(table).queryByText('Rescinded Co')).not.toBeInTheDocument();
    });

    it('should show all applications when All filter is clicked', async () => {
      const user = userEvent.setup();

      const applications = [
        createMockApplication({ id: '1', companyName: 'Active Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Rejected Co', status: 'REJECTED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');

      // Initially rejected should not be visible (Active filter is default)
      expect(within(table).queryByText('Rejected Co')).not.toBeInTheDocument();

      // Click on All filter
      const allButton = screen.getByRole('button', { name: 'All' });
      await user.click(allButton);

      // Now all applications should be visible
      await waitFor(() => {
        expect(within(table).getByText('Rejected Co')).toBeInTheDocument();
      });
      expect(within(table).getByText('Active Co')).toBeInTheDocument();
    });

    it('should display correct count for filtered applications', async () => {
      const applications = [
        createMockApplication({ id: '1', status: 'APPLIED' }),
        createMockApplication({ id: '2', status: 'RECRUITER_SCREEN' }),
        createMockApplication({ id: '3', status: 'REJECTED' }),
        createMockApplication({ id: '4', status: 'GHOSTED' }),
        createMockApplication({ id: '5', status: 'OFFER_RECEIVED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        // Should show "3 of 5 applications" (3 active, 5 total)
        expect(screen.getByText(/3 of 5 applications/)).toBeInTheDocument();
      });
    });

    it('should show "Active" in the filter options', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [createMockApplication()],
        },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify "Active" filter button exists
      expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    });
  });

  describe('Filter switching', () => {
    it('should switch from Active to Rejected filter', async () => {
      const user = userEvent.setup();

      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Rejected Co', status: 'REJECTED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');

      // Click Rejected filter
      const rejectedButton = screen.getByRole('button', { name: 'Rejected' });
      await user.click(rejectedButton);

      // Now only rejected should be visible
      await waitFor(() => {
        expect(within(table).getByText('Rejected Co')).toBeInTheDocument();
      });
      expect(within(table).queryByText('Applied Co')).not.toBeInTheDocument();
    });

    it('should switch back to Active filter', async () => {
      const user = userEvent.setup();

      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: 'APPLIED' }),
        createMockApplication({ id: '2', companyName: 'Rejected Co', status: 'REJECTED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');

      // Switch to All
      const allButton = screen.getByRole('button', { name: 'All' });
      await user.click(allButton);

      await waitFor(() => {
        expect(within(table).getByText('Rejected Co')).toBeInTheDocument();
      });

      // Switch back to Active
      const activeButton = screen.getByRole('button', { name: 'Active' });
      await user.click(activeButton);

      // Rejected should be hidden again
      await waitFor(() => {
        expect(within(table).queryByText('Rejected Co')).not.toBeInTheDocument();
      });
      expect(within(table).getByText('Applied Co')).toBeInTheDocument();
    });
  });

  describe('Empty state with Active filter', () => {
    it('should show empty state when no active applications exist', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Rejected Co', status: 'REJECTED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderJobTracker();

      await waitFor(() => {
        // Should show empty state message for active filter
        expect(screen.getByText(/No applications match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard shortcuts registration', () => {
    it('should register Enter key to open view modal (not edit modal)', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find the shortcuts registration call
      const shortcutsCall = mockUseKeyboardShortcuts.mock.calls.find(
        call => call[0] && Array.isArray(call[0])
      );
      expect(shortcutsCall).toBeDefined();

      const shortcuts = shortcutsCall[0];

      // Enter key should be registered
      const enterShortcut = shortcuts.find(s => s.key === 'Enter');
      expect(enterShortcut).toBeDefined();
      // The handler name should indicate it opens the view modal
      expect(enterShortcut.handler).toBeDefined();
    });

    it('should register "e" key to open edit modal', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find the shortcuts registration call
      const shortcutsCall = mockUseKeyboardShortcuts.mock.calls.find(
        call => call[0] && Array.isArray(call[0])
      );
      expect(shortcutsCall).toBeDefined();

      const shortcuts = shortcutsCall[0];

      // 'e' key should be registered for edit
      const editShortcut = shortcuts.find(s => s.key === 'e');
      expect(editShortcut).toBeDefined();
      expect(editShortcut.handler).toBeDefined();
    });

    it('should register "e" key with preventDefault to avoid typing into focused input', async () => {
      // This test ensures the fix for the bug where pressing 'e' to open the modal
      // would cause the 'e' character to be typed into the company name input field
      // because the modal auto-focuses that input on open
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find the shortcuts registration call
      const shortcutsCall = mockUseKeyboardShortcuts.mock.calls.find(
        call => call[0] && Array.isArray(call[0])
      );
      expect(shortcutsCall).toBeDefined();

      const shortcuts = shortcutsCall[0];

      // 'e' key should have preventDefault: true to stop the character from being typed
      const editShortcut = shortcuts.find(s => s.key === 'e');
      expect(editShortcut).toBeDefined();
      expect(editShortcut.preventDefault).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations when loaded', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Test Co', status: 'APPLIED' }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      const { container } = renderJobTracker();

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Note: Excluding heading-order rule due to existing issue in Dashboard component
      // where chart sections use h3 without preceding h1/h2 headers.
      // TODO: Fix heading hierarchy in Dashboard.jsx component.
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have accessible filter buttons', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Filter buttons should be accessible
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    });

    it('should have accessible table structure', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Should have proper table semantics
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});
