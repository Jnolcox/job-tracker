/**
 * @file useListNavigation.test.js
 * @description Tests for the useListNavigation custom hook
 *
 * Tests cover:
 * - Selected index state management
 * - Arrow key navigation (ArrowUp, ArrowDown)
 * - Vim-style navigation (j, k)
 * - Wrap-around support
 * - Callbacks for edit and delete actions
 * - Proper selection when list changes
 */

import { renderHook, act } from '@testing-library/react';
import { useListNavigation } from './useListNavigation';

describe('useListNavigation', () => {
  describe('initial state', () => {
    it('should initialize with selectedIndex as -1 (no selection)', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3] })
      );

      expect(result.current.selectedIndex).toBe(-1);
    });

    it('should accept initial selectedIndex', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 1 })
      );

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should clamp initialIndex to valid range', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 10 })
      );

      expect(result.current.selectedIndex).toBe(2); // Last valid index
    });
  });

  describe('selectNext', () => {
    it('should select first item when nothing is selected', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3] })
      );

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should select next item', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 0 })
      );

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should wrap to first item when at the end', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 2 })
      );

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should NOT wrap when wrapAround is false', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 2, wrapAround: false })
      );

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(2); // Stays at last
    });
  });

  describe('selectPrevious', () => {
    it('should select last item when nothing is selected', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3] })
      );

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(2); // Last item
    });

    it('should select previous item', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 2 })
      );

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it('should wrap to last item when at the beginning', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 0 })
      );

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(2);
    });

    it('should NOT wrap when wrapAround is false', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 0, wrapAround: false })
      );

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(0); // Stays at first
    });
  });

  describe('setSelectedIndex', () => {
    it('should set selected index directly', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3] })
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });

      expect(result.current.selectedIndex).toBe(2);
    });

    it('should clamp index to valid range', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3] })
      );

      act(() => {
        result.current.setSelectedIndex(100);
      });

      expect(result.current.selectedIndex).toBe(2);
    });

    it('should allow -1 to clear selection', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 1 })
      );

      act(() => {
        result.current.setSelectedIndex(-1);
      });

      expect(result.current.selectedIndex).toBe(-1);
    });
  });

  describe('clearSelection', () => {
    it('should clear selection', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 1 })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIndex).toBe(-1);
    });
  });

  describe('selectedItem', () => {
    it('should return null when nothing is selected', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: ['a', 'b', 'c'] })
      );

      expect(result.current.selectedItem).toBeNull();
    });

    it('should return the selected item', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: ['a', 'b', 'c'], initialIndex: 1 })
      );

      expect(result.current.selectedItem).toBe('b');
    });
  });

  describe('onEdit callback', () => {
    it('should call onEdit with selected item when triggerEdit is called', () => {
      const onEdit = jest.fn();
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const { result } = renderHook(() =>
        useListNavigation({ items, initialIndex: 1, onEdit })
      );

      act(() => {
        result.current.triggerEdit();
      });

      expect(onEdit).toHaveBeenCalledWith(items[1]);
    });

    it('should NOT call onEdit when nothing is selected', () => {
      const onEdit = jest.fn();
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const { result } = renderHook(() =>
        useListNavigation({ items, onEdit })
      );

      act(() => {
        result.current.triggerEdit();
      });

      expect(onEdit).not.toHaveBeenCalled();
    });
  });

  describe('onDelete callback', () => {
    it('should call onDelete with selected item when triggerDelete is called', () => {
      const onDelete = jest.fn();
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const { result } = renderHook(() =>
        useListNavigation({ items, initialIndex: 2, onDelete })
      );

      act(() => {
        result.current.triggerDelete();
      });

      expect(onDelete).toHaveBeenCalledWith(items[2]);
    });

    it('should NOT call onDelete when nothing is selected', () => {
      const onDelete = jest.fn();
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const { result } = renderHook(() =>
        useListNavigation({ items, onDelete })
      );

      act(() => {
        result.current.triggerDelete();
      });

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('empty list handling', () => {
    it('should handle empty list gracefully', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [] })
      );

      expect(result.current.selectedIndex).toBe(-1);
      expect(result.current.selectedItem).toBeNull();

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(-1);
    });
  });

  describe('list changes', () => {
    it('should clamp selection when list shrinks', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useListNavigation({ items, initialIndex: 2 }),
        { initialProps: { items: [1, 2, 3] } }
      );

      expect(result.current.selectedIndex).toBe(2);

      rerender({ items: [1, 2] });

      expect(result.current.selectedIndex).toBe(1); // Clamped to new last index
    });

    it('should preserve selection when list grows', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useListNavigation({ items, initialIndex: 1 }),
        { initialProps: { items: [1, 2, 3] } }
      );

      expect(result.current.selectedIndex).toBe(1);

      rerender({ items: [1, 2, 3, 4, 5] });

      expect(result.current.selectedIndex).toBe(1); // Unchanged
    });
  });

  describe('hasSelection', () => {
    it('should return false when nothing is selected', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3] })
      );

      expect(result.current.hasSelection).toBe(false);
    });

    it('should return true when something is selected', () => {
      const { result } = renderHook(() =>
        useListNavigation({ items: [1, 2, 3], initialIndex: 0 })
      );

      expect(result.current.hasSelection).toBe(true);
    });
  });
});
