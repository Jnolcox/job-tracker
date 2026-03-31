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
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

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
                .oldValue(oldValue)
                .newValue(newValue)
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
                .oldValue(oldNotes)
                .newValue(newNotes)
                .createdAt(Instant.now())
                .build();

        eventRepository.save(event);
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
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

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
     * <p>DESIGN NOTE: We use Objects.equals() for null-safe comparison throughout.</p>
     */
    @Override
    public void compareAndLogChanges(JobApplication oldApplication, JobApplication newApplication) {
        log.debug("Comparing changes for application ID: {}", newApplication.getId());

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

        // NOTES: Track when notes are added or modified
        if (!Objects.equals(oldApplication.getNotes(), newApplication.getNotes())) {
            logNoteAdded(newApplication, oldApplication.getNotes(), newApplication.getNotes());
        }

        // COMPANY NAME: Track changes to company information
        if (!Objects.equals(oldApplication.getCompanyName(), newApplication.getCompanyName())) {
            logFieldUpdated(newApplication, "companyName",
                    oldApplication.getCompanyName(), newApplication.getCompanyName());
        }

        // POSITION TITLE: Track changes to position information
        if (!Objects.equals(oldApplication.getPositionTitle(), newApplication.getPositionTitle())) {
            logFieldUpdated(newApplication, "positionTitle",
                    oldApplication.getPositionTitle(), newApplication.getPositionTitle());
        }

        // SALARY MIN: Track salary range changes
        if (!Objects.equals(oldApplication.getSalaryMin(), newApplication.getSalaryMin())) {
            logFieldUpdated(newApplication, "salaryMin",
                    oldApplication.getSalaryMin() != null ? oldApplication.getSalaryMin().toString() : null,
                    newApplication.getSalaryMin() != null ? newApplication.getSalaryMin().toString() : null);
        }

        // SALARY MAX: Track salary range changes
        if (!Objects.equals(oldApplication.getSalaryMax(), newApplication.getSalaryMax())) {
            logFieldUpdated(newApplication, "salaryMax",
                    oldApplication.getSalaryMax() != null ? oldApplication.getSalaryMax().toString() : null,
                    newApplication.getSalaryMax() != null ? newApplication.getSalaryMax().toString() : null);
        }

        // LOCATION: Track location changes
        if (!Objects.equals(oldApplication.getLocation(), newApplication.getLocation())) {
            logFieldUpdated(newApplication, "location",
                    oldApplication.getLocation(), newApplication.getLocation());
        }

        // RTO TYPE: Track remote/hybrid/onsite changes
        if (!Objects.equals(oldApplication.getRtoType(), newApplication.getRtoType())) {
            logFieldUpdated(newApplication, "rtoType",
                    oldApplication.getRtoType() != null ? oldApplication.getRtoType().name() : null,
                    newApplication.getRtoType() != null ? newApplication.getRtoType().name() : null);
        }

        // LEVEL: Track level/seniority changes
        if (!Objects.equals(oldApplication.getLevel(), newApplication.getLevel())) {
            logFieldUpdated(newApplication, "level",
                    oldApplication.getLevel() != null ? oldApplication.getLevel().name() : null,
                    newApplication.getLevel() != null ? newApplication.getLevel().name() : null);
        }

        // JOB URL: Track job posting URL changes
        if (!Objects.equals(oldApplication.getJobUrl(), newApplication.getJobUrl())) {
            logFieldUpdated(newApplication, "jobUrl",
                    oldApplication.getJobUrl(), newApplication.getJobUrl());
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
