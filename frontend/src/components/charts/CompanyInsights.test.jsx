/**
 * @file CompanyInsights.test.jsx
 * @description Tests for the CompanyInsights component.
 *
 * Tests cover:
 * - Loading state display
 * - Empty state display
 * - Rendering company data
 * - Proper formatting of metrics
 * - Accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CompanyInsights from './CompanyInsights';

expect.extend(toHaveNoViolations);

describe('CompanyInsights', () => {
  const mockData = {
    companies: [
      {
        companyName: 'Google',
        applicationCount: 5,
        responseRate: 80,
        ghostRate: 10,
        interviewRate: 60,
        avgDaysToResponse: 7,
      },
      {
        companyName: 'Meta',
        applicationCount: 3,
        responseRate: 66.7,
        ghostRate: 33.3,
        interviewRate: 33.3,
        avgDaysToResponse: 14,
      },
      {
        companyName: 'Amazon',
        applicationCount: 2,
        responseRate: 50,
        ghostRate: 50,
        interviewRate: 0,
        avgDaysToResponse: null,
      },
    ],
    totalCompaniesAnalyzed: 3,
    totalApplicationsAnalyzed: 10,
  };

  describe('loading state', () => {
    it('should display loading indicator when loading is true', () => {
      render(<CompanyInsights data={null} loading={true} />);

      expect(screen.getByText(/loading company data/i)).toBeInTheDocument();
    });

    it('should not display loading indicator when loading is false', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      expect(screen.queryByText(/loading company data/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty state when data is null', () => {
      render(<CompanyInsights data={null} loading={false} />);

      expect(screen.getByText(/no company data available/i)).toBeInTheDocument();
    });

    it('should display empty state when companies array is empty', () => {
      render(
        <CompanyInsights
          data={{ companies: [], totalCompaniesAnalyzed: 0, totalApplicationsAnalyzed: 0 }}
          loading={false}
        />
      );

      expect(screen.getByText(/no company data available/i)).toBeInTheDocument();
    });
  });

  describe('data display', () => {
    it('should render all companies', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Meta')).toBeInTheDocument();
      expect(screen.getByText('Amazon')).toBeInTheDocument();
    });

    it('should display application counts for each company', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      expect(screen.getByText('5 apps')).toBeInTheDocument();
      expect(screen.getByText('3 apps')).toBeInTheDocument();
      expect(screen.getByText('2 apps')).toBeInTheDocument();
    });

    it('should display response rates as percentages', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      // Google has 80% response rate
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should display ghost rates as percentages', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      // Google has 10% ghost rate
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should display interview rates as percentages', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      // Google has 60% interview rate
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should display average days to response when available', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      // Google has 7 days to response
      expect(screen.getByText('7d')).toBeInTheDocument();
      expect(screen.getByText('14d')).toBeInTheDocument();
    });

    it('should display dash when avgDaysToResponse is null', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      // Amazon has null avgDaysToResponse - check for dash in the Avg Time column
      // The component displays a long dash for null values
      const companyItems = screen.getAllByTestId('company-item');
      const amazonItem = companyItems[2]; // Amazon is the third company
      expect(amazonItem).toHaveTextContent('—');
    });

    it('should display total companies analyzed in header', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      expect(screen.getByText('Top 5 of 3')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should sort companies by application count descending', () => {
      const unsortedData = {
        companies: [
          { companyName: 'Small Co', applicationCount: 1, responseRate: 0, ghostRate: 0, interviewRate: 0, avgDaysToResponse: null },
          { companyName: 'Large Co', applicationCount: 10, responseRate: 0, ghostRate: 0, interviewRate: 0, avgDaysToResponse: null },
          { companyName: 'Medium Co', applicationCount: 5, responseRate: 0, ghostRate: 0, interviewRate: 0, avgDaysToResponse: null },
        ],
        totalCompaniesAnalyzed: 3,
        totalApplicationsAnalyzed: 16,
      };

      render(<CompanyInsights data={unsortedData} loading={false} />);

      const companyItems = screen.getAllByTestId('company-item');
      expect(companyItems[0]).toHaveTextContent('Large Co');
      expect(companyItems[1]).toHaveTextContent('Medium Co');
      expect(companyItems[2]).toHaveTextContent('Small Co');
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations when loading', async () => {
      const { container } = render(<CompanyInsights data={null} loading={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with data', async () => {
      const { container } = render(<CompanyInsights data={mockData} loading={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have test id for component', () => {
      render(<CompanyInsights data={mockData} loading={false} />);

      expect(screen.getByTestId('company-insights')).toBeInTheDocument();
    });
  });
});
