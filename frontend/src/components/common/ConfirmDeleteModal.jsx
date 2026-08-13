/**
 * @file ConfirmDeleteModal.jsx
 * @description Type-to-confirm modal for destructive actions. The confirm button
 * stays disabled until the user types the exact confirmation phrase, which guards
 * against accidental clicks on irreversible operations.
 */

import React, { useEffect, useState } from 'react';

/**
 * @component ConfirmDeleteModal
 * @description A modal that requires the user to type an exact phrase before
 * enabling the destructive confirm action.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when the modal should close
 * @param {Function} props.onConfirm - Async callback invoked when the user confirms
 * @param {string} props.title - Modal heading
 * @param {string} props.description - Explanation of what will be deleted
 * @param {string} props.confirmPhrase - Phrase the user must type exactly (e.g. "DELETE ALL")
 * @param {number} [props.itemCount] - Number of items affected, shown in the warning
 * @param {boolean} [props.loading=false] - Whether the delete is in flight
 * @param {string} [props.error] - Error message to display
 *
 * @example
 * <ConfirmDeleteModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDeleteAll}
 *   title="Delete All Applications"
 *   description="This permanently removes every application you have tracked."
 *   confirmPhrase="DELETE ALL"
 *   itemCount={42}
 * />
 *
 * @returns {JSX.Element|null} Modal component or null if not open
 */
export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmPhrase,
  itemCount,
  loading = false,
  error,
}) {
  const [typedPhrase, setTypedPhrase] = useState('');

  // Clear the typed phrase on close so reopening always starts guarded.
  useEffect(() => {
    if (!isOpen) {
      setTypedPhrase('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmEnabled = typedPhrase === confirmPhrase && !loading;

  return (
    <div
      data-testid="confirm-delete-backdrop"
      onClick={loading ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
      }}
    >
      <div
        role="dialog"
        aria-label={title}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0E1117',
          border: '1px solid #374151',
          borderRadius: 16,
          padding: 32,
          width: 440,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2
          style={{
            color: '#F9FAFB',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          {title}
        </h2>

        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 8,
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
          }}
        >
          <p
            style={{
              color: '#F87171',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {description}
            {itemCount !== undefined && (
              <>
                {' '}
                This will delete <strong>{itemCount}</strong> application
                {itemCount === 1 ? '' : 's'}. This action cannot be undone.
              </>
            )}
          </p>
        </div>

        <label
          htmlFor="confirm-delete-phrase"
          style={{
            color: '#9CA3AF',
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          Type &quot;{confirmPhrase}&quot; to confirm
        </label>
        <input
          id="confirm-delete-phrase"
          type="text"
          value={typedPhrase}
          disabled={loading}
          autoComplete="off"
          onChange={(e) => setTypedPhrase(e.target.value)}
          style={{
            background: '#1F2937',
            border: '1px solid #374151',
            borderRadius: 6,
            padding: '10px 12px',
            color: '#F9FAFB',
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
          }}
        />

        {error && (
          <p
            role="alert"
            style={{
              color: '#F87171',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #374151',
              background: 'transparent',
              color: '#9CA3AF',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Cancel
          </button>
          <button
            data-testid="confirm-delete-button"
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: isConfirmEnabled ? '#DC2626' : '#4B5563',
              color: '#F9FAFB',
              cursor: isConfirmEnabled ? 'pointer' : 'not-allowed',
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
