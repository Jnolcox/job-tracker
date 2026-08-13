package com.nolcox.jobtracking.domain.repository;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Page<JobApplication> findByUserId(Long userId, Pageable pageable);
    Page<JobApplication> findByUserIdAndStatus(Long userId, ApplicationStatus status, Pageable pageable);

    @Query("SELECT ja FROM JobApplication ja WHERE ja.user.id = :userId " +
            "AND (:status IS NULL OR ja.status = :status) " +
            "AND (:companyName IS NULL OR LOWER(ja.companyName) LIKE LOWER(CONCAT('%', :companyName, '%')))")
    Page<JobApplication> findByUserIdWithFilters(@Param("userId") Long userId,
                                                 @Param("status") ApplicationStatus status,
                                                 @Param("companyName") String companyName,
                                                 Pageable pageable);

    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.user.id = :userId " +
            "AND ja.status = :status")
    Long countByUserIdAndStatus(@Param("userId") Long userId,
                                @Param("status") ApplicationStatus status);

    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.user.id = :userId " +
            "AND ja.status IN :statuses")
    long countByUserIdAndStatusIn(@Param("userId") Long userId,
                                  @Param("statuses") Set<ApplicationStatus> statuses);

    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT ja.status, COUNT(ja) FROM JobApplication ja WHERE ja.user.id = :userId " +
            "GROUP BY ja.status")
    List<Object[]> countByStatusForUserRaw(@Param("userId") Long userId);

    default Map<ApplicationStatus, Long> countByStatusForUser(Long userId) {
        List<Object[]> results = countByStatusForUserRaw(userId);
        return results.stream()
                .collect(java.util.stream.Collectors.toMap(
                        result -> (ApplicationStatus) result[0],
                        result -> (Long) result[1]
                ));
    }

    @Query("SELECT ja FROM JobApplication ja WHERE ja.user.id = :userId " +
            "AND (:searchTerm IS NULL OR " +
            "LOWER(ja.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(ja.positionTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:status IS NULL OR ja.status = :status)")
    Page<JobApplication> searchApplications(@Param("userId") Long userId,
                                            @Param("searchTerm") String searchTerm,
                                            @Param("status") ApplicationStatus status,
                                            Pageable pageable);

    @Query("SELECT ja FROM JobApplication ja WHERE ja.user.id = :userId " +
            "ORDER BY ja.appliedDate DESC")
    List<JobApplication> findRecentApplicationsByUserId(@Param("userId") Long userId,
                                                        Pageable pageable);

    default List<JobApplication> findRecentApplicationsByUserId(Long userId, int limit) {
        return findRecentApplicationsByUserId(userId,
                org.springframework.data.domain.PageRequest.of(0, limit));
    }

    /**
     * Retrieves all job applications for a user.
     *
     * <p>Used for analytics calculations where we need to process
     * all applications for aggregation.</p>
     *
     * @param userId the user's ID
     * @return list of all applications for the user
     */
    List<JobApplication> findAllByUserId(Long userId);

    // ==================== Bulk Delete Operations ====================

    /**
     * Deletes all job applications for a specific user.
     *
     * <p>This bulk delete operation is used when cleaning up all data for a user,
     * such as during account deletion. IMPORTANT: All related ApplicationEvent
     * records MUST be deleted BEFORE calling this method to maintain JPA/database
     * consistency due to the foreign key relationship.</p>
     *
     * <p>Uses a subquery approach for H2 compatibility in tests while maintaining
     * correct behavior in production databases. The @Modifying annotation tells
     * Spring Data that this is a modifying query, and @Transactional ensures the
     * operation is atomic.</p>
     *
     * @param userId the ID of the user whose applications should be deleted
     * @see ApplicationEventRepository#deleteAllByUserId(Long) call this first
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM job_applications WHERE user_id = :userId", nativeQuery = true)
    void deleteAllByUserId(@Param("userId") Long userId);

    /**
     * Finds application IDs for a user filtered by a set of statuses.
     *
     * <p>This query returns only the IDs (not full entities) for performance
     * optimization when you need to perform bulk operations on applications
     * matching specific criteria. Common use case: finding all REJECTED or
     * WITHDRAWN applications for batch cleanup.</p>
     *
     * <p>Returns IDs instead of entities to minimize memory usage when dealing
     * with potentially large result sets that will be passed to deleteAllByIdIn.</p>
     *
     * @param userId the ID of the user whose applications to search
     * @param statuses the set of ApplicationStatus values to filter by (IN clause)
     * @return list of application IDs matching the criteria; empty list if none found
     */
    @Query("SELECT ja.id FROM JobApplication ja WHERE ja.user.id = :userId AND ja.status IN :statuses")
    List<Long> findIdsByUserIdAndStatusIn(@Param("userId") Long userId,
                                          @Param("statuses") Set<ApplicationStatus> statuses);

    /**
     * Deletes all job applications with IDs in the provided list.
     *
     * <p>This bulk delete operation enables efficient batch deletion of applications
     * by ID. Useful when you've identified specific applications to delete (e.g.,
     * all applications with certain statuses returned by findIdsByUserIdAndStatusIn).</p>
     *
     * <p>IMPORTANT: All related ApplicationEvent records MUST be deleted BEFORE
     * calling this method. Use ApplicationEventRepository#deleteAllByApplicationIdIn
     * to clean up events first.</p>
     *
     * <p>Handles edge cases gracefully:
     * <ul>
     *   <li>Empty list: No operation performed, no exception thrown</li>
     *   <li>Non-existent IDs: Silently ignored, existing IDs still deleted</li>
     *   <li>Mixed IDs: Only existing applications are deleted</li>
     * </ul>
     * </p>
     *
     * @param ids the list of application IDs to delete
     * @see ApplicationEventRepository#deleteAllByApplicationIdIn(List) call this first
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM job_applications WHERE id IN (:ids)", nativeQuery = true)
    void deleteAllByIdIn(@Param("ids") List<Long> ids);
}
