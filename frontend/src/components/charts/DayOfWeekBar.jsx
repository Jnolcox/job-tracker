/**
 * @file DayOfWeekBar.jsx
 * @description Bar chart showing application distribution by day of week.
 */

import { useMemo } from "react";
import { DAYS } from "../../constants/dashboard";
import ChartContainer from "./ChartContainer";
import { CHART_COLORS } from "../../constants/colors";

/**
 * Map from full day names (backend) to DAYS array index.
 * Defined outside component to avoid recreation on each render.
 * @constant {Object<string, number>}
 */
const DAY_NAME_TO_INDEX = {
  'MONDAY': 0,    // DAYS[0] = 'Mon'
  'TUESDAY': 1,   // DAYS[1] = 'Tue'
  'WEDNESDAY': 2, // DAYS[2] = 'Wed'
  'THURSDAY': 3,  // DAYS[3] = 'Thu'
  'FRIDAY': 4,    // DAYS[4] = 'Fri'
  'SATURDAY': 5,  // DAYS[5] = 'Sat'
  'SUNDAY': 6,    // DAYS[6] = 'Sun'
};

/**
 * @component DayOfWeekBar
 * @description Displays a vertical bar chart showing how many applications were
 * submitted on each day of the week, based on the appliedAt date.
 *
 * Uses pre-computed backend data for time patterns.
 *
 * @param {Object} props - Component props
 * @param {Object} props.timePatterns - Backend time pattern data
 * @param {Object<string, number>} props.timePatterns.byDayOfWeek - Map of day name to count
 * @param {boolean} [props.loading] - Loading state
 *
 * @example
 * <DayOfWeekBar timePatterns={{ byDayOfWeek: { Monday: 10, Tuesday: 8 } }} />
 *
 * @returns {JSX.Element} Day of week bar chart component
 */
export default function DayOfWeekBar({ timePatterns, loading }) {
  const counts = useMemo(() => {
    const result = DAYS.reduce((a, d) => { a[d] = 0; return a; }, {});

    if (timePatterns?.byDayOfWeek) {
      Object.entries(timePatterns.byDayOfWeek).forEach(([dayName, count]) => {
        const index = DAY_NAME_TO_INDEX[dayName];
        if (index !== undefined) {
          result[DAYS[index]] = count;
        }
      });
    }

    return result;
  }, [timePatterns]);

  const max = Math.max(...Object.values(counts), 1);

  return (
    <ChartContainer title="Applications by Day of Week" loading={loading}>
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
                {/* {v || ""} */}
              </span>
              <div style={{
                width: "100%",
                height: h,
                background: `linear-gradient(to top, ${CHART_COLORS.ACCENT_VIOLET}, ${CHART_COLORS.ACCENT_PURPLE})`,
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
