/**
 * @file FunnelAnalytics.jsx
 * @description Funnel analytics visualization showing conversion rates through
 * application stages, drop-off points as horizontal bar chart, response rate
 * breakdown, and success rates by position level.
 */

import { useMemo } from 'react';
import { STATUS_LABELS, LEVEL_LABELS } from '../../utils/dataAdapter';
import ChartContainer from './ChartContainer';

/**
 * Ordered stages for funnel display.
 * Only includes forward-progression stages.
 */
const FUNNEL_STAGE_ORDER = [
  'APPLIED',
  'RECRUITER_SCREEN',
  'TECH_SCREEN',
  'TAKE_HOME',
  'SYSTEM_DESIGN',
  'TECHNICAL_I',
  'TECHNICAL_II',
  'REFERENCE_CHECK',
  'OFFER_RECEIVED',
  'NEGOTIATING',
  'OFFER_ACCEPTED',
];

/**
 * Get color for conversion rate visualization.
 * Progresses from gray to blue to purple to green for higher rates.
 *
 * @param {number} rate - Conversion rate (0-100)
 * @returns {string} Hex color code
 */
function getConversionColor(rate) {
  if (rate >= 80) return '#10B981'; // Green - excellent
  if (rate >= 50) return '#A78BFA'; // Purple - good
  if (rate >= 25) return '#4E9AF1'; // Blue - moderate
  return '#6B7280'; // Gray - low
}

/**
 * Colors for response breakdown categories.
 * Each category has a distinct color for visual differentiation.
 */
const RESPONSE_COLORS = {
  interviewed: '#10B981', // Green - positive outcome
  rejected: '#F87171', // Red - negative outcome
  ghosted: '#6B7280', // Gray - no response
  active: '#4E9AF1', // Blue - ongoing
};

/**
 * Colors for drop-off visualization.
 */
const DROPOFF_COLORS = {
  REJECTED: '#F87171',
  GHOSTED: '#6B7280',
  WITHDRAWN: '#FBBF24',
  OFFER_DECLINED: '#F59E0B',
  OFFER_RESCINDED: '#EF4444',
  DEFAULT: '#9CA3AF',
};

/**
 * Get color for a drop-off status.
 *
 * @param {string} status - The drop-off status
 * @returns {string} Hex color code
 */
function getDropoffColor(status) {
  return DROPOFF_COLORS[status] || DROPOFF_COLORS.DEFAULT;
}

/**
 * @component FunnelAnalytics
 * @description Displays funnel analytics including:
 * - Overall success rate (prominent display)
 * - Stage conversion as a funnel visualization
 * - Drop-off points as horizontal bar chart sorted by count
 * - Response rate breakdown (interviewed, ghosted, rejected, active)
 * - Success rates by position level (Senior, Mid, Junior, etc.)
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Funnel analytics data from backend
 * @param {Object<string, number>} props.data.stageConversionRates - Conversion rate per stage
 * @param {Array<{status: string, count: number, percentage: number}>} props.data.dropOffPoints - Drop-off points
 * @param {Array<{positionType: string, totalApplications: number, offersReceived: number, successRate: number}>} props.data.successRateByPositionType
 * @param {number} props.data.overallSuccessRate - Overall success percentage
 * @param {number} props.data.totalApplicationsAnalyzed - Total applications in analysis
 * @param {boolean} [props.loading=false] - Whether data is loading
 *
 * @example
 * <FunnelAnalytics
 *   data={{
 *     stageConversionRates: { APPLIED: 100, RECRUITER_SCREEN: 60 },
 *     dropOffPoints: [{ status: 'REJECTED', count: 12, percentage: 24 }],
 *     successRateByPositionType: [{ positionType: 'SENIOR', totalApplications: 15, offersReceived: 3, successRate: 20 }],
 *     overallSuccessRate: 12.5,
 *     totalApplicationsAnalyzed: 40
 *   }}
 * />
 *
 * @returns {JSX.Element} Funnel analytics component
 */
