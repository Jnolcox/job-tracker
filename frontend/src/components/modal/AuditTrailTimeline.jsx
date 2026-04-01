/**
 * @file AuditTrailTimeline.jsx
 * @description Timeline component for displaying audit trail events in the application view modal.
 * Shows a chronological list of all changes made to a job application.
 */

import { parseBackendDate, STATUS_LABELS } from '../../utils/dataAdapter';

/**
 * Format a date value to a human-readable format.
 * Handles multiple input formats from the backend.
 *
 * @param {string|number|Array} dateValue - Date in ISO string, epoch seconds, or array format
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025, 10:30 AM")
 */
function formatTimestamp(dateValue) {
  const date = parseBackendDate(dateValue);
  if (!date) return '';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format an interview date value to a human-readable format.
 * Used specifically for formatting interview dates in event descriptions.
 * Handles multiple input formats from the backend (ISO string, epoch seconds, array).
 *
 * @param {string|number|Array} dateValue - Date in ISO string, epoch seconds, or array format
 * @returns {string} Formatted date string (e.g., "Feb 1, 2025 at 2:00 PM") or original value if unparseable
 */
function formatInterviewDate(dateValue) {
  if (dateValue === null || dateValue === undefined) return '';

  const date = parseBackendDate(dateValue);
  if (!date) {
    // Return original value as string if we cannot parse it
    return String(dateValue);
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a status value to its human-readable label.
 * Uses STATUS_LABELS from dataAdapter.js for known statuses,
 * falls back to the raw value for unknown statuses.
 *
 * @param {string} status - Status value in SCREAMING_SNAKE_CASE format
 * @returns {string} Human-readable status label
 */
function formatStatusValue(status) {
  if (!status) return '';
  return STATUS_LABELS[status] || status;
}

/**
 * Format an event into a human-readable description.
 *
 * @param {Object} event - The audit event object
 * @param {string} event.eventType - Type of event
 * @param {string} [event.fieldName] - Name of field that was updated
 * @param {string} [event.oldValue] - Previous value
 * @param {string} [event.newValue] - New value
 * @returns {string} Human-readable event description
 */
function formatEventDescription(event) {
  const { eventType, fieldName, oldValue, newValue } = event;

  switch (eventType) {
    case 'APPLICATION_CREATED':
      return 'Application created';

    case 'STATUS_CHANGED':
      return `Status changed from ${formatStatusValue(oldValue)} to ${formatStatusValue(newValue)}`;

    case 'INTERVIEW_SCHEDULED':
      return `Interview scheduled for ${formatInterviewDate(newValue)}`;

    case 'INTERVIEW_UPDATED':
      return `Interview rescheduled from ${formatInterviewDate(oldValue)} to ${formatInterviewDate(newValue)}`;

    case 'NOTE_ADDED':
      return 'Note added';

    case 'FIELD_UPDATED':
      return `${fieldName} updated from ${oldValue} to ${newValue}`;

    default:
      return eventType;
  }
}

/**
 * Get icon for event type.
 *
 * @param {string} eventType - Type of event
 * @returns {string} Unicode character representing the event type
 */
function getEventIcon(eventType) {
  switch (eventType) {
    case 'APPLICATION_CREATED':
      return '\u2795'; // Plus sign
    case 'STATUS_CHANGED':
      return '\u27A1'; // Arrow right
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_UPDATED':
      return '\uD83D\uDCC5'; // Calendar
    case 'NOTE_ADDED':
      return '\uD83D\uDCDD'; // Memo
    case 'FIELD_UPDATED':
      return '\u270F'; // Pencil
    default:
      return '\u2022'; // Bullet
  }
}

/**
 * Get color for event type.
 *
 * @param {string} eventType - Type of event
 * @returns {string} Hex color code for the event type
 */
function getEventColor(eventType) {
  switch (eventType) {
    case 'APPLICATION_CREATED':
      return '#10B981'; // Green
    case 'STATUS_CHANGED':
      return '#4E9AF1'; // Blue
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_UPDATED':
      return '#A78BFA'; // Purple
    case 'NOTE_ADDED':
      return '#F59E0B'; // Amber
    case 'FIELD_UPDATED':
      return '#6B7280'; // Gray
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * @component TimelineItem
 * @description Individual timeline item displaying a single audit event.
 *
 * @param {Object} props - Component props
 * @param {Object} props.event - The audit event object
 * @param {boolean} props.isLast - Whether this is the last item in the timeline
 *
 * @returns {JSX.Element} Timeline item component
 */
function TimelineItem({ event, isLast }) {
  const color = getEventColor(event.eventType);
  const icon = getEventIcon(event.eventType);

  return (
    <li
      data-testid="timeline-item"
      style={{
        display: 'flex',
        gap: 12,
        paddingBottom: isLast ? 0 : 16,
        position: 'relative',
      }}
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: 11,
            top: 24,
            bottom: 0,
            width: 2,
            background: '#1F2937',
          }}
        />
      )}

      {/* Event icon */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#0E1117',
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          flexShrink: 0,
          zIndex: 1,
          color: ['STATUS_CHANGED', 'APPLICATION_CREATED'].includes(event.eventType) ? '#9CA3AF' : 'inherit',
        }}
      >
        {icon}
      </div>

      {/* Event content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: '#F9FAFB',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            margin: 0,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {formatEventDescription(event)}
        </p>
        <p
          style={{
            color: '#6B7280',
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
            margin: '4px 0 0 0',
          }}
        >
          {formatTimestamp(event.createdAt)}
        </p>
      </div>
    </li>
  );
}

/**
 * @component AuditTrailTimeline
 * @description Timeline component displaying a chronological list of audit events
 * for a job application. Shows events in reverse chronological order (newest first).
 *
 * @param {Object} props - Component props
 * @param {Array} props.events - Array of audit event objects
 * @param {number} props.events[].id - Unique event ID
 * @param {string} props.events[].eventType - Type of event (APPLICATION_CREATED, STATUS_CHANGED, etc.)
 * @param {string} [props.events[].fieldName] - Name of field that was updated
 * @param {string} [props.events[].oldValue] - Previous value
 * @param {string} [props.events[].newValue] - New value
 * @param {string} [props.events[].details] - Additional details
 * @param {string} props.events[].createdAt - ISO datetime string when event occurred
 * @param {boolean} props.loading - Whether events are currently being loaded
 *
 * @example
 * <AuditTrailTimeline
 *   events={[
 *     { id: 1, eventType: 'APPLICATION_CREATED', createdAt: '2025-01-15T10:00:00Z' },
 *     { id: 2, eventType: 'STATUS_CHANGED', oldValue: 'APPLIED', newValue: 'RECRUITER_SCREEN', createdAt: '2025-01-18T14:00:00Z' },
 *   ]}
 *   loading={false}
 * />
 *
 * @returns {JSX.Element} Audit trail timeline component
 */
export default function AuditTrailTimeline({ events, loading }) {
  // Sort events in reverse chronological order (newest first)
  // Use parseDate to handle various backend date formats
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = parseBackendDate(a.createdAt);
    const dateB = parseBackendDate(b.createdAt);
    // Handle null dates by treating them as oldest
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB - dateA;
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Section header */}
      <div
        style={{
          borderTop: '1px solid #1F2937',
          paddingTop: 16,
          marginTop: 8,
          marginBottom: 16,
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
          Activity Timeline
        </span>
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
          Loading activity...
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedEvents.length === 0 && (
        <p
          style={{
            color: '#4B5563',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            fontStyle: 'italic',
          }}
        >
          No activity recorded yet
        </p>
      )}

      {/* Timeline */}
      {!loading && sortedEvents.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {sortedEvents.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLast={index === sortedEvents.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
