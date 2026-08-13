/**
 * @file DashboardSettingsModal.jsx
 * @description Modal component for managing dashboard component visibility settings.
 * Allows users to toggle which dashboard components are displayed.
 */

import React, { useState } from 'react';
import { DASHBOARD_COMPONENTS } from '../../hooks/useDashboardSettings';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

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
/**
 * @component DangerZoneRow
 * @description A single destructive action in the Danger Zone, with an
 * explanatory label on the left and the triggering button on the right.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Name of the destructive action
 * @param {string} props.description - What the action removes
 * @param {string} props.buttonLabel - Text for the action button
 * @param {Function} props.onClick - Callback when the button is clicked
 * @param {boolean} props.disabled - Whether there is nothing to delete
 *
 * @returns {JSX.Element} Danger zone row component
 */
function DangerZoneRow({ label, description, buttonLabel, onClick, disabled }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <span
          style={{
            color: '#F9FAFB',
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            display: 'block',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#6B7280',
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {description}
        </span>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: `1px solid ${disabled ? '#374151' : 'rgba(248, 113, 113, 0.5)'}`,
          background: 'transparent',
          color: disabled ? '#4B5563' : '#F87171',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

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
 * @param {number} [props.totalApps=0] - Total applications the user has tracked
 * @param {number} [props.nonActiveCount=0] - Count of REJECTED/WITHDRAWN/GHOSTED applications
 * @param {Function} [props.onDeleteAll] - Async callback to delete all applications
 * @param {Function} [props.onDeleteNonActive] - Async callback to delete non-active applications
 * @param {boolean} [props.deleteLoading=false] - Whether a bulk delete is in flight
 * @param {string} [props.deleteError] - Error message from the last bulk delete attempt
 *
 * @example
 * <DashboardSettingsModal
 *   isOpen={isSettingsOpen}
 *   onClose={() => setIsSettingsOpen(false)}
 *   settings={settings}
 *   onToggle={toggleComponent}
 *   onReset={resetSettings}
 *   componentDisplayNames={componentDisplayNames}
 *   totalApps={apps.length}
 *   nonActiveCount={nonActiveCount}
 *   onDeleteAll={handleDeleteAll}
 *   onDeleteNonActive={handleDeleteNonActive}
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
  totalApps = 0,
  nonActiveCount = 0,
  onDeleteAll,
  onDeleteNonActive,
  deleteLoading = false,
  deleteError,
}) {
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteNonActiveConfirm, setShowDeleteNonActiveConfirm] = useState(false);

  if (!isOpen) return null;

  /**
   * Runs a bulk delete handler and closes its confirmation modal on success.
   * A rejected handler leaves the modal open so the error stays visible.
   *
   * @param {Function} handler - The async delete callback
   * @param {Function} closeConfirm - Setter that hides the confirmation modal
   */
  const confirmDeletion = async (handler, closeConfirm) => {
    if (!handler) return;
    try {
      await handler();
      closeConfirm(false);
    } catch {
      // The parent surfaces the failure through deleteError.
    }
  };

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

        {/* Danger Zone */}
        <div style={{ marginTop: 24 }}>
          <h3
            style={{
              color: '#F87171',
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          >
            Danger Zone
          </h3>
          <div
            style={{
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 8,
              padding: '4px 16px',
            }}
          >
            <DangerZoneRow
              label="Delete Non-Active Applications"
              description="Removes rejected, withdrawn and ghosted applications"
              buttonLabel={`Delete ${nonActiveCount}`}
              onClick={() => setShowDeleteNonActiveConfirm(true)}
              disabled={nonActiveCount === 0}
            />
            <DangerZoneRow
              label="Delete All Applications"
              description="Removes every application you have tracked"
              buttonLabel="Delete All"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={totalApps === 0}
            />
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

      {/*
        These sit inside the settings backdrop, so their clicks would otherwise
        bubble up to it and dismiss the settings modal underneath.
      */}
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDeleteModal
          isOpen={showDeleteAllConfirm}
          onClose={() => setShowDeleteAllConfirm(false)}
          onConfirm={() => confirmDeletion(onDeleteAll, setShowDeleteAllConfirm)}
          title="Delete All Applications"
          description="This permanently removes every application you have tracked, along with their history."
          confirmPhrase="DELETE ALL"
          itemCount={totalApps}
          loading={deleteLoading}
          error={deleteError}
        />

        <ConfirmDeleteModal
          isOpen={showDeleteNonActiveConfirm}
          onClose={() => setShowDeleteNonActiveConfirm(false)}
          onConfirm={() => confirmDeletion(onDeleteNonActive, setShowDeleteNonActiveConfirm)}
          title="Delete Non-Active Applications"
          description="This permanently removes your rejected, withdrawn and ghosted applications, along with their history."
          confirmPhrase="DELETE"
          itemCount={nonActiveCount}
          loading={deleteLoading}
          error={deleteError}
        />
      </div>
    </div>
  );
}
