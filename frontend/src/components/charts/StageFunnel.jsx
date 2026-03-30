/**
 * @file StageFunnel.jsx
 * @description Pipeline funnel chart showing application distribution across stages.
 */

import { FUNNEL_GROUPS, FUNNEL_COLORS } from "../../constants/dashboard";

/**
 * @component StageFunnel
 * @description Displays a horizontal bar chart showing the count of applications
 * in each pipeline stage (Applied, Recruiter, Technical, etc.).
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects with status property
 *
 * @example
 * <StageFunnel apps={applications} />
 *
 * @returns {JSX.Element} Funnel chart component
 */
export default function StageFunnel({ apps }) {
  // Count apps by funnel group
  const counts = {};
  FUNNEL_GROUPS.forEach(g => { counts[g.key] = 0; });
  (apps || []).forEach(a => {
    if (!a || !a.status) return;
    const group = FUNNEL_GROUPS.find(g => g.statuses.includes(a.status));
    if (group) counts[group.key]++;
  });
  const max = Math.max(...Object.values(counts), 1);

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
        Pipeline Funnel
      </h3>
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
    </div>
  );
}
