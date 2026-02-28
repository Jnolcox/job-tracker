/**
 * @file ActivityHeatmap.jsx
 * @description GitHub-style contribution heatmap showing application activity over time.
 *
 * Displays a grid where:
 * - Rows represent days of the week (Sun-Sat)
 * - Columns represent weeks from January 1st of the current year through today
 * - Cell color intensity indicates the number of applications submitted on that date
 * - Uses fixed-size cells (like GitHub's contribution graph) for consistent appearance
 * - Container scrolls horizontally if needed (though 52 weeks fits in ~700px)
 *
 * Based on the appliedAt date of each application.
 */

import React, { useMemo } from 'react';

/**
 * Days of the week, starting with Sunday (matches JavaScript Date.getDay())
 * @constant {string[]}
 */
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Get the start of the week (Sunday) for a given date.
 * @param {Date} date - The date to get the week start for
 * @returns {Date} The Sunday of that week
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a date as YYYY-MM-DD for use as a grid key.
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for display in tooltips.
 * @param {Date} date - The date to format
 * @returns {string} Human-readable date string (e.g., "Feb 10, 2025")
 */
function formatDateDisplay(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get all weeks (as Sunday start dates) within a date range.
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Date[]} Array of Date objects representing week start dates
 */
export function getWeeksInRange(startDate, endDate) {
  const weeks = [];
  const currentWeek = getWeekStart(startDate);
  const endWeek = getWeekStart(endDate);

  while (currentWeek <= endWeek) {
    weeks.push(new Date(currentWeek));
    currentWeek.setDate(currentWeek.getDate() + 7);
  }

  return weeks;
}

/**
 * Generate month labels for the heatmap header.
 * Returns labels for weeks where a new month starts.
 * @param {Date[]} weeks - Array of week start dates
 * @returns {Array<{index: number, label: string}>} Month labels with their week indices
 */
export function getMonthLabels(weeks) {
  const labels = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;

  weeks.forEach((weekStart, index) => {
    // Check if any day in this week starts a new month
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + dayOffset);
      const month = date.getMonth();

      if (month !== lastMonth) {
        // Only add label if this is the first occurrence of this month
        // and it's within the first few days of the month (to position label at month start)
        if (date.getDate() <= 7) {
          labels.push({
            index,
            label: monthNames[month],
          });
          lastMonth = month;
          break;
        } else if (dayOffset === 0 && index === 0) {
          // For the very first week, always show the month
          labels.push({
            index,
            label: monthNames[month],
          });
          lastMonth = month;
          break;
        }
      }
    }
  });

  return labels;
}

/**
 * Build the heatmap data structure from applications.
 *
 * Date range starts from January 1st of the current year (or earlier if there
 * are applications before that date) and ends at today.
 *
 * @param {Array} apps - Array of application objects with appliedAt property
 * @param {Date} [today=new Date()] - Reference date for calculating the range
 * @returns {{grid: Object, maxCount: number, weeks: Date[], startDate: Date, endDate: Date}}
 */
export function buildGitHubHeatmapData(apps, today = new Date()) {
  const grid = {};
  let maxCount = 0;

  // Calculate date range: start from January 1st of the current year
  const jan1 = new Date(today.getFullYear(), 0, 1);
  jan1.setHours(0, 0, 0, 0);

  // Get the Sunday of the week containing January 1st
  let startDate = getWeekStart(jan1);

  let endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  // Process applications and potentially extend range
  const validApps = (apps || []).filter(app => {
    if (!app || !app.appliedAt) return false;
    const date = new Date(app.appliedAt);
    return !isNaN(date.getTime());
  });

  // Extend range to include oldest application if necessary
  validApps.forEach(app => {
    const appDate = new Date(app.appliedAt);
    if (appDate < startDate) {
      startDate = getWeekStart(appDate);
    }
  });

  // Count applications by date
  validApps.forEach(app => {
    const appDate = new Date(app.appliedAt);
    const dateKey = formatDateKey(appDate);

    grid[dateKey] = (grid[dateKey] || 0) + 1;
    maxCount = Math.max(maxCount, grid[dateKey]);
  });

  // Get all weeks in range
  const weeks = getWeeksInRange(startDate, endDate);

  return {
    grid,
    maxCount,
    weeks,
    startDate,
    endDate,
  };
}

/**
 * Calculate cell background color based on activity count.
 * Uses a deep blue to cyan gradient.
 * @param {number} count - Number of applications on this date
 * @param {number} maxCount - Maximum count across all dates
 * @returns {string} CSS color value
 */
