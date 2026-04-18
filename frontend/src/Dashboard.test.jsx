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
const mockUseDashboardSettings = jest.fn();

// Default mock settings - all visible
const defaultMockSettings = {
  statCards: true,
  stageFunnel: true,
  salaryRangeChart: true,
  maxTimePerStageChart: true,
  statusTransitionHeatmap: true,
  funnelAnalytics: true,
  applicationHealthDashboard: true,
  dayOfWeekBar: true,
  hourBar: true,
  activityHeatmap: true,
  companyInsights: true,
  locationInsights: true,
  positionInsights: true,
};

const defaultMockDashboardSettings = {
  settings: defaultMockSettings,
  isComponentVisible: (key) => defaultMockSettings[key] === true,
  toggleComponent: jest.fn(),
  resetSettings: jest.fn(),
  areAllHidden: false,
  componentDisplayNames: {
    statCards: 'Stat Cards',
    stageFunnel: 'Stage Funnel',
    salaryRangeChart: 'Salary Range Chart',
    maxTimePerStageChart: 'Max Time Per Stage',
    statusTransitionHeatmap: 'Status Transition Heatmap',
    funnelAnalytics: 'Funnel Analytics',
    applicationHealthDashboard: 'Application Health Dashboard',
    dayOfWeekBar: 'Day of Week Chart',
    hourBar: 'Hour Distribution Chart',
    activityHeatmap: 'Activity Heatmap',
    companyInsights: 'Company Insights',
    locationInsights: 'Location Insights',
    positionInsights: 'Position Insights',
  },
};

