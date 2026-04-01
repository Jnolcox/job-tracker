/**
 * @file JourneyTimeline.test.jsx
 * @description Tests for the JourneyTimeline component.
 */

import { render, screen } from '@testing-library/react';
import JourneyTimeline from './JourneyTimeline';

describe('JourneyTimeline', () => {
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

  // Mock date for consistent testing
  const originalDate = Date;
  const mockNow = new Date('2025-01-20T10:00:00Z');

  beforeAll(() => {
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) return mockNow;
        return new originalDate(...args);
      }
      static now() {
        return mockNow.getTime();
      }
    };
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  it('renders the component with section header', () => {
    render(<JourneyTimeline applicationId={1} events={[]} />);
    expect(screen.getByText('Stage History')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<JourneyTimeline applicationId={1} events={[]} />);
    expect(screen.getByText('No stage history available')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<JourneyTimeline applicationId={1} events={[]} loading={true} />);
    expect(screen.getByText('Loading journey...')).toBeInTheDocument();
  });

  it('renders stage bars for each stage in the journey', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        oldValue: null,
        newValue: null,
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
      createEvent({
        id: 3,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'RECRUITER_SCREEN',
        newValue: 'TECHNICAL_I',
        createdAt: '2025-01-10T10:00:00Z',
      }),
    ];

    render(<JourneyTimeline applicationId={1} events={events} />);

    // Should have 3 stage bars
    const stageBars = screen.getAllByTestId('stage-bar');
    expect(stageBars).toHaveLength(3);

    // Check stage labels are present
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Screen')).toBeInTheDocument();
    expect(screen.getByText('Technical I')).toBeInTheDocument();
  });

  it('displays duration for each stage', () => {
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
        createdAt: '2025-01-05T10:00:00Z', // 4 days in APPLIED
      }),
    ];

    render(<JourneyTimeline applicationId={1} events={events} />);

    // APPLIED should show 4 days
    expect(screen.getByText('4 days')).toBeInTheDocument();
  });

  it('shows "< 1 day" for zero duration', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-20T08:00:00Z', // Same day as mock now
      }),
      createEvent({
        id: 2,
        applicationId: 1,
        eventType: 'STATUS_CHANGED',
        oldValue: 'APPLIED',
        newValue: 'RECRUITER_SCREEN',
        createdAt: '2025-01-20T09:00:00Z', // 1 hour later
      }),
    ];

    render(<JourneyTimeline applicationId={1} events={events} />);

    // Should show "< 1 day" for both stages
    const shortDurations = screen.getAllByText('< 1 day');
    expect(shortDurations.length).toBeGreaterThan(0);
  });

  it('shows total days in date range', () => {
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
        createdAt: '2025-01-05T10:00:00Z',
      }),
    ];

    render(<JourneyTimeline applicationId={1} events={events} />);

    // Should show date range with total days
    expect(screen.getByText(/days total/)).toBeInTheDocument();
  });

  it('filters events to only the specified application', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
      createEvent({
        id: 2,
        applicationId: 2, // Different application
        eventType: 'CREATED',
        createdAt: '2025-01-02T10:00:00Z',
      }),
    ];

    render(<JourneyTimeline applicationId={1} events={events} />);

    // Should only show 1 stage bar for app 1
    const stageBars = screen.getAllByTestId('stage-bar');
    expect(stageBars).toHaveLength(1);
  });

  it('returns empty state when applicationId is null', () => {
    const events = [
      createEvent({
        id: 1,
        applicationId: 1,
        eventType: 'CREATED',
        createdAt: '2025-01-01T10:00:00Z',
      }),
    ];

    render(<JourneyTimeline applicationId={null} events={events} />);
    expect(screen.getByText('No stage history available')).toBeInTheDocument();
  });
});
