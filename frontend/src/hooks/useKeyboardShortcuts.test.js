/**
 * @file useKeyboardShortcuts.test.js
 * @description Tests for the useKeyboardShortcuts custom hook
 *
 * Tests cover:
 * - Shortcut registration and firing
 * - Modifier key support (Cmd/Ctrl)
 * - Input field awareness (ignore shortcuts when typing, except Escape and modifiers)
 * - Enable/disable toggle functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * Helper to create and dispatch keyboard events
 * @param {string} key - The key to press
 * @param {Object} options - Event options (metaKey, ctrlKey, target, etc.)
 */
function fireKey(key, options = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  // Override target if specified (for input field awareness tests)
  if (options.target) {
    Object.defineProperty(event, 'target', {
      value: options.target,
      writable: false,
    });
  }

  document.dispatchEvent(event);
  return event;
}

/**
 * Creates a mock input element for testing input field awareness
 * @param {string} tagName - The tag name (INPUT, TEXTAREA, SELECT)
 * @returns {Object} Mock element
 */
function createMockInput(tagName = 'INPUT') {
  return {
    tagName,
    isContentEditable: false,
  };
}

describe('useKeyboardShortcuts', () => {
  describe('basic shortcut registration', () => {
    it('should call handler when registered shortcut key is pressed', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('n');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not call handler when different key is pressed', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('m');
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple shortcuts', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const shortcuts = [
        { key: 'n', handler: handler1 },
        { key: '/', handler: handler2 },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('n');
        fireKey('/');
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should pass the event to the handler', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('n');
      });

      expect(handler).toHaveBeenCalledWith(expect.any(KeyboardEvent));
    });

    it('should support ? key for help shortcut', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: '?', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('?');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support Escape key', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Escape', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Escape');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('modifier key support', () => {
    it('should fire handler when Cmd+Enter is pressed on Mac', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Enter', handler, meta: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Enter', { metaKey: true });
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should fire handler when Ctrl+Enter is pressed on non-Mac', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Enter', handler, ctrl: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Enter', { ctrlKey: true });
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support cmdOrCtrl option for cross-platform shortcuts', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Enter', handler, cmdOrCtrl: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Should fire with either metaKey or ctrlKey
      act(() => {
        fireKey('Enter', { metaKey: true });
      });
      expect(handler).toHaveBeenCalledTimes(1);

      act(() => {
        fireKey('Enter', { ctrlKey: true });
      });
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should NOT fire handler when modifier key required but not pressed', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Enter', handler, cmdOrCtrl: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Enter');
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support Cmd/Ctrl+S for save', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 's', handler, cmdOrCtrl: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('s', { metaKey: true });
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('input field awareness', () => {
    it('should NOT fire regular shortcuts when typing in an input field', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('n', { target: createMockInput('INPUT') });
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should NOT fire regular shortcuts when typing in a textarea', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'j', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('j', { target: createMockInput('TEXTAREA') });
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should NOT fire regular shortcuts when typing in a select', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'k', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('k', { target: createMockInput('SELECT') });
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should NOT fire regular shortcuts when in contenteditable', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('n', {
          target: { tagName: 'DIV', isContentEditable: true }
        });
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should ALWAYS fire Escape even in input fields', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Escape', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Escape', { target: createMockInput('INPUT') });
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should fire modifier shortcuts (Cmd/Ctrl) even in input fields', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Enter', handler, cmdOrCtrl: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Enter', {
          metaKey: true,
          target: createMockInput('INPUT')
        });
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should fire Cmd/Ctrl+S even in textarea', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 's', handler, cmdOrCtrl: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('s', {
          metaKey: true,
          target: createMockInput('TEXTAREA')
        });
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('enable/disable toggle', () => {
    it('should fire shortcuts when enabled (default)', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: true }));

      act(() => {
        fireKey('n');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should NOT fire shortcuts when disabled', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }));

      act(() => {
        fireKey('n');
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should respond to enabled state changes', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      const { rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts(shortcuts, { enabled }),
        { initialProps: { enabled: true } }
      );

      // Should fire when enabled
      act(() => {
        fireKey('n');
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // Disable shortcuts
      rerender({ enabled: false });

      // Should NOT fire when disabled
      act(() => {
        fireKey('n');
      });
      expect(handler).toHaveBeenCalledTimes(1); // Still 1

      // Re-enable shortcuts
      rerender({ enabled: true });

      // Should fire again
      act(() => {
        fireKey('n');
      });
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'n', handler }];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

      unmount();

      act(() => {
        fireKey('n');
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('arrow keys', () => {
    it('should support ArrowDown key', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'ArrowDown', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('ArrowDown');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support ArrowUp key', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'ArrowUp', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('ArrowUp');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('vim-style navigation keys', () => {
    it('should support j key for down navigation', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'j', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('j');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support k key for up navigation', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'k', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('k');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete key', () => {
    it('should support Delete key', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Delete', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Delete');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support Backspace key as alternative delete', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: 'Backspace', handler }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKey('Backspace');
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('preventDefault behavior', () => {
    it('should prevent default behavior when preventDefault option is true', () => {
      const handler = jest.fn();
      const shortcuts = [{ key: '/', handler, preventDefault: true }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const mockPreventDefault = jest.fn();
      const event = new KeyboardEvent('keydown', {
        key: '/',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'preventDefault', {
        value: mockPreventDefault,
        writable: false,
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(mockPreventDefault).toHaveBeenCalled();
    });
  });
});
