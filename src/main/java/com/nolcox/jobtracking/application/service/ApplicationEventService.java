package com.nolcox.jobtracking.application.service;

import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;

import java.time.Instant;
import java.util.List;

/**
 * Service interface for managing application audit trail events.
 *
 * <p>This service provides methods to:</p>
 * <ul>
 *   <li>Log various types of events (creation, status changes, field updates, etc.)</li>
 *   <li>Retrieve events for a specific application</li>
 *   <li>Compare application states and automatically generate change events</li>
 * </ul>
 *
 * <p>The audit trail provides complete visibility into what happened to an application
 * and when, helping users track their job search progress over time.</p>
 *
 * <p>Example usage in JobApplicationService:</p>
 * <pre>{@code
 * // After creating an application
 * eventService.logApplicationCreated(savedApplication);
 *
 * // After updating an application
 * eventService.compareAndLogChanges(oldApplication, updatedApplication);
 * }</pre>
 *
 * @see com.nolcox.jobtracking.domain.entity.ApplicationEvent
 * @see com.nolcox.jobtracking.domain.entity.EventType
 */
public interface ApplicationEventService {

    /**
     * Logs an APPLICATION_CREATED event for a newly created application.
     *
     * <p>This should be called immediately after a new job application is persisted
     * to the database. It marks the beginning of the application's audit trail.</p>
     *
     * @param application the newly created job application
     */
    void logApplicationCreated(JobApplication application);

    /**
     * Logs a STATUS_CHANGED event when an application's status is updated.
     *
     * @param application the job application
     * @param oldStatus   the previous status value
     * @param newStatus   the new status value
     */
    void logStatusChanged(JobApplication application, ApplicationStatus oldStatus, ApplicationStatus newStatus);

    /**
     * Logs an INTERVIEW_SCHEDULED event when an interview date is set for the first time.
     *
     * @param application     the job application
     * @param interviewDate   the newly scheduled interview date
     */
    void logInterviewScheduled(JobApplication application, Instant interviewDate);

    /**
     * Logs an INTERVIEW_UPDATED event when an existing interview date is changed.
     *
     * @param application         the job application
     * @param oldInterviewDate    the previous interview date
     * @param newInterviewDate    the new interview date
     */
    void logInterviewUpdated(JobApplication application, Instant oldInterviewDate, Instant newInterviewDate);

    /**
     * Logs a FIELD_UPDATED event for a generic field change.
     *
     * <p>Use this for significant field changes that don't have a dedicated event type.
     * The old and new values are stored as strings.</p>
     *
     * @param application the job application
     * @param fieldName   the name of the field that changed
     * @param oldValue    the previous value (as string)
     * @param newValue    the new value (as string)
     */
    void logFieldUpdated(JobApplication application, String fieldName, String oldValue, String newValue);

    /**
     * Logs a NOTE_ADDED event when notes are added or modified.
     *
     * @param application the job application
     * @param oldNotes    the previous notes (can be null)
     * @param newNotes    the new notes
     */
    void logNoteAdded(JobApplication application, String oldNotes, String newNotes);

    /**
     * Retrieves all events for a specific application.
     *
     * <p>Authorization check: The requesting user must own the application.
     * Events are returned in reverse chronological order (newest first).</p>
     *
     * @param applicationId the ID of the job application
     * @param userId        the ID of the requesting user (for authorization)
     * @return list of events ordered by createdAt descending
     * @throws com.nolcox.jobtracking.shared.exception.ResourceNotFoundException if application not found
     * @throws com.nolcox.jobtracking.shared.exception.UnauthorizedException if user doesn't own the application
     */
    List<ApplicationEventResponse> getEventsForApplication(Long applicationId, Long userId);

    /**
     * Retrieves all events for all applications owned by a specific user.
     *
     * <p>This bulk method provides an efficient way to fetch all audit events for a user
     * in a single database call, rather than making N separate calls (one per application).
     * This is particularly useful for dashboard views or activity feeds that need to show
     * events across all applications.</p>
     *
     * <p>Events are returned in reverse chronological order (newest first) to support
     * typical activity feed display patterns.</p>
     *
     * @param userId the ID of the user whose application events to retrieve
     * @return list of all events for the user's applications, ordered by createdAt descending
     */
    List<ApplicationEventResponse> getAllEventsForUser(Long userId);

    /**
     * Compares old and new application states and logs all detected changes.
     *
     * <p>This is the primary method used during application updates. It automatically
     * detects what changed and generates the appropriate events:</p>
     * <ul>
     *   <li>Status changes -> STATUS_CHANGED event</li>
     *   <li>Interview date set -> INTERVIEW_SCHEDULED event</li>
     *   <li>Interview date changed -> INTERVIEW_UPDATED event</li>
     *   <li>Notes added/changed -> NOTE_ADDED event</li>
     *   <li>Other field changes -> FIELD_UPDATED events</li>
     * </ul>
     *
     * <p>Example:</p>
     * <pre>{@code
     * // Capture old state before update
     * JobApplication oldState = copyOf(existingApplication);
     *
     * // Apply updates
     * modelMapper.map(request, existingApplication);
     * JobApplication updatedApplication = repository.save(existingApplication);
     *
     * // Log all changes
     * eventService.compareAndLogChanges(oldState, updatedApplication);
     * }</pre>
     *
     * @param oldApplication the application state before the update
     * @param newApplication the application state after the update
     */
    void compareAndLogChanges(JobApplication oldApplication, JobApplication newApplication);
}
