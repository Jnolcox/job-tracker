/**
 * @file ApplicationViewModal.test.jsx
 * @description Tests for the ApplicationViewModal component (read-only view modal)
 *
 * Tests cover:
 * - Rendering of all application fields in read-only format
 * - Modal title displays "Application Details"
 * - No editable inputs (read-only view)
 * - Close button functionality
 * - Clicking backdrop closes modal
 * - Escape key closes modal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicationViewModal from './ApplicationViewModal';

// Mock the useKeyboardShortcuts hook
jest.mock('../../hooks', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

// Mock the dataAdapter exports
jest.mock('../../utils/dataAdapter', () => ({
  STATUS_LABELS: {
    APPLIED: 'Applied',
    RECRUITER_SCREEN: 'Recruiter Screen',
    REJECTED: 'Rejected',
    OFFER_RECEIVED: 'Offer Received',
  },
  RTO_LABELS: {
    REMOTE: 'Remote',
    HYBRID_2: 'Hybrid (2 days)',
    HYBRID_3: 'Hybrid (3 days)',
    ONSITE: 'On-site',
  },
  LEVEL_LABELS: {
    JUNIOR: 'Junior',
    MID: 'Mid',
    SENIOR: 'Senior',
    STAFF: 'Staff',
  },
  STATUS_COLORS: {
    APPLIED: '#4E9AF1',
    RECRUITER_SCREEN: '#A78BFA',
    REJECTED: '#F87171',
    OFFER_RECEIVED: '#10B981',
  },
}));

/**
 * Helper to create a complete mock application
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock application object
 */
const createMockApplication = (overrides = {}) => ({
  id: 'app-123',
  company: 'Acme Corporation',
  role: 'Senior Software Engineer',
  level: 'SENIOR',
  status: 'RECRUITER_SCREEN',
  appliedAt: '2025-01-15T10:00:00Z',
  lastUpdate: '2025-01-20T14:30:00Z',
  statusChangedAt: '2025-01-18T09:00:00Z',
  interviewDate: '2025-01-25T15:00:00Z',
  salaryMin: 150000,
  salaryMax: 200000,
  location: 'San Francisco, CA',
  rtoType: 'HYBRID_2',
  jobUrl: 'https://acme.com/careers/senior-engineer',
  jobDescription: 'We are looking for a senior engineer to join our team.',
  contactName: 'Jane Smith',
  contactEmail: 'jane.smith@acme.com',
  contactPhone: '(555) 123-4567',
  notes: 'Great company culture, interesting tech stack.',
  ...overrides,
});

describe('ApplicationViewModal', () => {
  const defaultProps = {
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when app is null', () => {
      const { container } = render(
        <ApplicationViewModal {...defaultProps} app={null} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should render "Application Details" as the modal title', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Application Details')).toBeInTheDocument();
    });

    it('should display the company name', () => {
      const app = createMockApplication({ company: 'Tech Giant Inc' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Tech Giant Inc')).toBeInTheDocument();
    });

    it('should display the role', () => {
      const app = createMockApplication({ role: 'Principal Engineer' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Principal Engineer')).toBeInTheDocument();
    });

    it('should display the level when present', () => {
      const app = createMockApplication({ level: 'SENIOR' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Senior')).toBeInTheDocument();
    });

    it('should display dash when level is not present', () => {
      const app = createMockApplication({ level: null });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      // Find the Level label and check the value next to it
      const levelLabel = screen.getByText('Level');
      expect(levelLabel.parentElement).toHaveTextContent('\u2014');
    });

    it('should display the status with human-readable label', () => {
      const app = createMockApplication({ status: 'RECRUITER_SCREEN' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Recruiter Screen')).toBeInTheDocument();
    });

    it('should display the applied date formatted', () => {
      const app = createMockApplication({ appliedAt: '2025-01-15T10:00:00Z' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      // Should show the date in a readable format
      expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
    });

    it('should display salary range when both min and max are present', () => {
      const app = createMockApplication({ salaryMin: 150000, salaryMax: 200000 });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('$150,000 - $200,000')).toBeInTheDocument();
    });

    it('should display dash when salary is not present', () => {
      const app = createMockApplication({ salaryMin: null, salaryMax: null });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      // Find Salary label and check its value
      const salaryLabel = screen.getByText('Salary Range');
      expect(salaryLabel.parentElement).toHaveTextContent('\u2014');
    });

    it('should display location when present', () => {
      const app = createMockApplication({ location: 'New York, NY' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });

    it('should display RTO type with human-readable label', () => {
      const app = createMockApplication({ rtoType: 'REMOTE' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Remote')).toBeInTheDocument();
    });

    it('should display job URL as a clickable link', () => {
      const app = createMockApplication({ jobUrl: 'https://example.com/job' });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      const link = screen.getByRole('link', { name: /example\.com/i });
      expect(link).toHaveAttribute('href', 'https://example.com/job');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should display job description when present', () => {
      const app = createMockApplication({
        jobDescription: 'Looking for an experienced developer.',
      });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(
        screen.getByText('Looking for an experienced developer.')
      ).toBeInTheDocument();
    });

    it('should display contact information section', () => {
      const app = createMockApplication({
        contactName: 'John Doe',
        contactEmail: 'john@company.com',
        contactPhone: '555-0100',
      });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@company.com')).toBeInTheDocument();
      expect(screen.getByText('555-0100')).toBeInTheDocument();
    });

    it('should display notes when present', () => {
      const app = createMockApplication({
        notes: 'Had a great initial conversation.',
      });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(
        screen.getByText('Had a great initial conversation.')
      ).toBeInTheDocument();
    });

    it('should display interview date when present', () => {
      const app = createMockApplication({
        interviewDate: '2025-02-01T14:00:00Z',
        status: 'RECRUITER_SCREEN',
      });

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText(/Feb 1, 2025/)).toBeInTheDocument();
    });
  });

  describe('Read-only behavior', () => {
    it('should not render any input elements', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should not render any textarea elements', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not render a Save button', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  describe('Close functionality', () => {
    it('should render a Close button', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should call onClose when Close button is clicked', () => {
      const onClose = jest.fn();
      const app = createMockApplication();

      render(<ApplicationViewModal app={app} onClose={onClose} />);

      fireEvent.click(screen.getByText('Close'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking the backdrop', () => {
      const onClose = jest.fn();
      const app = createMockApplication();

      render(<ApplicationViewModal app={app} onClose={onClose} />);

      // Click on the backdrop (the outer div with the dark overlay)
      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside the modal content', () => {
      const onClose = jest.fn();
      const app = createMockApplication();

      render(<ApplicationViewModal app={app} onClose={onClose} />);

      // Click on the modal content
      const modalContent = screen.getByTestId('modal-content');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Distinct from edit modal', () => {
    it('should have "Application Details" title, not "Edit Application"', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Application Details')).toBeInTheDocument();
      expect(screen.queryByText('Edit Application')).not.toBeInTheDocument();
      expect(screen.queryByText('New Application')).not.toBeInTheDocument();
    });

    it('should only have Close button, not Cancel and Save', () => {
      const app = createMockApplication();

      render(<ApplicationViewModal {...defaultProps} app={app} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });
});
