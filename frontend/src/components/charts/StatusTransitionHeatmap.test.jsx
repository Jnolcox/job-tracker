/**
 * @file StatusTransitionHeatmap.test.jsx
 * @description Tests for the StatusTransitionHeatmap component.
 * Tests written first following TDD methodology.
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import StatusTransitionHeatmap from './StatusTransitionHeatmap';

expect.extend(toHaveNoViolations);

describe('StatusTransitionHeatmap', () => {
  const mockTransitionData = {
    transitions: [
      { fromStatus: 'APPLIED', toStatus: 'RECRUITER_SCREEN', count: 15 },
      { fromStatus: 'APPLIED', toStatus: 'REJECTED', count: 8 },
      { fromStatus: 'RECRUITER_SCREEN', toStatus: 'TECH_SCREEN', count: 10 },
      { fromStatus: 'RECRUITER_SCREEN', toStatus: 'REJECTED', count: 5 },
      { fromStatus: 'TECH_SCREEN', toStatus: 'OFFER_RECEIVED', count: 3 },
      { fromStatus: 'TECH_SCREEN', toStatus: 'REJECTED', count: 7 },
    ],
    statuses: ['APPLIED', 'RECRUITER_SCREEN', 'TECH_SCREEN', 'OFFER_RECEIVED', 'REJECTED'],
    totalTransitions: 48,
  };

  it('renders the chart with header', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);
    expect(screen.getByText('Status Transitions')).toBeInTheDocument();
  });

  it('renders the chart container with correct test id', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);
    expect(screen.getByTestId('status-transition-heatmap')).toBeInTheDocument();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty transitions', { transitions: [], statuses: [], totalTransitions: 0 }],
  ])('shows empty state when data is %s', (_, data) => {
    render(<StatusTransitionHeatmap data={data} />);
    expect(screen.getByText('No transition data available')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<StatusTransitionHeatmap data={null} loading={true} />);
    expect(screen.getByText('Loading transitions...')).toBeInTheDocument();
  });

  it('renders heatmap cells for transitions', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);

    // Should render cells for each transition
    const cells = screen.getAllByTestId('heatmap-cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('displays row labels (from statuses)', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);

    // Should show status labels as row headers
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Screen')).toBeInTheDocument();
  });

  it('displays column labels (to statuses)', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);

    // Column headers should be present (may be abbreviated)
    // The component uses abbreviated labels for column headers
    const columnHeaders = screen.getAllByTestId('column-header');
    expect(columnHeaders.length).toBeGreaterThan(0);
  });

  it('shows total transitions count in header', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);
    expect(screen.getByText(/48 total/i)).toBeInTheDocument();
  });

  it('applies color intensity based on count', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);

    const cells = screen.getAllByTestId('heatmap-cell');
    // At least one cell should have a background color applied
    const cellsWithColor = cells.filter(cell => {
      const style = window.getComputedStyle(cell);
      return style.backgroundColor !== 'transparent' && style.backgroundColor !== '';
    });
    expect(cellsWithColor.length).toBeGreaterThan(0);
  });

  it('displays count values in cells', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);

    // Should show count values
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders legend with color scale', () => {
    render(<StatusTransitionHeatmap data={mockTransitionData} />);

    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('handles single transition', () => {
    const singleTransition = {
      transitions: [{ fromStatus: 'APPLIED', toStatus: 'REJECTED', count: 1 }],
      statuses: ['APPLIED', 'REJECTED'],
      totalTransitions: 1,
    };

    render(<StatusTransitionHeatmap data={singleTransition} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/1 total/i)).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<StatusTransitionHeatmap data={mockTransitionData} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible chart heading', () => {
      render(<StatusTransitionHeatmap data={mockTransitionData} />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('cells should have aria-label for screen readers', () => {
      render(<StatusTransitionHeatmap data={mockTransitionData} />);

      const cells = screen.getAllByTestId('heatmap-cell');
      const cellsWithLabel = cells.filter(cell => cell.getAttribute('aria-label'));
      expect(cellsWithLabel.length).toBeGreaterThan(0);
    });
  });
});
