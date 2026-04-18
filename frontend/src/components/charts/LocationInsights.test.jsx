/**
 * @file LocationInsights.test.jsx
 * @description Tests for the LocationInsights component.
 *
 * Tests cover:
 * - Loading state display
 * - Empty state display
 * - Rendering location data
 * - Rendering RTO type data
 * - Proper formatting of salaries and metrics
 * - Accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LocationInsights from './LocationInsights';

expect.extend(toHaveNoViolations);

describe('LocationInsights', () => {
  const mockData = {
    byLocation: [
      {
        location: 'San Francisco, CA',
        applicationCount: 15,
        avgSalaryMin: 150000,
        avgSalaryMax: 200000,
        successRate: 10,
      },
      {
        location: 'New York, NY',
        applicationCount: 10,
        avgSalaryMin: 140000,
        avgSalaryMax: 180000,
        successRate: 5,
      },
      {
        location: 'Not Specified',
        applicationCount: 5,
        avgSalaryMin: null,
        avgSalaryMax: null,
        successRate: 0,
      },
    ],
    byRtoType: [
      {
        rtoType: 'REMOTE',
        applicationCount: 20,
        percentage: 40,
        avgSalaryMin: 140000,
        avgSalaryMax: 180000,
        successRate: 15,
      },
      {
        rtoType: 'HYBRID_3',
        applicationCount: 15,
        percentage: 30,
        avgSalaryMin: 150000,
        avgSalaryMax: 190000,
        successRate: 10,
      },
      {
        rtoType: 'ONSITE',
        applicationCount: 15,
        percentage: 30,
        avgSalaryMin: 145000,
        avgSalaryMax: 185000,
        successRate: 5,
      },
    ],
    totalApplicationsAnalyzed: 50,
  };

  describe('loading state', () => {
    it('should display loading indicator when loading is true', () => {
      render(<LocationInsights data={null} loading={true} />);

      expect(screen.getByText(/loading location data/i)).toBeInTheDocument();
    });

    it('should not display loading indicator when loading is false', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.queryByText(/loading location data/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty state when data is null', () => {
      render(<LocationInsights data={null} loading={false} />);

      expect(screen.getByText(/no location data available/i)).toBeInTheDocument();
    });

    it('should display empty state when both arrays are empty', () => {
      render(
        <LocationInsights
          data={{ byLocation: [], byRtoType: [], totalApplicationsAnalyzed: 0 }}
          loading={false}
        />
      );

      expect(screen.getByText(/no location data available/i)).toBeInTheDocument();
    });
  });

  describe('RTO type display', () => {
    it('should render all RTO types', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByText('Remote')).toBeInTheDocument();
      expect(screen.getByText('Hybrid (3 days)')).toBeInTheDocument();
      expect(screen.getByText('Onsite')).toBeInTheDocument();
    });

    it('should display RTO type counts and percentages', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      // Remote has 20 apps at 40%
      expect(screen.getByText('20 (40%)')).toBeInTheDocument();
    });

    it('should display section header for work arrangement', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByText(/by work arrangement/i)).toBeInTheDocument();
    });
  });

  describe('location display', () => {
    it('should render all locations', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
      expect(screen.getByText('Not Specified')).toBeInTheDocument();
    });

    it('should display application counts for locations', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByText('15 apps')).toBeInTheDocument();
      expect(screen.getByText('10 apps')).toBeInTheDocument();
      expect(screen.getByText('5 apps')).toBeInTheDocument();
    });

    it('should display salary ranges when available', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      // San Francisco: $150k-$200k
      expect(screen.getByText('$150k-$200k')).toBeInTheDocument();
    });

    it('should display dash when salary is null', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      // "Not Specified" location has null salary
      const locationItems = screen.getAllByTestId('location-item');
      const notSpecifiedItem = locationItems.find(item => item.textContent.includes('Not Specified'));
      expect(notSpecifiedItem).toHaveTextContent('—');
    });

    it('should display success rates as percentages', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      // San Francisco has 10% success rate
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should display section header for top locations', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByText(/top locations/i)).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should sort RTO types by application count descending', () => {
      const unsortedData = {
        byLocation: [],
        byRtoType: [
          { rtoType: 'ONSITE', applicationCount: 5, percentage: 25, avgSalaryMin: null, avgSalaryMax: null, successRate: 0 },
          { rtoType: 'REMOTE', applicationCount: 10, percentage: 50, avgSalaryMin: null, avgSalaryMax: null, successRate: 0 },
          { rtoType: 'HYBRID_2', applicationCount: 5, percentage: 25, avgSalaryMin: null, avgSalaryMax: null, successRate: 0 },
        ],
        totalApplicationsAnalyzed: 20,
      };

      render(<LocationInsights data={unsortedData} loading={false} />);

      const rtoItems = screen.getAllByTestId('rto-item');
      expect(rtoItems[0]).toHaveTextContent('Remote');
    });

    it('should sort locations by application count descending', () => {
      const unsortedData = {
        byLocation: [
          { location: 'Small City', applicationCount: 1, avgSalaryMin: null, avgSalaryMax: null, successRate: 0 },
          { location: 'Big City', applicationCount: 10, avgSalaryMin: null, avgSalaryMax: null, successRate: 0 },
          { location: 'Medium City', applicationCount: 5, avgSalaryMin: null, avgSalaryMax: null, successRate: 0 },
        ],
        byRtoType: [],
        totalApplicationsAnalyzed: 16,
      };

      render(<LocationInsights data={unsortedData} loading={false} />);

      const locationItems = screen.getAllByTestId('location-item');
      expect(locationItems[0]).toHaveTextContent('Big City');
      expect(locationItems[1]).toHaveTextContent('Medium City');
      expect(locationItems[2]).toHaveTextContent('Small City');
    });
  });

  describe('header', () => {
    it('should display total applications in header', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByText('50 apps')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations when loading', async () => {
      const { container } = render(<LocationInsights data={null} loading={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with data', async () => {
      const { container } = render(<LocationInsights data={mockData} loading={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have test id for component', () => {
      render(<LocationInsights data={mockData} loading={false} />);

      expect(screen.getByTestId('location-insights')).toBeInTheDocument();
    });
  });
});
