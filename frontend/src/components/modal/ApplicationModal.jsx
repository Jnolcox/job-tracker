/**
 * @file ApplicationModal.jsx
 * @description Modal dialog for creating and editing job applications.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useKeyboardShortcuts } from "../../hooks";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  RTO_TYPES,
  RTO_LABELS,
  LEVEL_TYPES,
  LEVEL_LABELS,
  isStatusInGroup,
} from "../../utils/dataAdapter";
import { toDateTimeLocalInput } from "../../utils/formatters";

/**
 * @component ApplicationModal
 * @description Modal dialog for creating/editing job applications.
 * Supports keyboard shortcuts: Cmd/Ctrl+Enter or Cmd/Ctrl+S to save, Escape to close.
 *
 * The modal tracks the original application state to detect changes for proper
 * date handling. When saving, it passes both the form data and change context
 * to the parent to determine which date fields should be sent to the backend.
 *
 * The company name input is automatically focused when the modal opens,
 * allowing users to start typing immediately without needing to tab or click.
 *
 * @param {Object} props - Component props
 * @param {Object} props.app - Application data to edit (or empty object for new)
 * @param {Function} props.onClose - Callback when modal should close
 * @param {Function} props.onSave - Callback when form is submitted.
 *   Called with (formData, originalData, statusChanged) for updates,
 *   or just (formData) for creates.
 * @param {boolean} props.saving - Whether save operation is in progress
 *
 * @example
 * <ApplicationModal
 *   app={editingApp}
 *   onClose={() => setEditing(null)}
 *   onSave={handleSave}
 *   saving={isSaving}
 * />
 *
 * @returns {JSX.Element|null} Modal component or null if no app
 */
