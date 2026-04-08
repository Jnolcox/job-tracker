/**
 * @file SalaryRangeChart.jsx
 * @description Scatter plot of salary ranges: X = salaryMin, Y = salaryMax, one dot per application.
 */

import { useMemo } from "react";
import ChartContainer from "./ChartContainer";

// SVG coordinate space
const VB_W = 320;
const VB_H = 260;
const PAD = { top: 12, right: 12, bottom: 32, left: 46 };
const CW = VB_W - PAD.left - PAD.right; // chart width  (262)
const CH = VB_H - PAD.top - PAD.bottom; // chart height (216)

const TICK_COUNT = 5;

const formatSalary = (val) => {
  if (val == null) return "";
  if (val >= 1000) return `$${Math.round(val / 1000)}k`;
  return `$${val}`;
};

const niceTicks = (min, max, count) => {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
};

/**
 * @component SalaryRangeChart
 * @description Scatter plot where each application with both salaryMin and salaryMax is plotted
 * as a dot. X-axis = Min salary, Y-axis = Max salary. Dashed crosshairs mark the averages.
 *
 * @param {Object}  props.salaryDistribution
 * @param {Array}   props.salaryDistribution.entries     [{company, salaryMin, salaryMax}]
 * @param {number}  props.salaryDistribution.avgMin      average salaryMin (vertical crosshair)
 * @param {number}  props.salaryDistribution.avgMax      average salaryMax (horizontal crosshair)
 * @param {number}  props.salaryDistribution.activeAppsWithSalary
 * @param {boolean} [props.loading]
 */
export default function SalaryRangeChart({ salaryDistribution, loading }) {
  const data = useMemo(() => {
    const entries = salaryDistribution?.entries;
    if (!entries?.length) return null;

    const xVals = entries.map((e) => e.salaryMin);
    const yVals = entries.map((e) => e.salaryMax);

    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    // Add 5% padding to each axis so dots aren't clipped at the edges
    const xPad = (xMax - xMin) * 0.05 || 1;
    const yPad = (yMax - yMin) * 0.05 || 1;

    return {
      entries,
      xMin: xMin - xPad,
      xMax: xMax + xPad,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
      avgMin: salaryDistribution.avgMin,
      avgMax: salaryDistribution.avgMax,
      count: salaryDistribution.activeAppsWithSalary,
    };
  }, [salaryDistribution]);

  if (!data) {
    return (
      <ChartContainer title="Salary Range Distribution" loading={loading}>
        <p style={{ color: "#4B5563", fontSize: 11, fontFamily: "'DM Mono',monospace", textAlign: "center", padding: 40, margin: 0 }}>
          No applications with salary data
        </p>
      </ChartContainer>
    );
  }

  const { entries, xMin, xMax, yMin, yMax, avgMin, avgMax } = data;
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const sx = (val) => PAD.left + ((val - xMin) / xRange) * CW;
  const sy = (val) => PAD.top + CH - ((val - yMin) / yRange) * CH;

  const xTicks = niceTicks(xMin, xMax, TICK_COUNT);
  const yTicks = niceTicks(yMin, yMax, TICK_COUNT);

  return (
    <ChartContainer
      title="Salary Range Distribution"
      // subtitle={`${count} application${count !== 1 ? "s" : ""} — min salary (x) vs max salary (y)`}
      loading={loading}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <line key={`gy${i}`}
            x1={PAD.left} y1={sy(v)}
            x2={PAD.left + CW} y2={sy(v)}
            stroke="#1F2937" strokeWidth="0.5"
          />
        ))}
        {xTicks.map((v, i) => (
          <line key={`gx${i}`}
            x1={sx(v)} y1={PAD.top}
            x2={sx(v)} y2={PAD.top + CH}
            stroke="#1F2937" strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + CH} stroke="#374151" strokeWidth="0.75" />
        <line x1={PAD.left} y1={PAD.top + CH} x2={PAD.left + CW} y2={PAD.top + CH} stroke="#374151" strokeWidth="0.75" />

        {/* Average crosshairs */}
        {avgMin != null && (
          <line
            x1={sx(avgMin)} y1={PAD.top}
            x2={sx(avgMin)} y2={PAD.top + CH}
            stroke="#4E9AF1" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.7"
          />
        )}
        {avgMax != null && (
          <line
            x1={PAD.left} y1={sy(avgMax)}
            x2={PAD.left + CW} y2={sy(avgMax)}
            stroke="#A78BFA" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.7"
          />
        )}

        {/* Dots */}
        {entries.map((e, i) => (
          <circle
            key={i}
            cx={sx(e.salaryMin)}
            cy={sy(e.salaryMax)}
            r="3"
            fill="#7C3AED"
            fillOpacity="0.75"
            stroke="#A78BFA"
            strokeWidth="0.75"
          />
        ))}

        {/* Y-axis tick labels */}
        {yTicks.map((v, i) => (
          <text key={`yt${i}`}
            x={PAD.left - 4} y={sy(v) + 3}
            textAnchor="end"
            fill="#4B5563" fontSize="7" fontFamily="'DM Mono',monospace"
          >
            {formatSalary(v)}
          </text>
        ))}

        {/* X-axis tick labels */}
        {xTicks.map((v, i) => (
          <text key={`xt${i}`}
            x={sx(v)} y={PAD.top + CH + 10}
            textAnchor="middle"
            fill="#4B5563" fontSize="7" fontFamily="'DM Mono',monospace"
          >
            {formatSalary(v)}
          </text>
        ))}

        {/* Axis labels */}
        <text
          x={PAD.left + CW / 2} y={VB_H - 2}
          textAnchor="middle"
          fill="#6B7280" fontSize="7.5" fontFamily="'DM Mono',monospace"
        >
          MIN SALARY
        </text>
        <text
          x={0} y={0}
          textAnchor="middle"
          fill="#6B7280" fontSize="7.5" fontFamily="'DM Mono',monospace"
          transform={`translate(8, ${PAD.top + CH / 2}) rotate(-90)`}
        >
          MAX SALARY
        </text>

        {/* Average crosshair legend */}
        {avgMin != null && (
          <text x={sx(avgMin) + 3} y={PAD.top + 8} fill="#4E9AF1" fontSize="6" fontFamily="'DM Mono',monospace">
            avg min
          </text>
        )}
        {avgMax != null && (
          <text x={PAD.left + 3} y={sy(avgMax) - 3} fill="#A78BFA" fontSize="6" fontFamily="'DM Mono',monospace">
            avg max
          </text>
        )}
      </svg>
    </ChartContainer>
  );
}
