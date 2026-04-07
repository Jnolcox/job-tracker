/**
 * @file SalaryRangeChart.jsx
 * @description SVG chart showing salary range distribution across active applications.
 */

import { useMemo } from "react";
import ChartContainer from "./ChartContainer";

/**
 * @component SalaryRangeChart
 * @description Displays salary range distribution as a chart with min/max bands.
 * Shows only active applications (excludes rejected/withdrawn). Includes average line.
 *
 * Uses pre-computed backend data for salary analytics.
 *
 * @param {Object} props - Component props
 * @param {Object} props.salaryDistribution - Backend salary analytics
 * @param {number} props.salaryDistribution.globalMin - Minimum salary
 * @param {number} props.salaryDistribution.globalMax - Maximum salary
 * @param {number} props.salaryDistribution.avgMin - Average minimum salary
 * @param {number} props.salaryDistribution.avgMax - Average maximum salary
 * @param {number} props.salaryDistribution.avgMid - Average midpoint
 * @param {number} props.salaryDistribution.activeAppsWithSalary - Count of apps with salary
 * @param {boolean} [props.loading] - Loading state
 *
 * @example
 * <SalaryRangeChart salaryDistribution={{ globalMin: 80000, globalMax: 200000, avgMid: 140000 }} />
 *
 * @returns {JSX.Element} Salary range chart component
 */
export default function SalaryRangeChart({ salaryDistribution, loading }) {
  // Compute salary data from backend
  const salaryData = useMemo(() => {
    if (!salaryDistribution) {
      return null;
    }

    return {
      globalMin: salaryDistribution.globalMin || 0,
      globalMax: salaryDistribution.globalMax || 0,
      avgMin: salaryDistribution.avgMin || 0,
      avgMax: salaryDistribution.avgMax || 0,
      avgMid: salaryDistribution.avgMid || 0,
      count: salaryDistribution.activeAppsWithSalary || 0,
    };
  }, [salaryDistribution]);

  if (!salaryData || salaryData.count === 0) {
    return (
      <ChartContainer title="Salary Range Distribution" loading={loading}>
        <p style={{
          color: "#4B5563",
          fontSize: 11,
          fontFamily: "'DM Mono',monospace",
          textAlign: "center",
          padding: 40,
          margin: 0,
        }}>
          No active applications with salary data
        </p>
      </ChartContainer>
    );
  }

  const { globalMin, globalMax, avgMid, count } = salaryData;
  const range = globalMax - globalMin || 1;

  const formatSalary = (val) => {
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val}`;
  };

  const chartHeight = 200;
  const padding = 5;

  // Calculate Y coordinate for a value
  const getY = (val) => padding + ((globalMax - val) / range) * (100 - 2 * padding);
  const avgY = getY(avgMid);
  return (
    <ChartContainer
      title="Salary Range Distribution"
      subtitle={`${count} active applications with salary data`}
      loading={loading}
    >
      <div style={{ position: "relative", height: chartHeight, marginBottom: 8 }}>
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

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="salaryGradientSimple" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#4E9AF1" stopOpacity="0.5"/>
              </linearGradient>
            </defs>
            {/* Show range as a filled rectangle */}
            <rect
              x="10"
              y={getY(salaryData.avgMax)}
              width="80"
              height={getY(salaryData.avgMin) - getY(salaryData.avgMax)}
              fill="url(#salaryGradientSimple)"
              rx="4"
            />
            {/* Max line */}
            <line x1="10" y1={getY(salaryData.avgMax)} x2="90" y2={getY(salaryData.avgMax)} stroke="#A78BFA" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {/* Min line */}
            <line x1="10" y1={getY(salaryData.avgMin)} x2="90" y2={getY(salaryData.avgMin)} stroke="#4E9AF1" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {/* Average line */}
            <line x1="0" y1={avgY} x2="100" y2={avgY} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,3" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
    </ChartContainer>
  );
}
