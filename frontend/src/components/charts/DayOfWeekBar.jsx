/**
 * @file DayOfWeekBar.jsx
 * @description Bar chart showing application distribution by day of week.
 */

import { DAYS, getDayIndex } from "../../constants/dashboard";
import ChartContainer from "./ChartContainer";

/**
 * @component DayOfWeekBar
 * @description Displays a vertical bar chart showing how many applications were
 * submitted on each day of the week, based on the appliedAt date.
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects with appliedAt property
 *
 * @example
 * <DayOfWeekBar apps={applications} />
 *
 * @returns {JSX.Element} Day of week bar chart component
 */
export default function DayOfWeekBar({ apps }) {
  const counts = DAYS.reduce((a, d) => { a[d] = 0; return a; }, {});
  (apps || []).forEach(a => {
    if (!a || !a.appliedAt) return;
    const dt = new Date(a.appliedAt);
    if (isNaN(dt.getTime())) return;
    // Use getDayIndex to convert from JS getDay() (0=Sunday) to DAYS index (0=Monday)
    const d = DAYS[getDayIndex(dt.getDay())];
    counts[d]++;
  });
  const max = Math.max(...Object.values(counts), 1);

  return (
    <ChartContainer title="Applications by Day of Week">
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
        {DAYS.map(d => {
          const v = counts[d];
          const h = Math.max((v / max) * 64, v > 0 ? 4 : 0);
          return (
            <div key={d} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
              <span style={{
                color: "#A78BFA",
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
              }}>
                {v || ""}
              </span>
              <div style={{
                width: "100%",
                height: h,
                background: "linear-gradient(to top,#7C3AED,#A78BFA)",
                borderRadius: "3px 3px 0 0",
                transition: "height 0.6s",
              }}/>
              <span style={{
                color: "#6B7280",
                fontSize: 10,
                fontFamily: "'DM Mono',monospace",
              }}>
                {d}
              </span>
            </div>
          );
        })}
      </div>
    </ChartContainer>
  );
}
