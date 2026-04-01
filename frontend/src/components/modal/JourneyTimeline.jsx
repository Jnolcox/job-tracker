/**
 * @file JourneyTimeline.jsx
 * @description Gantt-style timeline visualization showing the duration spent
 * in each stage of a job application journey.
 */

import { useMemo } from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/dataAdapter';
import { getStageDurations } from '../../utils/stageDurationUtils';

/**
 * Format a date to a short human-readable format.
 *
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date (e.g., "Jan 15")
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format duration days to a human-readable string.
 *
 * @param {number} days - Number of days
 * @returns {string} Formatted duration (e.g., "5 days", "1 day", "< 1 day")
 */
function formatDuration(days) {
  if (days === 0) return '< 1 day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * @component StageBar
 * @description Individual bar in the Gantt chart representing time in a stage.
 *
 * @param {Object} props - Component props
 * @param {Object} props.stage - Stage duration object
 * @param {string} props.stage.status - Status name
 * @param {number} props.stage.durationDays - Days spent in stage
 * @param {string} props.stage.startDate - Stage start date
 * @param {string|null} props.stage.endDate - Stage end date (null if current)
 * @param {boolean} props.stage.isCurrent - Whether this is the current stage
 * @param {number} props.widthPercent - Width of bar as percentage
 * @param {number} props.index - Index for animation delay
 *
 * @returns {JSX.Element} Stage bar component
 */
function StageBar({ stage, widthPercent, index }) {
  const color = STATUS_COLORS[stage.status] || '#6B7280';
  const label = STATUS_LABELS[stage.status] || stage.status;

  return (
    <div
      data-testid="stage-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 8,
      }}
    >
      {/* Status label */}
      <div
        style={{
          width: 120,
          flexShrink: 0,
          fontSize: 11,
          fontFamily: "'DM Mono',monospace",
          color: stage.isCurrent ? '#F9FAFB' : '#9CA3AF',
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>

      {/* Bar container */}
      <div
        style={{
          flex: 1,
          height: 20,
          background: '#1F2937',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated bar */}
        <div
          style={{
            height: '100%',
            width: `${widthPercent}%`,
            minWidth: widthPercent > 0 ? 2 : 0,
            background: color,
            borderRadius: 4,
            transition: 'width 0.6s ease-out',
            transitionDelay: `${index * 0.1}s`,
            opacity: stage.isCurrent ? 1 : 0.7,
          }}
        />

        {/* Current indicator pulse */}
        {stage.isCurrent && widthPercent >= 5 && (
          <div
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Duration label */}
      <div
        style={{
          width: 70,
          flexShrink: 0,
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
          color: '#6B7280',
          textAlign: 'left',
        }}
      >
        {formatDuration(stage.durationDays)}
      </div>
    </div>
  );
}

/**
 * @component JourneyTimeline
 * @description Gantt-style timeline visualization for application journey.
 * Shows horizontal bars representing time spent in each stage.
 *
 * @param {Object} props - Component props
 * @param {number} props.applicationId - ID of the application
 * @param {Array} props.events - Array of audit trail events
 * @param {boolean} [props.loading=false] - Whether events are loading
 *
 * @example
 * <JourneyTimeline
 *   applicationId={1}
 *   events={auditEvents}
 *   loading={false}
 * />
 *
 * @returns {JSX.Element} Journey timeline component
 */
export default function JourneyTimeline({ applicationId, events, loading = false }) {
  // Calculate stage durations from events
  const stageDurations = useMemo(() => {
    if (!applicationId || !events || events.length === 0) {
      return [];
    }
    return getStageDurations(applicationId, events);
  }, [applicationId, events]);

  // Calculate max duration for scaling bars
  const maxDuration = useMemo(() => {
    if (stageDurations.length === 0) return 1;
    return Math.max(...stageDurations.map((s) => s.durationDays), 1);
  }, [stageDurations]);

  // Calculate total days
  const totalDays = useMemo(() => {
    return stageDurations.reduce((sum, s) => sum + s.durationDays, 0);
  }, [stageDurations]);

  // Get date range
  const dateRange = useMemo(() => {
    if (stageDurations.length === 0) return null;
    const first = stageDurations[0];
    const last = stageDurations[stageDurations.length - 1];
    return {
      start: formatShortDate(first.startDate),
      end: last.endDate ? formatShortDate(last.endDate) : 'Now',
    };
  }, [stageDurations]);

  return (
    <div
      data-testid="journey-timeline"
      style={{ width: '100%' }}
    >
      {/* Section header */}
      <div
        style={{
          borderTop: '1px solid #1F2937',
          paddingTop: 16,
          marginTop: 8,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            color: '#6B7280',
            fontSize: 11,
            fontFamily: "'DM Mono',monospace",
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Stage History
        </span>
        {dateRange && (
          <span
            style={{
              color: '#4B5563',
              fontSize: 10,
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {dateRange.start} - {dateRange.end} ({totalDays} days total)
          </span>
        )}
      </div>

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
          Loading journey...
        </div>
      )}

      {/* Empty state */}
      {!loading && stageDurations.length === 0 && (
        <p
          style={{
            color: '#4B5563',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            fontStyle: 'italic',
          }}
        >
          No stage history available
        </p>
      )}

      {/* Gantt chart */}
      {!loading && stageDurations.length > 0 && (
        <div>
          {stageDurations.map((stage, index) => (
            <StageBar
              key={`${stage.status}-${stage.startDate}`}
              stage={stage}
              widthPercent={maxDuration > 0 ? (stage.durationDays / maxDuration) * 100 : 0}
              index={index}
            />
          ))}

          {/* Pulse animation keyframes */}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
