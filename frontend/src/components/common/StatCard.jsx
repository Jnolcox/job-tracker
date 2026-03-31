/**
 * @file StatCard.jsx
 * @description A styled card component for displaying statistics with an accent color
 * and optional loading state with shimmer animation.
 */

/**
 * @component StatCard
 * @description Displays a statistic with a label, value, optional subtitle, and accent color.
 * Features a gradient top border that matches the accent color and supports a loading
 * state that shows shimmer animation placeholders.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Label text displayed at the top (uppercase)
 * @param {string|number} props.value - Main statistic value displayed prominently
 * @param {string} [props.sub] - Optional subtitle text displayed below the value
 * @param {string} props.accent - Accent color (hex) used for border gradient and subtitle
 * @param {boolean} [props.loading=false] - When true, shows shimmer placeholders instead of value/sub
 *
 * @example
 * // Normal state
 * <StatCard
 *   label="Total Applied"
 *   value={42}
 *   sub="10 still active"
 *   accent="#4E9AF1"
 * />
 *
 * @example
 * // Loading state with shimmer animation
 * <StatCard
 *   label="Total Applied"
 *   value={42}
 *   sub="10 still active"
 *   accent="#4E9AF1"
 *   loading={true}
 * />
 *
 * @returns {JSX.Element} Styled stat card component
 */
export default function StatCard({ label, value, sub, accent, loading = false }) {
  return (
    <div style={{
      background: "#0E1117",
      border: `1px solid ${accent}33`,
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Shimmer keyframes - only injected when loading */}
      {loading && (
        <style>{`
          @keyframes statCardShimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
        `}</style>
      )}

      {/* Top accent bar */}
      <div
        data-testid="accent-bar"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg,${accent},transparent)`,
        }}
      />

      {/* Label (always visible) */}
      <span style={{
        color: "#6B7280",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono',monospace",
      }}>
        {label}
      </span>

      {/* Value - show shimmer when loading */}
      {loading ? (
        <div
          data-testid="shimmer-value"
          style={{
            width: 60,
            height: 32,
            background: 'linear-gradient(90deg, #1F2937 0%, #374151 50%, #1F2937 100%)',
            backgroundSize: '400px 100%',
            animation: 'statCardShimmer 1.5s infinite linear',
            borderRadius: 4,
          }}
        />
      ) : (
        <span style={{
          color: "#F9FAFB",
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "'Bebas Neue',sans-serif",
          letterSpacing: "0.04em",
        }}>
          {value}
        </span>
      )}

      {/* Sub text - show shimmer when loading */}
      {loading ? (
        <div
          data-testid="shimmer-sub"
          style={{
            width: 80,
            height: 12,
            background: 'linear-gradient(90deg, #1F2937 0%, #374151 50%, #1F2937 100%)',
            backgroundSize: '400px 100%',
            animation: 'statCardShimmer 1.5s infinite linear',
            animationDelay: '0.2s',
            borderRadius: 3,
          }}
        />
      ) : sub && (
        <span style={{
          color: accent,
          fontSize: 12,
          fontFamily: "'DM Mono',monospace",
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}
