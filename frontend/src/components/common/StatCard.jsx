/**
 * @file StatCard.jsx
 * @description A styled card component for displaying statistics with an accent color.
 */

/**
 * @component StatCard
 * @description Displays a statistic with a label, value, optional subtitle, and accent color.
 * Features a gradient top border that matches the accent color.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Label text displayed at the top (uppercase)
 * @param {string|number} props.value - Main statistic value displayed prominently
 * @param {string} [props.sub] - Optional subtitle text displayed below the value
 * @param {string} props.accent - Accent color (hex) used for border gradient and subtitle
 *
 * @example
 * <StatCard
 *   label="Total Applied"
 *   value={42}
 *   sub="10 still active"
 *   accent="#4E9AF1"
 * />
 *
 * @returns {JSX.Element} Styled stat card component
 */
export default function StatCard({ label, value, sub, accent }) {
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
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg,${accent},transparent)`,
      }}/>
      <span style={{
        color: "#6B7280",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono',monospace",
      }}>
        {label}
      </span>
      <span style={{
        color: "#F9FAFB",
        fontSize: 32,
        fontWeight: 700,
        fontFamily: "'Bebas Neue',sans-serif",
        letterSpacing: "0.04em",
      }}>
        {value}
      </span>
      {sub && (
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
