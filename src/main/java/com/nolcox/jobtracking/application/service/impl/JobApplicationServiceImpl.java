package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository repository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

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
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

        return mapToResponse(application);
    }

    @Override
    @Transactional
    public JobApplicationResponse createApplication(
            JobApplicationCreateRequest request, Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        JobApplication application = modelMapper.map(request, JobApplication.class);
        application.setUser(user);
        application.setAppliedDate(request.appliedDate() != null ? request.appliedDate() : Instant.now());
        application.setStatus(request.status() != null ? request.status() : ApplicationStatus.APPLIED);
        application.setStatusChangedAt(request.statusChangedAt() != null ? request.statusChangedAt() : Instant.now());

        JobApplication saved = repository.save(application);
        return mapToResponse(saved);
    }

    /**
     * Updates an existing job application with the provided request data.
     *
     * <p>This method handles date fields with special care to prevent accidental overwrites:
     * <ul>
     *   <li><b>appliedDate</b>: Preserved from the original entity unless explicitly provided
     *       in the request. This prevents ModelMapper from overwriting it with null.</li>
     *   <li><b>statusChangedAt</b>: Auto-set to current time when status changes (ignoring
     *       any value in the request). When status is unchanged, uses the request value
     *       if provided (for manual backdating), otherwise preserves the original.</li>
     * </ul>
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
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

        // Preserve original values that should be protected from accidental overwrites
        // These are captured BEFORE ModelMapper modifies the entity
        ApplicationStatus oldStatus = application.getStatus();
        Instant originalAppliedDate = application.getAppliedDate();
        Instant originalStatusChangedAt = application.getStatusChangedAt();

        // Map request fields to entity (ModelMapper with skipNullEnabled may still overwrite)
        modelMapper.map(request, application);

        // BUSINESS RULE: Restore appliedDate if not explicitly changed in request
        // This prevents ModelMapper from clearing the date when request.appliedDate() is null
        if (request.appliedDate() == null) {
            application.setAppliedDate(originalAppliedDate);
        }

        // BUSINESS RULE: Handle statusChangedAt based on whether status actually changed
        if (application.getStatus() != null && !application.getStatus().equals(oldStatus)) {
            // Status changed: always auto-set to now
            // This ensures accurate tracking regardless of what the request contains
            application.setStatusChangedAt(Instant.now());
        } else if (request.statusChangedAt() != null) {
            // Status unchanged but user explicitly provided a value (for manual backdating)
            application.setStatusChangedAt(request.statusChangedAt());
        } else {
            // Status unchanged and no explicit value: keep original
            application.setStatusChangedAt(originalStatusChangedAt);
        }

        JobApplication updated = repository.save(application);

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteApplication(Long id, Long userId) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

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

    @Override
    @Transactional
    public JobApplicationResponse updateApplicationStatus(Long id,
                                                          ApplicationStatus status,
                                                          Long userId) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

        application.setStatus(status);
        application.setStatusChangedAt(Instant.now());
        JobApplication updated = repository.save(application);

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