/**
 * @file ApplicationHealthDashboard.jsx
 * @description Dashboard showing application health indicators including
 * stale applications, hot applications, quick wins, and quick losses.
 * Helps users identify applications that need attention or follow-up.
 */

import { useMemo } from 'react';
import { STATUS_LABELS } from '../../utils/dataAdapter';
import ChartContainer from './ChartContainer';

/**
 * Format relative time (e.g., "5d ago", "2 weeks ago").
 *
 * @param {number} days - Number of days
 * @returns {string} Formatted relative time
 */
function formatDaysAgo(days) {
  if (days === 0) return 'today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 14) return '1w';
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

/**
 * Get urgency color based on days stale.
 *
 * @param {number} days - Days since last event
 * @param {number} threshold - Stale threshold
 * @returns {string} Hex color code
 */
function getStaleColor(days, threshold) {
  const ratio = days / threshold;
  if (ratio >= 3) return '#EF4444'; // Red - critical
  if (ratio >= 2) return '#F97316'; // Orange - warning
  if (ratio >= 1) return '#F59E0B'; // Amber - attention
  return '#6B7280'; // Gray - ok
}

/**
 * @component ApplicationHealthDashboard
 * @description Displays application health indicators to help users
 * prioritize follow-ups and identify patterns in their job search.
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Health indicators data from backend
 * @param {Array} props.data.staleApplications - Applications with no recent activity
 * @param {Array} props.data.hotApplications - Applications with high activity
 * @param {Array} props.data.quickWins - Successfully resolved applications
 * @param {Array} props.data.quickLosses - Quickly rejected applications
 * @param {number} props.data.staleDaysThreshold - Days threshold for stale classification
 * @param {Object} props.data.summary - Summary counts
 * @param {boolean} [props.loading=false] - Whether data is loading
 *
 * @example
 * <ApplicationHealthDashboard
 *   data={{
 *     staleApplications: [...],
 *     hotApplications: [...],
 *     quickWins: [...],
 *     quickLosses: [...],
 *     staleDaysThreshold: 14,
 *     summary: { staleCount: 5, hotCount: 2, activeCount: 20 }
 *   }}
 * />
 *
 * @returns {JSX.Element} Application health dashboard component
 */
export default function ApplicationHealthDashboard({ data, loading = false }) {
  // Sort stale applications by days since last event (most stale first)
  const sortedStale = useMemo(() => {
    if (!data?.staleApplications) return [];
    return [...data.staleApplications].sort(
      (a, b) => b.daysSinceLastEvent - a.daysSinceLastEvent
    );
  }, [data]);

  const isEmpty = !data || !data.summary;
  const threshold = data?.staleDaysThreshold || 14;

  const headerRight = !isEmpty ? (
    <span
      style={{
        color: '#6B7280',
        fontSize: 10,
        fontFamily: "'DM Mono',monospace",
      }}
    >
      {threshold} days threshold
    </span>
  ) : null;

  return (
    <ChartContainer
      title="Application Health"
      headerRight={headerRight}
      testId="application-health-dashboard"
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
          Analyzing application health...
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
          No health data available
        </p>
      )}

      {/* Dashboard content */}
      {!loading && !isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
            }}
          >
            <HealthCard
              label="Stale"
              value={data.summary.staleCount}
              color="#F59E0B"
              icon="!"
            />
            <HealthCard
              label="Hot"
              value={data.summary.hotCount}
              color="#EF4444"
              icon="*"
            />
            <HealthCard
              label="Quick Wins"
              value={data.summary.quickWinCount}
              color="#10B981"
              icon="+"
            />
            <HealthCard
              label="Active"
              value={data.summary.activeCount}
              color="#4E9AF1"
              icon="o"
            />
          </div>

          {/* Stale applications */}
          {sortedStale.length > 0 && (
            <div>
              <h4
                style={{
                  color: '#F59E0B',
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>!</span> Stale Applications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sortedStale.slice(0, 5).map((app) => (
                  <ApplicationRow
                    key={app.applicationId}
                    company={app.companyName}
                    position={app.positionTitle}
                    status={app.currentStatus}
                    badge={`${app.daysSinceLastEvent}d`}
                    badgeColor={getStaleColor(app.daysSinceLastEvent, threshold)}
                  />
                ))}
                {sortedStale.length > 5 && (
                  <span
                    style={{
                      color: '#6B7280',
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                      textAlign: 'center',
                      padding: '4px 0',
                    }}
                  >
                    +{sortedStale.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hot applications */}
          {data.hotApplications && data.hotApplications.length > 0 && (
            <div>
              <h4
                style={{
                  color: '#EF4444',
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>*</span> Hot Applications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.hotApplications.slice(0, 3).map((app) => (
                  <ApplicationRow
                    key={app.applicationId}
                    company={app.companyName}
                    position={app.positionTitle}
                    status={app.currentStatus}
                    badge={`${app.recentEventCount} events`}
                    badgeColor="#EF4444"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick wins */}
          {data.quickWins && data.quickWins.length > 0 && (
            <div>
              <h4
                style={{
                  color: '#10B981',
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>+</span> Quick Wins
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.quickWins.slice(0, 3).map((app) => (
                  <ApplicationRow
                    key={app.applicationId}
                    company={app.companyName}
                    position={app.positionTitle}
                    status={app.finalStatus}
                    badge={`${app.daysToResolution}d`}
                    badgeColor="#10B981"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick losses (shown condensed) */}
          {data.quickLosses && data.quickLosses.length > 0 && (
            <div>
              <h4
                style={{
                  color: '#6B7280',
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                }}
              >
                Quick Rejections ({data.quickLosses.length})
              </h4>
              <div
                style={{
                  color: '#4B5563',
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                Avg. {Math.round(
                  data.quickLosses.reduce((sum, a) => sum + a.daysToResolution, 0) /
                    data.quickLosses.length
                )}d to rejection
              </div>
            </div>
          )}
        </div>
      )}
    </ChartContainer>
  );
}

/**
 * @component HealthCard
 * @description Summary card for health metrics.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Card label
 * @param {number} props.value - Metric value
 * @param {string} props.color - Accent color
 * @param {string} props.icon - Icon character
 *
 * @returns {JSX.Element} Health card component
 */
function HealthCard({ label, value, color, icon }) {
  return (
    <div
      data-testid="health-card"
      style={{
        background: '#1F2937',
        borderRadius: 8,
        padding: '12px 10px',
        textAlign: 'center',
        borderTop: `2px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontFamily: "'DM Mono',monospace",
          fontWeight: 700,
          color: color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          fontFamily: "'DM Mono',monospace",
          color: '#6B7280',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * @component ApplicationRow
 * @description Single row showing application details.
 *
 * @param {Object} props - Component props
 * @param {string} props.company - Company name
 * @param {string} props.position - Position title
 * @param {string} props.status - Current status
 * @param {string} props.badge - Badge text (e.g., "5d")
 * @param {string} props.badgeColor - Badge background color
 *
 * @returns {JSX.Element} Application row component
 */
function ApplicationRow({ company, position, status, badge, badgeColor }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: '#0E1117',
        borderRadius: 6,
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#D1D5DB',
            fontSize: 11,
            fontFamily: "'DM Mono',monospace",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {company}
        </div>
        <div
          style={{
            color: '#6B7280',
            fontSize: 9,
            fontFamily: "'DM Mono',monospace",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {position} - {STATUS_LABELS[status] || status}
        </div>
      </div>
      <div
        style={{
          background: badgeColor,
          color: '#FFFFFF',
          fontSize: 9,
          fontFamily: "'DM Mono',monospace",
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        {badge}
      </div>
    </div>
  );
}
