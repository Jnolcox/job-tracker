/**
 * @file useAnalytics.js
 * @description React hook for fetching analytics data from backend endpoints.
 * Replaces client-side metric calculations with server-computed analytics.
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/api';

/**
 * @typedef {Object} Metrics
 * @property {number} trueResponseRate - % of apps that received any response
 * @property {number} trueInterviewRate - % of apps that reached any interview stage
 * @property {number} trueOfferRate - % of apps that reached any offer stage
 * @property {number|null} avgDaysToResponse - Average days to first response
 * @property {number} weeklyPace - Applications per week
 * @property {number} totalApplications - Total number of applications
 * @property {Object} stageConversions - Funnel conversion metrics
 * @property {number} stageConversions.appliedToScreen - % apps reaching recruiter screen
 * @property {number} stageConversions.screenToTech - % of screened apps reaching tech
 * @property {number} stageConversions.techToOffer - % of tech-interviewed apps getting offers
 */

/**
 * @typedef {Object} SalaryDistribution
 * @property {number} globalMin - Minimum salary across all active apps
 * @property {number} globalMax - Maximum salary across all active apps
 * @property {number} avgMin - Average minimum salary
 * @property {number} avgMax - Average maximum salary
 * @property {number} avgMid - Average midpoint salary
 * @property {number} activeAppsWithSalary - Count of active apps with salary data
 */

/**
 * @typedef {Object} ActivityHeatmap
 * @property {Object<string, number>} data - Map of date string to application count
 * @property {number} maxCount - Maximum count on any single day
 * @property {number} year - The year this data represents
 */

/**
 * @typedef {Object} TimePatterns
 * @property {Object<string, number>} byDayOfWeek - Map of day name to count
 * @property {Object<number, number>} byHour - Map of hour (0-23) to count
 */

/**
 * @typedef {Object} StageDurations
 * @property {Object<string, number>} averageTimeByStage - Map of stage to avg days
 * @property {Array<{stage: string, avgDays: number}>} bottleneckStages - Stages with longest duration
 */

/**
 * @typedef {Object} TransitionMatrix
 * @property {Array<{fromStatus: string, toStatus: string, count: number}>} transitions - Status transitions
 * @property {string[]} statuses - All unique statuses
 * @property {number} totalTransitions - Total count of all transitions
 */

/**
 * @typedef {Object} FunnelAnalytics
 * @property {Object<string, number>} stageConversionRates - Conversion rate per stage
 * @property {Array<{status: string, count: number, percentage: number}>} dropOffPoints - Drop-off points
 * @property {Array<{companyName: string, totalApplications: number, offersReceived: number, successRate: number}>} successRateByCompany
 * @property {Array<{positionType: string, totalApplications: number, offersReceived: number, successRate: number}>} successRateByPositionType
 * @property {number} overallSuccessRate - Overall success percentage
 * @property {number} totalApplicationsAnalyzed - Total applications in analysis
 */

/**
 * @typedef {Object} HealthIndicators
 * @property {Array<{applicationId: number, companyName: string, positionTitle: string, currentStatus: string, lastEventAt: string, daysSinceLastEvent: number}>} staleApplications
 * @property {Array<{applicationId: number, companyName: string, positionTitle: string, currentStatus: string, recentEventCount: number, lastEventAt: string}>} hotApplications
 * @property {Array<{applicationId: number, companyName: string, positionTitle: string, finalStatus: string, appliedAt: string, resolvedAt: string, daysToResolution: number}>} quickWins
 * @property {Array} quickLosses - Quick loss applications
 * @property {number} staleDaysThreshold - Days threshold for stale classification
 * @property {{staleCount: number, hotCount: number, quickWinCount: number, quickLossCount: number, activeCount: number}} summary
 */

/**
 * @typedef {Object} UseAnalyticsOptions
 * @property {number} [year] - Year for activity heatmap (defaults to current year)
 * @property {number} [staleDays=14] - Days threshold for stale application classification
 */

/**
 * @typedef {Object} CompanyInsights
 * @property {Array<{companyName: string, applicationCount: number, responseRate: number, ghostRate: number, interviewRate: number, avgDaysToResponse: number|null}>} companies
 * @property {number} totalCompaniesAnalyzed
 * @property {number} totalApplicationsAnalyzed
 */

/**
 * @typedef {Object} LocationInsights
 * @property {Array<{location: string, applicationCount: number, avgSalaryMin: number|null, avgSalaryMax: number|null, successRate: number}>} byLocation
 * @property {Array<{rtoType: string, applicationCount: number, percentage: number, avgSalaryMin: number|null, avgSalaryMax: number|null, successRate: number}>} byRtoType
 * @property {number} totalApplicationsAnalyzed
 */

/**
 * @typedef {Object} PositionInsights
 * @property {Array<{level: string, applicationCount: number, percentage: number, successRate: number, interviewRate: number, avgSalaryMin: number|null, avgSalaryMax: number|null}>} byLevel
 * @property {number} totalApplicationsAnalyzed
 */

