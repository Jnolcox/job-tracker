/**
 * @file PositionInsights.test.jsx
 * @description Tests for the PositionInsights component.
 *
 * Tests cover:
 * - Loading state display
 * - Empty state display
 * - Rendering position level data
 * - Distribution visualization
 * - Performance metrics display
 * - Proper formatting of metrics
 * - Accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PositionInsights from './PositionInsights';

expect.extend(toHaveNoViolations);

describe('PositionInsights', () => {
  const mockData = {
    byLevel: [
      {
        level: 'SENIOR',
        applicationCount: 20,
        percentage: 40,
        successRate: 15,
        interviewRate: 50,
        avgSalaryMin: 150000,
        avgSalaryMax: 200000,
      },
      {
        level: 'MID',
        applicationCount: 15,
        percentage: 30,
        successRate: 10,
        interviewRate: 40,
        avgSalaryMin: 100000,
        avgSalaryMax: 140000,
      },
      {
        level: 'JUNIOR',
        applicationCount: 10,
        percentage: 20,
        successRate: 5,
        interviewRate: 30,
        avgSalaryMin: 70000,
        avgSalaryMax: 90000,
      },
      {
        level: 'Not Specified',
        applicationCount: 5,
        percentage: 10,
        successRate: 0,
        interviewRate: 10,
        avgSalaryMin: null,
        avgSalaryMax: null,
      },
    ],
    totalApplicationsAnalyzed: 50,
  };

  describe('loading state', () => {
    it('should display loading indicator when loading is true', () => {
      render(<PositionInsights data={null} loading={true} />);

      expect(screen.getByText(/loading position data/i)).toBeInTheDocument();
    });

    it('should not display loading indicator when loading is false', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      expect(screen.queryByText(/loading position data/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty state when data is null', () => {
      render(<PositionInsights data={null} loading={false} />);

      expect(screen.getByText(/no position data available/i)).toBeInTheDocument();
    });

    it('should display empty state when byLevel array is empty', () => {
      render(
        <PositionInsights
          data={{ byLevel: [], totalApplicationsAnalyzed: 0 }}
          loading={false}
        />
      );

      expect(screen.getByText(/no position data available/i)).toBeInTheDocument();
    });
  });

  describe('distribution display', () => {
    it('should render all position levels', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      expect(screen.getAllByText('Senior').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mid-Level').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Junior').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Not Specified').length).toBeGreaterThanOrEqual(1);
    });

    it('should display application counts and percentages', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      // Senior has 20 apps at 40%
      expect(screen.getByText('20 (40%)')).toBeInTheDocument();
    });

    it('should display section header for distribution', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      expect(screen.getByText(/distribution by level/i)).toBeInTheDocument();
    });
  });

  describe('performance metrics display', () => {
    it('should display interview rates', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      // Senior has 50% interview rate
      expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
    });

    it('should display success rates', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      // Senior has 15% success rate
      expect(screen.getAllByText('15%').length).toBeGreaterThanOrEqual(1);
    });

    it('should display salary ranges when available', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      // Senior: $150k-$200k
      expect(screen.getByText('$150k-$200k')).toBeInTheDocument();
    });

    it('should display dash when salary is null', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      // "Not Specified" level has null salary
      const metricsItems = screen.getAllByTestId('level-metrics');
      const notSpecifiedItem = metricsItems.find(item => item.textContent.includes('Not Specified'));
      expect(notSpecifiedItem).toHaveTextContent('—');
    });

    it('should display section header for performance', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      expect(screen.getByText(/performance by level/i)).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should sort levels by application count descending', () => {
      const unsortedData = {
        byLevel: [
          { level: 'JUNIOR', applicationCount: 5, percentage: 16.7, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
          { level: 'SENIOR', applicationCount: 15, percentage: 50, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
          { level: 'MID', applicationCount: 10, percentage: 33.3, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
        ],
        totalApplicationsAnalyzed: 30,
      };

      render(<PositionInsights data={unsortedData} loading={false} />);

      const levelItems = screen.getAllByTestId('level-item');
      expect(levelItems[0]).toHaveTextContent('Senior');
      expect(levelItems[1]).toHaveTextContent('Mid-Level');
      expect(levelItems[2]).toHaveTextContent('Junior');
    });
  });

  describe('header', () => {
    it('should display total applications in header', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      expect(screen.getByText('50 apps')).toBeInTheDocument();
    });
  });

  describe('level labels', () => {
    it('should display human-readable labels for levels', () => {
      const dataWithAllLevels = {
        byLevel: [
          { level: 'STAFF', applicationCount: 1, percentage: 25, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
          { level: 'PRINCIPAL', applicationCount: 1, percentage: 25, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
          { level: 'LEAD', applicationCount: 1, percentage: 25, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
          { level: 'MANAGER', applicationCount: 1, percentage: 25, successRate: 0, interviewRate: 0, avgSalaryMin: null, avgSalaryMax: null },
        ],
        totalApplicationsAnalyzed: 4,
      };

      render(<PositionInsights data={dataWithAllLevels} loading={false} />);

      expect(screen.getAllByText('Staff').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Principal').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Lead').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Manager').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations when loading', async () => {
      const { container } = render(<PositionInsights data={null} loading={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with data', async () => {
      const { container } = render(<PositionInsights data={mockData} loading={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have test id for component', () => {
      render(<PositionInsights data={mockData} loading={false} />);

      expect(screen.getByTestId('position-insights')).toBeInTheDocument();
    });
  });
});
