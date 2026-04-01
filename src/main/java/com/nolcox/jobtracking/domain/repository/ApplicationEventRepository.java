package com.nolcox.jobtracking.domain.repository;

import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for managing {@link ApplicationEvent} entities.
 *
 * <p>Provides data access operations for the application audit trail.
 * Events are stored chronologically and can be retrieved to display
 * the complete history of changes to a job application.</p>
 *
 * <p>Primary use case: Fetching the audit trail for a specific application
 * to show the user when and how their application data changed over time.</p>
 *
 * @see ApplicationEvent
 */
@Repository
public interface ApplicationEventRepository extends JpaRepository<ApplicationEvent, Long> {

    /**
     * Retrieves all events for a specific application, ordered by creation time descending.
     *
     * <p>Returns events in reverse chronological order (newest first) which is the
     * natural display order for audit trails where users typically want to see
     * recent activity at the top.</p>
     *
     * @param applicationId the ID of the job application
     * @return list of events ordered by createdAt descending (newest first)
     */
    List<ApplicationEvent> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    /**
     * Retrieves events for a specific application with pagination support.
     *
     * <p>Use this method when the event history could be large and you want
     * to implement lazy loading or infinite scroll in the UI.</p>
     *
     * @param applicationId the ID of the job application
     * @param pageable pagination parameters (includes sorting)
     * @return paginated list of events
     */
    Page<ApplicationEvent> findByApplicationId(Long applicationId, Pageable pageable);

    /**
     * Retrieves events of a specific type for an application.
     *
     * <p>Useful for filtering the audit trail to show only status changes
     * or only field updates, for example.</p>
     *
     * @param applicationId the ID of the job application
     * @param eventType the type of event to filter by
     * @return list of matching events ordered by createdAt descending
     */
    List<ApplicationEvent> findByApplicationIdAndEventTypeOrderByCreatedAtDesc(
            Long applicationId, EventType eventType);

    /**
     * Retrieves events created within a specific time range for an application.
     *
     * <p>Useful for generating activity reports or filtering events
     * to a specific time period.</p>
     *
     * @param applicationId the ID of the job application
     * @param startTime the start of the time range (inclusive)
     * @param endTime the end of the time range (inclusive)
     * @return list of events within the time range, ordered by createdAt descending
     */
    @Query("SELECT e FROM ApplicationEvent e WHERE e.application.id = :applicationId " +
           "AND e.createdAt >= :startTime AND e.createdAt <= :endTime " +
           "ORDER BY e.createdAt DESC")
    List<ApplicationEvent> findByApplicationIdAndCreatedAtBetween(
            @Param("applicationId") Long applicationId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime);

    /**
     * Counts the total number of events for a specific application.
     *
     * <p>Useful for displaying event counts in the UI without loading all events.</p>
     *
     * @param applicationId the ID of the job application
     * @return the total count of events
     */
    long countByApplicationId(Long applicationId);

    /**
     * Deletes all events for a specific application.
     *
     * <p>Note: This is typically handled automatically via CASCADE delete when
     * the parent application is deleted. This method exists for manual cleanup
     * scenarios if needed.</p>
     *
     * @param applicationId the ID of the job application
     */
    void deleteByApplicationId(Long applicationId);

    /**
     * Retrieves all events for all applications owned by a specific user.
     *
     * <p>This bulk query fetches events across all of a user's applications in a single
     * database call, which is more efficient than making N separate calls (one per application).
     * Events are returned in reverse chronological order (newest first).</p>
     *
     * <p>PERFORMANCE NOTE: This query joins through application to user, so an index on
     * application_id is utilized. For users with many applications and events, consider
     * adding pagination if performance becomes a concern.</p>
     *
     * @param userId the ID of the user whose application events to retrieve
     * @return list of all events for the user's applications, ordered by createdAt descending
     */
    @Query("SELECT e FROM ApplicationEvent e WHERE e.application.user.id = :userId ORDER BY e.createdAt DESC")
    List<ApplicationEvent> findAllByUserId(@Param("userId") Long userId);
}
