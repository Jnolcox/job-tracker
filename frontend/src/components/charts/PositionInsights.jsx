/**
 * @file PositionInsights.jsx
 * @description Position level analytics visualization showing metrics
 * grouped by seniority level (Junior, Mid, Senior, etc.).
 */

import { useMemo } from 'react';
import ChartContainer from './ChartContainer';
import { formatSalaryCompact, getRateColor } from '../../utils/formatters';
import { LEVEL_COLORS } from '../../constants/colors';

/**
 * Human-readable labels for position levels.
 */
const LEVEL_LABELS = {
  JUNIOR: 'Junior',
  MID: 'Mid-Level',
  SENIOR: 'Senior',
  STAFF: 'Staff',
  PRINCIPAL: 'Principal',
  LEAD: 'Lead',
  MANAGER: 'Manager',
  DIRECTOR: 'Director',
  VP: 'VP',
  'Not Specified': 'Not Specified',
};

/**
 * @component PositionInsights
 * @description Displays position level analytics including:
 * - Distribution by seniority level
 * - Success rates and interview rates per level
 * - Average salary ranges
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Position insights data from backend
 * @param {Array<{level: string, applicationCount: number, percentage: number, successRate: number, interviewRate: number, avgSalaryMin: number|null, avgSalaryMax: number|null}>} props.data.byLevel
 * @param {number} props.data.totalApplicationsAnalyzed
 * @param {boolean} [props.loading=false] - Whether data is loading
 *
 * @example
 * <PositionInsights
 *   data={{
 *     byLevel: [{ level: 'SENIOR', applicationCount: 20, percentage: 40, successRate: 15, interviewRate: 50, avgSalaryMin: 150000, avgSalaryMax: 200000 }],
 *     totalApplicationsAnalyzed: 50
 *   }}
 * />
 *
 * @returns {JSX.Element} Position insights component
 */
export default function PositionInsights({ data, loading = false }) {
  // Sort levels by application count
  const sortedLevels = useMemo(() => {
    if (!data?.byLevel || !Array.isArray(data.byLevel)) return [];
    return [...data.byLevel].sort((a, b) => b.applicationCount - a.applicationCount);
  }, [data]);

  // Calculate max application count for bar widths
  const maxCount = useMemo(() => {
    if (sortedLevels.length === 0) return 0;
    return sortedLevels[0]?.applicationCount || 0;
  }, [sortedLevels]);

  const isEmpty = !data || !data.byLevel || data.byLevel.length === 0;

  const headerRight =
    !isEmpty && data?.totalApplicationsAnalyzed ? (
      <span
        style={{
          color: '#6B7280',
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {data.totalApplicationsAnalyzed} apps
      </span>
    ) : null;

  return (
    <ChartContainer
      title="Position Level Insights"
      headerRight={headerRight}
      testId="position-insights"
    >
      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#6B7280',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            padding: '20px 0',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              border: '2px solid #1F2937',
              borderTopColor: '#4E9AF1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          Loading position data...
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <p
          style={{
            color: '#4B5563',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            fontStyle: 'italic',
            padding: '20px 0',
            margin: 0,
          }}
        >
          No position data available
        </p>
      )}

      {/* Content */}
      {!loading && !isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Distribution visualization */}
          <div>
            <h4
              style={{
                color: '#9CA3AF',
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              Distribution by Level
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortedLevels.map((level) => {
                const barWidthPct =
                  maxCount > 0 ? (level.applicationCount / maxCount) * 100 : 0;
                const color = LEVEL_COLORS[level.level] || LEVEL_COLORS['Not Specified'];

                return (
                  <div
                    key={level.level}
                    data-testid="level-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    {/* Level label */}
                    <span
                      style={{
                        width: 80,
                        color: '#D1D5DB',
                        fontSize: 10,
                        fontFamily: "'DM Mono',monospace",
                        textAlign: 'right',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {LEVEL_LABELS[level.level] || level.level}
                    </span>

                    {/* Bar container */}
                    <div
                      style={{
                        flex: 1,
                        height: 16,
                        background: '#0E1117',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidthPct}%`,
                          minWidth: barWidthPct > 0 ? 2 : 0,
                          height: '100%',
                          background: color,
                          borderRadius: 4,
                          transition: 'width 0.4s ease-out',
                        }}
                      />
                    </div>

                    {/* Count and percentage */}
                    <span
                      style={{
                        width: 50,
                        color: color,
                        fontSize: 10,
                        fontFamily: "'DM Mono',monospace",
                        textAlign: 'right',
                      }}
                    >
                      {level.applicationCount} ({Math.round(level.percentage)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed metrics table */}
          <div>
            <h4
              style={{
                color: '#9CA3AF',
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              Performance by Level
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortedLevels.map((level) => {
                const color = LEVEL_COLORS[level.level] || LEVEL_COLORS['Not Specified'];

                return (
                  <div
                    key={`metrics-${level.level}`}
                    data-testid="level-metrics"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr 70px 70px 90px',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#1F2937',
                      borderRadius: 6,
                      borderLeft: `3px solid ${color}`,
                      gap: 8,
                    }}
                  >
                    {/* Level name - fixed width column */}
                    <span
                      style={{
                        color: '#E5E7EB',
                        fontSize: 11,
                        fontFamily: "'DM Mono',monospace",
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {LEVEL_LABELS[level.level] || level.level}
                    </span>

                    {/* Spacer column for flexible space */}
                    <div />

                    {/* Interview Rate - fixed width column */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          color: getRateColor(level.interviewRate, { thresholds: { excellent: 25, good: 15, moderate: 8 } }),
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(level.interviewRate)}%
                      </div>
                      <div
                        style={{
                          color: '#6B7280',
                          fontSize: 8,
                          fontFamily: "'DM Mono',monospace",
                          textTransform: 'uppercase',
                        }}
                      >
                        Interview
                      </div>
                    </div>

                    {/* Success Rate - fixed width column */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          color: getRateColor(level.successRate, { thresholds: { excellent: 25, good: 15, moderate: 8 } }),
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(level.successRate)}%
                      </div>
                      <div
                        style={{
                          color: '#6B7280',
                          fontSize: 8,
                          fontFamily: "'DM Mono',monospace",
                          textTransform: 'uppercase',
                        }}
                      >
                        Success
                      </div>
                    </div>

                    {/* Salary Range - fixed width column */}
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          color:
                            level.avgSalaryMin !== null ? '#4E9AF1' : '#4B5563',
                          fontSize: 10,
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {level.avgSalaryMin !== null
                          ? `${formatSalaryCompact(level.avgSalaryMin)}-${formatSalaryCompact(level.avgSalaryMax)}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </ChartContainer>
  );
}
