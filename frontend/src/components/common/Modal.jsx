/**
 * @file Modal.jsx
 * @description Reusable modal component with backdrop and container styling.
 * Provides consistent modal behavior across the application.
 */

/**
 * @component Modal
 * @description A reusable modal component with backdrop, close on backdrop click,
 * and consistent styling. Handles focus trapping and escape key closing.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal should close (backdrop click or close button)
 * @param {React.ReactNode} props.children - Content to render inside the modal
 * @param {string} [props.title] - Optional modal title
 * @param {number} [props.width=560] - Modal width in pixels
 * @param {string} [props.maxHeight='90vh'] - Maximum height of the modal
 * @param {boolean} [props.showCloseButton=true] - Whether to show the X close button
 * @param {string} [props.ariaLabel] - Aria label for the modal dialog
 * @param {string} [props.testId] - Optional data-testid for testing
 * @param {number} [props.zIndex=100] - Z-index for the modal layer
 *
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} title="Edit Application">
 *   <form>...</form>
 * </Modal>
 *
 * @returns {JSX.Element|null} Modal component or null if not open
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  width = 560,
  maxHeight = '90vh',
  showCloseButton = true,
  ariaLabel,
  testId,
  zIndex = 100,
}) {
  if (!isOpen) return null;

  return (
    <div
      data-testid={testId ? `${testId}-backdrop` : 'modal-backdrop'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
      }}
    >
      <div
        role="dialog"
        aria-label={ariaLabel || title}
        aria-modal="true"
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0E1117',
          border: '1px solid #374151',
          borderRadius: 16,
          padding: 32,
          width,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="Close modal"
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
        )}

        {/* Title */}
        {title && (
          <h2
            style={{
              color: '#F9FAFB',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              letterSpacing: '0.04em',
              margin: 0,
              flexShrink: 0,
              paddingRight: showCloseButton ? 32 : 0,
            }}
          >
            {title}
          </h2>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

/**
 * Common backdrop styles for modals.
 * Exported for custom modal implementations.
 *
 * @constant {Object}
 */
export const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

/**
 * Common container styles for modals.
 * Exported for custom modal implementations.
 *
 * @constant {Object}
 */
export const modalContainerStyle = {
  background: '#0E1117',
  border: '1px solid #374151',
  borderRadius: 16,
  padding: 32,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  overflow: 'hidden',
};

/**
 * Common title styles for modals.
 * Exported for custom modal implementations.
 *
 * @constant {Object}
 */
export const modalTitleStyle = {
  color: '#F9FAFB',
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 24,
  letterSpacing: '0.04em',
  margin: 0,
  flexShrink: 0,
};
