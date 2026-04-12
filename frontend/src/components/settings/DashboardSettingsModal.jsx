/**
 * @file DashboardSettingsModal.jsx
 * @description Modal component for managing dashboard component visibility settings.
 * Allows users to toggle which dashboard components are displayed.
 */

import React from 'react';
import { DASHBOARD_COMPONENTS } from '../../hooks/useDashboardSettings';

/**
 * @component ToggleSwitch
 * @description A custom toggle switch component with accessible styling.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the toggle
 * @param {boolean} props.checked - Whether the toggle is on
 * @param {Function} props.onChange - Callback when toggle is clicked
 * @param {string} props.label - Accessible label for the toggle
 *
 * @returns {JSX.Element} Toggle switch component
 */
function ToggleSwitch({ id, checked, onChange, label }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? '#4E9AF1' : '#374151',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#F9FAFB',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

/**
 * @component SettingRow
 * @description A single row in the settings list with label and toggle.
 *
 * @param {Object} props - Component props
 * @param {string} props.componentKey - The key identifier for the component
 * @param {string} props.label - Display name for the component
 * @param {boolean} props.checked - Whether the component is visible
 * @param {Function} props.onToggle - Callback when toggle is clicked
 * @param {string} [props.subtitle] - Optional subtitle text
 *
 * @returns {JSX.Element} Setting row component
 */
function SettingRow({ componentKey, label, checked, onToggle, subtitle }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #1F2937',
      }}
    >
      <div style={{ flex: 1 }}>
        <label
          htmlFor={`toggle-${componentKey}`}
          style={{
            color: '#F9FAFB',
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            cursor: 'pointer',
            display: 'block',
          }}
        >
          {label}
        </label>
        {subtitle && (
          <span
            style={{
              color: '#6B7280',
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <ToggleSwitch
        id={`toggle-${componentKey}`}
        checked={checked}
        onChange={() => onToggle(componentKey)}
        label={label}
      />
    </div>
  );
}

/**
 * @component DashboardSettingsModal
 * @description Modal for configuring which dashboard components are visible.
 * Provides toggle switches for each component group except the table (always visible).
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal should close
 * @param {Object} props.settings - Current visibility settings for each component
 * @param {Function} props.onToggle - Callback when a component toggle is clicked
 * @param {Function} props.onReset - Callback when reset button is clicked
 * @param {Object} props.componentDisplayNames - Human-readable names for components
 *
 * @example
 * <DashboardSettingsModal
 *   isOpen={isSettingsOpen}
 *   onClose={() => setIsSettingsOpen(false)}
 *   settings={settings}
 *   onToggle={toggleComponent}
 *   onReset={resetSettings}
 *   componentDisplayNames={componentDisplayNames}
 * />
 *
 * @returns {JSX.Element|null} Modal component or null if not open
 */
export default function DashboardSettingsModal({
  isOpen,
  onClose,
  settings,
  onToggle,
  onReset,
  componentDisplayNames,
}) {
  if (!isOpen) return null;

  // Define component groups for better organization
  const statCardsKey = DASHBOARD_COMPONENTS.STAT_CARDS;
  const chartKeys = Object.values(DASHBOARD_COMPONENTS).filter(
    (key) => key !== statCardsKey
  );

  return (
    <div
      data-testid="settings-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-label="Dashboard Settings"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0E1117',
          border: '1px solid #374151',
          borderRadius: 16,
          padding: 32,
          width: 480,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                color: '#F9FAFB',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 24,
                letterSpacing: '0.04em',
                margin: 0,
              }}
            >
              Dashboard Settings
            </h2>
            <p
              style={{
                color: '#6B7280',
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                marginTop: 4,
              }}
            >
              Choose which components to display on your dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 8,
          }}
        >
          {/* Statistics Section */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                color: '#A78BFA',
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              Statistics
            </h3>
            <SettingRow
              componentKey={statCardsKey}
              label={componentDisplayNames[statCardsKey]}
              checked={settings[statCardsKey]}
              onToggle={onToggle}
              subtitle="Controls all statistics cards at the top"
            />
          </div>

          {/* Charts Section */}
          <div>
            <h3
              style={{
                color: '#A78BFA',
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              Charts & Analytics
            </h3>
            {chartKeys.map((key) => (
              <SettingRow
                key={key}
                componentKey={key}
                label={componentDisplayNames[key]}
                checked={settings[key]}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid #1F2937',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              color: '#4B5563',
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              margin: 0,
            }}
          >
            Note: The table is always visible
          </p>
          <button
            onClick={onReset}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #374151',
              background: 'transparent',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#4E9AF1';
              e.target.style.color = '#4E9AF1';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#374151';
              e.target.style.color = '#9CA3AF';
            }}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
