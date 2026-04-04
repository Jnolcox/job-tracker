/**
 * @file ChartContainer.jsx
 * @description Reusable container component for chart visualizations.
 * Provides consistent styling for chart backgrounds, borders, and titles.
 */

/**
 * @component ChartContainer
 * @description A standardized container wrapper for chart components.
 * Provides consistent background, border, padding, and optional title styling.
 *
 * @param {Object} props - Component props
 * @param {string} [props.title] - Optional chart title (uppercase, small text)
 * @param {string} [props.subtitle] - Optional subtitle under the title
 * @param {React.ReactNode} props.children - Chart content to render inside the container
 * @param {React.ReactNode} [props.headerRight] - Optional content to render on the right side of the header
 * @param {string} [props.testId] - Optional data-testid for testing
 * @param {Object} [props.style] - Optional additional inline styles to merge
 *
 * @example
 * <ChartContainer title="Pipeline Funnel">
 *   <FunnelChart data={data} />
 * </ChartContainer>
 *
 * @example
 * <ChartContainer
 *   title="Avg. Time Per Stage"
 *   subtitle="Longest time in current stage"
 *   headerRight={<span>Legend here</span>}
 * >
 *   <BarChart data={data} />
 * </ChartContainer>
 *
 * @returns {JSX.Element} Chart container component
 */
export default function ChartContainer({
  title,
  subtitle,
  children,
  headerRight,
  testId,
  style,
}) {
  return (
    <div
      data-testid={testId}
      style={{
        background: '#0E1117',
        border: '1px solid #1F2937',
        borderRadius: 12,
        padding: '20px 24px',
        ...style,
      }}
    >
      {/* Header with title and optional right content */}
      {(title || headerRight) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: subtitle ? 4 : 16,
          }}
        >
          {title && (
            <h3
              style={{
                color: '#9CA3AF',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: "'DM Mono',monospace",
                margin: 0,
              }}
            >
              {title}
            </h3>
          )}
          {headerRight}
        </div>
      )}

      {/* Optional subtitle */}
      {subtitle && (
        <p
          style={{
            color: '#4B5563',
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Chart content */}
      {children}
    </div>
  );
}

/**
 * Common chart title styles for components that don't use ChartContainer.
 * Exported for use in custom chart layouts.
 *
 * @constant {Object}
 */
export const chartTitleStyle = {
  color: '#9CA3AF',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontFamily: "'DM Mono',monospace",
  marginBottom: 16,
  margin: 0,
};

/**
 * Common chart subtitle styles.
 *
 * @constant {Object}
 */
export const chartSubtitleStyle = {
  color: '#4B5563',
  fontSize: 10,
  fontFamily: "'DM Mono',monospace",
  marginBottom: 16,
  marginTop: 0,
};

/**
 * Common container styles for charts.
 *
 * @constant {Object}
 */
export const chartContainerStyle = {
  background: '#0E1117',
  border: '1px solid #1F2937',
  borderRadius: 12,
  padding: '20px 24px',
};
