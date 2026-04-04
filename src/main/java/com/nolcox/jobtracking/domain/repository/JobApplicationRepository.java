package com.nolcox.jobtracking.domain.repository;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long>, JpaSpecificationExecutor<JobApplication> {
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
}
