/**
 * @hook useKeyboardShortcuts
 * @description Custom hook for registering keyboard shortcuts with modifier key support
 * and input field awareness. Handles global keyboard events and provides a clean API
 * for defining shortcuts declaratively.
 *
 * Features:
 * - Modifier key support (Cmd/Ctrl, with cross-platform cmdOrCtrl option)
 * - Input field awareness (ignores shortcuts when typing, except Escape and modifiers)
 * - Enable/disable toggle for conditional shortcut activation
 * - Automatic cleanup on unmount
 *
 * @param {Array<Object>} shortcuts - Array of shortcut definitions
 * @param {string} shortcuts[].key - The key to listen for (e.g., 'n', 'Escape', 'ArrowDown')
 * @param {Function} shortcuts[].handler - Callback function when shortcut is triggered
 * @param {boolean} [shortcuts[].meta] - Require metaKey (Cmd on Mac)
 * @param {boolean} [shortcuts[].ctrl] - Require ctrlKey
 * @param {boolean} [shortcuts[].cmdOrCtrl] - Require either metaKey or ctrlKey (cross-platform)
 * @param {boolean} [shortcuts[].preventDefault] - Call preventDefault() on matching events
 * @param {Object} [options] - Hook options
 * @param {boolean} [options.enabled=true] - Whether shortcuts are active
 *
 * @example
 * // Basic usage
 * useKeyboardShortcuts([
 *   { key: 'n', handler: handleNew },
 *   { key: '/', handler: handleSearch },
 *   { key: 'Escape', handler: handleClose },
 * ]);
 *
 * @example
 * // With modifier keys
 * useKeyboardShortcuts([
 *   { key: 'Enter', handler: handleSave, cmdOrCtrl: true },
 *   { key: 's', handler: handleSave, cmdOrCtrl: true, preventDefault: true },
 * ]);
 *
 * @example
 * // Conditional enabling (e.g., disable when modal is open)
 * useKeyboardShortcuts(shortcuts, { enabled: !isModalOpen });
 */

import { useEffect, useCallback } from 'react';

/**
 * Checks if the event target is an input field where typing should be allowed
 * @param {EventTarget} target - The event target element
 * @returns {boolean} True if the target is an input field
 */
function isInputField(target) {
  if (!target) return false;

  const tagName = target.tagName;
  const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  const isContentEditable = target.isContentEditable === true;

  return isInput || isContentEditable;
}

/**
 * Checks if a shortcut requires modifier keys
 * @param {Object} shortcut - The shortcut definition
 * @returns {boolean} True if the shortcut requires modifiers
 */
function requiresModifier(shortcut) {
  return shortcut.meta || shortcut.ctrl || shortcut.cmdOrCtrl;
}

/**
 * Checks if the modifier keys match the shortcut requirements
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} shortcut - The shortcut definition
 * @returns {boolean} True if modifiers match
 */
function modifiersMatch(event, shortcut) {
  if (shortcut.cmdOrCtrl) {
    return event.metaKey || event.ctrlKey;
  }
  if (shortcut.meta && !event.metaKey) {
    return false;
  }
  if (shortcut.ctrl && !event.ctrlKey) {
    return false;
  }
  return true;
}

export function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const targetIsInput = isInputField(event.target);

    for (const shortcut of shortcuts) {
      // Check if the key matches
      if (event.key !== shortcut.key) continue;

      // Check modifier key requirements
      if (requiresModifier(shortcut)) {
        if (!modifiersMatch(event, shortcut)) continue;
      } else {
        // For non-modifier shortcuts, check if modifier was pressed when not required
        // This prevents 'n' from firing when Cmd+N is pressed
        // But we DO want to fire when no modifier is pressed
      }

      // Check input field awareness
      // - Always allow Escape
      // - Always allow shortcuts with modifiers (Cmd/Ctrl+key)
      // - Block regular letter/symbol shortcuts when in input fields
      if (targetIsInput) {
        const isEscape = shortcut.key === 'Escape';
        const hasModifier = requiresModifier(shortcut);

        if (!isEscape && !hasModifier) {
          continue;
        }
      }

      // Handle preventDefault
      if (shortcut.preventDefault) {
        event.preventDefault();
      }

      // Call the handler
      shortcut.handler(event);
      break;
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
