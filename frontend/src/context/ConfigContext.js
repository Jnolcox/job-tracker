/**
 * @file ConfigContext.js
 * @description React Context for providing backend configuration to components.
 * Fetches status configuration (statuses, colors, groups) and options (RTO types, levels)
 * from backend endpoints on app load.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { configAPI } from '../services/api';

/**
 * @typedef {Object} StatusConfig
 * @property {string} key - Status key (e.g., 'APPLIED')
 * @property {string} label - Human-readable label (e.g., 'Applied')
 * @property {string} color - Hex color code (e.g., '#4E9AF1')
 * @property {string} group - Group name (e.g., 'ACTIVE')
 */

/**
 * @typedef {Object} OptionConfig
 * @property {string} key - Option key (e.g., 'REMOTE')
 * @property {string} label - Human-readable label (e.g., 'Remote')
 */

/**
 * @typedef {Object} ConfigContextValue
 * @property {StatusConfig[]} statuses - Array of status configurations
 * @property {Object<string, string[]>} groups - Map of group name to status keys
 * @property {OptionConfig[]} rtoTypes - Array of RTO type options
 * @property {OptionConfig[]} levels - Array of level options
 * @property {boolean} loading - Whether config is still loading
 * @property {Error|null} error - Error if config failed to load
 * @property {function(string): string} getStatusLabel - Get label for a status key
 * @property {function(string): string} getStatusColor - Get color for a status key
 * @property {function(string, string): boolean} isStatusInGroup - Check if status is in group
 * @property {function(string): string} getRtoLabel - Get label for an RTO type key
 * @property {function(string): string} getLevelLabel - Get label for a level key
 */

const ConfigContext = createContext(null);

/**
 * Default gray color for unknown statuses
 * @constant {string}
 */
const DEFAULT_COLOR = '#6B7280';

/**
 * ConfigProvider component that fetches and provides configuration data.
 *
 * @component ConfigProvider
 * @description Fetches configuration from backend on mount and provides it via context.
 * Handles loading and error states. Provides helper functions for common operations.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 *
 * @example
 * <ConfigProvider>
 *   <App />
 * </ConfigProvider>
 *
 * @returns {JSX.Element} Provider component with config context
 */
export function ConfigProvider({ children }) {
  const [statuses, setStatuses] = useState([]);
  const [groups, setGroups] = useState({});
  const [rtoTypes, setRtoTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch config on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both endpoints in parallel
        const [statusesRes, optionsRes] = await Promise.all([
          configAPI.getStatuses(),
          configAPI.getOptions(),
        ]);

        if (!cancelled) {
          // Extract data from responses
          const statusData = statusesRes.data || {};
          const optionsData = optionsRes.data || {};

          setStatuses(statusData.statuses || []);
          setGroups(statusData.groups || {});
          setRtoTypes(optionsData.rtoTypes || []);
          setLevels(optionsData.levels || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          // Keep empty arrays as fallback
          setStatuses([]);
          setGroups({});
          setRtoTypes([]);
          setLevels([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  // Memoize status lookup maps for O(1) access
  const statusMap = useMemo(() => {
    const map = new Map();
    statuses.forEach(status => {
      map.set(status.key, status);
    });
    return map;
  }, [statuses]);

  // Memoize RTO lookup map
  const rtoMap = useMemo(() => {
    const map = new Map();
    rtoTypes.forEach(rto => {
      map.set(rto.key, rto);
    });
    return map;
  }, [rtoTypes]);

  // Memoize level lookup map
  const levelMap = useMemo(() => {
    const map = new Map();
    levels.forEach(level => {
      map.set(level.key, level);
    });
    return map;
  }, [levels]);

  /**
   * Get the human-readable label for a status key.
   * @param {string} key - Status key
   * @returns {string} Status label or the key itself if not found
   */
  const getStatusLabel = useCallback((key) => {
    const status = statusMap.get(key);
    return status?.label || key;
  }, [statusMap]);

  /**
   * Get the color for a status key.
   * @param {string} key - Status key
   * @returns {string} Hex color code or default gray if not found
   */
  const getStatusColor = useCallback((key) => {
    const status = statusMap.get(key);
    return status?.color || DEFAULT_COLOR;
  }, [statusMap]);

  /**
   * Check if a status belongs to a specific group.
   * @param {string} status - Status key to check
   * @param {string} group - Group name to check against
   * @returns {boolean} True if status is in the group
   */
  const isStatusInGroup = useCallback((status, group) => {
    const groupStatuses = groups[group];
    return groupStatuses?.includes(status) || false;
  }, [groups]);

  /**
   * Get the human-readable label for an RTO type key.
   * @param {string} key - RTO type key
   * @returns {string} RTO label or the key itself if not found
   */
  const getRtoLabel = useCallback((key) => {
    const rto = rtoMap.get(key);
    return rto?.label || key;
  }, [rtoMap]);

  /**
   * Get the human-readable label for a level key.
   * @param {string} key - Level key
   * @returns {string} Level label or the key itself if not found
   */
  const getLevelLabel = useCallback((key) => {
    const level = levelMap.get(key);
    return level?.label || key;
  }, [levelMap]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    statuses,
    groups,
    rtoTypes,
    levels,
    loading,
    error,
    getStatusLabel,
    getStatusColor,
    isStatusInGroup,
    getRtoLabel,
    getLevelLabel,
  }), [
    statuses,
    groups,
    rtoTypes,
    levels,
    loading,
    error,
    getStatusLabel,
    getStatusColor,
    isStatusInGroup,
    getRtoLabel,
    getLevelLabel,
  ]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook to access configuration context.
 *
 * @hook useConfig
 * @description Provides access to application configuration including statuses,
 * groups, RTO types, levels, and helper functions for common operations.
 *
 * @returns {ConfigContextValue} Configuration context value
 * @throws {Error} If used outside of ConfigProvider
 *
 * @example
 * const { statuses, getStatusLabel, isStatusInGroup } = useConfig();
 * const label = getStatusLabel('APPLIED'); // 'Applied'
 * const isRejected = isStatusInGroup('REJECTED', 'REJECTED'); // true
 */
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

export default ConfigContext;