export default function ApplicationModal({ app, onClose, onSave, saving }) {
  const [form, setForm] = useState({...app});
  // Store original app data for comparison (to detect user changes)
  const originalData = useRef(app);
  // Ref for autofocusing the company input when modal opens
  const companyInputRef = useRef(null);

  // Focus the company input when the modal opens
  useEffect(() => {
    if (app && companyInputRef.current) {
      companyInputRef.current.focus();
    }
  }, [app]);

  // Handle keyboard shortcuts for modal
  const handleSave = useCallback(() => {
    if (!saving) {
      const isNew = !app.id;
      if (isNew) {
        // For new applications, just pass the form data
        onSave(form);
      } else {
        // For updates, pass form, original data, and whether status changed
        const statusChanged = form.status !== originalData.current.status;
        onSave(form, originalData.current, statusChanged);
      }
    }
  }, [form, onSave, saving, app.id]);

  // Handle Escape key to close modal
  const handleEscape = useCallback(() => {
    onClose();
  }, [onClose]);

  useKeyboardShortcuts([
    { key: 'Enter', handler: handleSave, cmdOrCtrl: true, preventDefault: true },
    { key: 's', handler: handleSave, cmdOrCtrl: true, preventDefault: true },
    { key: 'Escape', handler: handleEscape, preventDefault: true },
  ], { enabled: !!app });

  if (!app) return null;
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const isNew = !app.id;

  const inputStyle = {
    background: "#111827",
    border: "1px solid #374151",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#F9FAFB",
    fontFamily: "'DM Mono',monospace",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const labelStyle = {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "'DM Mono',monospace",
    letterSpacing: "0.1em",
  };

  return (
    <div
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
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0E1117",
          border: "1px solid #374151",
          borderRadius: 16,
          padding: 32,
          width: 560,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
        }}
      >
        <h2 style={{
          color: "#F9FAFB",
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 24,
          letterSpacing: "0.04em",
          margin: 0,
          flexShrink: 0,
        }}>
          {app.id ? "Edit Application" : "New Application"}
        </h2>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 8 }}>
          {/* Company & Role */}
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>COMPANY *</span>
              <input
                ref={companyInputRef}
                type="text"
                value={form.company || ''}
                onChange={e => set("company", e.target.value)}
                style={inputStyle}
                disabled={saving}
                placeholder="Company name"
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>ROLE *</span>
              <input
                type="text"
                value={form.role || ''}
                onChange={e => set("role", e.target.value)}
                style={inputStyle}
                disabled={saving}
                placeholder="Position title"
              />
            </label>
            <label style={{ flex: 0.6, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>LEVEL</span>
              <select
                value={form.level || ''}
                onChange={e => set("level", e.target.value || null)}
                style={inputStyle}
                disabled={saving}
              >
                <option value="">Select...</option>
                {LEVEL_TYPES.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </label>
          </div>

          {/* Status & Applied Date */}
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>STATUS</span>
              <select
                value={form.status}
                onChange={e => set("status", e.target.value)}
                style={inputStyle}
                disabled={saving}
              >
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>DATE APPLIED *</span>
              <input
                type="datetime-local"
                value={toDateTimeLocalInput(form.appliedAt)}
                onChange={e => set("appliedAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
                style={inputStyle}
                disabled={saving}
                required
              />
            </label>
          </div>

          {/* Interview Date - only show for interviewing statuses */}
          {isStatusInGroup(form.status, 'INTERVIEWING') && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>INTERVIEW DATE</span>
              <input
                type="datetime-local"
                value={toDateTimeLocalInput(form.interviewDate)}
                onChange={e => set("interviewDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                style={inputStyle}
                disabled={saving}
              />
            </label>
          )}

          {/* Salary Range */}
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>SALARY MIN</span>
              <input
                type="number"
                value={form.salaryMin || ''}
                onChange={e => set("salaryMin", e.target.value ? Number(e.target.value) : null)}
                style={inputStyle}
                disabled={saving}
                placeholder="e.g. 100000"
                min="0"
                step="1000"
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>SALARY MAX</span>
              <input
                type="number"
                value={form.salaryMax || ''}
                onChange={e => set("salaryMax", e.target.value ? Number(e.target.value) : null)}
                style={inputStyle}
                disabled={saving}
                placeholder="e.g. 150000"
                min="0"
                step="1000"
              />
            </label>
          </div>

          {/* Location & RTO */}
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>LOCATION</span>
              <input
                type="text"
                value={form.location || ''}
                onChange={e => set("location", e.target.value)}
                style={inputStyle}
                disabled={saving}
                placeholder="e.g. San Francisco, CA"
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>RTO</span>
              <select
                value={form.rtoType || ''}
                onChange={e => set("rtoType", e.target.value || null)}
                style={inputStyle}
                disabled={saving}
              >
                <option value="">Select...</option>
                {RTO_TYPES.map(r => <option key={r} value={r}>{RTO_LABELS[r]}</option>)}
              </select>
            </label>
          </div>

          {/* Job URL */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>JOB URL</span>
            <input
              type="url"
              value={form.jobUrl || ''}
              onChange={e => set("jobUrl", e.target.value)}
              style={inputStyle}
              disabled={saving}
              placeholder="https://..."
            />
          </label>

          {/* Job Description */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>JOB DESCRIPTION</span>
            <textarea
              value={form.jobDescription || ''}
              onChange={e => set("jobDescription", e.target.value)}
              rows={3}
              style={{...inputStyle, resize: "vertical"}}
              disabled={saving}
              placeholder="Paste job description here..."
            />
          </label>

          {/* Contact Info */}
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: 16 }}>
            <span style={{...labelStyle, display: "block", marginBottom: 12}}>CONTACT INFORMATION</span>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{...labelStyle, fontSize: 10}}>NAME</span>
                <input
                  type="text"
                  value={form.contactName || ''}
                  onChange={e => set("contactName", e.target.value)}
                  style={inputStyle}
                  disabled={saving}
                  placeholder="Recruiter name"
                />
              </label>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{...labelStyle, fontSize: 10}}>PHONE</span>
                <input
                  type="tel"
                  value={form.contactPhone || ''}
                  onChange={e => set("contactPhone", e.target.value)}
                  style={inputStyle}
                  disabled={saving}
                  placeholder="Phone number"
                />
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{...labelStyle, fontSize: 10}}>EMAIL</span>
              <input
                type="email"
                value={form.contactEmail || ''}
                onChange={e => set("contactEmail", e.target.value)}
                style={inputStyle}
                disabled={saving}
                placeholder="recruiter@company.com"
              />
            </label>
          </div>

          {/* Notes */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>NOTES</span>
            <textarea
              value={form.notes || ''}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              style={{...inputStyle, resize: "vertical"}}
              disabled={saving}
              placeholder="Additional notes..."
            />
          </label>

          {/* Editable status change date for existing apps (for back-data entry) */}
          {!isNew && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #1F2937", paddingTop: 16 }}>
              <span style={labelStyle}>STATUS CHANGED DATE</span>
              <input
                type="datetime-local"
                value={toDateTimeLocalInput(form.statusChangedAt)}
                onChange={e => set("statusChangedAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
                style={inputStyle}
                disabled={saving}
              />
              <span style={{ color: "#4B5563", fontSize: 10, fontFamily: "'DM Mono',monospace" }}>
                Edit to backfill historical data
              </span>
            </label>
          )}
        </div>

        <div style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          flexShrink: 0,
          borderTop: "1px solid #1F2937",
          paddingTop: 16,
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "transparent",
              color: "#9CA3AF",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Mono',monospace",
              fontSize: 12,
              opacity: saving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: saving ? "#374151" : "#4E9AF1",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Mono',monospace",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
