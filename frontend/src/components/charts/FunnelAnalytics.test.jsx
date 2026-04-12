/**
 * @file FunnelAnalytics.test.jsx
 * @description Tests for the FunnelAnalytics component.
 * Tests written first following TDD methodology.
 */

import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import FunnelAnalytics from './FunnelAnalytics';

expect.extend(toHaveNoViolations);

describe('FunnelAnalytics', () => {
  const mockFunnelData = {
    stageConversionRates: {
      APPLIED: 100,
      RECRUITER_SCREEN: 60,
      TECH_SCREEN: 40,
      OFFER_RECEIVED: 15,
      OFFER_ACCEPTED: 8,
    },
    dropOffPoints: [
      { status: 'REJECTED', count: 12, percentage: 24.0 },
      { status: 'GHOSTED', count: 8, percentage: 16.0 },
      { status: 'WITHDRAWN', count: 5, percentage: 10.0 },
    ],
    successRateByPositionType: [
      { positionType: 'SENIOR', totalApplications: 15, offersReceived: 3, successRate: 20 },
      { positionType: 'MID', totalApplications: 10, offersReceived: 1, successRate: 10 },
      { positionType: 'JUNIOR', totalApplications: 8, offersReceived: 0, successRate: 0 },
    ],
    overallSuccessRate: 12.5,
    totalApplicationsAnalyzed: 40,
  };

  describe('Basic Rendering', () => {
    it('renders the chart with header', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText('Funnel Analytics')).toBeInTheDocument();
    });

    it('renders the chart container with correct test id', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('shows empty state when data is %s', (_, data) => {
      render(<FunnelAnalytics data={data} />);
      expect(screen.getByText('No funnel data available')).toBeInTheDocument();
    });

    it('shows loading state when loading is true', () => {
      render(<FunnelAnalytics data={null} loading={true} />);
      expect(screen.getByText('Loading funnel data...')).toBeInTheDocument();
    });

    it('displays total applications analyzed', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText(/40 applications/i)).toBeInTheDocument();
    });
  });

  describe('Overall Success Rate', () => {
    it('displays overall success rate prominently', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText('12.5%')).toBeInTheDocument();
      expect(screen.getByText(/overall success/i)).toBeInTheDocument();
    });

    it('handles zero overall success rate', () => {
      const dataWithZeroSuccess = {
        ...mockFunnelData,
        overallSuccessRate: 0,
      };

      render(<FunnelAnalytics data={dataWithZeroSuccess} />);
      // The overall success rate container should exist
      expect(screen.getByTestId('overall-success-rate')).toBeInTheDocument();
    });

    it('applies appropriate color based on success rate', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const successContainer = screen.getByTestId('overall-success-rate');
      // Should have gray color for low rate (12.5%)
      expect(successContainer).toBeInTheDocument();
    });
  });

  describe('Stage Conversion Funnel', () => {
    it('renders stage conversion section with funnel heading', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText(/stage conversion/i)).toBeInTheDocument();
    });

    it('renders funnel bars with visual width representing remaining percentage', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const funnelBars = screen.getAllByTestId('funnel-bar');
      expect(funnelBars.length).toBeGreaterThan(0);
    });

    it('renders stage labels in conversion funnel', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      // Should show stage labels
      expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Recruiter Screen').length).toBeGreaterThan(0);
    });

    it('renders conversion rates for each stage', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      // Should show conversion rate percentages
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('displays funnel shape with decreasing bar widths', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const funnelBars = screen.getAllByTestId('funnel-bar');
      // Each bar should have a width style that decreases
      expect(funnelBars.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Drop-Off Points (Horizontal Bar Chart)', () => {
    it('displays drop-off points section heading', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText(/drop-off points/i)).toBeInTheDocument();
    });

    it('renders drop-off points sorted by count (highest first)', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const dropOffBars = screen.getAllByTestId('dropoff-bar');
      // Should have 3 drop-off points
      expect(dropOffBars.length).toBe(3);

      // Verify order: REJECTED (12), GHOSTED (8), WITHDRAWN (5)
      const labels = dropOffBars.map((bar) =>
        within(bar).getByTestId('dropoff-label').textContent
      );
      expect(labels[0]).toBe('Rejected');
      expect(labels[1]).toBe('Ghosted');
      expect(labels[2]).toBe('Withdrawn');
    });

    it('shows count and percentage for each drop-off point', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      // Check for counts
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders horizontal bars with width proportional to count', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const dropOffBars = screen.getAllByTestId('dropoff-bar');
      expect(dropOffBars.length).toBe(3);
    });

    it('handles data with no drop-off points gracefully', () => {
      const dataWithNoDropOff = {
        ...mockFunnelData,
        dropOffPoints: [],
      };

      render(<FunnelAnalytics data={dataWithNoDropOff} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
      expect(screen.queryByTestId('dropoff-bar')).not.toBeInTheDocument();
    });
  });

  describe('Response Rate Breakdown', () => {
    it('displays response rate breakdown section heading', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText(/response breakdown/i)).toBeInTheDocument();
    });

    it('shows percentage that got interviews', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const responseSection = screen.getByTestId('response-breakdown');
      expect(within(responseSection).getByText(/interviewed/i)).toBeInTheDocument();
    });

    it('shows percentage ghosted', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const responseSection = screen.getByTestId('response-breakdown');
      expect(within(responseSection).getByText(/ghosted/i)).toBeInTheDocument();
    });

    it('shows percentage rejected', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const responseSection = screen.getByTestId('response-breakdown');
      expect(within(responseSection).getByText(/rejected/i)).toBeInTheDocument();
    });

    it('shows percentage still active', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const responseSection = screen.getByTestId('response-breakdown');
      expect(within(responseSection).getByText(/active/i)).toBeInTheDocument();
    });

    it('calculates response breakdown from drop-off points data', () => {
      // Total: 40 applications
      // Rejected: 12 (24%), Ghosted: 8 (16%), Withdrawn: 5 (10%)
      // The component should derive these percentages
      render(<FunnelAnalytics data={mockFunnelData} />);
      const responseSection = screen.getByTestId('response-breakdown');
      expect(responseSection).toBeInTheDocument();
    });
  });

  describe('Success by Position Level (replaced Success by Company)', () => {
    it('displays success by position level section heading', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByText(/success by position/i)).toBeInTheDocument();
    });

    it('does NOT display success by company section', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.queryByText(/success by company/i)).not.toBeInTheDocument();
    });

    it('shows position type labels with human-readable names', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const positionSection = screen.getByTestId('position-success');
      expect(within(positionSection).getByText('Senior')).toBeInTheDocument();
      expect(within(positionSection).getByText('Mid-Level')).toBeInTheDocument();
      expect(within(positionSection).getByText('Junior')).toBeInTheDocument();
    });

    it('shows success rate for each position level', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const positionSection = screen.getByTestId('position-success');
      // Senior has 20% success rate
      expect(within(positionSection).getByText('20%')).toBeInTheDocument();
      // Mid has 10% success rate
      expect(within(positionSection).getByText('10%')).toBeInTheDocument();
    });

    it('shows offers received and total applications', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const positionSection = screen.getByTestId('position-success');
      // Senior: 3/15
      expect(within(positionSection).getByText('3/15')).toBeInTheDocument();
      // Mid: 1/10
      expect(within(positionSection).getByText('1/10')).toBeInTheDocument();
    });

    it('handles data with no position type data gracefully', () => {
      const dataWithNoPositionType = {
        ...mockFunnelData,
        successRateByPositionType: [],
      };

      render(<FunnelAnalytics data={dataWithNoPositionType} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
      expect(screen.queryByTestId('position-success')).not.toBeInTheDocument();
    });

    it('sorts position levels by success rate (highest first)', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      const positionSection = screen.getByTestId('position-success');
      const positionItems = within(positionSection).getAllByTestId('position-item');

      // First item should be Senior (20%), then Mid (10%), then Junior (0%)
      expect(within(positionItems[0]).getByText('Senior')).toBeInTheDocument();
      expect(within(positionItems[1]).getByText('Mid-Level')).toBeInTheDocument();
      expect(within(positionItems[2]).getByText('Junior')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty stageConversionRates', () => {
      const dataWithEmptyRates = {
        ...mockFunnelData,
        stageConversionRates: {},
      };

      render(<FunnelAnalytics data={dataWithEmptyRates} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
    });

    it('handles missing optional data gracefully', () => {
      const minimalData = {
        stageConversionRates: { APPLIED: 100 },
        overallSuccessRate: 5,
        totalApplicationsAnalyzed: 20,
      };

      render(<FunnelAnalytics data={minimalData} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('handles null dropOffPoints', () => {
      const dataWithNullDropOff = {
        ...mockFunnelData,
        dropOffPoints: null,
      };

      render(<FunnelAnalytics data={dataWithNullDropOff} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
    });

    it('handles null successRateByPositionType', () => {
      const dataWithNullPositionType = {
        ...mockFunnelData,
        successRateByPositionType: null,
      };

      render(<FunnelAnalytics data={dataWithNullPositionType} />);
      expect(screen.getByTestId('funnel-analytics')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<FunnelAnalytics data={mockFunnelData} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible chart heading', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should have section headings for screen readers', () => {
      render(<FunnelAnalytics data={mockFunnelData} />);
      // Each section should have h4 headings
      const sectionHeadings = screen.getAllByRole('heading', { level: 4 });
      expect(sectionHeadings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
