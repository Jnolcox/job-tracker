/**
 * @file SalaryRangeChart.jsx
 * @description SVG chart showing salary range distribution across active applications.
 */

import { isStatusInGroup } from "../../utils/dataAdapter";

/**
 * @component SalaryRangeChart
 * @description Displays salary range distribution as an area chart with min/max bands.
 * Shows only active applications (excludes rejected/withdrawn). Includes average line.
 *
 * @param {Object} props - Component props
 * @param {Array} props.apps - Array of application objects with salaryMin/salaryMax
 *
 * @example
 * <SalaryRangeChart apps={applications} />
 *
 * @returns {JSX.Element} Salary range chart component
 */
export default function SalaryRangeChart({ apps }) {
  // Filter active apps with salary data (exclude rejected/withdrawn statuses)
  const activeWithSalary = (apps || [])
    .filter(a => a && !isStatusInGroup(a.status, 'REJECTED') && !isStatusInGroup(a.status, 'WITHDRAWN') && (a.salaryMin || a.salaryMax))
    .sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));

  if (activeWithSalary.length === 0) {
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
          Salary Range Distribution
        </h3>
        <p style={{
          color: "#4B5563",
          fontSize: 11,
          fontFamily: "'DM Mono',monospace",
          textAlign: "center",
          padding: 40,
        }}>
          No active applications with salary data
        </p>
      </div>
    );
  }

  // Calculate stats
  const allMins = activeWithSalary.map(a => a.salaryMin || a.salaryMax || 0);
  const allMaxs = activeWithSalary.map(a => a.salaryMax || a.salaryMin || 0);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const range = globalMax - globalMin || 1;

  // Calculate average
  const avgMin = allMins.reduce((s, v) => s + v, 0) / allMins.length;
  const avgMax = allMaxs.reduce((s, v) => s + v, 0) / allMaxs.length;
  const avgMid = (avgMin + avgMax) / 2;

  const formatSalary = (val) => {
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val}`;
  };

  const chartHeight = 200;
  const padding = 5;

  // Calculate coordinates with padding
  const getX = (i) => padding + (i / Math.max(activeWithSalary.length - 1, 1)) * (100 - 2 * padding);
  const getY = (val) => padding + ((globalMax - val) / range) * (100 - 2 * padding);

  // Generate smooth curve path using cubic bezier
  const smoothPath = (points) => {
    if (points.length < 2) return `M ${points[0]?.x || 0},${points[0]?.y || 0}`;

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      // Calculate control points using Catmull-Rom to Bezier conversion
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  // Get points for max and min lines
  const maxPoints = activeWithSalary.map((a, i) => ({
    x: getX(i),
    y: getY(a.salaryMax || a.salaryMin || 0)
  }));
  const minPoints = activeWithSalary.map((a, i) => ({
    x: getX(i),
    y: getY(a.salaryMin || a.salaryMax || 0)
  }));

  // Create smooth paths
  const maxPath = smoothPath(maxPoints);
  const minPath = smoothPath(minPoints);

  // Create filled area path (max path forward, min path backward)
  const minPointsReversed = [...minPoints].reverse();
  const fillPath = maxPath + ` L ${minPointsReversed[0].x},${minPointsReversed[0].y}` +
    smoothPath(minPointsReversed).substring(smoothPath(minPointsReversed).indexOf(' ')) + ' Z';

  const avgY = getY(avgMid);

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
        marginBottom: 4,
      }}>
        Salary Range Distribution
      </h3>
      <p style={{
        color: "#4B5563",
        fontSize: 10,
        fontFamily: "'DM Mono',monospace",
        marginBottom: 16,
      }}>
        Min/Max spread for {activeWithSalary.length} active applications
      </p>

      {/* Chart container */}
      <div style={{ position: "relative", height: chartHeight, marginBottom: 8 }}>
        {/* Y-axis labels */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 50,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <span style={{ color: "#6B7280", fontSize: 9, fontFamily: "'DM Mono',monospace" }}>
            {formatSalary(globalMax)}
          </span>
          <span style={{ color: "#F59E0B", fontSize: 9, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
            {formatSalary(avgMid)}
          </span>
          <span style={{ color: "#6B7280", fontSize: 9, fontFamily: "'DM Mono',monospace" }}>
            {formatSalary(globalMin)}
          </span>
        </div>

        {/* Chart area */}
        <div style={{
          position: "absolute",
          left: 55,
          right: 0,
          top: 0,
          bottom: 0,
          background: "#111827",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          {/* Grid lines */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "0 8px",
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ borderBottom: "1px solid #1F2937", width: "100%" }}/>
            ))}
          </div>

          {/* SVG for the range area and average line */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          >
            {/* Range polygon (filled area between min and max) */}
            <defs>
              <linearGradient id="salaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#4E9AF1" stopOpacity="0.5"/>
              </linearGradient>
            </defs>
            {/* Filled area between curves */}
            <path
              fill="url(#salaryGradient)"
              stroke="none"
              d={fillPath}
            />

            {/* Max line (smooth) */}
            <path
              fill="none"
              stroke="#A78BFA"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              d={maxPath}
            />

            {/* Min line (smooth) */}
            <path
              fill="none"
              stroke="#4E9AF1"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              d={minPath}
            />

            {/* Average line */}
            <line
              x1="0"
              y1={avgY}
              x2="100"
              y2={avgY}
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
