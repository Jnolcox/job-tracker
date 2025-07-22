package com.nolcox.jobtracking.application.service;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface JobApplicationService {

    /**
     * Get all job applications for a specific user with optional filters
     *
     * @param userId User ID
     * @param status Optional status filter
     * @param companyName Optional company name filter
     * @param pageable Pagination information
     * @return Page of job applications
     */
    Page<JobApplicationResponse> getUserApplications(Long userId,
                                                     ApplicationStatus status,
                                                     String companyName,
                                                     Pageable pageable);

    /**
     * Get a specific job application by ID
     *
     * @param id Application ID
     * @param userId User ID (for authorization)
     * @return Job application details
     */
    JobApplicationResponse getApplication(Long id, Long userId);

    /**
     * Create a new job application
     *
     * @param request Application creation request
     * @param userId User ID
     * @return Created job application
     */
    JobApplicationResponse createApplication(JobApplicationCreateRequest request, Long userId);

    /**
     * Update an existing job application
     *
     * @param id Application ID
     * @param request Update request
     * @param userId User ID (for authorization)
     * @return Updated job application
     */
    JobApplicationResponse updateApplication(Long id,
                                             JobApplicationUpdateRequest request,
                                             Long userId);

    /**
     * Delete a job application
     *
     * @param id Application ID
     * @param userId User ID (for authorization)
     */
    void deleteApplication(Long id, Long userId);

    /**
     * Get application statistics for a user
     *
     * @param userId User ID
     * @return Map of status to count
     */
    Map<ApplicationStatus, Long> getApplicationStatistics(Long userId);

    /**
     * Get applications by status for a user
     *
     * @param userId User ID
     * @param status Application status
     * @param pageable Pagination information
     * @return Page of job applications
     */
    Page<JobApplicationResponse> getApplicationsByStatus(Long userId,
                                                         ApplicationStatus status,
                                                         Pageable pageable);

    /**
     * Search applications by multiple criteria
     *
     * @param userId User ID
     * @param searchTerm Search term for company/position
     * @param status Optional status filter
     * @param pageable Pagination information
     * @return Page of matching applications
     */
    Page<JobApplicationResponse> searchApplications(Long userId,
                                                    String searchTerm,
                                                    ApplicationStatus status,
                                                    Pageable pageable);

    /**
     * Update application status
     *
     * @param id Application ID
     * @param status New status
     * @param userId User ID (for authorization)
     * @return Updated application
     */
    JobApplicationResponse updateApplicationStatus(Long id,
                                                   ApplicationStatus status,
                                                   Long userId);

    /**
     * Get recent applications
     *
     * @param userId User ID
     * @param limit Number of recent applications to return
     * @return List of recent applications
     */
    List<JobApplicationResponse> getUserApplications(Long userId, int limit);
}
