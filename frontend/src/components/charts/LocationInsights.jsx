/**
 * @file LocationInsights.jsx
 * @description Location and RTO type analytics visualization showing
 * geographic distribution and work arrangement metrics.
 */

import { useMemo } from 'react';
import ChartContainer from './ChartContainer';
import { formatSalaryCompact } from '../../utils/formatters';
import { RTO_COLORS } from '../../constants/colors';

/**
 * Human-readable labels for RTO types.
 */
const RTO_LABELS = {
  REMOTE: 'Remote',
  HYBRID_2: '2 days',
  HYBRID_3: '3 days',
  HYBRID_4: '4 days',
  ONSITE: 'Onsite',
  'Not Specified': 'Not Specified',
};

/**
 * @component LocationInsights
 * @description Displays location and RTO analytics including:
 * - Metrics by geographic location (top locations)
 * - Distribution by RTO type (remote/hybrid/onsite)
 * - Average salaries and success rates
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Location insights data from backend
 * @param {Array<{location: string, applicationCount: number, avgSalaryMin: number|null, avgSalaryMax: number|null, successRate: number}>} props.data.byLocation
 * @param {Array<{rtoType: string, applicationCount: number, percentage: number, avgSalaryMin: number|null, avgSalaryMax: number|null, successRate: number}>} props.data.byRtoType
 * @param {number} props.data.totalApplicationsAnalyzed
 * @param {boolean} [props.loading=false] - Whether data is loading
 *
 * @example
 * <LocationInsights
 *   data={{
 *     byLocation: [{ location: 'San Francisco', applicationCount: 15, avgSalaryMin: 150000, avgSalaryMax: 200000, successRate: 10 }],
 *     byRtoType: [{ rtoType: 'REMOTE', applicationCount: 20, percentage: 40, avgSalaryMin: 140000, avgSalaryMax: 180000, successRate: 15 }],
 *     totalApplicationsAnalyzed: 50
 *   }}
 * />
 *
 * @returns {JSX.Element} Location insights component
 */
export default function LocationInsights({ data, loading = false }) {
  // Sort locations by application count
  const sortedLocations = useMemo(() => {
    if (!data?.byLocation || !Array.isArray(data.byLocation)) return [];
    return [...data.byLocation]
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 5); // Show top 5 locations
  }, [data]);

  // Sort RTO types by application count
  const sortedRtoTypes = useMemo(() => {
    if (!data?.byRtoType || !Array.isArray(data.byRtoType)) return [];
    return [...data.byRtoType].sort((a, b) => b.applicationCount - a.applicationCount);
  }, [data]);

  // Calculate max application count for RTO bar widths
  const maxRtoCount = useMemo(() => {
    if (sortedRtoTypes.length === 0) return 0;
    return sortedRtoTypes[0]?.applicationCount || 0;
  }, [sortedRtoTypes]);

  const isEmpty =
    !data ||
    ((!data.byLocation || data.byLocation.length === 0) &&
      (!data.byRtoType || data.byRtoType.length === 0));

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
      title="Location & RTO Insights"
      headerRight={headerRight}
      testId="location-insights"
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
          Loading location data...
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
          No location data available
        </p>
      )}

      {/* Content */}
      {!loading && !isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* RTO Type Distribution */}
          {sortedRtoTypes.length > 0 && (
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
                By Work Arrangement
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sortedRtoTypes.map((rto) => {
                  const barWidthPct =
                    maxRtoCount > 0 ? (rto.applicationCount / maxRtoCount) * 100 : 0;
                  const color = RTO_COLORS[rto.rtoType] || RTO_COLORS['Not Specified'];

                  return (
                    <div
                      key={rto.rtoType}
                      data-testid="rto-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      {/* RTO label */}
                      <span
                        style={{
                          width: 90,
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
                        {RTO_LABELS[rto.rtoType] || rto.rtoType}
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
                        {rto.applicationCount} ({Math.round(rto.percentage)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Locations */}
          {sortedLocations.length > 0 && (
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
                Top Locations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sortedLocations.map((location) => (
                  <div
                    key={location.location}
                    data-testid="location-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#1F2937',
                      borderRadius: 6,
                    }}
                  >
                    {/* Location name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          color: '#E5E7EB',
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {location.location}
                      </span>
                      <span
                        style={{
                          color: '#6B7280',
                          fontSize: 9,
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {location.applicationCount} apps
                      </span>
                    </div>

                    {/* Salary range */}
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <span
                        style={{
                          color:
                            location.avgSalaryMin !== null ? '#4E9AF1' : '#4B5563',
                          fontSize: 10,
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {location.avgSalaryMin !== null
                          ? `${formatSalaryCompact(location.avgSalaryMin)}-${formatSalaryCompact(location.avgSalaryMax)}`
                          : '—'}
                      </span>
                    </div>

                    {/* Success rate */}
                    {/*<div style={{ textAlign: 'right', minWidth: 45 }}>
                      <span
                        style={{
                          color: getSuccessRateColor(location.successRate),
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(location.successRate)}%
                      </span>
                    </div>*/}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ChartContainer>
  );
}
