/**
 * @file ActivityHeatmap.test.jsx
 * @description Tests for the GitHub-style ActivityHeatmap component
 *
 * Tests cover:
 * - Building GitHub-style weekly grid from applications
 * - Month label generation
 * - Date range calculations (January 1st of current year through today)
 * - Cell color calculations based on activity count
 * - Proper day of week alignment (rows: Sun-Sat, columns: weeks)
 * - Responsive width behavior (fills container width)
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

      // Should have weeks from late December 2024 through mid-June 2025
      // That's about 24-25 weeks
      expect(result.weeks.length).toBeGreaterThanOrEqual(23);
      expect(result.weeks.length).toBeLessThanOrEqual(26);
    });

    it('should end at today (not end of year) when viewing current year', () => {
      const apps = [];
      // Create date in local timezone to avoid timezone issues
      const today = new Date(2025, 2, 15, 12, 0, 0, 0); // March 15, 2025

      const result = buildGitHubHeatmapData(apps, today);

      // End date should be today (same year, month, day)
      expect(result.endDate.getFullYear()).toBe(today.getFullYear());
      expect(result.endDate.getMonth()).toBe(today.getMonth());
      expect(result.endDate.getDate()).toBe(today.getDate());
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

  describe('Fixed cell sizing (GitHub-style)', () => {
    it('should use fixed-size cells (10-12px squares)', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Find cells with data-testid
      const cells = container.querySelectorAll('[data-testid^="heatmap-cell-"]');
      expect(cells.length).toBeGreaterThan(0);

      // Cells should have fixed width and height, not flex: 1
      const firstCell = cells[0];
      expect(firstCell.style.width).toMatch(/^\d+px$/);
      expect(firstCell.style.height).toMatch(/^\d+px$/);
      expect(firstCell.style.flex).toBeFalsy();
    });

    it('should NOT stretch cells to fill container width', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // The day rows should NOT use justify-content: space-between
      const dayRows = container.querySelectorAll('[data-testid="heatmap-day-row"]');
      expect(dayRows.length).toBe(7);

      const firstRow = dayRows[0];
      expect(firstRow.style.justifyContent).not.toBe('space-between');
    });

    it('should display all weeks from Jan 1 to today (52+ weeks for full year)', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // Count the number of cells in a single row
      const firstDayRow = container.querySelector('[data-testid="heatmap-day-row"]');
      const cellsInRow = firstDayRow.querySelectorAll('[data-testid^="heatmap-cell-"]');

      // For late February, we should have ~9 weeks from Jan 1
      // The key test is that ALL weeks are shown (not truncated due to width)
      // We verify by checking weeks array in buildGitHubHeatmapData
      const today = new Date();
      const jan1 = new Date(today.getFullYear(), 0, 1);
      const expectedWeeks = Math.ceil((today - jan1) / (7 * 24 * 60 * 60 * 1000)) + 1;

      // Should have roughly the expected number of weeks (within 1-2 for week boundaries)
      expect(cellsInRow.length).toBeGreaterThanOrEqual(expectedWeeks - 2);
    });

    it('should use CSS Grid layout for the week columns', () => {
      const { container } = render(<ActivityHeatmap apps={[]} />);

      // The grid container should use CSS Grid for proper column layout
      const gridContainer = container.querySelector('[data-testid="heatmap-grid-container"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
