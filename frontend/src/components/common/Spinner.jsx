/**
 * @file Spinner.jsx
 * @description Reusable loading spinner component with size variants.
 * Used throughout the application for consistent loading indicators.
 */

/**
 * Spinner size configurations.
 * Each size defines width/height and border width.
 *
 * @constant {Object<string, {size: number, borderWidth: number}>}
 */
const SPINNER_SIZES = {
  sm: { size: 14, borderWidth: 2 },
  md: { size: 20, borderWidth: 2 },
  lg: { size: 32, borderWidth: 3 },
};

/**
 * @component Spinner
 * @description A loading spinner component with configurable size and color.
 * Uses CSS animation for smooth spinning effect.
 *
 * @param {Object} props - Component props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Spinner size variant
 * @param {string} [props.color='#4E9AF1'] - Spinner active color (top border)
 * @param {string} [props.trackColor='#1F2937'] - Spinner track color (other borders)
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Additional inline styles
 *
 * @example
 * // Default medium spinner
 * <Spinner />
 *
 * @example
 * // Small spinner with custom color
 * <Spinner size="sm" color="#10B981" />
 *
 * @example
 * // Large spinner
 * <Spinner size="lg" />
 *
 * @returns {JSX.Element} Spinner component
 */
export default function Spinner({
  size = 'md',
  color = '#4E9AF1',
  trackColor = '#1F2937',
  className,
  style,
}) {
  const config = SPINNER_SIZES[size] || SPINNER_SIZES.md;

  return (
    <>
      <div
        className={className}
        role="status"
        aria-label="Loading"
        style={{
          width: config.size,
          height: config.size,
          border: `${config.borderWidth}px solid ${trackColor}`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spinner-spin 1s linear infinite',
          ...style,
        }}
      />
      <style>{`
        @keyframes spinner-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

/**
 * @component SpinnerWithLabel
 * @description Spinner with an accompanying text label.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Text label to display
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Spinner size variant
 * @param {string} [props.color='#4E9AF1'] - Spinner active color
 * @param {string} [props.labelColor='#6B7280'] - Label text color
 *
 * @example
 * <SpinnerWithLabel label="Loading data..." />
 *
 * @returns {JSX.Element} Spinner with label component
 */
export function SpinnerWithLabel({
  label,
  size = 'md',
  color = '#4E9AF1',
  labelColor = '#6B7280',
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: labelColor,
        fontSize: 12,
        fontFamily: "'DM Mono',monospace",
      }}
    >
      <Spinner size={size} color={color} />
      {label}
    </div>
  );
}

/**
 * Spinner inline styles for use without the component.
 * Useful for one-off spinners in existing code.
 *
 * @param {'sm' | 'md' | 'lg'} size - Spinner size
 * @param {string} color - Active spinner color
 * @param {string} trackColor - Track/background color
 * @returns {Object} Inline style object for spinner div
 */
export function getSpinnerStyle(size = 'md', color = '#4E9AF1', trackColor = '#1F2937') {
  const config = SPINNER_SIZES[size] || SPINNER_SIZES.md;
  return {
    width: config.size,
    height: config.size,
    border: `${config.borderWidth}px solid ${trackColor}`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };
}

/**
 * CSS keyframes for spinner animation.
 * Include this once in your app if using getSpinnerStyle.
 */
export const spinnerKeyframes = `@keyframes spin { to { transform: rotate(360deg); }}`;
