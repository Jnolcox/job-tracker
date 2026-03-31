/**
 * @file Badge.jsx
 * @description A status badge component that displays application status with appropriate styling.
 */

import { STATUS_COLORS, STATUS_LABELS } from "../../utils/dataAdapter";

/**
 * @component Badge
 * @description Displays an application status as a styled badge.
 * Color and label are automatically determined from the status value using dataAdapter mappings.
 *
 * @param {Object} props - Component props
 * @param {string} props.status - Application status code (e.g., 'APPLIED', 'REJECTED')
 *
 * @example
 * <Badge status="APPLIED" />
 * // Renders: Applied (blue badge)
 *
 * <Badge status="REJECTED" />
 * // Renders: Rejected (red badge)
 *
 * @returns {JSX.Element} Styled badge element
 */
export default function Badge({ status }) {
  const color = STATUS_COLORS[status] || "#6B7280";
  const label = STATUS_LABELS[status] || status;

  return (
    <span style={{
      background: `${color}22`,
      color: color,
      border: `1px solid ${color}55`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 10,
      fontFamily: "'DM Mono',monospace",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}
