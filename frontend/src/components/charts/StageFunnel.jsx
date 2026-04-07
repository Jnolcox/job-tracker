/**
 * @file StageFunnel.jsx
 * @description Pipeline funnel chart showing application distribution across stages.
 */

import { useMemo } from "react";
import { FUNNEL_GROUPS, FUNNEL_COLORS } from "../../constants/dashboard";
import ChartContainer from "./ChartContainer";

/**
 * @component StageFunnel
 * @description Displays a horizontal bar chart showing the count of applications
 * in each pipeline stage (Applied, Recruiter, Technical, etc.).
 *
 * Uses pre-computed backend data for counts by status.
 *
 * @param {Object} props - Component props
 * @param {Object<string, number>} props.countsByStatus - Backend counts per status
 * @param {boolean} [props.loading] - Loading state
 *
 * @example
 * <StageFunnel countsByStatus={{ APPLIED: 20, RECRUITER_SCREEN: 10 }} />
 *
 * @returns {JSX.Element} Funnel chart component
 */
export default function StageFunnel({ countsByStatus, loading }) {
  // Compute funnel group counts from backend status counts
  const counts = useMemo(() => {
    const result = {};
    FUNNEL_GROUPS.forEach(g => { result[g.key] = 0; });

    if (countsByStatus) {
      FUNNEL_GROUPS.forEach(group => {
        group.statuses.forEach(status => {
          if (countsByStatus[status]) {
            result[group.key] += countsByStatus[status];
          }
        });
      });
    }

    return result;
  }, [countsByStatus]);

  const max = Math.max(...Object.values(counts), 1);

  return (
    <ChartContainer title="Pipeline Funnel" loading={loading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {FUNNEL_GROUPS.map(g => (
          <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 80,
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
            }}>
              <div style={{
                width: `${(counts[g.key] / max) * 100}%`,
                height: "100%",
                background: FUNNEL_COLORS[g.key],
                borderRadius: 4,
                transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                minWidth: counts[g.key] > 0 ? 2 : 0,
              }}/>
            </div>
            <span style={{
              width: 18,
              color: FUNNEL_COLORS[g.key],
              fontSize: 12,
              fontFamily: "'DM Mono',monospace",
              fontWeight: 700,
            }}>
              {counts[g.key]}
            </span>
          </div>
        ))}
      </div>
    </ChartContainer>
  );
}
