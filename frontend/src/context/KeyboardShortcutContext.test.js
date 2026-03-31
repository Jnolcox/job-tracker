/**
 * @file KeyboardShortcutContext.test.js
 * @description Tests for the KeyboardShortcutContext and Provider
 *
 * Tests cover:
 * - Help modal open/close state management
 * - Providing shortcut definitions for documentation
 * - Context consumer access via useKeyboardShortcutContext hook
 * - Error when used outside provider
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  KeyboardShortcutProvider,
  useKeyboardShortcutContext,
  SHORTCUT_DEFINITIONS,
} from './KeyboardShortcutContext';

/**
 * Test component that consumes the context
 */
function TestConsumer() {
  const {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    shortcuts,
  } = useKeyboardShortcutContext();

  return (
    <div>
      <span data-testid="help-open">{isHelpOpen ? 'true' : 'false'}</span>
      <span data-testid="shortcuts-count">{shortcuts.length}</span>
      <button data-testid="open-help" onClick={openHelp}>Open</button>
      <button data-testid="close-help" onClick={closeHelp}>Close</button>
      <button data-testid="toggle-help" onClick={toggleHelp}>Toggle</button>
    </div>
  );
}

describe('KeyboardShortcutContext', () => {
  describe('useKeyboardShortcutContext outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useKeyboardShortcutContext must be used within a KeyboardShortcutProvider');
    });
  });

  describe('help modal state', () => {
    it('should initialize with help modal closed', () => {
      render(
        <KeyboardShortcutProvider>
          <TestConsumer />
        </KeyboardShortcutProvider>
      );

      expect(screen.getByTestId('help-open').textContent).toBe('false');
    });

    it('should open help modal when openHelp is called', async () => {
      const user = userEvent.setup();

      render(
        <KeyboardShortcutProvider>
          <TestConsumer />
        </KeyboardShortcutProvider>
      );

      await user.click(screen.getByTestId('open-help'));

      expect(screen.getByTestId('help-open').textContent).toBe('true');
    });

    it('should close help modal when closeHelp is called', async () => {
      const user = userEvent.setup();

      render(
        <KeyboardShortcutProvider>
          <TestConsumer />
        </KeyboardShortcutProvider>
      );

      // Open first
      await user.click(screen.getByTestId('open-help'));
      expect(screen.getByTestId('help-open').textContent).toBe('true');

      // Then close
      await user.click(screen.getByTestId('close-help'));
      expect(screen.getByTestId('help-open').textContent).toBe('false');
    });

    it('should toggle help modal state', async () => {
      const user = userEvent.setup();

      render(
        <KeyboardShortcutProvider>
          <TestConsumer />
        </KeyboardShortcutProvider>
      );

      // Toggle to open
      await user.click(screen.getByTestId('toggle-help'));
      expect(screen.getByTestId('help-open').textContent).toBe('true');

      // Toggle to close
      await user.click(screen.getByTestId('toggle-help'));
      expect(screen.getByTestId('help-open').textContent).toBe('false');
    });
  });

  describe('shortcut definitions', () => {
    it('should provide shortcuts array', () => {
      render(
        <KeyboardShortcutProvider>
          <TestConsumer />
        </KeyboardShortcutProvider>
      );

      const count = parseInt(screen.getByTestId('shortcuts-count').textContent);
      expect(count).toBeGreaterThan(0);
    });

    it('should have shortcuts array matching SHORTCUT_DEFINITIONS', () => {
      let contextShortcuts;

      function CaptureShortcuts() {
        const { shortcuts } = useKeyboardShortcutContext();
        contextShortcuts = shortcuts;
        return null;
      }

      render(
        <KeyboardShortcutProvider>
          <CaptureShortcuts />
        </KeyboardShortcutProvider>
      );

      expect(contextShortcuts).toEqual(SHORTCUT_DEFINITIONS);
    });
  });

  describe('SHORTCUT_DEFINITIONS structure', () => {
    it('should have global shortcuts group', () => {
      const globalGroup = SHORTCUT_DEFINITIONS.find(g => g.group === 'Global');
      expect(globalGroup).toBeDefined();
      expect(globalGroup.shortcuts.length).toBeGreaterThan(0);
    });

    it('should have modal shortcuts group', () => {
      const modalGroup = SHORTCUT_DEFINITIONS.find(g => g.group === 'Modal');
      expect(modalGroup).toBeDefined();
      expect(modalGroup.shortcuts.length).toBeGreaterThan(0);
    });

    it('should have table navigation shortcuts group', () => {
      const tableGroup = SHORTCUT_DEFINITIONS.find(g => g.group === 'Table Navigation');
      expect(tableGroup).toBeDefined();
      expect(tableGroup.shortcuts.length).toBeGreaterThan(0);
    });

    it('each shortcut should have key and description', () => {
      SHORTCUT_DEFINITIONS.forEach(group => {
        group.shortcuts.forEach(shortcut => {
          expect(shortcut).toHaveProperty('key');
          expect(shortcut).toHaveProperty('description');
          expect(typeof shortcut.key).toBe('string');
          expect(typeof shortcut.description).toBe('string');
        });
      });
    });
  });
});
