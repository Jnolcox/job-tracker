/**
 * @file ConfirmDeleteModal.test.jsx
 * @description Tests for the ConfirmDeleteModal component.
 *
 * Tests cover:
 * - Open/close behavior
 * - Type-to-confirm guard on the destructive button
 * - Loading state locking down interactions
 * - Error display
 * - Input reset between openings
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConfirmDeleteModal from './ConfirmDeleteModal';

expect.extend(toHaveNoViolations);

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete All Applications',
    description: 'This permanently removes every application you have tracked.',
    confirmPhrase: 'DELETE ALL',
    itemCount: 42,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Queried by test id rather than label, since the label changes while loading.
  const getConfirmButton = () => screen.getByTestId('confirm-delete-button');
  const getPhraseInput = () => screen.getByLabelText(/type .* to confirm/i);

  it('renders nothing when closed', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the title when open', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByText('Delete All Applications')).toBeInTheDocument();
  });

  it('renders the description when open', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(
      screen.getByText(/permanently removes every application/i)
    ).toBeInTheDocument();
  });

  it('shows the number of items that will be deleted', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('omits the item count when itemCount is not provided', () => {
    render(<ConfirmDeleteModal {...defaultProps} itemCount={undefined} />);

    expect(screen.queryByText(/this action cannot be undone/i)).not.toBeInTheDocument();
  });

  it('disables the confirm button before anything is typed', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(getConfirmButton()).toBeDisabled();
  });

  it('keeps the confirm button disabled when the phrase is wrong', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.change(getPhraseInput(), { target: { value: 'DELETE' } });

    expect(getConfirmButton()).toBeDisabled();
  });

  it('keeps the confirm button disabled when the phrase differs in case', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.change(getPhraseInput(), { target: { value: 'delete all' } });

    expect(getConfirmButton()).toBeDisabled();
  });

  it('enables the confirm button when the phrase matches exactly', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.change(getPhraseInput(), { target: { value: 'DELETE ALL' } });

    expect(getConfirmButton()).toBeEnabled();
  });

  it('calls onConfirm when the enabled confirm button is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.change(getPhraseInput(), { target: { value: 'DELETE ALL' } });
    fireEvent.click(getConfirmButton());

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the cancel button is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId('confirm-delete-backdrop'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on backdrop click while loading', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading />);

    fireEvent.click(screen.getByTestId('confirm-delete-backdrop'));

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('disables the confirm button while loading even with a matching phrase', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading />);

    fireEvent.change(getPhraseInput(), { target: { value: 'DELETE ALL' } });

    expect(getConfirmButton()).toBeDisabled();
  });

  it('disables the phrase input while loading', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading />);

    expect(getPhraseInput()).toBeDisabled();
  });

  it('shows a deleting label on the confirm button while loading', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading />);

    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
  });

  it('displays the error message when one is provided', () => {
    render(<ConfirmDeleteModal {...defaultProps} error="Server unavailable" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
  });

  it('does not render an alert when there is no error', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the typed phrase when the modal closes and reopens', () => {
    const { rerender } = render(<ConfirmDeleteModal {...defaultProps} />);
    fireEvent.change(getPhraseInput(), { target: { value: 'DELETE ALL' } });

    rerender(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    rerender(<ConfirmDeleteModal {...defaultProps} isOpen />);

    expect(getPhraseInput()).toHaveValue('');
  });

  it('re-guards the confirm button after reopening', () => {
    const { rerender } = render(<ConfirmDeleteModal {...defaultProps} />);
    fireEvent.change(getPhraseInput(), { target: { value: 'DELETE ALL' } });

    rerender(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    rerender(<ConfirmDeleteModal {...defaultProps} isOpen />);

    expect(getConfirmButton()).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
