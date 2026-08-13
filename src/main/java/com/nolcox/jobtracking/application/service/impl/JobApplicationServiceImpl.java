package com.nolcox.jobtracking.application.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.service.ApplicationEventService;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;

import static com.nolcox.jobtracking.shared.exception.ErrorMessages.ACCESS_DENIED;
import static com.nolcox.jobtracking.shared.exception.ErrorMessages.APPLICATION_NOT_FOUND;
import static com.nolcox.jobtracking.shared.exception.ErrorMessages.USER_NOT_FOUND;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link JobApplicationService} for managing job applications.
 *
 * <p>This service handles all CRUD operations for job applications and integrates
 * with the audit trail system to log significant changes. Each modification to
 * an application generates appropriate events that can be retrieved via the
 * {@link ApplicationEventService}.</p>
 *
 * <p>The service enforces authorization rules ensuring users can only access
 * their own applications.</p>
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository repository;
    private final UserRepository userRepository;
    private final ApplicationEventRepository eventRepository;
    private final ModelMapper modelMapper;

    /** Applies full-replacement updates, including clearing fields sent as null. */
    private final JobApplicationUpdateMapper updateMapper;

    /**
     * Event service for logging audit trail events.
     * Optional dependency - if not available, events are simply not logged.
     * This allows the service to function in tests without event logging.
     */
    private ApplicationEventService eventService;

    /**
     * Sets the optional event service for audit trail logging.
     *
     * <p>Using setter injection (with @Autowired(required = false)) allows the service
     * to function in tests and environments where event logging is not needed.</p>
     *
     * @param eventService the event service to use for logging, or null to disable logging
     */
    @Autowired(required = false)
    public void setEventService(ApplicationEventService eventService) {
        this.eventService = eventService;
        log.debug("ApplicationEventService {} for audit trail logging",
                eventService != null ? "configured" : "not configured");
    }

    @Override
    public Page<JobApplicationResponse> getUserApplications(
            Long userId, ApplicationStatus status,
            String companyName, Pageable pageable) {

        Page<JobApplication> applications = repository
                .findByUserIdWithFilters(userId, status, companyName, pageable);

        return applications.map(this::mapToResponse);
    }

    @Override
    public JobApplicationResponse getApplication(Long id, Long userId) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(APPLICATION_NOT_FOUND));

        assertUserOwnsApplication(application, userId);

        return mapToResponse(application);
    }

    /**
     * {@inheritDoc}
     *
     * <p>After creating the application, an APPLICATION_CREATED event is logged
     * to the audit trail. This marks the beginning of the application's history.</p>
     */
    @Override
    @Transactional
    public JobApplicationResponse createApplication(
            JobApplicationCreateRequest request, Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));

        JobApplication application = modelMapper.map(request, JobApplication.class);
        application.setUser(user);
        application.setAppliedDate(request.appliedDate() != null ? request.appliedDate() : Instant.now());
        application.setStatus(request.status());
        application.setStatusChangedAt(request.statusChangedAt() != null ? request.statusChangedAt() : Instant.now());

        JobApplication saved = repository.save(application);

        // AUDIT TRAIL: Log the application creation event
        if (eventService != null) {
            log.debug("Logging APPLICATION_CREATED event for application ID: {}", saved.getId());
            eventService.logApplicationCreated(saved);
        }

        return mapToResponse(saved);
    }

    /**
     * Updates an existing job application with the provided request data.
     *
     * <p>
     * This method handles date fields with special care to prevent accidental
     * overwrites:
     * <ul>
     * <li><b>appliedDate</b>: Preserved from the original entity unless
     * explicitly provided in the request. This prevents ModelMapper from
     * overwriting it with null.</li>
     * <li><b>statusChangedAt</b>: Follows a priority system:
     * <ol>
     * <li>If request provides a value, use it (enables backdating scenarios
     * where users record historical status changes)</li>
     * <li>If status changed but no date provided, auto-set to current time</li>
     * <li>If status unchanged and no date provided, preserve the original
     * value</li>
     * </ol>
     * </li>
     * </ul>
     *
     * <p>After updating, all detected changes are logged to the audit trail
     * using the event service.</p>
     *
     * @param id the ID of the job application to update
     * @param request the update request containing new field values
     * @param userId the ID of the authenticated user (for authorization check)
     * @return the updated job application as a response DTO
     * @throws ResourceNotFoundException if no application exists with the given ID
     * @throws UnauthorizedException if the application belongs to a different user
     */
    @Override
    @Transactional
    public JobApplicationResponse updateApplication(
            Long id, JobApplicationUpdateRequest request, Long userId) {

        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(APPLICATION_NOT_FOUND));

        assertUserOwnsApplication(application, userId);

        // AUDIT TRAIL: Capture the old state before any modifications
        // This snapshot is used to detect what changed for event logging
        JobApplication oldState = captureApplicationState(application);

        // Preserve original values that should be protected from accidental overwrites
        // These are captured BEFORE ModelMapper modifies the entity
        ApplicationStatus oldStatus = application.getStatus();
        Instant originalAppliedDate = application.getAppliedDate();
        Instant originalStatusChangedAt = application.getStatusChangedAt();

        // PUT is a full replacement, so this mapper applies nulls rather than skipping
        // them. That is what lets a client clear notes, location, level, rtoType or a
        // contact field. Values that must survive a null are restored immediately below.
        updateMapper.applyTo(request, application);

        // BUSINESS RULE: Restore appliedDate if not explicitly changed in request
        // This prevents ModelMapper from clearing the date when request.appliedDate() is null
        if (request.appliedDate() == null) {
            application.setAppliedDate(originalAppliedDate);
        }

        // BUSINESS RULE: Handle statusChangedAt based on whether status changed and user intent
        // Priority: User-provided value > Auto-update on status change > Preserve original
        boolean statusChanged = application.getStatus() != null && !application.getStatus().equals(oldStatus);

        if (request.statusChangedAt() != null) {
            application.setStatusChangedAt(request.statusChangedAt());
        } else if (statusChanged) {
            application.setStatusChangedAt(Instant.now());
        } else {
            application.setStatusChangedAt(originalStatusChangedAt);
        }

        JobApplication updated = repository.save(application);

        // AUDIT TRAIL: Log all detected changes by comparing old and new states
        if (eventService != null) {
            log.debug("Logging changes for application ID: {}", updated.getId());
            eventService.compareAndLogChanges(oldState, updated);
        }

        return mapToResponse(updated);
    }

    /**
     * Creates a shallow copy of the application state for change comparison.
     *
     * <p>This method captures the current field values before they are modified,
     * allowing the event service to detect what changed during an update.</p>
     *
     * <p><strong>Design Note:</strong> Uses manual builder pattern instead of ModelMapper
     * to avoid circular reference issues. The User and JobApplication entities have a
     * bidirectional relationship that causes infinite recursion with ModelMapper.</p>
     *
     * <p>When adding new fields to JobApplication, remember to add them here too.</p>
     *
     * @param application the application to capture
     * @return a new JobApplication instance with the same field values
     */
    private JobApplication captureApplicationState(JobApplication application) {
        // DESIGN: Manual builder used to avoid circular reference issues with ModelMapper
        // The User <-> JobApplication bidirectional relationship causes stack overflow
        return JobApplication.builder()
                .id(application.getId())
                .user(application.getUser())
                .companyName(application.getCompanyName())
                .positionTitle(application.getPositionTitle())
                .jobDescription(application.getJobDescription())
                .status(application.getStatus())
                .appliedDate(application.getAppliedDate())
                .interviewDate(application.getInterviewDate())
                .salaryMin(application.getSalaryMin())
                .salaryMax(application.getSalaryMax())
                .location(application.getLocation())
                .rtoType(application.getRtoType())
                .level(application.getLevel())
                .notes(application.getNotes())
                .jobUrl(application.getJobUrl())
                .contactName(application.getContactName())
                .contactEmail(application.getContactEmail())
                .contactPhone(application.getContactPhone())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .statusChangedAt(application.getStatusChangedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteApplication(Long id, Long userId) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(APPLICATION_NOT_FOUND));

        assertUserOwnsApplication(application, userId);

        // IMPORTANT: Delete associated events before deleting the application.
        // This ensures the Hibernate persistence context is consistent and avoids
        // TransientObjectException when events reference the deleted application.
        // While the database has ON DELETE CASCADE, we need to manage the JPA
        // persistence context explicitly to prevent issues in transactional contexts.
        eventRepository.deleteByApplicationId(id);

        repository.delete(application);
    }

    @Override
    public Map<ApplicationStatus, Long> getApplicationStatistics(Long userId) {
        return repository.countByStatusForUser(userId);
    }

    @Override
    public Page<JobApplicationResponse> getApplicationsByStatus(Long userId,
            ApplicationStatus status,
            Pageable pageable) {
        Page<JobApplication> applications = repository
                .findByUserIdAndStatus(userId, status, pageable);
        return applications.map(this::mapToResponse);
    }

    @Override
    public Page<JobApplicationResponse> searchApplications(Long userId,
            String searchTerm,
            ApplicationStatus status,
            Pageable pageable) {
        Page<JobApplication> applications = repository
                .searchApplications(userId, searchTerm, status, pageable);
        return applications.map(this::mapToResponse);
    }

    /**
     * {@inheritDoc}
     *
     * <p>This method specifically handles status updates and logs a STATUS_CHANGED
     * event to the audit trail.</p>
     */
    @Override
    @Transactional
    public JobApplicationResponse updateApplicationStatus(Long id,
            ApplicationStatus status,
            Long userId) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(APPLICATION_NOT_FOUND));

        assertUserOwnsApplication(application, userId);

        // AUDIT TRAIL: Capture old status for event logging
        ApplicationStatus oldStatus = application.getStatus();

        application.setStatus(status);
        application.setStatusChangedAt(Instant.now());
        JobApplication updated = repository.save(application);

        // AUDIT TRAIL: Log the status change event
        if (eventService != null && !oldStatus.equals(status)) {
            log.debug("Logging STATUS_CHANGED event for application ID: {} ({} -> {})",
                    updated.getId(), oldStatus, status);
            eventService.logStatusChanged(updated, oldStatus, status);
        }

        return mapToResponse(updated);
    }

    @Override
    public List<JobApplicationResponse> getUserApplications(Long userId, int limit) {
        List<JobApplication> applications = repository
                .findRecentApplicationsByUserId(userId, limit);
        return applications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Verifies that the specified user owns the application.
     *
     * <p>This authorization check is performed before any operation that reads or
     * modifies an application. It ensures users can only access their own data.</p>
     *
     * @param application the application to check ownership of
     * @param userId the ID of the user claiming ownership
     * @throws UnauthorizedException if the user does not own the application
     */
    private void assertUserOwnsApplication(JobApplication application, Long userId) {
        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException(ACCESS_DENIED);
        }
    }

    private JobApplicationResponse mapToResponse(JobApplication application) {
        return new JobApplicationResponse(
                application.getId(),
                application.getCompanyName(),
                application.getPositionTitle(),
                application.getJobDescription(),
                application.getStatus(),
                application.getAppliedDate(),
                application.getInterviewDate(),
                application.getSalaryMin(),
                application.getSalaryMax(),
                application.getLocation(),
                application.getRtoType(),
                application.getLevel(),
                application.getNotes(),
                application.getJobUrl(),
                application.getContactName(),
                application.getContactEmail(),
                application.getContactPhone(),
                application.getCreatedAt(),
                application.getUpdatedAt(),
                application.getStatusChangedAt()
        );
    }
}
