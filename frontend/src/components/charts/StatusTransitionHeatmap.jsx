/**
 * @file StatusTransitionHeatmap.jsx
 * @description Heatmap visualization showing status transitions between application stages.
 * Displays how applications move between different statuses, helping identify
 * common paths and patterns in the job application process.
 */

import { useMemo } from 'react';
import { STATUS_LABELS } from '../../utils/dataAdapter';
import ChartContainer from './ChartContainer';

/**
 * Get abbreviated label for column headers to save space.
 *
 * @param {string} status - Status key
 * @returns {string} Abbreviated or short label
 */
function getShortLabel(status) {
  const shortLabels = {
    APPLIED: 'App',
    RECRUITER_SCREEN: 'Rec',
    TECH_SCREEN: 'Tech',
    TAKE_HOME: 'Home',
    SYSTEM_DESIGN: 'Sys',
    TECHNICAL_I: 'T-I',
    TECHNICAL_II: 'T-II',
    REFERENCE_CHECK: 'Ref',
    OFFER_RECEIVED: 'Offer',
    NEGOTIATING: 'Neg',
    OFFER_ACCEPTED: 'Acc',
    OFFER_DECLINED: 'Dec',
    OFFER_RESCINDED: 'Resc',
    REJECTED: 'Rej',
    WITHDRAWN: 'With',
    ON_HOLD: 'Hold',
    WAITING_FOR_RESPONSE: 'Wait',
    GHOSTED: 'Ghost',
  };
  return shortLabels[status] || status.slice(0, 4);
}

/**
 * Get color intensity based on count relative to max.
 * Returns an RGBA color string with varying opacity.
 *
 * @param {number} count - The count value
 * @param {number} maxCount - Maximum count in the dataset
 * @returns {string} RGBA color string
 */
