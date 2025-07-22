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

import java.time.LocalDateTime;
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

        return applications.map(app -> modelMapper.map(app, JobApplicationResponse.class));
    }

    @Override
    public JobApplicationResponse getApplication(Long id, Long userId) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

        return modelMapper.map(application, JobApplicationResponse.class);
    }

    @Override
    @Transactional
    public JobApplicationResponse createApplication(
            JobApplicationCreateRequest request, Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        JobApplication application = modelMapper.map(request, JobApplication.class);
        application.setUser(user);
        application.setAppliedDate(LocalDateTime.now());
        application.setStatus(ApplicationStatus.APPLIED);

        JobApplication saved = repository.save(application);
        return modelMapper.map(saved, JobApplicationResponse.class);
    }

    @Override
    @Transactional
    public JobApplicationResponse updateApplication(
            Long id, JobApplicationUpdateRequest request, Long userId) {

        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied");
        }

        modelMapper.map(request, application);
        JobApplication updated = repository.save(application);

        return modelMapper.map(updated, JobApplicationResponse.class);
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
        return applications.map(app -> modelMapper.map(app, JobApplicationResponse.class));
    }

    @Override
    public Page<JobApplicationResponse> searchApplications(Long userId,
                                                           String searchTerm,
                                                           ApplicationStatus status,
                                                           Pageable pageable) {
        Page<JobApplication> applications = repository
                .searchApplications(userId, searchTerm, status, pageable);
        return applications.map(app -> modelMapper.map(app, JobApplicationResponse.class));
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
        JobApplication updated = repository.save(application);

        return modelMapper.map(updated, JobApplicationResponse.class);
    }

    @Override
    public List<JobApplicationResponse> getUserApplications(Long userId, int limit) {
        List<JobApplication> applications = repository
                .findRecentApplicationsByUserId(userId, limit);
        return applications.stream()
                .map(app -> modelMapper.map(app, JobApplicationResponse.class))
                .toList();
    }
}