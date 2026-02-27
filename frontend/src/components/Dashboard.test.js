/**
 * @file Dashboard.test.js
 * @description Tests for the Dashboard component
 *
 * Tests cover:
 * - Default sorting by last update date (descending)
 * - Active filter functionality (excludes rejected applications)
 * - Default filter is 'active' instead of 'all'
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { jobApplicationsAPI } from '../services/api';
import { APPLICATION_STATUS } from '../constants';

// Mock the API
jest.mock('../services/api', () => ({
  jobApplicationsAPI: {
    getAll: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the useAuth hook
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Test' },
    token: 'mock-token',
    isAuthenticated: true,
  }),
}));

/**
 * Helper to create a mock application with specified properties
 * @param {Object} overrides - Properties to override in the default application
 * @returns {Object} Mock application object
 */
const createMockApplication = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  companyName: 'Test Company',
  positionTitle: 'Software Engineer',
  status: APPLICATION_STATUS.APPLIED,
  appliedDate: [2025, 1, 15],
  lastUpdated: [2025, 1, 15, 10, 0, 0],
  notes: '',
  jobUrl: '',
  salaryExpectation: null,
  interviewDate: null,
  ...overrides,
});

/**
 * Helper to render Dashboard component
 * Auth context is mocked at the module level
 * @returns {Object} Render result
 */
