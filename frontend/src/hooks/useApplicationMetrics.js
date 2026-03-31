/**
 * @file useApplicationMetrics.js
 * @description React hook for computing application metrics from audit trail events.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { jobApplicationsAPI } from '../services/api';
import { getAllMetrics } from '../utils/metricsEngine';

/**
 * Stable empty array reference to prevent infinite loops when apps is empty.
 * @type {Array}
 */
const EMPTY_EVENTS = [];

/**
 * @typedef {Object} ApplicationMetrics
 * @property {number} trueResponseRate - % of apps that received any response
 * @property {number} trueInterviewRate - % of apps that reached any interview stage
 * @property {number} trueOfferRate - % of apps that reached any offer stage
 * @property {number|null} avgDaysToResponse - Average days to first response
 * @property {Object} stageConversions - Funnel conversion metrics
 * @property {number} stageConversions.appliedToScreen - % apps reaching recruiter screen
 * @property {number} stageConversions.screenToTech - % of screened apps reaching tech
 * @property {number} stageConversions.techToOffer - % of tech-interviewed apps getting offers
 */

/**
 * Hook for computing application metrics from audit trail events.
 * Fetches all events for the provided applications and computes metrics.
 *
 * @param {Array<{id: number}>} apps - Array of application objects
 * @returns {{
 *   metrics: ApplicationMetrics | null,
 *   loading: boolean,
 *   error: Error | null
 * }}
 *
 * @example
 * const { metrics, loading, error } = useApplicationMetrics(apps);
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <div>Response Rate: {metrics.trueResponseRate}%</div>;
 */
export function useApplicationMetrics(apps) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store apps reference to use in useMemo without triggering effect re-runs
  const appsRef = useRef(apps);
  appsRef.current = apps;

  // Create a stable key based on app IDs to detect actual changes
  const appsKey = useMemo(() => {
    if (!apps || apps.length === 0) return '';
    return apps.map(app => app.id).sort((a, b) => a - b).join(',');
  }, [apps]);

  // Fetch events when apps change (using stable key)
  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      // Handle empty/null/undefined apps case
      if (!appsKey) {
        setEvents(EMPTY_EVENTS);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const currentApps = appsRef.current;
        const allEvents = await jobApplicationsAPI.getAllEvents(currentApps);
        if (!cancelled) {
          setEvents(allEvents);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [appsKey]);

  // Compute metrics when events change
  const metrics = useMemo(() => {
    if (events === null) {
      return null;
    }
    return getAllMetrics(events, appsRef.current);
  }, [events]);

  return { metrics, loading, error };
}

export default useApplicationMetrics;
