/**
 * @file HourBar.jsx
 * @description Bar chart showing application distribution by hour of day.
 */

import { HOURS } from "../../constants/dashboard";

/**
 * @component HourBar
 * @description Displays a vertical bar chart showing how many applications were
 * submitted during each hour of the day (0-23), based on the appliedAt time.
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects with appliedAt property
 *
 * @example
 * <HourBar apps={applications} />
 *
 * @returns {JSX.Element} Hour bar chart component
 */
export default function HourBar({ apps }) {
  const counts = HOURS.reduce((a, h) => { a[h] = 0; return a; }, {});
  (apps || []).forEach(a => {
    if (!a || !a.appliedAt) return;
    const dt = new Date(a.appliedAt);
    if (isNaN(dt.getTime())) return;
    const h = dt.getHours();
    counts[h]++;
  });
  const max = Math.max(...Object.values(counts), 1);
  const AM_PM = h => h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
  const labeled = [0, 6, 9, 12, 15, 18, 21, 23];

  return (
    <div style={{
      background: "#0E1117",
      border: "1px solid #1F2937",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <h3 style={{
        color: "#9CA3AF",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono',monospace",
        marginBottom: 16,
      }}>
        Applications by Hour
      </h3>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 72 }}>
        {HOURS.map(h => {
          const v = counts[h];
          const ht = Math.max((v / max) * 56, v > 0 ? 3 : 0);
          return (
            <div key={h} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}>
              <div style={{
                width: "100%",
                height: ht,
                background: "linear-gradient(to top,#0EA5E9,#38BDF8)",
                borderRadius: "2px 2px 0 0",
                transition: "height 0.6s",
              }}/>
              <span style={{
                color: labeled.includes(h) ? "#6B7280" : "transparent",
                fontSize: 8,
                fontFamily: "'DM Mono',monospace",
                transform: "rotate(-45deg)",
                transformOrigin: "top left",
                display: "block",
                width: 16,
                marginTop: 8,
              }}>
                {AM_PM(h)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
