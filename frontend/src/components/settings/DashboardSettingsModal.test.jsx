/**
 * @file DashboardSettingsModal.test.jsx
 * @description Tests for the DashboardSettingsModal component.
 *
 * Tests cover:
 * - Modal open/close behavior
 * - Displaying all toggleable components
 * - Toggle interactions
 * - Reset functionality
 * - Accessibility
 * - Table NOT being listed as toggleable
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DashboardSettingsModal from './DashboardSettingsModal';
import { DASHBOARD_COMPONENTS } from '../../hooks/useDashboardSettings';

expect.extend(toHaveNoViolations);

describe('DashboardSettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    settings: {
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
      companyInsights: true,
      locationInsights: true,
      positionInsights: true,
    },
    onToggle: jest.fn(),
    onReset: jest.fn(),
    componentDisplayNames: {
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
      companyInsights: 'Company Insights',
      locationInsights: 'Location Insights',
      positionInsights: 'Position Insights',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render nothing when isOpen is false', () => {
      render(<DashboardSettingsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render the modal when isOpen is true', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render the title "Dashboard Settings"', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByText('Dashboard Settings')).toBeInTheDocument();
    });

    it('should render all toggleable component names', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByText('Stat Cards')).toBeInTheDocument();
      expect(screen.getByText('Stage Funnel')).toBeInTheDocument();
      expect(screen.getByText('Salary Range Chart')).toBeInTheDocument();
      expect(screen.getByText('Max Time Per Stage')).toBeInTheDocument();
      expect(screen.getByText('Status Transition Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Funnel Analytics')).toBeInTheDocument();
      expect(screen.getByText('Application Health Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Day of Week Chart')).toBeInTheDocument();
      expect(screen.getByText('Hour Distribution Chart')).toBeInTheDocument();
      expect(screen.getByText('Activity Heatmap')).toBeInTheDocument();
    });

    it('should NOT render table as a toggleable option', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.queryByText('Table')).not.toBeInTheDocument();
      expect(screen.queryByText('App Table')).not.toBeInTheDocument();
      expect(screen.queryByText('Applications Table')).not.toBeInTheDocument();
    });

    it('should render a toggle switch for each component', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const toggles = screen.getAllByRole('switch');
      expect(toggles.length).toBe(Object.keys(DASHBOARD_COMPONENTS).length);
    });

    it('should render a reset button', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe('toggle states', () => {
    it('should show toggle as checked when component is visible', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const statCardsToggle = screen.getByRole('switch', { name: /stat cards/i });
      expect(statCardsToggle).toBeChecked();
    });

    it('should show toggle as unchecked when component is hidden', () => {
      const settingsWithHidden = {
        ...defaultProps.settings,
        statCards: false,
      };

      render(<DashboardSettingsModal {...defaultProps} settings={settingsWithHidden} />);

      const statCardsToggle = screen.getByRole('switch', { name: /stat cards/i });
      expect(statCardsToggle).not.toBeChecked();
    });

    it('should reflect mixed toggle states correctly', () => {
      const mixedSettings = {
        ...defaultProps.settings,
        statCards: false,
        stageFunnel: true,
        activityHeatmap: false,
      };

      render(<DashboardSettingsModal {...defaultProps} settings={mixedSettings} />);

      expect(screen.getByRole('switch', { name: /stat cards/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /stage funnel/i })).toBeChecked();
      expect(screen.getByRole('switch', { name: /activity heatmap/i })).not.toBeChecked();
    });
  });

  describe('interactions', () => {
    it('should call onToggle with component key when toggle is clicked', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const statCardsToggle = screen.getByRole('switch', { name: /stat cards/i });
      fireEvent.click(statCardsToggle);

      expect(defaultProps.onToggle).toHaveBeenCalledWith('statCards');
    });

    it('should call onToggle for each different component toggle', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('switch', { name: /stage funnel/i }));
      expect(defaultProps.onToggle).toHaveBeenCalledWith('stageFunnel');

      fireEvent.click(screen.getByRole('switch', { name: /activity heatmap/i }));
      expect(defaultProps.onToggle).toHaveBeenCalledWith('activityHeatmap');
    });

    it('should call onClose when close button is clicked', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const backdrop = screen.getByTestId('settings-modal-backdrop');
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when modal content is clicked', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onReset when reset button is clicked', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });

  describe('component grouping', () => {
    it('should group Stat Cards separately from individual charts', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      // Stat Cards should have a descriptive subtitle indicating it controls all stat cards
      expect(screen.getByText(/all statistics cards/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<DashboardSettingsModal {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper aria-label for the dialog', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Dashboard Settings');
    });

    it('should have toggle switches with accessible names', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByRole('switch', { name: /stat cards/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /stage funnel/i })).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have a descriptive subtitle for the modal', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByText(/choose which components to display/i)).toBeInTheDocument();
    });

    it('should display info about table always being visible', () => {
      render(<DashboardSettingsModal {...defaultProps} />);

      expect(screen.getByText(/table is always visible/i)).toBeInTheDocument();
    });
  });

  describe('danger zone', () => {
    const dangerProps = {
      ...defaultProps,
      totalApps: 20,
      nonActiveCount: 7,
      onDeleteAll: jest.fn(),
      onDeleteNonActive: jest.fn(),
    };

    const getDeleteAllButton = () => screen.getByRole('button', { name: /^delete all$/i });
    const getDeleteNonActiveButton = () => screen.getByRole('button', { name: /^delete 7$/i });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render the danger zone heading', () => {
      render(<DashboardSettingsModal {...dangerProps} />);

      expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    });

    it('should show the non-active count on its delete button', () => {
      render(<DashboardSettingsModal {...dangerProps} />);

      expect(getDeleteNonActiveButton()).toBeInTheDocument();
    });

    it('should disable the non-active button when the count is zero', () => {
      render(<DashboardSettingsModal {...dangerProps} nonActiveCount={0} />);

      expect(screen.getByRole('button', { name: /^delete 0$/i })).toBeDisabled();
    });

    it('should disable the delete all button when there are no applications', () => {
      render(<DashboardSettingsModal {...dangerProps} totalApps={0} />);

      expect(getDeleteAllButton()).toBeDisabled();
    });

    it('should enable the delete all button when applications exist', () => {
      render(<DashboardSettingsModal {...dangerProps} />);

      expect(getDeleteAllButton()).toBeEnabled();
    });

    it('should not open a confirmation until a danger zone button is clicked', () => {
      render(<DashboardSettingsModal {...dangerProps} />);

      expect(screen.queryByTestId('confirm-delete-backdrop')).not.toBeInTheDocument();
    });

    it('should open the delete all confirmation when its button is clicked', () => {
      render(<DashboardSettingsModal {...dangerProps} />);

      fireEvent.click(getDeleteAllButton());

      expect(
        screen.getByRole('dialog', { name: 'Delete All Applications' })
      ).toBeInTheDocument();
    });

    it('should open the non-active confirmation when its button is clicked', () => {
      render(<DashboardSettingsModal {...dangerProps} />);

      fireEvent.click(getDeleteNonActiveButton());

      expect(
        screen.getByRole('dialog', { name: 'Delete Non-Active Applications' })
      ).toBeInTheDocument();
    });

    it('should not call onDeleteAll until the confirm phrase is typed', () => {
      render(<DashboardSettingsModal {...dangerProps} />);
      fireEvent.click(getDeleteAllButton());

      fireEvent.click(screen.getByTestId('confirm-delete-button'));

      expect(dangerProps.onDeleteAll).not.toHaveBeenCalled();
    });

    it('should call onDeleteAll once the confirm phrase is typed', () => {
      render(<DashboardSettingsModal {...dangerProps} />);
      fireEvent.click(getDeleteAllButton());

      fireEvent.change(screen.getByLabelText(/type .* to confirm/i), {
        target: { value: 'DELETE ALL' },
      });
      fireEvent.click(screen.getByTestId('confirm-delete-button'));

      expect(dangerProps.onDeleteAll).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteNonActive once its confirm phrase is typed', () => {
      render(<DashboardSettingsModal {...dangerProps} />);
      fireEvent.click(getDeleteNonActiveButton());

      fireEvent.change(screen.getByLabelText(/type .* to confirm/i), {
        target: { value: 'DELETE' },
      });
      fireEvent.click(screen.getByTestId('confirm-delete-button'));

      expect(dangerProps.onDeleteNonActive).toHaveBeenCalledTimes(1);
    });

    it('should close the confirmation after a successful delete', async () => {
      render(<DashboardSettingsModal {...dangerProps} />);
      fireEvent.click(getDeleteAllButton());

      fireEvent.change(screen.getByLabelText(/type .* to confirm/i), {
        target: { value: 'DELETE ALL' },
      });
      fireEvent.click(screen.getByTestId('confirm-delete-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-delete-backdrop')).not.toBeInTheDocument();
      });
    });

    it('should keep the confirmation open when the delete fails', async () => {
      const onDeleteAll = jest.fn().mockRejectedValue(new Error('network down'));
      render(<DashboardSettingsModal {...dangerProps} onDeleteAll={onDeleteAll} />);
      fireEvent.click(getDeleteAllButton());

      fireEvent.change(screen.getByLabelText(/type .* to confirm/i), {
        target: { value: 'DELETE ALL' },
      });
      fireEvent.click(screen.getByTestId('confirm-delete-button'));

      await waitFor(() => expect(onDeleteAll).toHaveBeenCalled());
      expect(screen.getByTestId('confirm-delete-backdrop')).toBeInTheDocument();
    });

    it('should surface the delete error in the confirmation', () => {
      render(<DashboardSettingsModal {...dangerProps} deleteError="Server unavailable" />);
      fireEvent.click(getDeleteAllButton());

      expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
    });

    it('should not close the settings modal when the confirmation is clicked', () => {
      render(<DashboardSettingsModal {...dangerProps} />);
      fireEvent.click(getDeleteAllButton());

      fireEvent.click(screen.getByRole('dialog', { name: 'Delete All Applications' }));

      expect(dangerProps.onClose).not.toHaveBeenCalled();
    });

    it('should not close the settings modal when the confirmation backdrop is clicked', () => {
      render(<DashboardSettingsModal {...dangerProps} />);
      fireEvent.click(getDeleteAllButton());

      fireEvent.click(screen.getByTestId('confirm-delete-backdrop'));

      expect(dangerProps.onClose).not.toHaveBeenCalled();
    });
  });
});
