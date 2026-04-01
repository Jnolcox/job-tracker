/**
 * @file StageDurationChart.test.jsx
 * @description Tests for the StageDurationChart component.
 */

import { render, screen } from '@testing-library/react';
import StageDurationChart from './StageDurationChart';

describe('StageDurationChart', () => {
  // Helper to create mock events
  const createEvent = (overrides = {}) => ({
    id: 1,
    applicationId: 1,
    eventType: 'STATUS_CHANGED',
    fieldName: 'status',
    oldValue: 'APPLIED',
    newValue: 'RECRUITER_SCREEN',
    createdAt: '2025-01-15T10:00:00Z',
    ...overrides,
  });

  it('renders the chart with header', () => {
    render(<StageDurationChart events={[]} />);
    expect(screen.getByText('Avg. Time Per Stage (days)')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<StageDurationChart events={[]} />);
    expect(screen.getByText('No stage data available yet')).toBeInTheDocument();
  });

  it('shows empty state when events is null', () => {
    render(<StageDurationChart events={null} />);
    expect(screen.getByText('No stage data available yet')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<StageDurationChart events={[]} loading={true} />);
    expect(screen.getByText('Calculating averages...')).toBeInTheDocument();
  });

  it('renders stage bars for stages with data', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-06T10:00:00Z', // 5 days in APPLIED
      }),
      createEvent({
        id: 3,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'RECRUITER_SCREEN',
        newValue: 'TECHNICAL_I',
        createdAt: '2025-01-13T10:00:00Z', // 7 days in RECRUITER_SCREEN
      }),
    ];

    render(<StageDurationChart events={events} />);

    // Should render stage bars
    const stageBars = screen.getAllByTestId('stage-bar');
    expect(stageBars.length).toBeGreaterThan(0);

    // Should show stage labels
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Screen')).toBeInTheDocument();
  });

  it('displays duration values for each stage', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-06T10:00:00Z', // 5 days
      }),
    ];

    render(<StageDurationChart events={events} />);

    // Should show duration
    expect(screen.getByText('5d')).toBeInTheDocument();
  });

  it('shows bottleneck indicator when showBottlenecks is true', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-15T10:00:00Z', // 14 days - bottleneck
      }),
    ];

    render(<StageDurationChart events={events} showBottlenecks={true} />);

    // Should show bottleneck highlight indicator
    expect(screen.getByText('Bottlenecks highlighted')).toBeInTheDocument();
  });

  it('hides bottleneck indicator when showBottlenecks is false', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-15T10:00:00Z',
      }),
    ];

    render(<StageDurationChart events={events} showBottlenecks={false} />);

    // Should not show bottleneck text
    expect(screen.queryByText('Bottlenecks highlighted')).not.toBeInTheDocument();
  });

  it('renders legend items', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-06T10:00:00Z',
      }),
    ];

    render(<StageDurationChart events={events} />);

    // Should render legend
    expect(screen.getByText('< 5 days')).toBeInTheDocument();
    expect(screen.getByText('5-10 days')).toBeInTheDocument();
    expect(screen.getByText('> 10 days')).toBeInTheDocument();
  });

  it('aggregates data from multiple applications', () => {
    const events = [
      // App 1: 4 days in APPLIED
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-05T10:00:00Z',
      }),
      // App 2: 6 days in APPLIED
      createEvent({
        id: 3,
        applicationId: 2,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 4,
        applicationId: 2,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'REJECTED',
        createdAt: '2025-01-07T10:00:00Z',
      }),
    ];

    render(<StageDurationChart events={events} />);

    // Average APPLIED time should be (4 + 6) / 2 = 5 days
    expect(screen.getByText('5d')).toBeInTheDocument();
  });
});
