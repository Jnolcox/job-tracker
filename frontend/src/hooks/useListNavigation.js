/**
 * @hook useListNavigation
 * @description Custom hook for arrow-key navigation through a list of items.
 * Provides selected index state, wrap-around support, and callbacks for
 * edit/delete actions on the selected item.
 *
 * Features:
 * - Selected index state management
 * - Navigation methods (selectNext, selectPrevious)
 * - Wrap-around support (configurable)
 * - Callbacks for edit and delete actions
 * - Automatic selection clamping when list size changes
 *
 * @param {Object} options - Configuration options
 * @param {Array} options.items - The list of items to navigate
 * @param {number} [options.initialIndex=-1] - Initial selected index (-1 for no selection)
 * @param {boolean} [options.wrapAround=true] - Whether navigation wraps at list boundaries
 * @param {Function} [options.onEdit] - Callback when triggerEdit is called with selected item
 * @param {Function} [options.onDelete] - Callback when triggerDelete is called with selected item
 *
 * @returns {Object} Navigation state and methods
 * @returns {number} return.selectedIndex - Current selected index (-1 if none)
 * @returns {*} return.selectedItem - The currently selected item, or null
 * @returns {boolean} return.hasSelection - Whether an item is selected
 * @returns {Function} return.selectNext - Select the next item in the list
 * @returns {Function} return.selectPrevious - Select the previous item in the list
 * @returns {Function} return.setSelectedIndex - Set the selected index directly
 * @returns {Function} return.clearSelection - Clear the current selection
 * @returns {Function} return.triggerEdit - Trigger edit callback with selected item
 * @returns {Function} return.triggerDelete - Trigger delete callback with selected item
 *
 * @example
 * const {
 *   selectedIndex,
 *   selectedItem,
 *   selectNext,
 *   selectPrevious,
 *   triggerEdit,
 *   triggerDelete,
 * } = useListNavigation({
 *   items: applications,
 *   onEdit: (app) => setEditing(app),
 *   onDelete: (app) => handleDelete(app.id),
 * });
 *
 * // Use with keyboard shortcuts
 * useKeyboardShortcuts([
 *   { key: 'j', handler: selectNext },
 *   { key: 'ArrowDown', handler: selectNext },
 *   { key: 'k', handler: selectPrevious },
 *   { key: 'ArrowUp', handler: selectPrevious },
 *   { key: 'Enter', handler: triggerEdit },
 *   { key: 'Delete', handler: triggerDelete },
 * ]);
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Clamps a value to a valid index range
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value (typically -1 for no selection)
 * @param {number} max - Maximum value (typically items.length - 1)
 * @returns {number} The clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function useListNavigation({
  items,
  initialIndex = -1,
  wrapAround = true,
  onEdit,
  onDelete,
}) {
  // Clamp initial index to valid range
  const clampedInitial = items.length > 0
    ? clamp(initialIndex, -1, items.length - 1)
    : -1;

  const [selectedIndex, setSelectedIndexState] = useState(clampedInitial);

  // Clamp selection when items array changes
  useEffect(() => {
    if (items.length === 0) {
      setSelectedIndexState(-1);
    } else if (selectedIndex >= items.length) {
      setSelectedIndexState(items.length - 1);
    }
  }, [items.length, selectedIndex]);

  /**
   * Select the next item in the list
   */
  const selectNext = useCallback(() => {
    if (items.length === 0) return;

    setSelectedIndexState((current) => {
      if (current === -1) {
        // No selection, select first item
        return 0;
      }
      if (current >= items.length - 1) {
        // At the end
        return wrapAround ? 0 : current;
      }
      return current + 1;
    });
  }, [items.length, wrapAround]);

  /**
   * Select the previous item in the list
   */
  const selectPrevious = useCallback(() => {
    if (items.length === 0) return;

    setSelectedIndexState((current) => {
      if (current === -1) {
        // No selection, select last item
        return items.length - 1;
      }
      if (current <= 0) {
        // At the beginning
        return wrapAround ? items.length - 1 : current;
      }
      return current - 1;
    });
  }, [items.length, wrapAround]);

  /**
   * Set selected index directly with clamping
   */
  const setSelectedIndex = useCallback((index) => {
    if (index === -1) {
      setSelectedIndexState(-1);
      return;
    }
    if (items.length === 0) {
      setSelectedIndexState(-1);
      return;
    }
    setSelectedIndexState(clamp(index, -1, items.length - 1));
  }, [items.length]);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedIndexState(-1);
  }, []);

  /**
   * Get the currently selected item
   */
  const selectedItem = useMemo(() => {
    if (selectedIndex === -1 || selectedIndex >= items.length) {
      return null;
    }
    return items[selectedIndex];
  }, [items, selectedIndex]);

  /**
   * Check if there is a selection
   */
  const hasSelection = selectedIndex !== -1;

  /**
   * Trigger the edit callback with the selected item
   */
  const triggerEdit = useCallback(() => {
    if (selectedIndex === -1 || !onEdit) return;
    const item = items[selectedIndex];
    if (item) {
      onEdit(item);
    }
  }, [items, selectedIndex, onEdit]);

  /**
   * Trigger the delete callback with the selected item
   */
  const triggerDelete = useCallback(() => {
    if (selectedIndex === -1 || !onDelete) return;
    const item = items[selectedIndex];
    if (item) {
      onDelete(item);
    }
  }, [items, selectedIndex, onDelete]);

  return {
    selectedIndex,
    selectedItem,
    hasSelection,
    selectNext,
    selectPrevious,
    setSelectedIndex,
    clearSelection,
    triggerEdit,
    triggerDelete,
  };
}
