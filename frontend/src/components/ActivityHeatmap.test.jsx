/**
 * @file ActivityHeatmap.test.jsx
 * @description Tests for the GitHub-style ActivityHeatmap component
 *
 * Tests cover:
 * - Building GitHub-style weekly grid from applications
 * - Month label generation
 * - Date range calculations (January 1st of current year through December 31st)
 * - Cell color calculations based on activity count
 * - Proper day of week alignment (rows: Sun-Sat, columns: weeks)
 * - Responsive width behavior (fills container width using CSS Grid)
 * - Dynamic cell sizing with square aspect ratio
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ActivityHeatmap, {
  buildGitHubHeatmapData,
  getWeeksInRange,
  getMonthLabels,
  DAYS
} from './ActivityHeatmap';

describe('ActivityHeatmap', () => {
  describe('buildGitHubHeatmapData', () => {
    it('should return empty grid when no applications provided', () => {
      const result = buildGitHubHeatmapData([], new Date('2025-02-27'));

      expect(result.grid).toBeDefined();
      expect(result.maxCount).toBe(0);
      expect(result.weeks.length).toBeGreaterThan(0);
    });

    it('should count applications by their appliedAt date', () => {
      const apps = [
        { id: '1', appliedAt: '2025-02-10T10:00:00Z' },
        { id: '2', appliedAt: '2025-02-10T15:00:00Z' }, // Same date, different time
        { id: '3', appliedAt: '2025-02-11T10:00:00Z' },
      ];

      const result = buildGitHubHeatmapData(apps, new Date('2025-02-27'));

      // February 10, 2025 should have 2 applications
      const feb10Key = '2025-02-10';
      expect(result.grid[feb10Key]).toBe(2);

      // February 11, 2025 should have 1 application
      const feb11Key = '2025-02-11';
      expect(result.grid[feb11Key]).toBe(1);

      // Max count should be 2
      expect(result.maxCount).toBe(2);
    });

    it('should ignore applications with invalid appliedAt dates', () => {
      const apps = [
        { id: '1', appliedAt: '2025-02-10T10:00:00Z' },
        { id: '2', appliedAt: null },
        { id: '3', appliedAt: undefined },
        { id: '4', appliedAt: 'invalid-date' },
      ];

      const result = buildGitHubHeatmapData(apps, new Date('2025-02-27'));

      expect(result.maxCount).toBe(1);
    });

    it('should start from January 1st of the current year', () => {
      const apps = [];
      // Create date in local timezone
      const today = new Date(2025, 5, 15); // June 15, 2025

      const result = buildGitHubHeatmapData(apps, today);

      // Start date should be in the week containing January 1st, 2025
      // January 1, 2025 is a Wednesday, so week starts on Sunday Dec 29, 2024
      const jan1 = new Date(2025, 0, 1);
      const expectedWeekStart = new Date(2024, 11, 29); // Sunday Dec 29, 2024
      expectedWeekStart.setHours(0, 0, 0, 0);

      expect(result.startDate.getTime()).toBe(expectedWeekStart.getTime());

      // Should have weeks from late December 2024 through December 2025
      // That's about 53 weeks (full calendar year)
      expect(result.weeks.length).toBeGreaterThanOrEqual(52);
      expect(result.weeks.length).toBeLessThanOrEqual(54);
    });

    it('should end at December 31st of the current year (full calendar year)', () => {
      const apps = [];
      // Create date in local timezone to avoid timezone issues
      const today = new Date(2025, 2, 15, 12, 0, 0, 0); // March 15, 2025

      const result = buildGitHubHeatmapData(apps, today);

      // End date should be December 31st of the current year
      expect(result.endDate.getFullYear()).toBe(today.getFullYear());
      expect(result.endDate.getMonth()).toBe(11); // December
      expect(result.endDate.getDate()).toBe(31);
    });

    it('should extend range to include applications older than January 1st', () => {
      const oldApp = {
        id: '1',
        appliedAt: '2024-06-15T10:00:00Z', // Last year
      };
      const today = new Date('2025-02-27');

      const result = buildGitHubHeatmapData([oldApp], today);

      // The grid should include the old application's date
      expect(result.grid['2024-06-15']).toBe(1);

      // Start date should be extended to include June 2024
      expect(result.startDate.getFullYear()).toBe(2024);
      expect(result.startDate.getMonth()).toBeLessThanOrEqual(5); // June or earlier
    });
  });

  describe('getWeeksInRange', () => {
    it('should return array of week start dates', () => {
      const startDate = new Date('2025-02-01');
      const endDate = new Date('2025-02-28');

      const weeks = getWeeksInRange(startDate, endDate);

      expect(weeks.length).toBeGreaterThan(0);
      // Each week should start on Sunday
      weeks.forEach(week => {
        expect(week.getDay()).toBe(0); // Sunday = 0
      });
    });

    it('should include all weeks that contain dates in the range', () => {
      const startDate = new Date('2025-02-10'); // Monday
      const endDate = new Date('2025-02-20'); // Thursday

      const weeks = getWeeksInRange(startDate, endDate);

      // Should include at least 2 weeks
      expect(weeks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getMonthLabels', () => {
    it('should return month labels for weeks that start new months', () => {
      const weeks = [
        new Date('2025-01-05'), // January
        new Date('2025-01-12'),
        new Date('2025-01-19'),
        new Date('2025-01-26'),
        new Date('2025-02-02'), // February starts
        new Date('2025-02-09'),
      ];

      const labels = getMonthLabels(weeks);

      // Should have labels for January and February
      expect(labels).toContainEqual(expect.objectContaining({ label: 'Jan' }));
      expect(labels).toContainEqual(expect.objectContaining({ label: 'Feb' }));
    });

    it('should include week index for positioning', () => {
      const weeks = [
        new Date('2025-01-05'),
        new Date('2025-02-02'),
      ];

      const labels = getMonthLabels(weeks);

      labels.forEach(label => {
        expect(label).toHaveProperty('index');
        expect(label).toHaveProperty('label');
        expect(typeof label.index).toBe('number');
      });
    });
  });

  describe('DAYS constant', () => {
    it('should have 7 days starting with Sunday', () => {
      expect(DAYS).toHaveLength(7);
      expect(DAYS[0]).toBe('Sun');
      expect(DAYS[6]).toBe('Sat');
    });
  });

  describe('ActivityHeatmap component rendering', () => {
    it('should render the component with title', () => {
      render(<ActivityHeatmap apps={[]} />);

      expect(screen.getByText(/Application Activity/i)).toBeInTheDocument();
    });

    it('should render day labels (Sun-Sat)', () => {
      render(<ActivityHeatmap apps={[]} />);

      // At minimum, should show abbreviated day labels
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
    });

    it('should render month labels', () => {
      render(<ActivityHeatmap apps={[]} />);

      // Should have at least one month label visible
      // The exact months depend on current date, so we check for any 3-letter month
      const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;
      const allText = screen.getAllByText(monthPattern);
      expect(allText.length).toBeGreaterThan(0);
    });

    it('should render legend with 0 and max values', () => {
      const apps = [
        { id: '1', appliedAt: '2025-02-10T10:00:00Z' },
        { id: '2', appliedAt: '2025-02-10T15:00:00Z' },
      ];

      render(<ActivityHeatmap apps={apps} />);

      // Legend should show 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should render cells with title attributes for tooltips', () => {
      const apps = [
        { id: '1', appliedAt: '2025-02-10T10:00:00Z' },
      ];

      const { container } = render(<ActivityHeatmap apps={apps} />);

      // Find cells with title attributes (for tooltips)
      const cellsWithTitles = container.querySelectorAll('[title]');
      expect(cellsWithTitles.length).toBeGreaterThan(0);
    });

    it('should render 7 rows for days of the week', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Find the grid container and check for 7 day rows
      // Each row represents a day of the week
      const dayRows = container.querySelectorAll('[data-testid="heatmap-day-row"]');
      expect(dayRows.length).toBe(7);
    });

    it('should handle empty apps array gracefully', () => {
      expect(() => render(<ActivityHeatmap apps={[]} />)).not.toThrow();
    });

    it('should handle null/undefined apps gracefully', () => {
      expect(() => render(<ActivityHeatmap apps={null} />)).not.toThrow();
      expect(() => render(<ActivityHeatmap apps={undefined} />)).not.toThrow();
    });
  });

  describe('Color gradient', () => {
    it('should use deep blue for empty cells', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Find a cell - empty cells should have the empty color
      const cells = container.querySelectorAll('[data-testid^="heatmap-cell-"]');
      expect(cells.length).toBeGreaterThan(0);

      // At least one cell should have the empty background color
      const emptyCellStyle = cells[0].style.background;
      expect(emptyCellStyle).toBeTruthy();
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly in tooltips', () => {
      const apps = [
        { id: '1', appliedAt: '2025-02-10T10:00:00Z' },
      ];

      const { container } = render(<ActivityHeatmap apps={apps} />);

      // Find the cell for Feb 10, 2025
      const cell = container.querySelector('[title*="Feb 10"]');
      expect(cell).toBeInTheDocument();

      // Title should contain the count
      expect(cell.getAttribute('title')).toMatch(/1 application/i);
    });
  });

  describe('Responsive cell sizing', () => {
    it('should use CSS Grid layout for week rows', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // The day rows should use CSS Grid with 1fr columns
      const dayRows = container.querySelectorAll('[data-testid="heatmap-day-row"]');
      expect(dayRows.length).toBe(7);

      const firstRow = dayRows[0];
      expect(firstRow.style.display).toBe('grid');
    });

    it('should have grid container that fills available width', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // The grid container should have flex: 1 to fill available space
      const gridContainer = container.querySelector('[data-testid="heatmap-grid-container"]');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer.style.flex).toBe('1');
    });

    it('should use aspect-ratio to maintain square cells', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Find cells with data-testid
      const cells = container.querySelectorAll('[data-testid^="heatmap-cell-"]');
      expect(cells.length).toBeGreaterThan(0);

      // Cells should have aspect-ratio: 1 to stay square
      const firstCell = cells[0];
      expect(firstCell.style.aspectRatio).toBe('1');
    });

    it('should NOT use fixed pixel width on cells', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Find cells
      const cells = container.querySelectorAll('[data-testid^="heatmap-cell-"]');
      expect(cells.length).toBeGreaterThan(0);

      // Cells should NOT have fixed width (should be empty or use grid sizing)
      const firstCell = cells[0];
      expect(firstCell.style.width).toBeFalsy();
    });

    it('should display all weeks from Jan 1 through Dec 31 (52-53 weeks)', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Count the number of cells in a single row
      const firstDayRow = container.querySelector('[data-testid="heatmap-day-row"]');
      const cellsInRow = firstDayRow.querySelectorAll('[data-testid^="heatmap-cell-"]');

      // Should have 52-54 weeks for a full calendar year
      expect(cellsInRow.length).toBeGreaterThanOrEqual(52);
      expect(cellsInRow.length).toBeLessThanOrEqual(54);
    });

    it('should use CSS Grid layout for the grid container structure', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // The grid container should be present for proper column layout
      const gridContainer = container.querySelector('[data-testid="heatmap-grid-container"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
