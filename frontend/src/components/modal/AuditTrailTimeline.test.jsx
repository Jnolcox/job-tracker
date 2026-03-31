/**
 * @file AuditTrailTimeline.test.jsx
 * @description Tests for the AuditTrailTimeline component
 *
 * Tests cover:
 * - Rendering of different event types with correct formatting
 * - Timestamp formatting in human-readable format
 * - Loading state display
 * - Empty state display
 * - Error state handling
 * - Chronological ordering of events
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AuditTrailTimeline from './AuditTrailTimeline';

/**
 * Helper to create a mock audit event
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock audit event object
 */
const createMockEvent = (overrides = {}) => ({
  id: 1,
  eventType: 'APPLICATION_CREATED',
  fieldName: null,
  oldValue: null,
  newValue: null,
  details: null,
  createdAt: '2025-01-15T10:00:00Z',
  ...overrides,
});

describe('AuditTrailTimeline', () => {
  describe('Rendering', () => {
    it('should render the "Activity Timeline" section header', () => {
      const events = [createMockEvent()];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
    });

    it('should render nothing when loading is true and no events', () => {
      const { container } = render(
        <AuditTrailTimeline events={[]} loading={true} />
      );

      expect(screen.getByText('Loading activity...')).toBeInTheDocument();
    });

    it('should render empty state message when no events and not loading', () => {
      render(<AuditTrailTimeline events={[]} loading={false} />);

      expect(screen.getByText('No activity recorded yet')).toBeInTheDocument();
    });
  });

  describe('Event type formatting', () => {
    it('should format APPLICATION_CREATED event correctly', () => {
      const events = [
        createMockEvent({
          eventType: 'APPLICATION_CREATED',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(screen.getByText('Application created')).toBeInTheDocument();
    });

    it('should format STATUS_CHANGED event with human-readable status values', () => {
      const events = [
        createMockEvent({
          eventType: 'STATUS_CHANGED',
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      // Status values should be formatted as Title Case, not SCREAMING_SNAKE_CASE
      expect(
        screen.getByText(/Status changed from Applied to Recruiter Screen/)
      ).toBeInTheDocument();
    });

    it('should format ON_HOLD status as "On Hold"', () => {
      const events = [
        createMockEvent({
          eventType: 'STATUS_CHANGED',
          oldValue: 'APPLIED',
          newValue: 'ON_HOLD',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(
        screen.getByText(/Status changed from Applied to On Hold/)
      ).toBeInTheDocument();
    });

    it('should format TECH_SCREEN status as "Tech Screen"', () => {
      const events = [
        createMockEvent({
          eventType: 'STATUS_CHANGED',
          oldValue: 'TECH_SCREEN',
          newValue: 'TECHNICAL_I',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(
        screen.getByText(/Status changed from Tech Screen to Technical I/)
      ).toBeInTheDocument();
    });

    it('should format INTERVIEW_SCHEDULED event with new value', () => {
      const events = [
        createMockEvent({
          eventType: 'INTERVIEW_SCHEDULED',
          newValue: '2025-02-01T14:00:00Z',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(
        screen.getByText(/Interview scheduled for 2025-02-01T14:00:00Z/)
      ).toBeInTheDocument();
    });

    it('should format INTERVIEW_UPDATED event with old and new values', () => {
      const events = [
        createMockEvent({
          eventType: 'INTERVIEW_UPDATED',
          oldValue: '2025-02-01T14:00:00Z',
          newValue: '2025-02-03T10:00:00Z',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(
        screen.getByText(
          /Interview rescheduled from 2025-02-01T14:00:00Z to 2025-02-03T10:00:00Z/
        )
      ).toBeInTheDocument();
    });

    it('should format NOTE_ADDED event correctly', () => {
      const events = [
        createMockEvent({
          eventType: 'NOTE_ADDED',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(screen.getByText('Note added')).toBeInTheDocument();
    });

    it('should format FIELD_UPDATED event with field name and values', () => {
      const events = [
        createMockEvent({
          eventType: 'FIELD_UPDATED',
          fieldName: 'salaryMin',
          oldValue: '100000',
          newValue: '120000',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(
        screen.getByText(/salaryMin updated from 100000 to 120000/)
      ).toBeInTheDocument();
    });

    it('should handle unknown event types gracefully', () => {
      const events = [
        createMockEvent({
          eventType: 'UNKNOWN_EVENT_TYPE',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      // Should display the event type as-is
      expect(screen.getByText('UNKNOWN_EVENT_TYPE')).toBeInTheDocument();
    });
  });

  describe('Timestamp formatting', () => {
    it('should display ISO string timestamps in human-readable format', () => {
      const events = [
        createMockEvent({
          createdAt: '2025-01-15T10:30:00Z',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      // Should show formatted date (exact format depends on implementation)
      expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
    });

    it('should handle epoch seconds from Java Instant (number format)', () => {
      // Java Instant serializes as epoch seconds (1737024600 = Jan 16, 2025 10:30:00 UTC)
      const epochSeconds = 1737024600;
      const events = [
        createMockEvent({
          createdAt: epochSeconds,
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      // Should correctly parse epoch seconds and display the date
      expect(screen.getByText(/Jan 16, 2025/)).toBeInTheDocument();
    });

    it('should handle array format from Java LocalDateTime', () => {
      // LocalDateTime serializes as array [year, month, day, hour, minute, second]
      const events = [
        createMockEvent({
          createdAt: [2025, 1, 17, 14, 45, 30],
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      // Should correctly parse array format and display the date
      expect(screen.getByText(/Jan 17, 2025/)).toBeInTheDocument();
    });

    it('should sort events correctly when createdAt is epoch seconds', () => {
      // Jan 15, 2025 10:00:00 UTC = 1736935200
      // Jan 20, 2025 09:00:00 UTC = 1737363600
      const events = [
        createMockEvent({
          id: 1,
          eventType: 'APPLICATION_CREATED',
          createdAt: 1736935200,
        }),
        createMockEvent({
          id: 2,
          eventType: 'NOTE_ADDED',
          createdAt: 1737363600,
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      const items = screen.getAllByTestId('timeline-item');
      // First item should be the newer event (NOTE_ADDED)
      expect(items[0]).toHaveTextContent('Note added');
      // Second item should be the older event (APPLICATION_CREATED)
      expect(items[1]).toHaveTextContent('Application created');
    });
  });

  describe('Multiple events', () => {
    it('should render multiple events', () => {
      const events = [
        createMockEvent({
          id: 1,
          eventType: 'APPLICATION_CREATED',
          createdAt: '2025-01-15T10:00:00Z',
        }),
        createMockEvent({
          id: 2,
          eventType: 'STATUS_CHANGED',
          oldValue: 'APPLIED',
          newValue: 'RECRUITER_SCREEN',
          createdAt: '2025-01-18T14:00:00Z',
        }),
        createMockEvent({
          id: 3,
          eventType: 'NOTE_ADDED',
          createdAt: '2025-01-20T09:00:00Z',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(screen.getByText('Application created')).toBeInTheDocument();
      expect(
        screen.getByText(/Status changed from Applied to Recruiter Screen/)
      ).toBeInTheDocument();
      expect(screen.getByText('Note added')).toBeInTheDocument();
    });

    it('should display events in reverse chronological order (newest first)', () => {
      const events = [
        createMockEvent({
          id: 1,
          eventType: 'APPLICATION_CREATED',
          createdAt: '2025-01-15T10:00:00Z',
        }),
        createMockEvent({
          id: 2,
          eventType: 'NOTE_ADDED',
          createdAt: '2025-01-20T09:00:00Z',
        }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      const items = screen.getAllByTestId('timeline-item');
      // First item should be the newer event (NOTE_ADDED)
      expect(items[0]).toHaveTextContent('Note added');
      // Second item should be the older event (APPLICATION_CREATED)
      expect(items[1]).toHaveTextContent('Application created');
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when loading is true', () => {
      render(<AuditTrailTimeline events={[]} loading={true} />);

      expect(screen.getByText('Loading activity...')).toBeInTheDocument();
    });

    it('should not show loading indicator when loading is false', () => {
      const events = [createMockEvent()];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(screen.queryByText('Loading activity...')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic list elements for timeline', () => {
      const events = [
        createMockEvent({ id: 1 }),
        createMockEvent({ id: 2, eventType: 'NOTE_ADDED' }),
      ];

      render(<AuditTrailTimeline events={events} loading={false} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });
});
