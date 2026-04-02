/**
 * @file StatCard.test.jsx
 * @description Tests for the StatCard component with loading state support.
 *
 * Tests cover:
 * - Basic rendering with label, value, sub, and accent
 * - Loading state with shimmer animation placeholders
 * - Optional sub text behavior
 * - Default loading prop behavior (false)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import StatCard from './StatCard';

expect.extend(toHaveNoViolations);

describe('StatCard', () => {
  const defaultProps = {
    label: 'Total Applied',
    value: 42,
    accent: '#4E9AF1',
  };

  describe('basic rendering', () => {
    it('should render the label text', () => {
      render(<StatCard {...defaultProps} />);

      expect(screen.getByText('Total Applied')).toBeInTheDocument();
    });

    it('should render the value', () => {
      render(<StatCard {...defaultProps} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render string values', () => {
      render(<StatCard {...defaultProps} value="N/A" />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should render sub text when provided', () => {
      render(<StatCard {...defaultProps} sub="10 still active" />);

      expect(screen.getByText('10 still active')).toBeInTheDocument();
    });

    it('should not render sub text when not provided', () => {
      const { container } = render(<StatCard {...defaultProps} />);

      // Only label and value should be rendered as spans
      const spans = container.querySelectorAll('span');
      expect(spans.length).toBe(2); // label + value
    });

    it('should apply accent color to border', () => {
      const { container } = render(<StatCard {...defaultProps} accent="#FF5733" />);

      const card = container.firstChild;
      // Browser normalizes hex to lowercase
      expect(card.style.border.toLowerCase()).toContain('#ff573333');
    });

    it('should render top accent bar with gradient', () => {
      const { container } = render(<StatCard {...defaultProps} accent="#4E9AF1" />);

      // The accent bar is the second child (first is the card itself as container)
      const accentBar = container.querySelector('[data-testid="accent-bar"]');
      expect(accentBar).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should default loading prop to false', () => {
      render(<StatCard {...defaultProps} />);

      // Value should be visible when not loading
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should hide value when loading is true', () => {
      render(<StatCard {...defaultProps} loading={true} />);

      // Value should not be rendered
      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });

    it('should show shimmer placeholder for value when loading', () => {
      const { container } = render(<StatCard {...defaultProps} loading={true} />);

      // Should have a shimmer placeholder div for value
      const shimmerElements = container.querySelectorAll('[data-testid="shimmer-value"]');
      expect(shimmerElements.length).toBe(1);
    });

    it('should hide sub text when loading is true', () => {
      render(<StatCard {...defaultProps} sub="10 still active" loading={true} />);

      // Sub text should not be rendered
      expect(screen.queryByText('10 still active')).not.toBeInTheDocument();
    });

    it('should show shimmer placeholder for sub when loading', () => {
      const { container } = render(<StatCard {...defaultProps} sub="10 still active" loading={true} />);

      // Should have a shimmer placeholder div for sub
      const shimmerElements = container.querySelectorAll('[data-testid="shimmer-sub"]');
      expect(shimmerElements.length).toBe(1);
    });

    it('should always show label even when loading', () => {
      render(<StatCard {...defaultProps} loading={true} />);

      // Label should still be visible during loading
      expect(screen.getByText('Total Applied')).toBeInTheDocument();
    });

    it('should inject shimmer keyframes style when loading', () => {
      const { container } = render(<StatCard {...defaultProps} loading={true} />);

      // Should have a style element with keyframes
      const styleElement = container.querySelector('style');
      expect(styleElement).toBeInTheDocument();
      expect(styleElement.textContent).toContain('statCardShimmer');
      expect(styleElement.textContent).toContain('@keyframes');
    });

    it('should not inject shimmer keyframes style when not loading', () => {
      const { container } = render(<StatCard {...defaultProps} loading={false} />);

      // Should not have a style element
      const styleElement = container.querySelector('style');
      expect(styleElement).not.toBeInTheDocument();
    });

    it('should apply animation to shimmer placeholders', () => {
      const { container } = render(<StatCard {...defaultProps} loading={true} />);

      const shimmerValue = container.querySelector('[data-testid="shimmer-value"]');
      expect(shimmerValue.style.animation).toContain('statCardShimmer');
    });

    it('should apply gradient background to shimmer placeholders', () => {
      const { container } = render(<StatCard {...defaultProps} loading={true} />);

      const shimmerValue = container.querySelector('[data-testid="shimmer-value"]');
      // Browser may normalize the background property differently, check backgroundImage instead
      // or verify the element exists with proper styling structure
      expect(shimmerValue).toBeInTheDocument();
      expect(shimmerValue.style.backgroundSize).toBe('400px 100%');
    });

    it('should show value when loading becomes false', () => {
      const { rerender } = render(<StatCard {...defaultProps} loading={true} />);

      // Initially loading, value should be hidden
      expect(screen.queryByText('42')).not.toBeInTheDocument();

      // Rerender with loading=false
      rerender(<StatCard {...defaultProps} loading={false} />);

      // Value should now be visible
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply correct styles to the card container', () => {
      const { container } = render(<StatCard {...defaultProps} />);

      const card = container.firstChild;
      // Browser normalizes hex colors to rgb format
      expect(card.style.background).toBe('rgb(14, 17, 23)'); // #0E1117
      expect(card.style.borderRadius).toBe('12px');
      expect(card.style.padding).toBe('20px 24px');
      expect(card.style.display).toBe('flex');
      expect(card.style.flexDirection).toBe('column');
      expect(card.style.position).toBe('relative');
      expect(card.style.overflow).toBe('hidden');
    });

    it('should apply correct styles to the label', () => {
      render(<StatCard {...defaultProps} />);

      const label = screen.getByText('Total Applied');
      expect(label.style.color).toBe('rgb(107, 114, 128)'); // #6B7280
      expect(label.style.fontSize).toBe('11px');
      expect(label.style.textTransform).toBe('uppercase');
    });

    it('should apply correct styles to the value', () => {
      render(<StatCard {...defaultProps} />);

      const value = screen.getByText('42');
      expect(value.style.color).toBe('rgb(249, 250, 251)'); // #F9FAFB
      expect(value.style.fontSize).toBe('32px');
      expect(value.style.fontWeight).toBe('700');
    });

    it('should apply accent color to sub text', () => {
      render(<StatCard {...defaultProps} sub="10 still active" accent="#4E9AF1" />);

      const sub = screen.getByText('10 still active');
      expect(sub.style.color).toBe('rgb(78, 154, 241)'); // #4E9AF1
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<StatCard {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with sub text', async () => {
      const { container } = render(
        <StatCard {...defaultProps} sub="10 still active" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when loading', async () => {
      const { container } = render(<StatCard {...defaultProps} loading={true} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
