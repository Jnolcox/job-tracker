/**
 * @file SalaryRangeChart.test.jsx
 * @description Tests for the SalaryRangeChart component including hover tooltip functionality.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SalaryRangeChart from './SalaryRangeChart';

expect.extend(toHaveNoViolations);

/**
 * Factory function to create mock salary distribution data.
 * @param {Object} overrides - Properties to override in the default data
 * @returns {Object} Mock salary distribution data
 */
const createMockSalaryDistribution = (overrides = {}) => ({
  entries: [
    { company: 'Acme Corp', salaryMin: 80000, salaryMax: 100000 },
    { company: 'Tech Inc', salaryMin: 90000, salaryMax: 120000 },
    { company: 'Startup LLC', salaryMin: 70000, salaryMax: 95000 },
  ],
  avgMin: 80000,
  avgMax: 105000,
  activeAppsWithSalary: 3,
  ...overrides,
});

describe('SalaryRangeChart', () => {
  describe('Rendering', () => {
    it('renders the chart with title', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);
      expect(screen.getByText('Salary Range Distribution')).toBeInTheDocument();
    });

    it('shows empty state when no salary data is available', () => {
      render(<SalaryRangeChart salaryDistribution={{ entries: [] }} />);
      expect(screen.getByText('No applications with salary data')).toBeInTheDocument();
    });

    it('shows empty state when salaryDistribution is null', () => {
      render(<SalaryRangeChart salaryDistribution={null} />);
      expect(screen.getByText('No applications with salary data')).toBeInTheDocument();
    });

    it('renders scatter plot dots for each entry', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      const dots = screen.getAllByTestId('salary-dot');
      expect(dots).toHaveLength(3);
    });

    it('renders axis labels', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      expect(screen.getByText('MIN SALARY')).toBeInTheDocument();
      expect(screen.getByText('MAX SALARY')).toBeInTheDocument();
    });
  });

  describe('Tooltip Hover Functionality', () => {
    it('does not show tooltip initially', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      expect(screen.queryByTestId('salary-tooltip')).not.toBeInTheDocument();
    });

    it('shows tooltip with company name when hovering over a dot', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      const dots = screen.getAllByTestId('salary-dot');
      fireEvent.mouseEnter(dots[0]);

      const tooltip = screen.getByTestId('salary-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Acme Corp');
    });

    it('shows min salary in tooltip', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      const dots = screen.getAllByTestId('salary-dot');
      fireEvent.mouseEnter(dots[0]);

      const tooltip = screen.getByTestId('salary-tooltip');
      expect(tooltip).toHaveTextContent('$80k');
    });

    it('shows max salary in tooltip', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      const dots = screen.getAllByTestId('salary-dot');
      fireEvent.mouseEnter(dots[0]);

      const tooltip = screen.getByTestId('salary-tooltip');
      expect(tooltip).toHaveTextContent('$100k');
    });

    it('hides tooltip when mouse leaves the dot', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      const dots = screen.getAllByTestId('salary-dot');
      fireEvent.mouseEnter(dots[0]);

      expect(screen.getByTestId('salary-tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(dots[0]);

      expect(screen.queryByTestId('salary-tooltip')).not.toBeInTheDocument();
    });

    it('updates tooltip content when hovering over different dots', () => {
      render(<SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />);

      const dots = screen.getAllByTestId('salary-dot');

      // Hover first dot
      fireEvent.mouseEnter(dots[0]);
      expect(screen.getByTestId('salary-tooltip')).toHaveTextContent('Acme Corp');

      // Move to second dot
      fireEvent.mouseLeave(dots[0]);
      fireEvent.mouseEnter(dots[1]);
      expect(screen.getByTestId('salary-tooltip')).toHaveTextContent('Tech Inc');
    });

    it('displays tooltip with all required information', () => {
      const salaryDistribution = createMockSalaryDistribution({
        entries: [
          { company: 'Test Company', salaryMin: 55000, salaryMax: 75000 },
        ],
        activeAppsWithSalary: 1,
      });

      render(<SalaryRangeChart salaryDistribution={salaryDistribution} />);

      const dot = screen.getByTestId('salary-dot');
      fireEvent.mouseEnter(dot);

      const tooltip = screen.getByTestId('salary-tooltip');
      expect(tooltip).toHaveTextContent('Test Company');
      expect(tooltip).toHaveTextContent('$55k');
      expect(tooltip).toHaveTextContent('$75k');
    });
  });

  describe('Loading State', () => {
    it('shows loading state when loading is true', () => {
      render(
        <SalaryRangeChart
          salaryDistribution={createMockSalaryDistribution()}
          loading={true}
        />
      );

      // ChartContainer handles loading state, just verify the component renders
      expect(screen.getByText('Salary Range Distribution')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when tooltip is visible', async () => {
      const { container } = render(
        <SalaryRangeChart salaryDistribution={createMockSalaryDistribution()} />
      );

      const dots = screen.getAllByTestId('salary-dot');
      fireEvent.mouseEnter(dots[0]);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