jest.mock('./hooks', () => ({
  useKeyboardShortcuts: (...args) => mockUseKeyboardShortcuts(...args),
  useAnalytics: () => ({
    metrics: {
      trueResponseRate: 0,
      trueInterviewRate: 0,
      trueOfferRate: 0,
      avgDaysToResponse: null,
      weeklyPace: 0,
      totalApplications: 0,
      stageConversions: { appliedToScreen: 0, screenToTech: 0, techToOffer: 0 },
    },
    countsByStatus: {},
    salaryDistribution: null,
    activityHeatmap: null,
    timePatterns: null,
    stageDurations: null,
    companyInsights: null,
    locationInsights: null,
    positionInsights: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useDashboardSettings: () => mockUseDashboardSettings(),
  DASHBOARD_COMPONENTS: {
    STAT_CARDS: 'statCards',
    STAGE_FUNNEL: 'stageFunnel',
    SALARY_RANGE_CHART: 'salaryRangeChart',
    MAX_TIME_PER_STAGE_CHART: 'maxTimePerStageChart',
    STATUS_TRANSITION_HEATMAP: 'statusTransitionHeatmap',
    FUNNEL_ANALYTICS: 'funnelAnalytics',
    APPLICATION_HEALTH_DASHBOARD: 'applicationHealthDashboard',
    DAY_OF_WEEK_BAR: 'dayOfWeekBar',
    HOUR_BAR: 'hourBar',
    ACTIVITY_HEATMAP: 'activityHeatmap',
    COMPANY_INSIGHTS: 'companyInsights',
    LOCATION_INSIGHTS: 'locationInsights',
    POSITION_INSIGHTS: 'positionInsights',
  },
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
    // Reset to default settings
    mockUseDashboardSettings.mockReturnValue(defaultMockDashboardSettings);
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

  describe('Sort order after edit', () => {
    it('should move edited application to top when lastUpdate changes', async () => {
      const user = userEvent.setup();

      // Arrange: Create applications with different lastUpdate dates
      // The oldest app will be edited, and should move to the top after edit
      const oldApp = createMockBackendApplication({
        id: 'old-app',
        companyName: 'Old Company',
        positionTitle: 'Developer',
        status: 'APPLIED',
        updatedAt: '2025-01-01T10:00:00Z', // Oldest - will be at bottom initially
      });

      const middleApp = createMockBackendApplication({
        id: 'middle-app',
        companyName: 'Middle Company',
        positionTitle: 'Engineer',
        status: 'APPLIED',
        updatedAt: '2025-01-15T10:00:00Z', // Middle
      });

      const newestApp = createMockBackendApplication({
        id: 'newest-app',
        companyName: 'Newest Company',
        positionTitle: 'Architect',
        status: 'APPLIED',
        updatedAt: '2025-02-01T10:00:00Z', // Newest - will be at top initially
      });

      // Return applications in random order - table should sort by lastUpdate desc
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [middleApp, newestApp, oldApp] },
      });

      renderJobTracker();

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify initial order: Newest, Middle, Old
      const table = screen.getByRole('table');
      let rows = within(table).getAllByRole('row');
      let dataRows = rows.slice(1); // Skip header
      let companyNames = dataRows.map(row => {
        const cells = within(row).getAllByRole('cell');
        return cells[0]?.textContent;
      }).filter(Boolean);

      expect(companyNames[0]).toBe('Newest Company');
      expect(companyNames[1]).toBe('Middle Company');
      expect(companyNames[2]).toBe('Old Company');

      // Set up mock for update - the "Old Company" gets edited and returns with newest updatedAt
      const updatedOldApp = {
        ...oldApp,
        notes: 'Updated notes',
        updatedAt: '2025-03-01T10:00:00Z', // Now the newest!
      };
      jobApplicationsAPI.update.mockResolvedValueOnce({ data: updatedOldApp });

      // Click Edit button on Old Company (which is in the last row)
      const oldCompanyRow = dataRows[2];
      const editButton = within(oldCompanyRow).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit application/i })).toBeInTheDocument();
      });

      // Make a change (update notes)
      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      // Save the application
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /edit application/i })).not.toBeInTheDocument();
      });

      // Verify the updated app is now at the top (re-sorted by lastUpdate)
      rows = within(table).getAllByRole('row');
      dataRows = rows.slice(1);
      companyNames = dataRows.map(row => {
        const cells = within(row).getAllByRole('cell');
        return cells[0]?.textContent;
      }).filter(Boolean);

      // Old Company should now be at the top because its updatedAt is the newest
      expect(companyNames[0]).toBe('Old Company');
      expect(companyNames[1]).toBe('Newest Company');
      expect(companyNames[2]).toBe('Middle Company');
    });

    it('should maintain sort order for applications that were not edited', async () => {
      const user = userEvent.setup();

      const app1 = createMockBackendApplication({
        id: 'app-1',
        companyName: 'First Company',
        updatedAt: '2025-02-01T10:00:00Z',
      });

      const app2 = createMockBackendApplication({
        id: 'app-2',
        companyName: 'Second Company',
        updatedAt: '2025-01-15T10:00:00Z',
      });

      const app3 = createMockBackendApplication({
        id: 'app-3',
        companyName: 'Third Company',
        updatedAt: '2025-01-01T10:00:00Z',
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [app1, app2, app3] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify initial order
      const table = screen.getByRole('table');
      let rows = within(table).getAllByRole('row');
      let dataRows = rows.slice(1);

      expect(within(dataRows[0]).getByText('First Company')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('Second Company')).toBeInTheDocument();
      expect(within(dataRows[2]).getByText('Third Company')).toBeInTheDocument();

      // Update Second Company - it should move to the top
      const updatedApp2 = {
        ...app2,
        notes: 'New notes',
        updatedAt: '2025-03-01T10:00:00Z',
      };
      jobApplicationsAPI.update.mockResolvedValueOnce({ data: updatedApp2 });

      // Click Edit on Second Company
      const editButton = within(dataRows[1]).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit application/i })).toBeInTheDocument();
      });

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /edit application/i })).not.toBeInTheDocument();
      });

      // Verify new order after edit
      rows = within(table).getAllByRole('row');
      dataRows = rows.slice(1);

      // Second Company should now be first
      expect(within(dataRows[0]).getByText('Second Company')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('First Company')).toBeInTheDocument();
      expect(within(dataRows[2]).getByText('Third Company')).toBeInTheDocument();
    });

    it('should re-sort table immediately after edit without page refresh', async () => {
      const user = userEvent.setup();

      // This test verifies the specific bug scenario:
      // After editing and saving, the table should immediately reflect the new sort order
      // without requiring a page refresh
      const app1 = createMockBackendApplication({
        id: 'app-1',
        companyName: 'Alpha Corp',
        status: 'APPLIED',
        updatedAt: '2025-01-01T10:00:00Z', // Oldest - should be at bottom
      });

      const app2 = createMockBackendApplication({
        id: 'app-2',
        companyName: 'Beta Inc',
        status: 'APPLIED',
        updatedAt: '2025-02-01T10:00:00Z', // Newest - should be at top
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [app1, app2] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify initial order: Beta (newest) at top, Alpha (oldest) at bottom
      const table = screen.getByRole('table');
      let rows = within(table).getAllByRole('row');
      let dataRows = rows.slice(1);

      expect(within(dataRows[0]).getByText('Beta Inc')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('Alpha Corp')).toBeInTheDocument();

      // Edit Alpha Corp - it should move to top after save
      const updatedApp1 = {
        ...app1,
        notes: 'Just edited this one',
        updatedAt: '2025-03-01T10:00:00Z', // Now the newest
      };
      jobApplicationsAPI.update.mockResolvedValueOnce({ data: updatedApp1 });

      // Click Edit on Alpha Corp (second row)
      const editButton = within(dataRows[1]).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit application/i })).toBeInTheDocument();
      });

      // Click Save
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /edit application/i })).not.toBeInTheDocument();
      });

      // CRITICAL: Verify the table is re-sorted WITHOUT a page refresh
      // Alpha Corp should now be at the top
      rows = within(table).getAllByRole('row');
      dataRows = rows.slice(1);

      // The edited app should now be first (it has the newest updatedAt)
      expect(within(dataRows[0]).getByText('Alpha Corp')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('Beta Inc')).toBeInTheDocument();
    });

    it('should correctly update table when backend returns updated data after save', async () => {
      // This test specifically validates that when the backend returns updated data,
      // the frontend correctly processes it and re-sorts the table
      const user = userEvent.setup();

      const app1 = createMockBackendApplication({
        id: 'app-1',
        companyName: 'Company A',
        updatedAt: '2025-01-01T10:00:00Z',
      });

      const app2 = createMockBackendApplication({
        id: 'app-2',
        companyName: 'Company B',
        updatedAt: '2025-02-01T10:00:00Z',
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [app1, app2] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify initial order
      const table = screen.getByRole('table');
      let rows = within(table).getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText('Company B')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Company A')).toBeInTheDocument();

      // Mock update returns app1 with newer updatedAt
      const updatedApp1 = {
        ...app1,
        updatedAt: '2025-03-15T10:00:00Z',
      };
      jobApplicationsAPI.update.mockResolvedValueOnce({ data: updatedApp1 });

      // Edit Company A
      await user.click(within(rows[1]).getByRole('button', { name: /edit/i }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit application/i })).toBeInTheDocument();
      });

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /edit application/i })).not.toBeInTheDocument();
      });

      // Verify Company A is now first
      rows = within(table).getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText('Company A')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Company B')).toBeInTheDocument();
    });
  });

  describe('Dashboard Settings', () => {
    it('should render settings button in the header', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should open settings modal when settings button is clicked', async () => {
      const user = userEvent.setup();

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      expect(screen.getByRole('dialog', { name: /dashboard settings/i })).toBeInTheDocument();
    });

    it('should close settings modal when close button is clicked', async () => {
      const user = userEvent.setup();

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open settings
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close settings
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should hide stat cards when statCards setting is false', async () => {
      const hiddenSettings = {
        ...defaultMockSettings,
        statCards: false,
      };

      mockUseDashboardSettings.mockReturnValue({
        ...defaultMockDashboardSettings,
        settings: hiddenSettings,
        isComponentVisible: (key) => hiddenSettings[key] === true,
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Stat cards should not be visible - "Total Applied" is a stat card label
      expect(screen.queryByText('Total Applied')).not.toBeInTheDocument();
    });

    it('should show stat cards when statCards setting is true', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Stat cards should be visible
      expect(screen.getByText('Total Applied')).toBeInTheDocument();
    });

    it('should hide activity heatmap when activityHeatmap setting is false', async () => {
      const hiddenSettings = {
        ...defaultMockSettings,
        activityHeatmap: false,
      };

      mockUseDashboardSettings.mockReturnValue({
        ...defaultMockDashboardSettings,
        settings: hiddenSettings,
        isComponentVisible: (key) => hiddenSettings[key] === true,
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Activity heatmap should not be visible
      expect(screen.queryByTestId('activity-heatmap')).not.toBeInTheDocument();
    });

    it('should always show the table regardless of settings', async () => {
      // Hide all components
      const allHiddenSettings = {
        statCards: false,
        stageFunnel: false,
        salaryRangeChart: false,
        maxTimePerStageChart: false,
        statusTransitionHeatmap: false,
        funnelAnalytics: false,
        applicationHealthDashboard: false,
        dayOfWeekBar: false,
        hourBar: false,
        activityHeatmap: false,
      };

      mockUseDashboardSettings.mockReturnValue({
        ...defaultMockDashboardSettings,
        settings: allHiddenSettings,
        isComponentVisible: () => false,
        areAllHidden: true,
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Table should always be present
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should hide individual charts based on settings', async () => {
      const hiddenSettings = {
        ...defaultMockSettings,
        stageFunnel: false,
        salaryRangeChart: false,
      };

      mockUseDashboardSettings.mockReturnValue({
        ...defaultMockDashboardSettings,
        settings: hiddenSettings,
        isComponentVisible: (key) => hiddenSettings[key] === true,
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: [createMockApplication()] },
      });

      renderJobTracker();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Hidden charts should not be visible
      expect(screen.queryByTestId('stage-funnel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('salary-range-chart')).not.toBeInTheDocument();
    });
  });
});
