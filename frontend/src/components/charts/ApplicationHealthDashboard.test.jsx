/**
 * @file ApplicationHealthDashboard.test.jsx
 * @description Tests for the ApplicationHealthDashboard component.
 * Tests written first following TDD methodology.
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ApplicationHealthDashboard from './ApplicationHealthDashboard';

expect.extend(toHaveNoViolations);

describe('ApplicationHealthDashboard', () => {
  const mockHealthData = {
    staleApplications: [
      {
        applicationId: 1,
        companyName: 'Google',
        positionTitle: 'Software Engineer',
        currentStatus: 'APPLIED',
        lastEventAt: '2026-03-01T10:00:00Z',
        daysSinceLastEvent: 41,
      },
      {
        applicationId: 2,
        companyName: 'Meta',
        positionTitle: 'Frontend Developer',
        currentStatus: 'RECRUITER_SCREEN',
        lastEventAt: '2026-03-15T10:00:00Z',
        daysSinceLastEvent: 27,
      },
    ],
    hotApplications: [
      {
        applicationId: 3,
        companyName: 'Amazon',
        positionTitle: 'Senior SDE',
        currentStatus: 'TECH_SCREEN',
        recentEventCount: 5,
        lastEventAt: '2026-04-10T10:00:00Z',
      },
    ],
    quickWins: [
      {
        applicationId: 4,
        companyName: 'Netflix',
        positionTitle: 'Staff Engineer',
        finalStatus: 'OFFER_ACCEPTED',
        appliedAt: '2026-03-01T10:00:00Z',
        resolvedAt: '2026-03-20T10:00:00Z',
        daysToResolution: 19,
      },
    ],
    quickLosses: [
      {
        applicationId: 5,
        companyName: 'Stripe',
        positionTitle: 'Backend Engineer',
        finalStatus: 'REJECTED',
        appliedAt: '2026-03-01T10:00:00Z',
        resolvedAt: '2026-03-05T10:00:00Z',
        daysToResolution: 4,
      },
    ],
    staleDaysThreshold: 14,
    summary: {
      staleCount: 2,
      hotCount: 1,
      quickWinCount: 1,
      quickLossCount: 1,
      activeCount: 10,
    },
  };

  it('renders the chart with header', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);
    expect(screen.getByText('Application Health')).toBeInTheDocument();
  });

  it('renders the chart container with correct test id', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);
    expect(screen.getByTestId('application-health-dashboard')).toBeInTheDocument();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('shows empty state when data is %s', (_, data) => {
    render(<ApplicationHealthDashboard data={data} />);
    expect(screen.getByText('No health data available')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<ApplicationHealthDashboard data={null} loading={true} />);
    expect(screen.getByText('Analyzing application health...')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    // Should show summary counts
    expect(screen.getByText('2')).toBeInTheDocument(); // stale count
    expect(screen.getByText('10')).toBeInTheDocument(); // active count
  });

  it('displays stale applications section', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    // Multiple elements contain "stale" (summary card and section header)
    expect(screen.getAllByText(/stale/i).length).toBeGreaterThan(0);
  });

  it('shows stale application company names', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
  });

  it('shows days since last event for stale applications', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    // Should show days since last event
    expect(screen.getByText(/41d/i)).toBeInTheDocument();
    expect(screen.getByText(/27d/i)).toBeInTheDocument();
  });

  it('displays hot applications section', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    // Multiple elements contain "hot" (summary card and section header)
    expect(screen.getAllByText(/hot/i).length).toBeGreaterThan(0);
  });

  it('shows hot application details', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('displays quick wins section when available', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    // Multiple elements may contain "Quick Wins" (summary card and section header)
    expect(screen.getAllByText(/quick win/i).length).toBeGreaterThan(0);
  });

  it('shows quick win company name', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('shows days to resolution for quick wins', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    expect(screen.getByText(/19d/i)).toBeInTheDocument();
  });

  it('handles empty stale applications', () => {
    const dataWithNoStale = {
      ...mockHealthData,
      staleApplications: [],
      summary: { ...mockHealthData.summary, staleCount: 0 },
    };

    render(<ApplicationHealthDashboard data={dataWithNoStale} />);
    expect(screen.getByTestId('application-health-dashboard')).toBeInTheDocument();
  });

  it('handles empty hot applications', () => {
    const dataWithNoHot = {
      ...mockHealthData,
      hotApplications: [],
      summary: { ...mockHealthData.summary, hotCount: 0 },
    };

    render(<ApplicationHealthDashboard data={dataWithNoHot} />);
    expect(screen.getByTestId('application-health-dashboard')).toBeInTheDocument();
  });

  it('displays stale days threshold', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    expect(screen.getByText(/14 days/i)).toBeInTheDocument();
  });

  it('renders health indicator cards', () => {
    render(<ApplicationHealthDashboard data={mockHealthData} />);

    const cards = screen.getAllByTestId('health-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ApplicationHealthDashboard data={mockHealthData} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible chart heading', () => {
      render(<ApplicationHealthDashboard data={mockHealthData} />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});
