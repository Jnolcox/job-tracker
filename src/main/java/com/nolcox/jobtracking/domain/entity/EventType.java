package com.nolcox.jobtracking.domain.entity;

/**
 * Defines the types of events that can occur during the lifecycle of a job application.
 *
 * <p>These event types are used in the audit trail to track significant changes
 * and milestones for each job application. The audit trail provides users with
 * a complete history of their application's progress.</p>
 *
 * <p>Event types are categorized as follows:</p>
 * <ul>
 *   <li><b>Lifecycle events</b>: APPLICATION_CREATED - marks the initial creation</li>
 *   <li><b>Status events</b>: STATUS_CHANGED - tracks progression through application stages</li>
 *   <li><b>Interview events</b>: INTERVIEW_SCHEDULED, INTERVIEW_UPDATED - tracks interview scheduling</li>
 *   <li><b>Field events</b>: FIELD_UPDATED - captures changes to application fields</li>
 *   <li><b>Note events</b>: NOTE_ADDED - tracks when notes are added or modified</li>
 * </ul>
 *
 * @see ApplicationEvent
 */
public enum EventType {

    /**
     * Event triggered when a new job application is created.
     * This is always the first event in any application's audit trail.
     */
    APPLICATION_CREATED,

    /**
     * Event triggered when the application status changes.
     * The old and new status values are captured in the event details.
     */
    STATUS_CHANGED,

    /**
     * Event triggered when an interview date is scheduled for the first time.
     * Indicates a significant milestone in the application process.
     */
    INTERVIEW_SCHEDULED,

    /**
     * Event triggered when an existing interview date is modified.
     * Captures both the old and new interview dates.
     */
    INTERVIEW_UPDATED,

    /**
     * Event triggered when any significant field is updated.
     * The fieldName, oldValue, and newValue are captured in the event.
     */
    FIELD_UPDATED,

    /**
     * Event triggered when notes are added or modified.
     * Helps track the history of user annotations on the application.
     */
    NOTE_ADDED
}
