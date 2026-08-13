package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.application.service.ApplicationEventService;
import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.EventType;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.ErrorMessages;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;

import static com.nolcox.jobtracking.shared.exception.ErrorMessages.APPLICATION_NOT_FOUND;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

/**
 * Implementation of {@link ApplicationEventService} for managing application audit trail events.
 *
 * <p>This service is responsible for creating and retrieving audit events that track
 * all significant changes to job applications. The audit trail provides users with
 * a complete history of their application's lifecycle.</p>
 *
 * <p>Design decisions:</p>
 * <ul>
 *   <li>Events are created within the same transaction as the application update
 *       to ensure consistency (if the update fails, no event is recorded)</li>
 *   <li>All values are stored as strings for uniform storage and display</li>
 *   <li>The compareAndLogChanges method provides a convenient way to detect and
 *       log multiple changes in a single call</li>
 * </ul>
 *
 * @see ApplicationEventService
 * @see ApplicationEvent
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ApplicationEventServiceImpl implements ApplicationEventService {

    private final ApplicationEventRepository eventRepository;
    private final JobApplicationRepository applicationRepository;

    /**
     * {@inheritDoc}
     *
     * <p>Creates an APPLICATION_CREATED event to mark the beginning of the application's
     * audit trail. The event captures the initial status and company name in the details.</p>
     */
    @Override
    public void logApplicationCreated(JobApplication application) {
        log.debug("Logging APPLICATION_CREATED event for application ID: {}", application.getId());

        ApplicationEvent event = ApplicationEvent.builder()
                .application(application)
                .eventType(EventType.APPLICATION_CREATED)
                .details(String.format("Application created for %s at %s",
                        application.getPositionTitle(), application.getCompanyName()))
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Creates a STATUS_CHANGED event capturing the transition from one status to another.
     * Status changes are significant milestones in the application lifecycle.</p>
     */
    @Override
    public void logStatusChanged(JobApplication application, ApplicationStatus oldStatus, ApplicationStatus newStatus) {
        log.debug("Logging STATUS_CHANGED event for application ID: {} ({} -> {})",
                application.getId(), oldStatus, newStatus);

        ApplicationEvent event = ApplicationEvent.builder()
                .application(application)
                .eventType(EventType.STATUS_CHANGED)
                .fieldName("status")
                .oldValue(oldStatus != null ? oldStatus.name() : null)
                .newValue(newStatus != null ? newStatus.name() : null)
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Creates an INTERVIEW_SCHEDULED event when an interview date is first set.
     * This is a significant milestone indicating progression in the interview process.</p>
     */
    @Override
    public void logInterviewScheduled(JobApplication application, Instant interviewDate) {
        log.debug("Logging INTERVIEW_SCHEDULED event for application ID: {}", application.getId());

        ApplicationEvent event = ApplicationEvent.builder()
                .application(application)
                .eventType(EventType.INTERVIEW_SCHEDULED)
                .fieldName("interviewDate")
                .oldValue(null)
                .newValue(interviewDate != null ? interviewDate.toString() : null)
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Creates an INTERVIEW_UPDATED event when an existing interview date is modified.
     * Tracks rescheduling of interviews.</p>
     */
    @Override
    public void logInterviewUpdated(JobApplication application, Instant oldInterviewDate, Instant newInterviewDate) {
        log.debug("Logging INTERVIEW_UPDATED event for application ID: {}", application.getId());

        ApplicationEvent event = ApplicationEvent.builder()
                .application(application)
                .eventType(EventType.INTERVIEW_UPDATED)
                .fieldName("interviewDate")
                .oldValue(oldInterviewDate != null ? oldInterviewDate.toString() : null)
                .newValue(newInterviewDate != null ? newInterviewDate.toString() : null)
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Creates a FIELD_UPDATED event for generic field changes. This is used for
     * significant fields that don't have a dedicated event type.</p>
     */
    @Override
    public void logFieldUpdated(JobApplication application, String fieldName, String oldValue, String newValue) {
        log.debug("Logging FIELD_UPDATED event for application ID: {}, field: {}",
                application.getId(), fieldName);

        ApplicationEvent event = ApplicationEvent.builder()
                .application(application)
                .eventType(EventType.FIELD_UPDATED)
                .fieldName(fieldName)
                .oldValue(truncateForAudit(oldValue))
                .newValue(truncateForAudit(newValue))
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Creates a NOTE_ADDED event when notes are added or modified.
     * Notes often contain important context about the application.</p>
     */
    @Override
    public void logNoteAdded(JobApplication application, String oldNotes, String newNotes) {
        log.debug("Logging NOTE_ADDED event for application ID: {}", application.getId());

        ApplicationEvent event = ApplicationEvent.builder()
                .application(application)
                .eventType(EventType.NOTE_ADDED)
                .fieldName("notes")
                .oldValue(truncateForAudit(oldNotes))
                .newValue(truncateForAudit(newNotes))
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
    }

    /**
     * {@inheritDoc}
     *
     * <p>This bulk query is more efficient than fetching events per application because
     * it uses a single database call with a JOIN through the application to the user.
     * No additional authorization check is needed since the query itself filters by userId.</p>
     */
    @Override
    @Transactional(readOnly = true)
    public List<ApplicationEventResponse> getAllEventsForUser(Long userId) {
        log.debug("Fetching all events for user ID: {}", userId);

        // PERFORMANCE: Single query to get all events for all user's applications
        // The query joins through application.user.id, so only the user's events are returned
        List<ApplicationEvent> events = eventRepository.findAllByUserId(userId);

        return events.stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * {@inheritDoc}
     *
     * <p>Authorization is enforced by checking that the requesting user owns the application.
     * Events are returned in reverse chronological order for display in the UI.</p>
     */
    @Override
    @Transactional(readOnly = true)
    public List<ApplicationEventResponse> getEventsForApplication(Long applicationId, Long userId) {
        log.debug("Fetching events for application ID: {}, requested by user ID: {}", applicationId, userId);

        // AUTHORIZATION: Verify the user owns this application before returning events
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException(APPLICATION_NOT_FOUND));

        assertUserOwnsApplication(application, userId);

        List<ApplicationEvent> events = eventRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);

        return events.stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * {@inheritDoc}
     *
     * <p>This method performs field-by-field comparison between the old and new states,
     * generating appropriate events for each detected change. The comparison logic:</p>
     * <ul>
     *   <li>Status changes are always detected and logged as STATUS_CHANGED</li>
     *   <li>Interview date changes are logged as INTERVIEW_SCHEDULED (if newly set)
     *       or INTERVIEW_UPDATED (if modified)</li>
     *   <li>Notes changes are logged as NOTE_ADDED</li>
     *   <li>Other significant field changes are logged as FIELD_UPDATED</li>
     * </ul>
     *
     * <p>DESIGN NOTE: The generic helper method {@link #compareField} is used to reduce
     * boilerplate for standard field comparisons. Special cases (status, interview date,
     * notes) have their own dedicated event types and are handled separately.</p>
     */
    @Override
    public void compareAndLogChanges(JobApplication oldApplication, JobApplication newApplication) {
        log.debug("Comparing changes for application ID: {}", newApplication.getId());

        // ============================================================
        // SPECIAL CASES: These fields have dedicated event types
        // ============================================================

        // STATUS CHANGE: Most significant change type - logged first
        if (!Objects.equals(oldApplication.getStatus(), newApplication.getStatus())) {
            logStatusChanged(newApplication, oldApplication.getStatus(), newApplication.getStatus());
        }

        // INTERVIEW DATE: Different event types depending on whether date is being set or updated
        if (!Objects.equals(oldApplication.getInterviewDate(), newApplication.getInterviewDate())) {
            if (oldApplication.getInterviewDate() == null && newApplication.getInterviewDate() != null) {
                // Interview being scheduled for the first time
                logInterviewScheduled(newApplication, newApplication.getInterviewDate());
            } else if (oldApplication.getInterviewDate() != null && newApplication.getInterviewDate() != null) {
                // Existing interview being rescheduled
                logInterviewUpdated(newApplication, oldApplication.getInterviewDate(), newApplication.getInterviewDate());
            }
            // If new interview date is null (cleared), we could log a different event type if needed
        }

        // NOTES: Track when notes are added or modified (has its own event type)
        if (!Objects.equals(oldApplication.getNotes(), newApplication.getNotes())) {
            logNoteAdded(newApplication, oldApplication.getNotes(), newApplication.getNotes());
        }

        // ============================================================
        // STANDARD FIELDS: Use generic comparison helper
        // ============================================================

        // String fields - use identity converter
        compareField(newApplication, "companyName",
                oldApplication.getCompanyName(), newApplication.getCompanyName(), Function.identity());
        compareField(newApplication, "positionTitle",
                oldApplication.getPositionTitle(), newApplication.getPositionTitle(), Function.identity());
        compareField(newApplication, "location",
                oldApplication.getLocation(), newApplication.getLocation(), Function.identity());
        compareField(newApplication, "jobUrl",
                oldApplication.getJobUrl(), newApplication.getJobUrl(), Function.identity());
        compareField(newApplication, "contactName",
                oldApplication.getContactName(), newApplication.getContactName(), Function.identity());
        compareField(newApplication, "contactEmail",
                oldApplication.getContactEmail(), newApplication.getContactEmail(), Function.identity());
        compareField(newApplication, "contactPhone",
                oldApplication.getContactPhone(), newApplication.getContactPhone(), Function.identity());
        compareField(newApplication, "jobDescription",
                oldApplication.getJobDescription(), newApplication.getJobDescription(), Function.identity());

        // Numeric fields - convert to string
        compareField(newApplication, "salaryMin",
                oldApplication.getSalaryMin(), newApplication.getSalaryMin(), Object::toString);
        compareField(newApplication, "salaryMax",
                oldApplication.getSalaryMax(), newApplication.getSalaryMax(), Object::toString);

        // Enum fields - use name() method
        compareField(newApplication, "rtoType",
                oldApplication.getRtoType(), newApplication.getRtoType(), Enum::name);
        compareField(newApplication, "level",
                oldApplication.getLevel(), newApplication.getLevel(), Enum::name);
    }

    /**
     * Generic helper method for comparing and logging field changes.
     *
     * <p>This method eliminates the repetitive comparison pattern by accepting a field name,
     * old and new values, and a converter function to transform the values to strings
     * for event logging.</p>
     *
     * <p>Example usage:</p>
     * <pre>{@code
     * // String field - use identity
     * compareField(app, "companyName", oldName, newName, Function.identity());
     *
     * // Numeric field - convert to string
     * compareField(app, "salaryMin", oldSalary, newSalary, Object::toString);
     *
     * // Enum field - use name()
     * compareField(app, "rtoType", oldRto, newRto, Enum::name);
     * }</pre>
     *
     * @param <T> the type of the field being compared
     * @param application the application entity (for event association)
     * @param fieldName the name of the field being tracked
     * @param oldValue the previous value (may be null)
     * @param newValue the current value (may be null)
     * @param toStringConverter function to convert non-null values to strings
     */
    /**
     * Maximum length of an audit value, matching the column and the bean validation
     * constraint on {@code ApplicationEvent.oldValue} and {@code newValue}.
     */
    private static final int MAX_AUDIT_VALUE_LENGTH = 500;

    /**
     * Truncates a value so that recording history can never fail the edit that produced it.
     *
     * <p>Notes accept 5000 characters and a job description 10000, while an audit value
     * column holds 500. Without this, editing a long field would violate the constraint and
     * roll back the whole update.</p>
     *
     * @param value the value to record, possibly null
     * @return the value, shortened with a trailing ellipsis if it was too long
     */
    private String truncateForAudit(String value) {
        if (value == null || value.length() <= MAX_AUDIT_VALUE_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_AUDIT_VALUE_LENGTH - 3) + "...";
    }

    private <T> void compareField(
            JobApplication application,
            String fieldName,
            T oldValue,
            T newValue,
            Function<T, String> toStringConverter) {

        if (!Objects.equals(oldValue, newValue)) {
            String oldString = oldValue != null ? toStringConverter.apply(oldValue) : null;
            String newString = newValue != null ? toStringConverter.apply(newValue) : null;
            logFieldUpdated(application, fieldName, oldString, newString);
        }
    }

    /**
     * Maps an ApplicationEvent entity to an ApplicationEventResponse DTO.
     *
     * <p>The DTO includes the application ID but not the full application object
     * to avoid circular references in JSON serialization.</p>
     *
     * @param event the entity to map
     * @return the mapped DTO
     */
    /**
     * Verifies that the specified user owns the application.
     *
     * @param application the application to check ownership of
     * @param userId the ID of the user claiming ownership
     * @throws UnauthorizedException if the user does not own the application
     */
    private void assertUserOwnsApplication(JobApplication application, Long userId) {
        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException(ErrorMessages.ACCESS_DENIED);
        }
    }

    private ApplicationEventResponse mapToResponse(ApplicationEvent event) {
        return new ApplicationEventResponse(
                event.getId(),
                event.getApplication().getId(),
                event.getEventType(),
                event.getFieldName(),
                event.getOldValue(),
                event.getNewValue(),
                event.getDetails(),
                event.getCreatedAt()
        );
    }
}
