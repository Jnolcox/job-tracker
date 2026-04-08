/**
 * @file KeyboardShortcutHelp.test.js
 * @description Tests for the KeyboardShortcutHelp modal component
 *
 * Tests cover:
 * - Rendering all shortcut groups and shortcuts
 * - Modal visibility based on context state
 * - Close button and backdrop click functionality
 * - Keyboard key badges display
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutHelp } from './KeyboardShortcutHelp';
import {
  KeyboardShortcutProvider,
  useKeyboardShortcutContext,
  SHORTCUT_DEFINITIONS,
} from '../context/KeyboardShortcutContext';

/**
 * Wrapper component that opens the help modal by default
 */
function HelpWrapper({ children, defaultOpen = false }) {
  return (
    <KeyboardShortcutProvider>
      {defaultOpen && <HelpOpener />}
      {children}
    </KeyboardShortcutProvider>
  );
}

/**
 * Component that opens the help modal on mount
 */
function HelpOpener() {
  const { openHelp } = useKeyboardShortcutContext();
  React.useEffect(() => {
    openHelp();
  }, [openHelp]);
  return null;
}

describe('KeyboardShortcutHelp', () => {
  describe('visibility', () => {
    it('should not render when help modal is closed', () => {
      render(
        <HelpWrapper defaultOpen={false}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when help modal is open', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display title "Keyboard Shortcuts"', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  describe('shortcut groups', () => {
    it('should render all shortcut groups', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      SHORTCUT_DEFINITIONS.forEach(group => {
        expect(screen.getByText(group.group)).toBeInTheDocument();
      });
    });

    it('should render all shortcuts within groups', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      SHORTCUT_DEFINITIONS.forEach(group => {
        group.shortcuts.forEach(shortcut => {
          // Some descriptions may appear multiple times, use getAllByText
          const elements = screen.getAllByText(shortcut.description);
          expect(elements.length).toBeGreaterThanOrEqual(1);
        });
      });
    });
  });

  describe('key badges', () => {
    it('should display key values', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      // Check for some specific keys
      expect(screen.getByText('n')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
      // ? appears multiple times (in shortcuts and in footer hint)
      const questionMarkElements = screen.getAllByText('?');
      expect(questionMarkElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display Escape key', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      // Escape appears multiple times (Global and Modal)
      const escapeElements = screen.getAllByText('Escape');
      expect(escapeElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('close functionality', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup();

      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const backdrop = screen.getByTestId('help-backdrop');
      await user.click(backdrop);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should NOT close modal when content is clicked', async () => {
      const user = userEvent.setup();

      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      const dialog = screen.getByRole('dialog');
      await user.click(dialog);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper dialog role', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-label for close button', () => {
      render(
        <HelpWrapper defaultOpen={true}>
          <KeyboardShortcutHelp />
        </HelpWrapper>
      );

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });
});
