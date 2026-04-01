/**
 * @file ApplicationViewModal.jsx
 * @description Read-only modal dialog for viewing job application details.
 * This modal is distinct from ApplicationModal (edit modal) - it displays
 * application information in a clean, readable format without any edit capability.
 * Includes an audit trail timeline showing the history of changes to the application.
 */

import { useCallback, useEffect, useState } from "react";
import { useKeyboardShortcuts } from "../../hooks";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  RTO_LABELS,
  LEVEL_LABELS,
} from "../../utils/dataAdapter";
import { jobApplicationsAPI } from "../../services/api";
import AuditTrailTimeline from "./AuditTrailTimeline";
import JourneyTimeline from "./JourneyTimeline";

/**
 * Format a date string to a human-readable format.
 *
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025 at 10:00 AM")
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a date string to just the date portion.
 *
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025")
 */
function formatDateOnly(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format salary number to currency string.
 *
 * @param {number} salary - Salary amount
 * @returns {string} Formatted salary (e.g., "$150,000")
 */
function formatSalary(salary) {
  if (!salary) return null;
  return `$${salary.toLocaleString()}`;
}

/**
 * Extract domain from URL for display.
 *
 * @param {string} url - Full URL
 * @returns {string} Domain name (e.g., "example.com")
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * @component InfoRow
 * @description Displays a label-value pair in the view modal.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Label text
 * @param {React.ReactNode} props.children - Value content
 * @param {boolean} [props.fullWidth=false] - Whether to span full width
 *
 * @returns {JSX.Element} Info row component
 */
function InfoRow({ label, children, fullWidth = false }) {
  const hasValue = children !== null && children !== undefined && children !== "";

  return (
    <div
      style={{
        flex: fullWidth ? "1 1 100%" : "1 1 calc(50% - 8px)",
        minWidth: fullWidth ? "100%" : 200,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          color: "#6B7280",
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: hasValue ? "#F9FAFB" : "#4B5563",
          fontSize: 13,
          fontFamily: "'DM Mono',monospace",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {hasValue ? children : "\u2014"}
      </span>
    </div>
  );
}

/**
 * @component SectionDivider
 * @description Visual divider between sections in the modal.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 *
 * @returns {JSX.Element} Section divider component
 */
function SectionDivider({ title }) {
  return (
    <div
      style={{
        borderTop: "1px solid #1F2937",
        paddingTop: 16,
        marginTop: 8,
        width: "100%",
      }}
    >
      <span
        style={{
          color: "#6B7280",
          fontSize: 11,
          fontFamily: "'DM Mono',monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
    </div>
  );
}

/**
 * @component ApplicationViewModal
 * @description Read-only modal dialog for viewing job application details.
 * Displays all application information in a clean, organized layout.
 * Supports Escape key to close.
 *
 * This component is intentionally read-only and distinct from ApplicationModal.
 * Use this for viewing details; use ApplicationModal for editing.
 *
 * @param {Object} props - Component props
 * @param {Object} props.app - Application data to display
 * @param {string} props.app.company - Company name
 * @param {string} props.app.role - Position title
 * @param {string} [props.app.level] - Job level (JUNIOR, MID, SENIOR, etc.)
 * @param {string} props.app.status - Application status
 * @param {string} props.app.appliedAt - Date when applied (ISO string)
 * @param {string} [props.app.lastUpdate] - Last update date (ISO string)
 * @param {string} [props.app.interviewDate] - Scheduled interview date (ISO string)
 * @param {number} [props.app.salaryMin] - Minimum salary
 * @param {number} [props.app.salaryMax] - Maximum salary
 * @param {string} [props.app.location] - Job location
 * @param {string} [props.app.rtoType] - Remote/hybrid/onsite type
 * @param {string} [props.app.jobUrl] - URL to job posting
 * @param {string} [props.app.jobDescription] - Job description text
 * @param {string} [props.app.contactName] - Recruiter/contact name
 * @param {string} [props.app.contactEmail] - Recruiter/contact email
 * @param {string} [props.app.contactPhone] - Recruiter/contact phone
 * @param {string} [props.app.notes] - Additional notes
 * @param {Function} props.onClose - Callback when modal should close
 *
 * @example
 * <ApplicationViewModal
 *   app={selectedApp}
 *   onClose={() => setViewing(null)}
 * />
 *
 * @returns {JSX.Element|null} Modal component or null if no app
 */
export default function ApplicationViewModal({ app, onClose }) {
  // State for audit trail events
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Handle Escape key to close
  const handleEscape = useCallback(() => {
    onClose();
  }, [onClose]);

  useKeyboardShortcuts(
    [{ key: "Escape", handler: handleEscape, preventDefault: true }],
    { enabled: !!app }
  );

  // Fetch audit trail events when modal opens
  useEffect(() => {
    if (!app?.id) return;

    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const response = await jobApplicationsAPI.getEvents(app.id);
        setEvents(response.data || []);
      } catch (error) {
        console.error('Failed to fetch audit trail events:', error);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [app?.id]);

  if (!app) return null;

  const statusColor = STATUS_COLORS[app.status] || "#6B7280";
  const salaryRange =
    app.salaryMin || app.salaryMax
      ? `${formatSalary(app.salaryMin) || "?"} - ${formatSalary(app.salaryMax) || "?"}`
      : null;

  return (
    <div
      data-testid="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        data-testid="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0E1117",
          border: "1px solid #374151",
          borderRadius: 16,
          padding: 32,
          width: 600,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                color: "#F9FAFB",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 24,
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Application Details
            </h2>
            <p
              style={{
                color: "#6B7280",
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                margin: "4px 0 0 0",
              }}
            >
              View-only
            </p>
          </div>
          <div
            style={{
              background: statusColor,
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "'DM Mono',monospace",
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {STATUS_LABELS[app.status] || app.status}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingRight: 8,
          }}
        >
          {/* Company & Role Header */}
          <div>
            <h3
              style={{
                color: "#F9FAFB",
                fontFamily: "'DM Mono',monospace",
                fontSize: 20,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {app.company}
            </h3>
            <p
              style={{
                color: "#9CA3AF",
                fontFamily: "'DM Mono',monospace",
                fontSize: 14,
                margin: "4px 0 0 0",
              }}
            >
              {app.role}
            </p>
          </div>

          {/* Basic Info Grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <InfoRow label="Level">
              {app.level ? LEVEL_LABELS[app.level] : null}
            </InfoRow>
            <InfoRow label="Applied">
              {formatDateOnly(app.appliedAt)}
            </InfoRow>
            <InfoRow label="Location">{app.location}</InfoRow>
            <InfoRow label="Work Type">
              {app.rtoType ? RTO_LABELS[app.rtoType] : null}
            </InfoRow>
            <InfoRow label="Salary Range">{salaryRange}</InfoRow>
            <InfoRow label="Last Updated">
              {formatDateOnly(app.lastUpdate)}
            </InfoRow>
          </div>

          {/* Interview Date (if present) */}
          {app.interviewDate && (
            <InfoRow label="Interview Date" fullWidth>
              {formatDate(app.interviewDate)}
            </InfoRow>
          )}

          {/* Job URL */}
          {app.jobUrl && (
            <div style={{ width: "100%" }}>
              <span
                style={{
                  color: "#6B7280",
                  fontSize: 10,
                  fontFamily: "'DM Mono',monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Job Posting
              </span>
              <a
                href={app.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4E9AF1",
                  fontSize: 13,
                  fontFamily: "'DM Mono',monospace",
                  textDecoration: "none",
                }}
              >
                {extractDomain(app.jobUrl)}
              </a>
            </div>
          )}

          {/* Job Description */}
          {app.jobDescription && (
            <>
              <SectionDivider title="Job Description" />
              <p
                style={{
                  color: "#D1D5DB",
                  fontSize: 12,
                  fontFamily: "'DM Mono',monospace",
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {app.jobDescription}
              </p>
            </>
          )}

          {/* Contact Information */}
          {(app.contactName || app.contactEmail || app.contactPhone) && (
            <>
              <SectionDivider title="Contact Information" />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <InfoRow label="Name">{app.contactName}</InfoRow>
                <InfoRow label="Email">{app.contactEmail}</InfoRow>
                <InfoRow label="Phone">{app.contactPhone}</InfoRow>
              </div>
            </>
          )}

          {/* Notes */}
          {app.notes && (
            <>
              <SectionDivider title="Notes" />
              <p
                style={{
                  color: "#D1D5DB",
                  fontSize: 12,
                  fontFamily: "'DM Mono',monospace",
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {app.notes}
              </p>
            </>
          )}

          {/* Journey Timeline (Stage History) */}
          {/*<JourneyTimeline
            applicationId={app.id}
            events={events}
            loading={eventsLoading}
          />*/}

          {/* Audit Trail Timeline */}
          <AuditTrailTimeline events={events} loading={eventsLoading} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
            borderTop: "1px solid #1F2937",
            paddingTop: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "transparent",
              color: "#9CA3AF",
              cursor: "pointer",
              fontFamily: "'DM Mono',monospace",
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
