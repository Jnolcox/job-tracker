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
 * @typedef {Object} UseAnalyticsOptions
 * @property {number} [year] - Year for activity heatmap (defaults to current year)
 */

/**
 * @typedef {Object} UseAnalyticsReturn
 * @property {Metrics|null} metrics - Application metrics
 * @property {Object<string, number>|null} countsByStatus - Counts per status
 * @property {SalaryDistribution|null} salaryDistribution - Salary analytics
 * @property {ActivityHeatmap|null} activityHeatmap - Heatmap data
 * @property {TimePatterns|null} timePatterns - Day/hour distribution
 * @property {StageDurations|null} stageDurations - Stage duration analytics
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
  const { year } = options;

  const [metrics, setMetrics] = useState(null);
  const [countsByStatus, setCountsByStatus] = useState(null);
  const [salaryDistribution, setSalaryDistribution] = useState(null);
  const [activityHeatmap, setActivityHeatmap] = useState(null);
  const [timePatterns, setTimePatterns] = useState(null);
  const [stageDurations, setStageDurations] = useState(null);
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
        fetch: () => analyticsAPI.getStageDurations(),
        setter: setStageDurations,
        name: 'stageDurations',
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
  }, [year]);

  // Fetch data on mount and when year changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    metrics,
    countsByStatus,
    salaryDistribution,
    activityHeatmap,
    timePatterns,
    stageDurations,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

export default useAnalytics;