/**
 * @typedef {Object} UseAnalyticsReturn
 * @property {Metrics|null} metrics - Application metrics
 * @property {Object<string, number>|null} countsByStatus - Counts per status
 * @property {SalaryDistribution|null} salaryDistribution - Salary analytics
 * @property {ActivityHeatmap|null} activityHeatmap - Heatmap data
 * @property {TimePatterns|null} timePatterns - Day/hour distribution
 * @property {TransitionMatrix|null} transitionMatrix - Status transition matrix for heatmap
 * @property {FunnelAnalytics|null} funnelAnalytics - Funnel/conversion analytics
 * @property {HealthIndicators|null} healthIndicators - Application health indicators
 * @property {CompanyInsights|null} companyInsights - Company-level analytics
 * @property {LocationInsights|null} locationInsights - Location and RTO analytics
 * @property {PositionInsights|null} positionInsights - Position level analytics
 * @property {boolean} loading - Whether data is still loading
 * @property {Error|null} error - Error if any request failed
 * @property {function(): Promise<void>} refetch - Function to refetch all data
 */

/**
 * Hook for fetching analytics data from backend.
 * Fetches all analytics endpoints in parallel and provides unified loading/error states.
 *
 * @hook useAnalytics
 * @description Fetches pre-computed analytics from backend, replacing client-side calculations.
 *
 * @param {UseAnalyticsOptions} [options={}] - Hook options
 * @returns {UseAnalyticsReturn} Analytics data and state
 *
 * @example
 * const { metrics, loading, error } = useAnalytics();
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <div>Response Rate: {metrics.trueResponseRate}%</div>;
 */
export function useAnalytics(options = {}) {
  const { year, staleDays = 14 } = options;

  const [metrics, setMetrics] = useState(null);
  const [countsByStatus, setCountsByStatus] = useState(null);
  const [salaryDistribution, setSalaryDistribution] = useState(null);
  const [activityHeatmap, setActivityHeatmap] = useState(null);
  const [timePatterns, setTimePatterns] = useState(null);
  const [transitionMatrix, setTransitionMatrix] = useState(null);
  const [funnelAnalytics, setFunnelAnalytics] = useState(null);
  const [healthIndicators, setHealthIndicators] = useState(null);
  const [companyInsights, setCompanyInsights] = useState(null);
  const [locationInsights, setLocationInsights] = useState(null);
  const [positionInsights, setPositionInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all analytics data from backend endpoints.
   * Each endpoint is fetched independently, so partial failures
   * still allow successful data to be used.
   */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Create an array of fetch promises with their setters
    const fetches = [
      {
        fetch: () => analyticsAPI.getMetrics(),
        setter: setMetrics,
        name: 'metrics',
      },
      {
        fetch: () => analyticsAPI.getCountsByStatus(),
        setter: setCountsByStatus,
        name: 'countsByStatus',
      },
      {
        fetch: () => analyticsAPI.getSalaryDistribution(),
        setter: setSalaryDistribution,
        name: 'salaryDistribution',
      },
      {
        fetch: () => analyticsAPI.getActivityHeatmap(year),
        setter: setActivityHeatmap,
        name: 'activityHeatmap',
      },
      {
        fetch: () => analyticsAPI.getTimePatterns(),
        setter: setTimePatterns,
        name: 'timePatterns',
      },
      {
        fetch: () => analyticsAPI.getTransitionMatrix(),
        setter: setTransitionMatrix,
        name: 'transitionMatrix',
      },
      {
        fetch: () => analyticsAPI.getFunnel(),
        setter: setFunnelAnalytics,
        name: 'funnelAnalytics',
      },
      {
        fetch: () => analyticsAPI.getHealth(staleDays),
        setter: setHealthIndicators,
        name: 'healthIndicators',
      },
      {
        fetch: () => analyticsAPI.getCompanyInsights(),
        setter: setCompanyInsights,
        name: 'companyInsights',
      },
      {
        fetch: () => analyticsAPI.getLocationInsights(),
        setter: setLocationInsights,
        name: 'locationInsights',
      },
      {
        fetch: () => analyticsAPI.getPositionInsights(),
        setter: setPositionInsights,
        name: 'positionInsights',
      },
    ];

    // Execute all fetches in parallel, handling individual failures
    const results = await Promise.allSettled(
      fetches.map(async ({ fetch, setter, name }) => {
        try {
          const response = await fetch();
          setter(response.data);
          return { name, success: true };
        } catch (err) {
          setter(null);
          return { name, success: false, error: err };
        }
      })
    );

    // Check if all requests failed - if so, set error state
    const allFailed = results.every(
      (r) => r.status === 'fulfilled' && !r.value.success
    );

    if (allFailed && results.length > 0) {
      // Use the first error as the main error
      const firstFailure = results.find(
        (r) => r.status === 'fulfilled' && !r.value.success
      );
      if (firstFailure && firstFailure.status === 'fulfilled') {
        setError(firstFailure.value.error);
      }
    }

    setLoading(false);
  }, [year, staleDays]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    metrics,
    countsByStatus,
    salaryDistribution,
    activityHeatmap,
    timePatterns,
    transitionMatrix,
    funnelAnalytics,
    healthIndicators,
    companyInsights,
    locationInsights,
    positionInsights,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

export default useAnalytics;
