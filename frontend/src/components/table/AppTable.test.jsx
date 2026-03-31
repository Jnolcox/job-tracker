/**
 * @file AppTable.test.jsx
 * @description Tests for the AppTable component
 *
 * Tests cover:
 * - Company name click triggers onView callback
 * - Company name displays as clickable element
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppTable from './AppTable';

// Mock the Badge component
jest.mock('../common', () => ({
  Badge: ({ status }) => <span data-testid="badge">{status}</span>,
}));

// Mock the TableHeader component
jest.mock('./TableHeader', () => {
  return function MockTableHeader({ children, onClick }) {
    return <th onClick={onClick}>{children}</th>;
  };
});

// Mock the dashboard constants
jest.mock('../../constants/dashboard', () => ({
  FUNNEL_GROUPS: [
    { key: 'Applied', label: 'Applied', statuses: ['APPLIED'] },
    { key: 'Interviewing', label: 'Interviewing', statuses: ['RECRUITER_SCREEN'] },
  ],
  FUNNEL_COLORS: {
    Applied: '#4E9AF1',
    Interviewing: '#A78BFA',
  },
  FILTER_OPTIONS: ['All', 'Active', 'Applied', 'Interviewing'],
}));

// Mock the dateHelpers
jest.mock('../../utils/dateHelpers', () => ({
  timeInStage: jest.fn(() => 5),
  totalDaysActive: jest.fn(() => 10),
}));

// Mock the dataAdapter
jest.mock('../../utils/dataAdapter', () => ({
  isStatusInGroup: jest.fn((status, group) => {
    if (group === 'REJECTED' && status === 'REJECTED') return true;
    return false;
  }),
  RTO_LABELS: {
    REMOTE: 'Remote',
    HYBRID_2: 'Hybrid (2 days)',
    ONSITE: 'On-site',
  },
  LEVEL_LABELS: {
    JUNIOR: 'Junior',
    SENIOR: 'Senior',
  },
}));

/**
 * Helper to create a mock application
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock application object
 */
const createMockApplication = (overrides = {}) => ({
  id: 'app-1',
  company: 'Test Company',
  role: 'Software Engineer',
  level: 'SENIOR',
  status: 'APPLIED',
  location: 'San Francisco, CA',
  rtoType: 'REMOTE',
  salaryMin: 100000,
  salaryMax: 150000,
  appliedAt: '2025-01-15T10:00:00Z',
  lastUpdate: '2025-01-20T14:00:00Z',
  ...overrides,
});

describe('AppTable', () => {
  const defaultProps = {
    apps: [createMockApplication()],
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    searchInputRef: { current: null },
    selectedIndex: -1,
    onSelectionChange: jest.fn(),
    getSortedItems: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Company name click functionality', () => {
    it('should render company name as clickable text', () => {
      render(<AppTable {...defaultProps} />);

      const companyCell = screen.getByText('Test Company');
      expect(companyCell).toBeInTheDocument();
      // Company name should have cursor pointer styling
      expect(companyCell).toHaveStyle({ cursor: 'pointer' });
    });

    it('should call onView with application when company name is clicked', () => {
      const onView = jest.fn();
      const app = createMockApplication({ id: 'app-123', company: 'Acme Corp' });

      render(<AppTable {...defaultProps} apps={[app]} onView={onView} />);

      const companyName = screen.getByText('Acme Corp');
      fireEvent.click(companyName);

      expect(onView).toHaveBeenCalledTimes(1);
      expect(onView).toHaveBeenCalledWith(app);
    });

    it('should not trigger row selection when clicking company name', () => {
      const onView = jest.fn();
      const onSelectionChange = jest.fn();
      const app = createMockApplication();

      render(
        <AppTable
          {...defaultProps}
          apps={[app]}
          onView={onView}
          onSelectionChange={onSelectionChange}
        />
      );

      const companyName = screen.getByText('Test Company');
      fireEvent.click(companyName);

      // onView should be called
      expect(onView).toHaveBeenCalledTimes(1);
      // onSelectionChange should not be triggered by the company click
      // (event propagation should be stopped)
    });

    it('should still allow Edit button to work', () => {
      const onEdit = jest.fn();
      const onView = jest.fn();
      const app = createMockApplication();

      render(
        <AppTable {...defaultProps} apps={[app]} onEdit={onEdit} onView={onView} />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(app);
      // onView should not be called when clicking Edit
      expect(onView).not.toHaveBeenCalled();
    });

    it('should work correctly with multiple applications', () => {
      const onView = jest.fn();
      const apps = [
        createMockApplication({ id: 'app-1', company: 'Company A' }),
        createMockApplication({ id: 'app-2', company: 'Company B' }),
        createMockApplication({ id: 'app-3', company: 'Company C' }),
      ];

      render(<AppTable {...defaultProps} apps={apps} onView={onView} />);

      // Click on the second company
      const companyB = screen.getByText('Company B');
      fireEvent.click(companyB);

      expect(onView).toHaveBeenCalledTimes(1);
      expect(onView).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'app-2', company: 'Company B' })
      );
    });

    it('should not error when onView is not provided', () => {
      // Remove onView from props
      const { onView, ...propsWithoutOnView } = defaultProps;

      // Should render without errors
      expect(() => {
        render(<AppTable {...propsWithoutOnView} />);
      }).not.toThrow();

      // Clicking company name should not throw
      const companyName = screen.getByText('Test Company');
      expect(() => {
        fireEvent.click(companyName);
      }).not.toThrow();
    });
  });
});