const renderDashboard = () => {
  return render(<Dashboard />);
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('default sorting by last update date', () => {
    it('should sort applications by lastUpdated field in descending order (newest first)', async () => {
      // Arrange: Create applications with different lastUpdated dates
      const oldApplication = createMockApplication({
        id: 'old',
        companyName: 'Old Company',
        positionTitle: 'Old Position',
        lastUpdated: [2025, 1, 10, 10, 0, 0], // January 10, 2025
      });

      const newApplication = createMockApplication({
        id: 'new',
        companyName: 'New Company',
        positionTitle: 'New Position',
        lastUpdated: [2025, 2, 20, 10, 0, 0], // February 20, 2025
      });

      const middleApplication = createMockApplication({
        id: 'middle',
        companyName: 'Middle Company',
        positionTitle: 'Middle Position',
        lastUpdated: [2025, 1, 25, 10, 0, 0], // January 25, 2025
      });

      // Return applications in random order to verify sorting
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [oldApplication, newApplication, middleApplication],
        },
      });

      // Act
      renderDashboard();

      // Assert: Wait for applications to load and verify order
      await waitFor(() => {
        expect(screen.getByText(/New Company/)).toBeInTheDocument();
      });

      // Get all application cards and verify order
      const applicationCards = screen.getAllByText(/Position at/i);

      // The newest should appear first, then middle, then oldest
      // We check the company names appear in the correct order
      const allText = document.body.textContent;
      const newIndex = allText.indexOf('New Company');
      const middleIndex = allText.indexOf('Middle Company');
      const oldIndex = allText.indexOf('Old Company');

      expect(newIndex).toBeLessThan(middleIndex);
      expect(middleIndex).toBeLessThan(oldIndex);
    });

    it('should handle applications with array format lastUpdated dates', async () => {
      const application1 = createMockApplication({
        id: '1',
        companyName: 'Array Date Company',
        lastUpdated: [2025, 3, 15, 14, 30, 0], // March 15, 2025
      });

      const application2 = createMockApplication({
        id: '2',
        companyName: 'Earlier Company',
        lastUpdated: [2025, 3, 10, 9, 0, 0], // March 10, 2025
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [application2, application1],
        },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Array Date Company/)).toBeInTheDocument();
      });

      const allText = document.body.textContent;
      const firstIndex = allText.indexOf('Array Date Company');
      const secondIndex = allText.indexOf('Earlier Company');

      expect(firstIndex).toBeLessThan(secondIndex);
    });

    it('should handle applications with ISO string format lastUpdated dates', async () => {
      const application1 = createMockApplication({
        id: '1',
        companyName: 'ISO Date Company',
        lastUpdated: '2025-03-15T14:30:00',
      });

      const application2 = createMockApplication({
        id: '2',
        companyName: 'Earlier ISO Company',
        lastUpdated: '2025-03-10T09:00:00',
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [application2, application1],
        },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/ISO Date Company/)).toBeInTheDocument();
      });

      const allText = document.body.textContent;
      const firstIndex = allText.indexOf('ISO Date Company');
      const secondIndex = allText.indexOf('Earlier ISO Company');

      expect(firstIndex).toBeLessThan(secondIndex);
    });

    it('should fall back to appliedDate if lastUpdated is not available', async () => {
      const application1 = createMockApplication({
        id: '1',
        companyName: 'No LastUpdated Company',
        appliedDate: [2025, 3, 15],
        lastUpdated: null,
      });

      const application2 = createMockApplication({
        id: '2',
        companyName: 'Earlier No LastUpdated',
        appliedDate: [2025, 3, 10],
        lastUpdated: null,
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [application2, application1],
        },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/No LastUpdated Company/)).toBeInTheDocument();
      });

      const allText = document.body.textContent;
      const firstIndex = allText.indexOf('No LastUpdated Company');
      const secondIndex = allText.indexOf('Earlier No LastUpdated');

      expect(firstIndex).toBeLessThan(secondIndex);
    });
  });

  describe('Active filter functionality', () => {
    it('should have Active as the default filter', async () => {
      const activeApplication = createMockApplication({
        id: 'active',
        companyName: 'Active Company',
        status: APPLICATION_STATUS.APPLIED,
      });

      const rejectedApplication = createMockApplication({
        id: 'rejected',
        companyName: 'Rejected Company',
        status: APPLICATION_STATUS.REJECTED,
      });

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [activeApplication, rejectedApplication],
        },
      });

      renderDashboard();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/Active Company/)).toBeInTheDocument();
      });

      // Rejected application should NOT be visible with default 'active' filter
      expect(screen.queryByText(/Rejected Company/)).not.toBeInTheDocument();
    });

    it('should show Active filter as selected by default', async () => {
      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: {
          content: [createMockApplication()],
        },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Test Company/)).toBeInTheDocument();
      });

      // The Active stat card should have the active styling
      const activeStatCard = screen.getByText(/Active/i).closest('.stat-card');
      expect(activeStatCard).toHaveClass('stat-card-active');
    });

    it('should exclude REJECTED status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', companyName: 'Interview Co', status: APPLICATION_STATUS.RECRUITER_SCREEN }),
        createMockApplication({ id: '3', companyName: 'Rejected Co', status: APPLICATION_STATUS.REJECTED }),
        createMockApplication({ id: '4', companyName: 'Offer Co', status: APPLICATION_STATUS.OFFER_RECEIVED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Applied Co/)).toBeInTheDocument();
      });

      // Active applications should be visible
      expect(screen.getByText(/Applied Co/)).toBeInTheDocument();
      expect(screen.getByText(/Interview Co/)).toBeInTheDocument();
      expect(screen.getByText(/Offer Co/)).toBeInTheDocument();

      // Rejected should NOT be visible
      expect(screen.queryByText(/Rejected Co/)).not.toBeInTheDocument();
    });

    it('should exclude WITHDRAWN status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', companyName: 'Withdrawn Co', status: APPLICATION_STATUS.WITHDRAWN }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Applied Co/)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Withdrawn Co/)).not.toBeInTheDocument();
    });

    it('should exclude GHOSTED status applications in Active filter', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', companyName: 'Ghosted Co', status: APPLICATION_STATUS.GHOSTED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Applied Co/)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Ghosted Co/)).not.toBeInTheDocument();
    });

    it('should show all applications when All filter is clicked', async () => {
      const user = userEvent.setup();

      const applications = [
        createMockApplication({ id: '1', companyName: 'Active Co', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', companyName: 'Rejected Co', status: APPLICATION_STATUS.REJECTED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Active Co/)).toBeInTheDocument();
      });

      // Initially rejected should not be visible (Active filter is default)
      expect(screen.queryByText(/Rejected Co/)).not.toBeInTheDocument();

      // Click on Total Applications (All filter)
      const allFilterCard = screen.getByText(/Total Applications/i).closest('.stat-card');
      await user.click(allFilterCard);

      // Now all applications should be visible
      await waitFor(() => {
        expect(screen.getByText(/Rejected Co/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Active Co/)).toBeInTheDocument();
    });

    it('should display correct count for Active applications in stats', async () => {
      const applications = [
        createMockApplication({ id: '1', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', status: APPLICATION_STATUS.RECRUITER_SCREEN }),
        createMockApplication({ id: '3', status: APPLICATION_STATUS.REJECTED }),
        createMockApplication({ id: '4', status: APPLICATION_STATUS.WITHDRAWN }),
        createMockApplication({ id: '5', status: APPLICATION_STATUS.OFFER_RECEIVED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        // Total should be 5
        const totalCard = screen.getByText(/Total Applications/i).closest('.stat-card');
        expect(within(totalCard).getByText('5')).toBeInTheDocument();
      });

      // Active count should be 3 (excluding REJECTED, WITHDRAWN)
      const activeCard = screen.getByText(/^Active$/i).closest('.stat-card');
      expect(within(activeCard).getByText('3')).toBeInTheDocument();
    });
  });

  describe('filter switching', () => {
    it('should switch from Active to All filter when clicking Total Applications', async () => {
      const user = userEvent.setup();

      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', companyName: 'Rejected Co', status: APPLICATION_STATUS.REJECTED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Applied Co/)).toBeInTheDocument();
      });

      // Click Total Applications card
      const allCard = screen.getByText(/Total Applications/i).closest('.stat-card');
      await user.click(allCard);

      // Both should now be visible
      await waitFor(() => {
        expect(screen.getByText(/Rejected Co/)).toBeInTheDocument();
      });
    });

    it('should switch back to Active filter', async () => {
      const user = userEvent.setup();

      const applications = [
        createMockApplication({ id: '1', companyName: 'Applied Co', status: APPLICATION_STATUS.APPLIED }),
        createMockApplication({ id: '2', companyName: 'Rejected Co', status: APPLICATION_STATUS.REJECTED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Applied Co/)).toBeInTheDocument();
      });

      // Switch to All
      const allCard = screen.getByText(/Total Applications/i).closest('.stat-card');
      await user.click(allCard);

      await waitFor(() => {
        expect(screen.getByText(/Rejected Co/)).toBeInTheDocument();
      });

      // Switch back to Active
      const activeCard = screen.getByText(/^Active$/i).closest('.stat-card');
      await user.click(activeCard);

      // Rejected should be hidden again
      await waitFor(() => {
        expect(screen.queryByText(/Rejected Co/)).not.toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show appropriate message when no active applications exist', async () => {
      const applications = [
        createMockApplication({ id: '1', companyName: 'Rejected Co', status: APPLICATION_STATUS.REJECTED }),
      ];

      jobApplicationsAPI.getAll.mockResolvedValueOnce({
        data: { content: applications },
      });

      renderDashboard();

      await waitFor(() => {
        // Should show empty state for active filter
        expect(screen.getByText(/No active applications/i)).toBeInTheDocument();
      });
    });
  });
});
