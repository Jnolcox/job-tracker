/**
 * @file TimeInStageChart.jsx
 * @description Chart showing time applications have spent in their current status.
 */

import { isTerminalStatus } from "../../utils/dataAdapter";
import { timeInStage } from "../../utils/dateHelpers";
import ChartContainer from "./ChartContainer";

/**
 * @component TimeInStageChart
 * @description Displays a horizontal bar chart showing how long each active application
 * has been in its current status. Only shows non-terminal applications (excludes rejected,
 * withdrawn, etc.). Bars are color-coded by urgency (green < 3 days, yellow 3-7 days, red > 7 days).
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects
 *
 * @example
 * <TimeInStageChart apps={applications} />
 *
 * @returns {JSX.Element} Time in stage chart component
 */
export default function TimeInStageChart({ apps }) {
  // Filter to active (non-terminal) applications
  const active = (apps || []).filter(a => a && !isTerminalStatus(a.status));
  const sorted = [...active].sort((a, b) => timeInStage(b) - timeInStage(a)).slice(0, 8);
  const max = Math.max(...sorted.map(a => timeInStage(a)), 1);

  return (
    <ChartContainer title="Time in Current Status (days)">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map(a => {
          const days = timeInStage(a);
          const pct = (days / max) * 100;
          const color = days > 7 ? "#F87171" : days > 3 ? "#F59E0B" : "#34D399";
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 90,
                color: "#D1D5DB",
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {a.company}
              </span>
              <div style={{
                flex: 1,
                height: 18,
                background: "#1F2937",
                borderRadius: 4,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 4,
                  transition: "width 0.6s",
                }}/>
              </div>
              <span style={{
                width: 22,
                color,
                fontSize: 12,
                fontFamily: "'DM Mono',monospace",
                fontWeight: 700,
              }}>
                {days}d
              </span>
            </div>
          );
        })}
      </div>
    </ChartContainer>
  );
}
