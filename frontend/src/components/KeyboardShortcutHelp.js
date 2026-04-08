/**
 * @component KeyboardShortcutHelp
 * @description Modal component displaying all available keyboard shortcuts
 * organized by category with styled key badges matching the app's dark theme.
 *
 * This component reads the help modal state and shortcut definitions from
 * the KeyboardShortcutContext and renders them in a visually appealing format.
 *
 * @example
 * // In your main app component
 * import { KeyboardShortcutHelp } from './components/KeyboardShortcutHelp';
 *
 * function App() {
 *   return (
 *     <KeyboardShortcutProvider>
 *       <YourContent />
 *       <KeyboardShortcutHelp />
 *     </KeyboardShortcutProvider>
 *   );
 * }
 *
 * @returns {JSX.Element|null} Modal component or null if closed
 */

import React, { useCallback } from 'react';
import { useKeyboardShortcutContext } from '../context/KeyboardShortcutContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

/**
 * @component KeyBadge
 * @description Styled badge for displaying keyboard key
 *
 * @param {Object} props - Component props
 * @param {string} props.keyText - The key text to display
 *
 * @returns {JSX.Element} Styled key badge span
 */
function KeyBadge({ keyText }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: '#1F2937',
        border: '1px solid #374151',
        borderRadius: 4,
        padding: '2px 8px',
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        fontWeight: 500,
        color: '#F9FAFB',
        marginRight: 4,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {keyText}
    </span>
  );
}

/**
 * @component ShortcutRow
 * @description Row displaying a single shortcut with key badge and description
 *
 * @param {Object} props - Component props
 * @param {string} props.keyText - The keyboard key(s)
 * @param {string} props.description - What the shortcut does
 *
 * @returns {JSX.Element} Shortcut row element
 */
function ShortcutRow({ keyText, description }) {
  // Split key text by " / " for alternative keys (e.g., "j / ArrowDown")
  const keys = keyText.split(' / ');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #1F2937',
      }}
    >
      <div>
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            <KeyBadge keyText={key.trim()} />
            {index < keys.length - 1 && (
              <span
                style={{
                  color: '#6B7280',
                  fontSize: 10,
                  marginRight: 4,
                }}
              >
                or
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <span
        style={{
          color: '#9CA3AF',
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {description}
      </span>
    </div>
  );
}

/**
 * @component ShortcutGroup
 * @description Group of shortcuts with a heading
 *
 * @param {Object} props - Component props
 * @param {string} props.group - Group name
 * @param {Array} props.shortcuts - Array of shortcuts in the group
 *
 * @returns {JSX.Element} Shortcut group element
 */
function ShortcutGroup({ group, shortcuts }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          color: '#4E9AF1',
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        {group}
      </h3>
      <div>
        {shortcuts.map((shortcut) => (
          <ShortcutRow
            key={shortcut.key + shortcut.description}
            keyText={shortcut.key}
            description={shortcut.description}
          />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutHelp() {
  const { isHelpOpen, closeHelp, shortcuts } = useKeyboardShortcutContext();

  /**
   * Handle Escape key to close the modal.
   * Uses useCallback to maintain stable reference for the hook.
   */
  const handleEscape = useCallback(() => {
    closeHelp();
  }, [closeHelp]);

  // Register Escape key handler when the modal is open
  useKeyboardShortcuts(
    [{ key: 'Escape', handler: handleEscape, preventDefault: true }],
    { enabled: isHelpOpen }
  );

  if (!isHelpOpen) {
    return null;
  }

  return (
    <div
      data-testid="help-backdrop"
      onClick={closeHelp}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        role="dialog"
        aria-label="Keyboard Shortcuts"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0E1117',
          border: '1px solid #374151',
          borderRadius: 16,
          padding: 32,
          width: 480,
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={closeHelp}
          aria-label="Close keyboard shortcuts help"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
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

        {/* Title */}
        <h2
          style={{
            color: '#F9FAFB',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 28,
            letterSpacing: '0.04em',
            marginBottom: 24,
            marginTop: 0,
          }}
        >
          Keyboard Shortcuts
        </h2>

        {/* Shortcut groups */}
        {shortcuts.map((group) => (
          <ShortcutGroup
            key={group.group}
            group={group.group}
            shortcuts={group.shortcuts}
          />
        ))}

        {/* Footer hint */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #1F2937',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              color: '#4B5563',
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Press <KeyBadge keyText="?" /> anytime to show this help
          </span>
        </div>
      </div>
    </div>
  );
}
