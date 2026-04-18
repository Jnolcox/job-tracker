/**
 * @file CompanyInsights.jsx
 * @description Company-level analytics visualization showing response rates,
 * ghost rates, interview rates, and average response time per company.
 */

import { useMemo } from 'react';
import ChartContainer from './ChartContainer';

/**
 * Get color for rate visualization based on value.
 * Higher rates get more positive colors.
 *
 * @param {number} rate - Rate value (0-100)
 * @param {boolean} [inverted=false] - If true, lower is better (e.g., ghost rate)
 * @returns {string} Hex color code
 */
function getRateColor(rate, inverted = false) {
  const effectiveRate = inverted ? 100 - rate : rate;
  if (effectiveRate >= 60) return '#10B981'; // Green - excellent
  if (effectiveRate >= 40) return '#A78BFA'; // Purple - good
  if (effectiveRate >= 20) return '#4E9AF1'; // Blue - moderate
  return '#6B7280'; // Gray - low
}

/**
 * @component CompanyInsights
 * @description Displays company-level analytics including:
 * - Top companies by application count
 * - Response rates, ghost rates, interview rates per company
 * - Average days to response
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Company insights data from backend
 * @param {Array<{companyName: string, applicationCount: number, responseRate: number, ghostRate: number, interviewRate: number, avgDaysToResponse: number|null}>} props.data.companies
 * @param {number} props.data.totalCompaniesAnalyzed
 * @param {number} props.data.totalApplicationsAnalyzed
 * @param {boolean} [props.loading=false] - Whether data is loading
 *
 * @example
 * <CompanyInsights
 *   data={{
 *     companies: [{ companyName: 'Google', applicationCount: 5, responseRate: 80, ghostRate: 10, interviewRate: 60, avgDaysToResponse: 7 }],
 *     totalCompaniesAnalyzed: 10,
 *     totalApplicationsAnalyzed: 50
 *   }}
 * />
 *
 * @returns {JSX.Element} Company insights component
 */
export default function CompanyInsights({ data, loading = false }) {
  // Sort companies by application count (already sorted from backend, but ensure)
  const sortedCompanies = useMemo(() => {
    if (!data?.companies || !Array.isArray(data.companies)) return [];
    return [...data.companies].sort((a, b) => b.applicationCount - a.applicationCount);
  }, [data]);

  const isEmpty = !data || !data.companies || data.companies.length === 0;

  const headerRight =
    !isEmpty && data?.totalCompaniesAnalyzed ? (
      <span
        style={{
          color: '#6B7280',
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        Top 5 of {data.totalCompaniesAnalyzed}
      </span>
    ) : null;

  return (
    <ChartContainer
      title="Company Insights"
      headerRight={headerRight}
      testId="company-insights"
    >
      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#6B7280',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            padding: '20px 0',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              border: '2px solid #1F2937',
              borderTopColor: '#4E9AF1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          Loading company data...
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <p
          style={{
            color: '#4B5563',
            fontSize: 12,
            fontFamily: "'DM Mono',monospace",
            fontStyle: 'italic',
            padding: '20px 0',
            margin: 0,
          }}
        >
          No company data available
        </p>
      )}

      {/* Company list - limited to top 5 for uniform widget height */}
      {!loading && !isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedCompanies.slice(0, 5).map((company) => (
            <div
              key={company.companyName}
              data-testid="company-item"
              style={{
                background: '#1F2937',
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              {/* Company name and app count */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    color: '#E5E7EB',
                    fontSize: 12,
                    fontFamily: "'DM Mono',monospace",
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '60%',
                  }}
                >
                  {company.companyName}
                </span>
                <span
                  style={{
                    color: '#6B7280',
                    fontSize: 10,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {company.applicationCount} apps
                </span>
              </div>

              {/* Metrics row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {/* Response Rate */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: getRateColor(company.responseRate),
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(company.responseRate)}%
                  </div>
                  <div
                    style={{
                      color: '#6B7280',
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Response
                  </div>
                </div>

                {/* Ghost Rate */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: getRateColor(company.ghostRate, true),
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(company.ghostRate)}%
                  </div>
                  <div
                    style={{
                      color: '#6B7280',
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Ghost
                  </div>
                </div>

                {/* Interview Rate */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: getRateColor(company.interviewRate),
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(company.interviewRate)}%
                  </div>
                  <div
                    style={{
                      color: '#6B7280',
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Interview
                  </div>
                </div>

                {/* Avg Response Time */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: company.avgDaysToResponse !== null ? '#4E9AF1' : '#4B5563',
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 600,
                    }}
                  >
                    {company.avgDaysToResponse !== null
                      ? `${Math.round(company.avgDaysToResponse)}d`
                      : '—'}
                  </div>
                  <div
                    style={{
                      color: '#6B7280',
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Avg Time
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartContainer>
  );
}
