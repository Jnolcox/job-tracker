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

    // ==================== Bulk Delete Operations ====================

    /**
     * Deletes all job applications for a specific user.
     *
     * <p>This method performs a bulk deletion of all applications belonging to the user,
     * including all associated events. Events are deleted first to maintain referential
     * integrity due to the foreign key relationship.</p>
     *
     * <p>Use this method for complete data cleanup scenarios such as user account
     * deletion or when a user wants to start fresh.</p>
     *
     * @param userId the ID of the user whose applications should be deleted
     * @return the number of applications that were deleted
     */
    int deleteAllApplications(Long userId);

    /**
     * Deletes all non-active job applications for a specific user.
     *
     * <p>Non-active applications are those with status: REJECTED, WITHDRAWN, or GHOSTED.
     * These represent closed-out applications that users may want to clean up to
     * keep their dashboard focused on active opportunities.</p>
     *
     * <p>Associated events for the deleted applications are also removed to maintain
     * data consistency.</p>
     *
     * @param userId the ID of the user whose non-active applications should be deleted
     * @return the number of applications that were deleted
     */
    int deleteNonActiveApplications(Long userId);

    /**
     * Counts the number of non-active job applications for a specific user.
     *
     * <p>Non-active applications are those with status: REJECTED, WITHDRAWN, or GHOSTED.
     * This method is useful for displaying cleanup suggestions to users or determining
     * if the "clean up" feature should be shown in the UI.</p>
     *
     * @param userId the ID of the user whose non-active applications should be counted
     * @return the count of non-active applications
     */
    long countNonActiveApplications(Long userId);
}
