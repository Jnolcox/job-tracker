package com.nolcox.jobtracking.domain.repository;

import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    // ==================== Analytics Query Methods ====================

    /**
     * Retrieves all status change events for a user's applications.
     *
     * <p>Filters events where eventType is STATUS_CHANGED and fieldName is 'status'.
     * This data is used for transition matrix analytics to show how applications
     * flow between different statuses.</p>
     *
     * @param userId the ID of the user whose status transitions to retrieve
     * @return list of status change events with oldValue and newValue populated
     */
    @Query("SELECT e FROM ApplicationEvent e " +
           "WHERE e.application.user.id = :userId " +
           "AND e.eventType = 'STATUS_CHANGED' " +
           "AND e.fieldName = 'status' " +
           "ORDER BY e.createdAt DESC")
    List<ApplicationEvent> findStatusTransitionsByUserId(@Param("userId") Long userId);

    /**
     * Retrieves events for a specific application within a time range.
     *
     * <p>Used for health indicator calculations to determine application activity
     * within specific periods (e.g., last 7 days for "hot" applications).</p>
     *
     * @param applicationId the ID of the job application
     * @param since the start of the time range (inclusive)
     * @return list of events created on or after the since timestamp
     */
    @Query("SELECT e FROM ApplicationEvent e " +
           "WHERE e.application.id = :applicationId " +
           "AND e.createdAt >= :since " +
           "ORDER BY e.createdAt DESC")
    List<ApplicationEvent> findByApplicationIdAndCreatedAtAfter(
            @Param("applicationId") Long applicationId,
            @Param("since") Instant since);

    /**
     * Counts recent events for each application owned by a user.
     *
     * <p>Returns application IDs with their event counts for events created
     * after the specified timestamp. Used to identify "hot" applications
     * with high recent activity.</p>
     *
     * @param userId the ID of the user
     * @param since the start of the time range (inclusive)
     * @return list of Object arrays where [0] is applicationId (Long) and [1] is count (Long)
     */
    @Query("SELECT e.application.id, COUNT(e) FROM ApplicationEvent e " +
           "WHERE e.application.user.id = :userId " +
           "AND e.createdAt >= :since " +
           "GROUP BY e.application.id")
    List<Object[]> countRecentEventsByApplicationForUser(
            @Param("userId") Long userId,
            @Param("since") Instant since);

    /**
     * Finds the most recent event timestamp for each application owned by a user.
     *
     * <p>Used to identify "stale" applications that haven't had any activity
     * for an extended period.</p>
     *
     * @param userId the ID of the user
     * @return list of Object arrays where [0] is applicationId (Long) and [1] is lastEventAt (Instant)
     */
    @Query("SELECT e.application.id, MAX(e.createdAt) FROM ApplicationEvent e " +
           "WHERE e.application.user.id = :userId " +
           "GROUP BY e.application.id")
    List<Object[]> findLastEventTimestampByApplicationForUser(@Param("userId") Long userId);

    /**
     * Retrieves status change events that transition to terminal statuses.
     *
     * <p>Terminal statuses include: REJECTED, WITHDRAWN, GHOSTED, OFFER_ACCEPTED,
     * OFFER_DECLINED, OFFER_RESCINDED. This is used for funnel drop-off analysis
     * and quick win/loss calculations.</p>
     *
     * @param userId the ID of the user
     * @return list of status change events where newValue is a terminal status
     */
    @Query("SELECT e FROM ApplicationEvent e " +
           "WHERE e.application.user.id = :userId " +
           "AND e.eventType = 'STATUS_CHANGED' " +
           "AND e.fieldName = 'status' " +
           "AND e.newValue IN ('REJECTED', 'WITHDRAWN', 'GHOSTED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'OFFER_RESCINDED') " +
           "ORDER BY e.createdAt DESC")
    List<ApplicationEvent> findTerminalStatusTransitionsByUserId(@Param("userId") Long userId);

    // ==================== Bulk Delete Operations ====================

    /**
     * Deletes all events for all applications owned by a specific user.
     *
     * <p>This bulk delete operation is critical for data cleanup when deleting
     * a user's data. Due to the foreign key relationship between ApplicationEvent
     * and JobApplication, this method MUST be called BEFORE deleting the user's
     * job applications to maintain JPA/database consistency.</p>
     *
     * <p>Uses a subquery to find all application IDs for the user, then deletes
     * events matching those application IDs. This approach ensures compatibility
     * across different databases (H2 for tests, MySQL/PostgreSQL for production).</p>
     *
     * <p>Handles edge cases gracefully:
     * <ul>
     *   <li>User with no applications: No operation performed</li>
     *   <li>Applications with no events: No operation performed</li>
     *   <li>Non-existent user ID: No exception thrown</li>
     * </ul>
     * </p>
     *
     * @param userId the ID of the user whose application events should be deleted
     * @see JobApplicationRepository#deleteAllByUserId(Long) call this AFTER deleting events
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM application_events WHERE application_id IN " +
           "(SELECT id FROM job_applications WHERE user_id = :userId)", nativeQuery = true)
    void deleteAllByUserId(@Param("userId") Long userId);

    /**
     * Deletes all events for applications with IDs in the provided list.
     *
     * <p>This bulk delete operation enables efficient batch deletion of events
     * for specific applications. MUST be called BEFORE deleting the corresponding
     * job applications to maintain referential integrity.</p>
     *
     * <p>Common use case: When deleting applications by status (e.g., all REJECTED
     * applications), first call this method with the application IDs, then call
     * JobApplicationRepository#deleteAllByIdIn with the same IDs.</p>
     *
     * <p>Handles edge cases gracefully:
     * <ul>
     *   <li>Empty list: No operation performed, no exception thrown</li>
     *   <li>Non-existent application IDs: Silently ignored</li>
     *   <li>Applications with no events: No operation needed for those IDs</li>
     * </ul>
     * </p>
     *
     * @param applicationIds the list of application IDs whose events should be deleted
     * @see JobApplicationRepository#deleteAllByIdIn(List) call this AFTER deleting events
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM application_events WHERE application_id IN (:applicationIds)", nativeQuery = true)
    void deleteAllByApplicationIdIn(@Param("applicationIds") List<Long> applicationIds);
}