export default function FunnelAnalytics({ data, loading = false }) {
  // Process conversion rates into ordered stages
  const orderedStages = useMemo(() => {
    if (!data?.stageConversionRates) return [];

    return FUNNEL_STAGE_ORDER.filter(
      (stage) => data.stageConversionRates[stage] !== undefined
    ).map((stage) => ({
      stage,
      label: STATUS_LABELS[stage] || stage,
      rate: data.stageConversionRates[stage],
    }));
  }, [data]);

  // Sort drop-off points by count (highest first)
  const sortedDropOffPoints = useMemo(() => {
    if (!data?.dropOffPoints || !Array.isArray(data.dropOffPoints)) return [];
    return [...data.dropOffPoints].sort((a, b) => b.count - a.count);
  }, [data]);

  // Find the maximum count for bar width calculations
  const maxDropOffCount = useMemo(() => {
    if (sortedDropOffPoints.length === 0) return 0;
    return sortedDropOffPoints[0]?.count || 0;
  }, [sortedDropOffPoints]);

  // Sort position types by success rate (highest first)
  const sortedPositionTypes = useMemo(() => {
    if (
      !data?.successRateByPositionType ||
      !Array.isArray(data.successRateByPositionType)
    )
      return [];
    return [...data.successRateByPositionType].sort(
      (a, b) => b.successRate - a.successRate
    );
  }, [data]);

  // Calculate response breakdown from drop-off points
  // Categories: interviewed (got past APPLIED), ghosted, rejected, active (still in pipeline)
  const responseBreakdown = useMemo(() => {
    if (!data?.dropOffPoints || !data?.totalApplicationsAnalyzed) {
      return null;
    }

    const total = data.totalApplicationsAnalyzed;
    let ghostedCount = 0;
    let rejectedCount = 0;
    let withdrawnCount = 0;

    // Sum up the drop-off categories
    data.dropOffPoints.forEach((point) => {
      if (point.status === 'GHOSTED') {
        ghostedCount += point.count;
      } else if (
        point.status === 'REJECTED' ||
        point.status === 'OFFER_DECLINED' ||
        point.status === 'OFFER_RESCINDED'
      ) {
        rejectedCount += point.count;
      } else if (point.status === 'WITHDRAWN') {
        withdrawnCount += point.count;
      }
    });

    // Calculate interviewed (applications that moved past APPLIED stage)
    // We can derive this from stageConversionRates or estimate from remaining applications
    let interviewedCount = 0;
    if (data.stageConversionRates?.RECRUITER_SCREEN !== undefined) {
      // If RECRUITER_SCREEN exists, use that percentage
      interviewedCount = Math.round(
        (data.stageConversionRates.RECRUITER_SCREEN / 100) * total
      );
    } else if (data.stageConversionRates?.TECH_SCREEN !== undefined) {
      interviewedCount = Math.round(
        (data.stageConversionRates.TECH_SCREEN / 100) * total
      );
    }

    // Calculate active (not in any terminal state)
    const terminalCount = ghostedCount + rejectedCount + withdrawnCount;
    // Include successful applications (offers accepted)
    const successfulCount = Math.round((data.overallSuccessRate / 100) * total);
    const activeCount = Math.max(
      0,
      total - terminalCount - successfulCount - (interviewedCount > 0 ? 0 : 0)
    );

    // Ensure we don't double count - active should be applications still in progress
    const calculatedActive = total - terminalCount - successfulCount;

    return {
      interviewed: {
        count: interviewedCount,
        percentage: total > 0 ? ((interviewedCount / total) * 100).toFixed(1) : 0,
      },
      rejected: {
        count: rejectedCount,
        percentage: total > 0 ? ((rejectedCount / total) * 100).toFixed(1) : 0,
      },
      ghosted: {
        count: ghostedCount,
        percentage: total > 0 ? ((ghostedCount / total) * 100).toFixed(1) : 0,
      },
      active: {
        count: Math.max(0, calculatedActive),
        percentage:
          total > 0
            ? ((Math.max(0, calculatedActive) / total) * 100).toFixed(1)
            : 0,
      },
    };
  }, [data]);

  const isEmpty = !data || !data.stageConversionRates;

  const headerRight =
    !isEmpty && data?.totalApplicationsAnalyzed ? (
      <span
        style={{
          color: '#6B7280',
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {data.totalApplicationsAnalyzed} applications
      </span>
    ) : null;

  return (
    <ChartContainer
      title="Funnel Analytics"
      headerRight={headerRight}
      testId="funnel-analytics"
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
          Loading funnel data...
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
          No funnel data available
        </p>
      )}

      {/* Funnel content */}
      {!loading && !isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overall success rate highlight */}
          <div
            data-testid="overall-success-rate"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '16px 0',
              borderBottom: '1px solid #1F2937',
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontFamily: "'DM Mono',monospace",
                fontWeight: 700,
                color: getConversionColor(data.overallSuccessRate || 0),
              }}
            >
              {data.overallSuccessRate || 0}%
            </span>
            <span
              style={{
                color: '#6B7280',
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Overall Success
            </span>
          </div>

          {/* Stage Conversion Funnel */}
          {orderedStages.length > 0 && (
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
                Stage Conversion
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {orderedStages.map((item, index) => {
                  const widthPct = item.rate;
                  const color = getConversionColor(item.rate);

                  return (
                    <div
                      key={item.stage}
                      data-testid="funnel-bar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      {/* Stage label */}
                      <span
                        style={{
                          width: 100,
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
                        {item.label}
                      </span>

                      {/* Funnel bar container with centered bar for funnel effect */}
                      <div
                        style={{
                          flex: 1,
                          height: 16,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: `${widthPct}%`,
                            minWidth: widthPct > 0 ? 2 : 0,
                            height: '100%',
                            background: color,
                            borderRadius: 4,
                            transition: 'width 0.6s ease-out',
                            transitionDelay: `${index * 0.05}s`,
                          }}
                        />
                      </div>

                      {/* Rate value */}
                      <span
                        style={{
                          width: 36,
                          color: color,
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        {Math.round(item.rate)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Response Breakdown */}
          {responseBreakdown && (
            <div data-testid="response-breakdown">
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
                Response Breakdown
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                }}
              >
                {/* Interviewed */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#1F2937',
                    borderRadius: 6,
                    borderLeft: `3px solid ${RESPONSE_COLORS.interviewed}`,
                  }}
                >
                  <span
                    style={{
                      color: RESPONSE_COLORS.interviewed,
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {responseBreakdown.interviewed.percentage}%
                  </span>
                  <span
                    style={{
                      color: '#9CA3AF',
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    Interviewed
                  </span>
                </div>

                {/* Rejected */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#1F2937',
                    borderRadius: 6,
                    borderLeft: `3px solid ${RESPONSE_COLORS.rejected}`,
                  }}
                >
                  <span
                    style={{
                      color: RESPONSE_COLORS.rejected,
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {responseBreakdown.rejected.percentage}%
                  </span>
                  <span
                    style={{
                      color: '#9CA3AF',
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    Rejected
                  </span>
                </div>

                {/* Ghosted */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#1F2937',
                    borderRadius: 6,
                    borderLeft: `3px solid ${RESPONSE_COLORS.ghosted}`,
                  }}
                >
                  <span
                    style={{
                      color: RESPONSE_COLORS.ghosted,
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {responseBreakdown.ghosted.percentage}%
                  </span>
                  <span
                    style={{
                      color: '#9CA3AF',
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    Ghosted
                  </span>
                </div>

                {/* Active */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: '#1F2937',
                    borderRadius: 6,
                    borderLeft: `3px solid ${RESPONSE_COLORS.active}`,
                  }}
                >
                  <span
                    style={{
                      color: RESPONSE_COLORS.active,
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {responseBreakdown.active.percentage}%
                  </span>
                  <span
                    style={{
                      color: '#9CA3AF',
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Drop-off Points - Horizontal Bar Chart sorted by count */}
          {sortedDropOffPoints.length > 0 && (
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
                Drop-Off Points
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sortedDropOffPoints.map((point) => {
                  const barWidthPct =
                    maxDropOffCount > 0
                      ? (point.count / maxDropOffCount) * 100
                      : 0;
                  const color = getDropoffColor(point.status);

                  return (
                    <div
                      key={point.status}
                      data-testid="dropoff-bar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      {/* Status label */}
                      <span
                        data-testid="dropoff-label"
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
                        {STATUS_LABELS[point.status] || point.status}
                      </span>

                      {/* Bar container */}
                      <div
                        style={{
                          flex: 1,
                          height: 16,
                          background: '#0E1117',
                          borderRadius: 4,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Horizontal bar */}
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

                      {/* Count */}
                      <span
                        style={{
                          width: 28,
                          color: color,
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        {point.count}
                      </span>

                      {/* Percentage */}
                      <span
                        style={{
                          width: 36,
                          color: '#6B7280',
                          fontSize: 10,
                          fontFamily: "'DM Mono',monospace",
                          textAlign: 'right',
                        }}
                      >
                        {point.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success by Position Level */}
          {sortedPositionTypes.length > 0 && (
            <div data-testid="position-success">
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
                Success by Position
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sortedPositionTypes.map((position) => (
                  <div
                    key={position.positionType}
                    data-testid="position-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: '#1F2937',
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        color: '#D1D5DB',
                        fontSize: 11,
                        fontFamily: "'DM Mono',monospace",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '40%',
                      }}
                    >
                      {LEVEL_LABELS[position.positionType] ||
                        position.positionType}
                    </span>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      {/* Success rate bar */}
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          background: '#0E1117',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${position.successRate}%`,
                            height: '100%',
                            background: getConversionColor(position.successRate),
                            borderRadius: 3,
                            transition: 'width 0.4s ease-out',
                          }}
                        />
                      </div>
                      {/* Offers / Total */}
                      <span
                        style={{
                          color: '#6B7280',
                          fontSize: 9,
                          fontFamily: "'DM Mono',monospace",
                          minWidth: 32,
                        }}
                      >
                        {position.offersReceived}/{position.totalApplications}
                      </span>
                      {/* Success rate percentage */}
                      <span
                        style={{
                          color: getConversionColor(position.successRate),
                          fontSize: 11,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 600,
                          minWidth: 32,
                          textAlign: 'right',
                        }}
                      >
                        {position.successRate}%
                      </span>
                    </div>
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
