/**
 * @file HourBar.jsx
 * @description Bar chart showing application distribution by hour of day.
 */

import { useMemo } from "react";
import { HOURS } from "../../constants/dashboard";
import ChartContainer from "./ChartContainer";

/**
 * @component HourBar
 * @description Displays a vertical bar chart showing how many applications were
 * submitted during each hour of the day (0-23), based on the appliedAt time.
 *
 * Uses pre-computed backend data for time patterns.
 *
 * @param {Object} props - Component props
 * @param {Object} props.timePatterns - Backend time pattern data
 * @param {Object<number, number>} props.timePatterns.byHour - Map of hour (0-23) to count
 * @param {boolean} [props.loading] - Loading state
 *
 * @example
 * <HourBar timePatterns={{ byHour: { 9: 5, 10: 8, 14: 6 } }} />
 *
 * @returns {JSX.Element} Hour bar chart component
 */
export default function HourBar({ timePatterns, loading }) {
  const counts = useMemo(() => {
    const result = HOURS.reduce((a, h) => { a[h] = 0; return a; }, {});

    if (timePatterns?.byHour) {
      Object.entries(timePatterns.byHour).forEach(([hour, count]) => {
        const hourNum = parseInt(hour, 10);
        if (!isNaN(hourNum) && hourNum >= 0 && hourNum < 24) {
          result[hourNum] = count;
        }
      });
    }

    return result;
  }, [timePatterns]);

  const max = Math.max(...Object.values(counts), 1);
  const AM_PM = h => h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
  const labeled = [0, 6, 9, 12, 15, 18, 21, 23];

  return (
    <ChartContainer title="Applications by Hour" loading={loading}>
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
    </ChartContainer>
  );
}
