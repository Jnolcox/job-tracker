/**
 * @file useDashboardSettings.test.js
 * @description Tests for the useDashboardSettings hook.
 *
 * Tests cover:
 * - Default state (core components visible, advanced analytics opt-in)
 * - Toggling individual components
 * - Stat cards treated as a single group
 * - localStorage persistence
 * - Loading settings from localStorage on mount
 * - Reset functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useDashboardSettings, DASHBOARD_COMPONENTS, STORAGE_KEY } from './useDashboardSettings';

describe('useDashboardSettings', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  describe('DASHBOARD_COMPONENTS constant', () => {
    it('should export component keys for all toggleable components', () => {
      expect(DASHBOARD_COMPONENTS).toBeDefined();
      expect(DASHBOARD_COMPONENTS.STAT_CARDS).toBe('statCards');
      expect(DASHBOARD_COMPONENTS.STAGE_FUNNEL).toBe('stageFunnel');
      expect(DASHBOARD_COMPONENTS.SALARY_RANGE_CHART).toBe('salaryRangeChart');
      expect(DASHBOARD_COMPONENTS.MAX_TIME_PER_STAGE_CHART).toBe('maxTimePerStageChart');
      expect(DASHBOARD_COMPONENTS.STATUS_TRANSITION_HEATMAP).toBe('statusTransitionHeatmap');
      expect(DASHBOARD_COMPONENTS.FUNNEL_ANALYTICS).toBe('funnelAnalytics');
      expect(DASHBOARD_COMPONENTS.APPLICATION_HEALTH_DASHBOARD).toBe('applicationHealthDashboard');
      expect(DASHBOARD_COMPONENTS.DAY_OF_WEEK_BAR).toBe('dayOfWeekBar');
      expect(DASHBOARD_COMPONENTS.HOUR_BAR).toBe('hourBar');
      expect(DASHBOARD_COMPONENTS.ACTIVITY_HEATMAP).toBe('activityHeatmap');
    });

    it('should NOT include a table component key', () => {
      const componentValues = Object.values(DASHBOARD_COMPONENTS);
      expect(componentValues).not.toContain('table');
      expect(componentValues).not.toContain('appTable');
    });
  });

  describe('default state', () => {
    it('should have core components visible by default', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.settings.statCards).toBe(true);
      expect(result.current.settings.stageFunnel).toBe(true);
      expect(result.current.settings.salaryRangeChart).toBe(true);
      expect(result.current.settings.maxTimePerStageChart).toBe(true);
      expect(result.current.settings.dayOfWeekBar).toBe(true);
      expect(result.current.settings.hourBar).toBe(true);
      expect(result.current.settings.activityHeatmap).toBe(true);
      expect(result.current.settings.companyInsights).toBe(true);
      expect(result.current.settings.locationInsights).toBe(true);
      expect(result.current.settings.positionInsights).toBe(true);
    });

    it('should have advanced analytics hidden by default', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.settings.statusTransitionHeatmap).toBe(false);
      expect(result.current.settings.funnelAnalytics).toBe(false);
      expect(result.current.settings.applicationHealthDashboard).toBe(false);
    });

    it('should return isComponentVisible function', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(typeof result.current.isComponentVisible).toBe('function');
    });

    it('should return toggleComponent function', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(typeof result.current.toggleComponent).toBe('function');
    });

    it('should return resetSettings function', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(typeof result.current.resetSettings).toBe('function');
    });
  });

  describe('isComponentVisible', () => {
    it('should return true for visible components', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.isComponentVisible('statCards')).toBe(true);
      expect(result.current.isComponentVisible('stageFunnel')).toBe(true);
    });

    it('should return false for hidden components', () => {
      const { result } = renderHook(() => useDashboardSettings());

      act(() => {
        result.current.toggleComponent('statCards');
      });

      expect(result.current.isComponentVisible('statCards')).toBe(false);
    });

    it('should return false for unknown component keys', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.isComponentVisible('unknownComponent')).toBe(false);
    });
  });

  describe('toggleComponent', () => {
    it('should toggle a component from visible to hidden', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.settings.statCards).toBe(true);

      act(() => {
        result.current.toggleComponent('statCards');
      });

      expect(result.current.settings.statCards).toBe(false);
    });

    it('should toggle a component from hidden to visible', () => {
      const { result } = renderHook(() => useDashboardSettings());

      act(() => {
        result.current.toggleComponent('stageFunnel');
      });

      expect(result.current.settings.stageFunnel).toBe(false);

      act(() => {
        result.current.toggleComponent('stageFunnel');
      });

      expect(result.current.settings.stageFunnel).toBe(true);
    });

    it('should not affect other components when toggling one', () => {
      const { result } = renderHook(() => useDashboardSettings());

      act(() => {
        result.current.toggleComponent('statCards');
      });

      expect(result.current.settings.statCards).toBe(false);
      expect(result.current.settings.stageFunnel).toBe(true);
      expect(result.current.settings.salaryRangeChart).toBe(true);
    });

    it('should handle toggling unknown component keys gracefully', () => {
      const { result } = renderHook(() => useDashboardSettings());

      // Should not throw
      act(() => {
        result.current.toggleComponent('unknownComponent');
      });

      // Original settings should remain unchanged
      expect(result.current.settings.statCards).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('should save settings to localStorage when toggling', () => {
      const { result } = renderHook(() => useDashboardSettings());

      act(() => {
        result.current.toggleComponent('statCards');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(stored.statCards).toBe(false);
    });

    it('should load settings from localStorage on mount', () => {
      const savedSettings = {
        statCards: false,
        stageFunnel: false,
        salaryRangeChart: true,
        maxTimePerStageChart: true,
        statusTransitionHeatmap: true,
        funnelAnalytics: true,
        applicationHealthDashboard: true,
        dayOfWeekBar: true,
        hourBar: true,
        activityHeatmap: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));

      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.settings.statCards).toBe(false);
      expect(result.current.settings.stageFunnel).toBe(false);
      expect(result.current.settings.salaryRangeChart).toBe(true);
    });

    it('should use default settings when localStorage is empty', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.settings.statCards).toBe(true);
      expect(result.current.settings.stageFunnel).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json');

      const { result } = renderHook(() => useDashboardSettings());

      // Should fall back to defaults
      expect(result.current.settings.statCards).toBe(true);
    });

    it('should merge with defaults when localStorage has partial data', () => {
      // Simulate a scenario where new components were added
      const partialSettings = {
        statCards: false,
        stageFunnel: true,
        // Missing other keys
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partialSettings));

      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.settings.statCards).toBe(false);
      expect(result.current.settings.stageFunnel).toBe(true);
      // New components should default to visible
      expect(result.current.settings.activityHeatmap).toBe(true);
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to their defaults', () => {
      const { result } = renderHook(() => useDashboardSettings());

      // Toggle some components off
      act(() => {
        result.current.toggleComponent('statCards');
        result.current.toggleComponent('stageFunnel');
        result.current.toggleComponent('activityHeatmap');
      });

      expect(result.current.settings.statCards).toBe(false);
      expect(result.current.settings.stageFunnel).toBe(false);
      expect(result.current.settings.activityHeatmap).toBe(false);

      // Reset
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings.statCards).toBe(true);
      expect(result.current.settings.stageFunnel).toBe(true);
      expect(result.current.settings.activityHeatmap).toBe(true);
    });

    it('should clear localStorage when resetting', () => {
      const { result } = renderHook(() => useDashboardSettings());

      act(() => {
        result.current.toggleComponent('statCards');
      });

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      act(() => {
        result.current.resetSettings();
      });

      // After reset, localStorage should have defaults or be cleared
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(stored.statCards).toBe(true);
    });
  });

  describe('derived state: areAllHidden', () => {
    it('should return false when at least one component is visible', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.areAllHidden).toBe(false);
    });

    it('should return true when all toggleable components are hidden', () => {
      const { result } = renderHook(() => useDashboardSettings());

      // Hide all components
      act(() => {
        Object.values(DASHBOARD_COMPONENTS).forEach((key) => {
          if (result.current.settings[key]) {
            result.current.toggleComponent(key);
          }
        });
      });

      expect(result.current.areAllHidden).toBe(true);
    });
  });

  describe('component display names', () => {
    it('should provide human-readable display names for components', () => {
      const { result } = renderHook(() => useDashboardSettings());

      expect(result.current.componentDisplayNames).toBeDefined();
      expect(result.current.componentDisplayNames.statCards).toBe('Stat Cards');
      expect(result.current.componentDisplayNames.stageFunnel).toBe('Stage Funnel');
      expect(result.current.componentDisplayNames.activityHeatmap).toBe('Activity Heatmap');
    });
  });
});
