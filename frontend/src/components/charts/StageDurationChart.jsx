/**
 * @file StageDurationChart.jsx
 * @description Chart showing average time spent in each stage across all applications.
 * Uses audit trail events to calculate accurate stage durations.
 */

import { useMemo } from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/dataAdapter';
import { getAverageStageTime, getBottleneckStages } from '../../utils/stageDurationUtils';
import ChartContainer from './ChartContainer';

/**
 * Ordered list of stages for consistent display order.
 * Follows the typical application flow.
 */
const STAGE_ORDER = [
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
];

/**
 * Get color for duration based on thresholds.
 * Green: < 5 days (fast)
 * Yellow: 5-10 days (moderate)
 * Red: > 10 days (slow/bottleneck)
 *
 * @param {number} days - Number of days
 * @returns {string} Hex color code
 */
function getDurationColor(days) {
  if (days > 10) return '#F87171'; // Red
  if (days > 5) return '#F59E0B'; // Yellow/Amber
  return '#34D399'; // Green
}

/**
 * @component StageDurationChart
 * @description Displays a horizontal bar chart showing average time spent
 * in each stage across all applications. Stages are color-coded by duration
 * (green < 5 days, yellow 5-10 days, red > 10 days).
 *
 * Uses audit trail events to calculate accurate stage durations rather than
 * just the current status timestamp.
 *
 * @param {Object} props - Component props
 * @param {Array} props.events - Array of all audit trail events
 * @param {boolean} [props.loading=false] - Whether data is loading
 * @param {boolean} [props.showBottlenecks=true] - Whether to highlight bottleneck stages
 *
 * @example
 * <StageDurationChart events={allEvents} loading={false} />
 *
 * @returns {JSX.Element} Stage duration chart component
 */
export default function StageDurationChart({ events, loading = false, showBottlenecks = true }) {
  // Calculate average stage times from events
  const averageTimes = useMemo(() => {
    if (!events || events.length === 0) return {};
    return getAverageStageTime(events);
  }, [events]);

  // Get bottleneck stages for highlighting
  const bottlenecks = useMemo(() => {
    if (!showBottlenecks || !events || events.length === 0) return new Set();
    const topBottlenecks = getBottleneckStages(events, 3);
    return new Set(topBottlenecks.map((b) => b.status));
  }, [events, showBottlenecks]);

  // Filter to stages that have data and sort by stage order
  const stagesWithData = useMemo(() => {
    return STAGE_ORDER.filter((status) => averageTimes[status] !== undefined).map((status) => ({
      status,
      avgDays: averageTimes[status],
      label: STATUS_LABELS[status] || status,
      color: STATUS_COLORS[status] || '#6B7280',
      isBottleneck: bottlenecks.has(status),
    }));
  }, [averageTimes, bottlenecks]);

  // Calculate max for scaling bars
  const maxDays = useMemo(() => {
    if (stagesWithData.length === 0) return 1;
    return Math.max(...stagesWithData.map((s) => s.avgDays), 1);
  }, [stagesWithData]);

  const headerRight = showBottlenecks && stagesWithData.some((s) => s.isBottleneck) ? (
    <span
      style={{
        color: '#F87171',
        fontSize: 9,
        fontFamily: "'DM Mono',monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      Bottlenecks highlighted
    </span>
  ) : null;

  return (
    <ChartContainer
      title="Avg. Time Per Stage (days)"
      headerRight={headerRight}
      testId="stage-duration-chart"
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
          Calculating averages...
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && stagesWithData.length === 0 && (
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
          No stage data available yet
        </p>
      )}

      {/* Chart bars */}
      {!loading && stagesWithData.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stagesWithData.map((stage, index) => {
            const pct = (stage.avgDays / maxDays) * 100;
            const durationColor = getDurationColor(stage.avgDays);

            return (
              <div
                key={stage.status}
                data-testid="stage-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {/* Stage label */}
                <span
                  style={{
                    width: 110,
                    color: stage.isBottleneck ? '#F87171' : '#D1D5DB',
                    fontSize: 11,
                    fontFamily: "'DM Mono',monospace",
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontWeight: stage.isBottleneck ? 600 : 400,
                  }}
                >
                  {stage.label}
                </span>

                {/* Bar container */}
                <div
                  style={{
                    flex: 1,
                    height: 18,
                    background: '#1F2937',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Animated bar */}
                  <div
                    style={{
                      width: `${pct}%`,
                      minWidth: pct > 0 ? 2 : 0,
                      height: '100%',
                      background: stage.isBottleneck ? '#F87171' : stage.color,
                      borderRadius: 4,
                      transition: 'width 0.6s ease-out',
                      transitionDelay: `${index * 0.05}s`,
                      opacity: stage.isBottleneck ? 1 : 0.8,
                    }}
                  />

                  {/* Bottleneck indicator */}
                  {stage.isBottleneck && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 10,
                      }}
                    >
                      !
                    </div>
                  )}
                </div>

                {/* Duration value */}
                <span
                  style={{
                    width: 28,
                    color: durationColor,
                    fontSize: 12,
                    fontFamily: "'DM Mono',monospace",
                    fontWeight: 700,
                    textAlign: 'right',
                  }}
                >
                  {stage.avgDays}d
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {!loading && stagesWithData.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid #1F2937',
          }}
        >
          <LegendItem color="#34D399" label="< 5 days" />
          <LegendItem color="#F59E0B" label="5-10 days" />
          <LegendItem color="#F87171" label="> 10 days" />
        </div>
      )}
    </ChartContainer>
  );
}

/**
 * @component LegendItem
 * @description Single legend item for the chart.
 *
 * @param {Object} props - Component props
 * @param {string} props.color - Color of the legend dot
 * @param {string} props.label - Legend text
 *
 * @returns {JSX.Element} Legend item component
 */
function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span
        style={{
          color: '#6B7280',
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}
