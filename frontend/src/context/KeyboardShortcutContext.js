/**
 * @file KeyboardShortcutContext.js
 * @description Context provider for keyboard shortcut help modal state and
 * centralized shortcut definitions for documentation purposes.
 *
 * This context provides:
 * - Help modal open/close state management
 * - Centralized shortcut definitions for the help modal
 *
 * @example
 * // In App.js
 * import { KeyboardShortcutProvider } from './context/KeyboardShortcutContext';
 *
 * function App() {
 *   return (
 *     <KeyboardShortcutProvider>
 *       <YourApp />
 *     </KeyboardShortcutProvider>
 *   );
 * }
 *
 * @example
 * // In a component
 * import { useKeyboardShortcutContext } from './context/KeyboardShortcutContext';
 *
 * function HelpButton() {
 *   const { toggleHelp } = useKeyboardShortcutContext();
 *   return <button onClick={toggleHelp}>Keyboard Shortcuts</button>;
 * }
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Centralized shortcut definitions for documentation.
 * Organized by groups for better display in the help modal.
 *
 * @type {Array<{group: string, shortcuts: Array<{key: string, description: string}>}>}
 */
export const SHORTCUT_DEFINITIONS = [
  {
    group: 'Global',
    shortcuts: [
      { key: 'n', description: 'Open new application modal' },
      { key: '/', description: 'Focus search input' },
      { key: '?', description: 'Show keyboard shortcuts help' },
      { key: 'Escape', description: 'Close modal / clear selection' },
    ],
  },
  {
    group: 'Modal',
    shortcuts: [
      { key: 'Cmd/Ctrl + Enter', description: 'Save and close' },
      { key: 'Cmd/Ctrl + S', description: 'Save and close' },
      { key: 'Escape', description: 'Cancel and close' },
    ],
  },
  {
    group: 'Table Navigation',
    shortcuts: [
      { key: 'j / ArrowDown', description: 'Select next row' },
      { key: 'k / ArrowUp', description: 'Select previous row' },
      { key: 'Enter', description: 'View selected application' },
      { key: 'e', description: 'Edit selected application' },
      { key: 'Delete', description: 'Delete selected (with confirm)' },
    ],
  },
];

/**
 * Context for keyboard shortcut state
 * @private
 */
const KeyboardShortcutContext = createContext(null);

/**
 * @component KeyboardShortcutProvider
 * @description Provider component for keyboard shortcut context.
 * Manages help modal state and provides shortcut definitions.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 *
 * @returns {JSX.Element} Provider component wrapping children
 */
export function KeyboardShortcutProvider({ children }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  /**
   * Opens the keyboard shortcuts help modal
   */
  const openHelp = useCallback(() => {
    setIsHelpOpen(true);
  }, []);

  /**
   * Closes the keyboard shortcuts help modal
   */
  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  /**
   * Toggles the keyboard shortcuts help modal
   */
  const toggleHelp = useCallback(() => {
    setIsHelpOpen((prev) => !prev);
  }, []);

  const value = useMemo(() => ({
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    shortcuts: SHORTCUT_DEFINITIONS,
  }), [isHelpOpen, openHelp, closeHelp, toggleHelp]);

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

/**
 * @hook useKeyboardShortcutContext
 * @description Hook to access keyboard shortcut context.
 * Must be used within a KeyboardShortcutProvider.
 *
 * @returns {Object} Context value
 * @returns {boolean} return.isHelpOpen - Whether the help modal is open
 * @returns {Function} return.openHelp - Function to open the help modal
 * @returns {Function} return.closeHelp - Function to close the help modal
 * @returns {Function} return.toggleHelp - Function to toggle the help modal
 * @returns {Array} return.shortcuts - Array of shortcut definitions for documentation
 *
 * @throws {Error} When used outside of KeyboardShortcutProvider
 *
 * @example
 * const { isHelpOpen, toggleHelp, shortcuts } = useKeyboardShortcutContext();
 */
export function useKeyboardShortcutContext() {
  const context = useContext(KeyboardShortcutContext);

  if (context === null) {
    throw new Error(
      'useKeyboardShortcutContext must be used within a KeyboardShortcutProvider'
    );
  }

  return context;
}
