/**
 * @file ConfigContext.test.js
 * @description Tests for ConfigContext - provides backend configuration to components
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ConfigProvider, useConfig } from './ConfigContext';
import { configAPI } from '../services/api';

// Mock the configAPI
jest.mock('../services/api', () => ({
  configAPI: {
    getStatuses: jest.fn(),
    getOptions: jest.fn(),
  },
}));

// Test component to access context
function TestConsumer() {
  const config = useConfig();
  return (
    <div>
      <span data-testid="loading">{config.loading.toString()}</span>
      <span data-testid="error">{config.error?.message || 'no-error'}</span>
      <span data-testid="statuses-count">{config.statuses.length}</span>
      <span data-testid="groups-count">{Object.keys(config.groups).length}</span>
      <span data-testid="rto-types-count">{config.rtoTypes.length}</span>
      <span data-testid="levels-count">{config.levels.length}</span>
      {config.statuses.length > 0 && (
        <span data-testid="first-status">{config.statuses[0].key}</span>
      )}
      {config.rtoTypes.length > 0 && (
        <span data-testid="first-rto">{config.rtoTypes[0].key}</span>
      )}
    </div>
  );
}

describe('ConfigContext', () => {
  const mockStatusesResponse = {
    data: {
      statuses: [
        { key: 'APPLIED', label: 'Applied', color: '#4E9AF1', group: 'ACTIVE' },
        { key: 'RECRUITER_SCREEN', label: 'Recruiter Screen', color: '#A78BFA', group: 'INTERVIEWING' },
        { key: 'REJECTED', label: 'Rejected', color: '#F87171', group: 'REJECTED' },
      ],
      groups: {
        ACTIVE: ['APPLIED'],
        INTERVIEWING: ['RECRUITER_SCREEN'],
        REJECTED: ['REJECTED'],
      },
    },
  };

  const mockOptionsResponse = {
    data: {
      rtoTypes: [
        { key: 'REMOTE', label: 'Remote' },
        { key: 'HYBRID_2', label: 'Hybrid (2 days)' },
        { key: 'ONSITE', label: 'On-site' },
      ],
      levels: [
        { key: 'JUNIOR', label: 'Junior' },
        { key: 'SENIOR', label: 'Senior' },
        { key: 'STAFF', label: 'Staff' },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', async () => {
    // Make the API calls hang to test loading state
    configAPI.getStatuses.mockImplementation(() => new Promise(() => {}));
    configAPI.getOptions.mockImplementation(() => new Promise(() => {}));

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('should load and provide config data', async () => {
    configAPI.getStatuses.mockResolvedValue(mockStatusesResponse);
    configAPI.getOptions.mockResolvedValue(mockOptionsResponse);

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('statuses-count')).toHaveTextContent('3');
    expect(screen.getByTestId('groups-count')).toHaveTextContent('3');
    expect(screen.getByTestId('rto-types-count')).toHaveTextContent('3');
    expect(screen.getByTestId('levels-count')).toHaveTextContent('3');
    expect(screen.getByTestId('first-status')).toHaveTextContent('APPLIED');
    expect(screen.getByTestId('first-rto')).toHaveTextContent('REMOTE');
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    configAPI.getStatuses.mockRejectedValue(error);
    configAPI.getOptions.mockRejectedValue(error);

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Network error');
  });

  it('should provide fallback values when config fails to load', async () => {
    configAPI.getStatuses.mockRejectedValue(new Error('Failed'));
    configAPI.getOptions.mockRejectedValue(new Error('Failed'));

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Should have fallback empty arrays
    expect(screen.getByTestId('statuses-count')).toHaveTextContent('0');
    expect(screen.getByTestId('rto-types-count')).toHaveTextContent('0');
    expect(screen.getByTestId('levels-count')).toHaveTextContent('0');
  });

  it('should throw error when useConfig is used outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useConfig must be used within a ConfigProvider');

    consoleSpy.mockRestore();
  });

  describe('helper functions', () => {
    it('should provide getStatusLabel function', async () => {
      configAPI.getStatuses.mockResolvedValue(mockStatusesResponse);
      configAPI.getOptions.mockResolvedValue(mockOptionsResponse);

      function LabelTestConsumer() {
        const { getStatusLabel } = useConfig();
        return (
          <div>
            <span data-testid="applied-label">{getStatusLabel('APPLIED')}</span>
            <span data-testid="unknown-label">{getStatusLabel('UNKNOWN')}</span>
          </div>
        );
      }

      render(
        <ConfigProvider>
          <LabelTestConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('applied-label')).toHaveTextContent('Applied');
      });

      expect(screen.getByTestId('unknown-label')).toHaveTextContent('UNKNOWN');
    });

    it('should provide getStatusColor function', async () => {
      configAPI.getStatuses.mockResolvedValue(mockStatusesResponse);
      configAPI.getOptions.mockResolvedValue(mockOptionsResponse);

      function ColorTestConsumer() {
        const { getStatusColor } = useConfig();
        return (
          <div>
            <span data-testid="applied-color">{getStatusColor('APPLIED')}</span>
            <span data-testid="unknown-color">{getStatusColor('UNKNOWN')}</span>
          </div>
        );
      }

      render(
        <ConfigProvider>
          <ColorTestConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('applied-color')).toHaveTextContent('#4E9AF1');
      });

      expect(screen.getByTestId('unknown-color')).toHaveTextContent('#6B7280');
    });

    it('should provide isStatusInGroup function', async () => {
      configAPI.getStatuses.mockResolvedValue(mockStatusesResponse);
      configAPI.getOptions.mockResolvedValue(mockOptionsResponse);

      function GroupTestConsumer() {
        const { isStatusInGroup } = useConfig();
        return (
          <div>
            <span data-testid="applied-in-active">{isStatusInGroup('APPLIED', 'ACTIVE').toString()}</span>
            <span data-testid="applied-in-rejected">{isStatusInGroup('APPLIED', 'REJECTED').toString()}</span>
            <span data-testid="rejected-in-rejected">{isStatusInGroup('REJECTED', 'REJECTED').toString()}</span>
          </div>
        );
      }

      render(
        <ConfigProvider>
          <GroupTestConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('applied-in-active')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('applied-in-rejected')).toHaveTextContent('false');
      expect(screen.getByTestId('rejected-in-rejected')).toHaveTextContent('true');
    });

    it('should provide getRtoLabel function', async () => {
      configAPI.getStatuses.mockResolvedValue(mockStatusesResponse);
      configAPI.getOptions.mockResolvedValue(mockOptionsResponse);

      function RtoTestConsumer() {
        const { getRtoLabel } = useConfig();
        return (
          <div>
            <span data-testid="remote-label">{getRtoLabel('REMOTE')}</span>
            <span data-testid="unknown-rto-label">{getRtoLabel('UNKNOWN')}</span>
          </div>
        );
      }

      render(
        <ConfigProvider>
          <RtoTestConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('remote-label')).toHaveTextContent('Remote');
      });

      expect(screen.getByTestId('unknown-rto-label')).toHaveTextContent('UNKNOWN');
    });

    it('should provide getLevelLabel function', async () => {
      configAPI.getStatuses.mockResolvedValue(mockStatusesResponse);
      configAPI.getOptions.mockResolvedValue(mockOptionsResponse);

      function LevelTestConsumer() {
        const { getLevelLabel } = useConfig();
        return (
          <div>
            <span data-testid="senior-label">{getLevelLabel('SENIOR')}</span>
            <span data-testid="unknown-level-label">{getLevelLabel('UNKNOWN')}</span>
          </div>
        );
      }

      render(
        <ConfigProvider>
          <LevelTestConsumer />
        </ConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('senior-label')).toHaveTextContent('Senior');
      });

      expect(screen.getByTestId('unknown-level-label')).toHaveTextContent('UNKNOWN');
    });
  });
});
