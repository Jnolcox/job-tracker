/**
 * @file MaxTimePerStageChart.jsx
 * @description Chart showing the maximum time spent in each pipeline stage.
 */

import { FUNNEL_GROUPS, FUNNEL_COLORS } from "../../constants/dashboard";
import { isStatusInGroup } from "../../utils/dataAdapter";
import { timeInStage } from "../../utils/dateHelpers";
import ChartContainer from "./ChartContainer";

/**
 * @component MaxTimePerStageChart
 * @description Displays the longest time any application has spent in each pipeline stage.
 * Shows which company holds the record for each stage. Excludes rejected applications.
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects
 *
 * @example
 * <MaxTimePerStageChart apps={applications} />
 *
 * @returns {JSX.Element} Max time per stage chart component
 */
export default function MaxTimePerStageChart({ apps }) {
  // For each funnel group, find the application that spent the MOST time in current stage.
  const groupMax = {};
  const groupCompany = {};
  const groupHasApps = {};
  FUNNEL_GROUPS.forEach(g => {
    groupMax[g.key] = 0;
    groupCompany[g.key] = null;
    groupHasApps[g.key] = false;
  });

  (apps || []).forEach(a => {
    if (!a || !a.status) return;
    if (isStatusInGroup(a.status, 'REJECTED')) return;  // Skip rejected

    const days = timeInStage(a);  // Use stage duration, not total age
    const group = FUNNEL_GROUPS.find(g => g.statuses.includes(a.status));
    if (group) {
      groupHasApps[group.key] = true;
      if (days > (groupMax[group.key] || 0)) {
        groupMax[group.key] = days;
        groupCompany[group.key] = a.company;
      }
    }
  });

  // Show groups that have apps (excluding REJECTED), even if max days is 0
  const presentGroups = FUNNEL_GROUPS.filter(g => g.key !== 'REJECTED' && groupHasApps[g.key]);
  const maxVal = Math.max(...presentGroups.map(g => groupMax[g.key]), 1);

  return (
    <ChartContainer
      title="Max Days in Stage"
      // subtitle="Longest time in current stage per pipeline group"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {presentGroups.map(g => {
          const days = groupMax[g.key];
          const pct = (days / maxVal) * 100;
          const color = FUNNEL_COLORS[g.key];
          return (
            <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 84,
                color: "#9CA3AF",
                fontSize: 11,
                fontFamily: "'DM Mono',monospace",
                textAlign: "right",
                flexShrink: 0,
              }}>
                {g.label}
              </span>
              <div style={{
                flex: 1,
                height: 20,
                background: "#1F2937",
                borderRadius: 4,
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg,${color}99,${color})`,
                  borderRadius: 4,
                  transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
                }}/>
                {groupCompany[g.key] && (
                  <span style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#ffffff88",
                    fontSize: 9,
                    fontFamily: "'DM Mono',monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    maxWidth: "80%",
                  }}>
                    {groupCompany[g.key]}
                  </span>
                )}
              </div>
              <span style={{
                width: 28,
                color,
                fontSize: 12,
                fontFamily: "'DM Mono',monospace",
                fontWeight: 700,
                textAlign: "right",
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
