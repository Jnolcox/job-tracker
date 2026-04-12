/**
 * @file useDashboardSettings.js
 * @description Custom hook for managing dashboard component visibility settings.
 * Persists settings to localStorage for cross-session persistence.
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * localStorage key for persisting dashboard settings
 * @constant {string}
 */
export const STORAGE_KEY = 'jobtracker-dashboard-settings';

/**
 * Component keys for all toggleable dashboard components.
 * Note: Table is NOT included as it is always visible.
 *
 * @constant {Object}
 */
export const DASHBOARD_COMPONENTS = {
  STAT_CARDS: 'statCards',
  STAGE_FUNNEL: 'stageFunnel',
  SALARY_RANGE_CHART: 'salaryRangeChart',
  MAX_TIME_PER_STAGE_CHART: 'maxTimePerStageChart',
  STATUS_TRANSITION_HEATMAP: 'statusTransitionHeatmap',
  FUNNEL_ANALYTICS: 'funnelAnalytics',
  APPLICATION_HEALTH_DASHBOARD: 'applicationHealthDashboard',
  DAY_OF_WEEK_BAR: 'dayOfWeekBar',
  HOUR_BAR: 'hourBar',
  ACTIVITY_HEATMAP: 'activityHeatmap',
};

/**
 * Human-readable display names for dashboard components.
 * Used in the settings UI.
 *
 * @constant {Object}
 */
const COMPONENT_DISPLAY_NAMES = {
  statCards: 'Stat Cards',
  stageFunnel: 'Stage Funnel',
  salaryRangeChart: 'Salary Range Chart',
  maxTimePerStageChart: 'Max Time Per Stage',
  statusTransitionHeatmap: 'Status Transition Heatmap',
  funnelAnalytics: 'Funnel Analytics',
  applicationHealthDashboard: 'Application Health Dashboard',
  dayOfWeekBar: 'Day of Week Chart',
  hourBar: 'Hour Distribution Chart',
  activityHeatmap: 'Activity Heatmap',
};

/**
 * Default settings with all components visible.
 *
 * @constant {Object}
 */
const DEFAULT_SETTINGS = {
  statCards: true,
  stageFunnel: true,
  salaryRangeChart: true,
  maxTimePerStageChart: true,
  statusTransitionHeatmap: true,
  funnelAnalytics: true,
  applicationHealthDashboard: true,
  dayOfWeekBar: true,
  hourBar: true,
  activityHeatmap: true,
};

/**
 * Load settings from localStorage, merging with defaults for any missing keys.
 *
 * @returns {Object} Settings object with all component visibility states
 */
function loadSettingsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new components added after user saved settings
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    // Handle corrupted data gracefully
    console.warn('Failed to parse dashboard settings from localStorage:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to localStorage.
 *
 * @param {Object} settings - Settings object to persist
 */
function saveSettingsToStorage(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save dashboard settings to localStorage:', error);
  }
}

/**
 * @hook useDashboardSettings
 * @description Manages dashboard component visibility settings with localStorage persistence.
 * All components are visible by default. Settings persist across browser sessions.
 *
 * @returns {Object} Dashboard settings state and controls
 * @returns {Object} return.settings - Current visibility settings for each component
 * @returns {Function} return.isComponentVisible - Check if a component is visible by key
 * @returns {Function} return.toggleComponent - Toggle visibility of a component by key
 * @returns {Function} return.resetSettings - Reset all settings to default (all visible)
 * @returns {boolean} return.areAllHidden - True if all toggleable components are hidden
 * @returns {Object} return.componentDisplayNames - Human-readable names for components
 *
 * @example
 * const { settings, toggleComponent, isComponentVisible } = useDashboardSettings();
 *
 * // Check if stat cards should be shown
 * if (isComponentVisible('statCards')) {
 *   return <StatCards />;
 * }
 *
 * // Toggle a component
 * <button onClick={() => toggleComponent('statCards')}>Toggle Stat Cards</button>
 */
export function useDashboardSettings() {
  const [settings, setSettings] = useState(() => loadSettingsFromStorage());

  /**
   * Check if a component is visible by its key.
   *
   * @param {string} componentKey - The component key to check
   * @returns {boolean} True if the component is visible, false otherwise
   */
  const isComponentVisible = useCallback(
    (componentKey) => {
      return settings[componentKey] === true;
    },
    [settings]
  );

  /**
   * Toggle the visibility of a component.
   *
   * @param {string} componentKey - The component key to toggle
   */
  const toggleComponent = useCallback((componentKey) => {
    // Ignore unknown component keys
    if (!(componentKey in DEFAULT_SETTINGS)) {
      return;
    }

    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [componentKey]: !prev[componentKey],
      };
      saveSettingsToStorage(newSettings);
      return newSettings;
    });
  }, []);

  /**
   * Reset all settings to default (all components visible).
   */
  const resetSettings = useCallback(() => {
    const defaultSettings = { ...DEFAULT_SETTINGS };
    saveSettingsToStorage(defaultSettings);
    setSettings(defaultSettings);
  }, []);

  /**
   * Derived state: true if all toggleable components are hidden.
   */
  const areAllHidden = useMemo(() => {
    return Object.values(settings).every((visible) => !visible);
  }, [settings]);

  return {
    settings,
    isComponentVisible,
    toggleComponent,
    resetSettings,
    areAllHidden,
    componentDisplayNames: COMPONENT_DISPLAY_NAMES,
  };
}