function getHeatmapColor(count, maxCount) {
  if (count === 0 || maxCount === 0) {
    return 'rgba(31, 41, 55, 0.3)'; // Dark background for empty cells
  }

  const intensity = Math.min(count / maxCount, 1);
  // Gradient from blue to purple based on intensity
  const r = Math.round(78 + (167 - 78) * intensity);
  const g = Math.round(154 - (154 - 139) * intensity);
  const b = Math.round(241 + (250 - 241) * intensity);
  const alpha = 0.3 + intensity * 0.7;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * @component StatusTransitionHeatmap
 * @description Displays a heatmap showing how applications transition between statuses.
 * Rows represent "from" status, columns represent "to" status.
 * Cell color intensity indicates transition frequency.
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Transition matrix data from backend
 * @param {Array<{fromStatus: string, toStatus: string, count: number}>} props.data.transitions - Transition records
 * @param {string[]} props.data.statuses - All unique statuses involved in transitions
 * @param {number} props.data.totalTransitions - Total count of all transitions
 * @param {boolean} [props.loading=false] - Whether data is loading
 *
 * @example
 * <StatusTransitionHeatmap
 *   data={{
 *     transitions: [{ fromStatus: 'APPLIED', toStatus: 'REJECTED', count: 5 }],
 *     statuses: ['APPLIED', 'REJECTED'],
 *     totalTransitions: 5
 *   }}
 * />
 *
 * @returns {JSX.Element} Status transition heatmap component
 */
export default function StatusTransitionHeatmap({ data, loading = false }) {
  // Build lookup map and compute max count for color scaling
  const { transitionMap, maxCount, fromStatuses, toStatuses } = useMemo(() => {
    if (!data?.transitions || data.transitions.length === 0) {
      return { transitionMap: {}, maxCount: 0, fromStatuses: [], toStatuses: [] };
    }

    const map = {};
    let max = 0;
    const fromSet = new Set();
    const toSet = new Set();

    data.transitions.forEach(({ fromStatus, toStatus, count }) => {
      const key = `${fromStatus}->${toStatus}`;
      map[key] = count;
      if (count > max) max = count;
      fromSet.add(fromStatus);
      toSet.add(toStatus);
    });

    return {
      transitionMap: map,
      maxCount: max,
      fromStatuses: Array.from(fromSet),
      toStatuses: Array.from(toSet),
    };
  }, [data]);

  const isEmpty = !data?.transitions || data.transitions.length === 0;

  const headerRight = !isEmpty && data?.totalTransitions ? (
    <span
      style={{
        color: '#6B7280',
        fontSize: 10,
        fontFamily: "'DM Mono',monospace",
      }}
    >
      {data.totalTransitions} total
    </span>
  ) : null;

  return (
    <ChartContainer
      title="Status Transitions"
      headerRight={headerRight}
      testId="status-transition-heatmap"
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
          Loading transitions...
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
          No transition data available
        </p>
      )}

      {/* Heatmap grid */}
      {!loading && !isEmpty && (
        <>
          <div role="grid" aria-label="Status transition heatmap">
            {/* Column headers row */}
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: `100px repeat(${toStatuses.length}, 1fr)`,
                gap: 2,
                marginBottom: 2,
              }}
            >
              {/* Corner cell with hidden label for accessibility */}
              <div role="columnheader" style={{ width: 100 }}>
                <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                  From status / To status
                </span>
              </div>

              {/* To status headers */}
              {toStatuses.map((status) => (
                <div
                  key={`col-${status}`}
                  role="columnheader"
                  data-testid="column-header"
                  style={{
                    color: '#9CA3AF',
                    fontSize: 9,
                    fontFamily: "'DM Mono',monospace",
                    textAlign: 'center',
                    padding: '4px 2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={STATUS_LABELS[status] || status}
                >
                  {getShortLabel(status)}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {fromStatuses.map((fromStatus) => (
              <div
                key={`row-${fromStatus}`}
                role="row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `100px repeat(${toStatuses.length}, 1fr)`,
                  gap: 2,
                  marginBottom: 2,
                }}
              >
                {/* Row label (from status) */}
                <div
                  role="rowheader"
                  style={{
                    color: '#D1D5DB',
                    fontSize: 10,
                    fontFamily: "'DM Mono',monospace",
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={STATUS_LABELS[fromStatus] || fromStatus}
                >
                  {STATUS_LABELS[fromStatus] || fromStatus}
                </div>

                {/* Cells for each to status */}
                {toStatuses.map((toStatus) => {
                  const key = `${fromStatus}->${toStatus}`;
                  const count = transitionMap[key] || 0;
                  const bgColor = getHeatmapColor(count, maxCount);

                  return (
                    <div
                      key={key}
                      role="gridcell"
                      data-testid="heatmap-cell"
                      aria-label={`${STATUS_LABELS[fromStatus] || fromStatus} to ${STATUS_LABELS[toStatus] || toStatus}: ${count} transitions`}
                      style={{
                        backgroundColor: bgColor,
                        borderRadius: 4,
                        minHeight: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontFamily: "'DM Mono',monospace",
                        fontWeight: count > 0 ? 600 : 400,
                        color: count > 0 ? '#FFFFFF' : '#4B5563',
                        transition: 'background-color 0.2s ease',
                      }}
                      title={`${STATUS_LABELS[fromStatus] || fromStatus} -> ${STATUS_LABELS[toStatus] || toStatus}: ${count}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
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
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid #1F2937',
            }}
          >
            <span
              style={{
                color: '#6B7280',
                fontSize: 9,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              Low
            </span>
            <div
              style={{
                display: 'flex',
                gap: 2,
              }}
            >
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
                <div
                  key={intensity}
                  style={{
                    width: 16,
                    height: 12,
                    borderRadius: 2,
                    background: getHeatmapColor(intensity * maxCount, maxCount),
                  }}
                />
              ))}
            </div>
            <span
              style={{
                color: '#6B7280',
                fontSize: 9,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              High
            </span>
          </div>
        </>
      )}
    </ChartContainer>
  );
}