function getCellColor(count, maxCount) {
  if (count === 0) return '#111827'; // Empty cell - dark gray

  const t = maxCount > 0 ? count / maxCount : 0;
  // deep blue -> cyan gradient (matching original implementation)
  const r = Math.round(17 + (80 - 17) * t);
  const g = Math.round(24 + (240 - 24) * t);
  const b = Math.round(39 + (255 - 39) * t);
  return `rgb(${r},${g},${b})`;
}

/**
 * @component ActivityHeatmap
 * @description GitHub-style contribution graph showing job application activity over time.
 *
 * Displays a grid of cells where:
 * - Each row represents a day of the week (Sunday at top, Saturday at bottom)
 * - Each column represents a week
 * - Cell color intensity indicates application count for that specific date
 * - Month labels appear at the top
 * - Includes a legend showing the color scale
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects with appliedAt property
 *
 * @example
 * <ActivityHeatmap apps={applications} />
 *
 * @returns {JSX.Element} Heatmap visualization component
 */
export default function ActivityHeatmap({ apps }) {
  // Build heatmap data
  const { grid, maxCount, weeks } = useMemo(
    () => buildGitHubHeatmapData(apps || []),
    [apps]
  );

  // Generate month labels
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  // Calculate cell size based on number of weeks
  const cellSize = 12;
  const cellGap = 2;

  return (
    <div
      style={{
        background: '#0E1117',
        border: '1px solid #1F2937',
        borderRadius: 12,
        padding: '20px 24px',
        overflowX: 'auto',
      }}
    >
      <h3
        style={{
          color: '#9CA3AF',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: "'DM Mono',monospace",
          marginBottom: 16,
        }}
      >
        Application Activity
      </h3>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Day labels (Y-axis) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingTop: 20, // Space for month labels
            marginRight: 6,
            gap: cellGap,
            flexShrink: 0,
          }}
        >
          {DAYS.map((day, index) => (
            <span
              key={day}
              style={{
                color: '#6B7280',
                fontSize: 9,
                fontFamily: "'DM Mono',monospace",
                width: 26,
                textAlign: 'right',
                height: cellSize,
                lineHeight: `${cellSize}px`,
                // Only show Mon, Wed, Fri for cleaner look (like GitHub)
                visibility: index % 2 === 1 ? 'visible' : 'hidden',
              }}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Main grid area */}
        <div
          data-testid="heatmap-grid-container"
          style={{ minWidth: 0 }}
        >
          {/* Month labels (X-axis) */}
          <div
            style={{
              position: 'relative',
              height: 16,
              marginBottom: 4,
            }}
          >
            {monthLabels.map(({ index, label }) => {
              // Calculate pixel position based on week index and cell size
              const pixelLeft = index * (cellSize + cellGap);
              return (
                <span
                  key={`${label}-${index}`}
                  style={{
                    position: 'absolute',
                    left: pixelLeft,
                    color: '#6B7280',
                    fontSize: 9,
                    fontFamily: "'DM Mono',monospace",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>

          {/* Grid of cells */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: cellGap }}>
            {DAYS.map((day, dayIndex) => (
              <div
                key={day}
                data-testid="heatmap-day-row"
                style={{
                  display: 'flex',
                  gap: cellGap,
                }}
              >
                {weeks.map((weekStart, weekIndex) => {
                  // Calculate the date for this cell
                  const cellDate = new Date(weekStart);
                  cellDate.setDate(cellDate.getDate() + dayIndex);

                  // Don't render future dates
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  if (cellDate > today) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        data-testid={`heatmap-cell-${weekIndex}-${dayIndex}`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 2,
                          background: 'transparent',
                        }}
                      />
                    );
                  }

                  const dateKey = formatDateKey(cellDate);
                  const count = grid[dateKey] || 0;
                  const color = getCellColor(count, maxCount);

                  const tooltipText = `${formatDateDisplay(cellDate)}: ${count} application${count !== 1 ? 's' : ''}`;

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      data-testid={`heatmap-cell-${weekIndex}-${dayIndex}`}
                      title={tooltipText}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 2,
                        background: color,
                        cursor: 'default',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 10,
              justifyContent: 'flex-end',
            }}
          >
            <span
              style={{
                color: '#6B7280',
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              0
            </span>
            {[0, 0.25, 0.5, 0.75, 1].map(t => (
              <div
                key={t}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background: getCellColor(t * (maxCount || 1), maxCount || 1),
                }}
              />
            ))}
            <span
              style={{
                color: '#6B7280',
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {maxCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
