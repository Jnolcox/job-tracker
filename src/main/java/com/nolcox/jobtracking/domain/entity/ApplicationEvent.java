package com.nolcox.jobtracking.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Entity representing an audit event for a job application.
 *
 * <p>ApplicationEvent tracks significant changes and milestones in a job application's
 * lifecycle. This provides users with a complete audit trail of what happened to their
 * application and when.</p>
 *
 * <p>The entity maps to the {@code application_events} table and maintains a foreign key
 * relationship to the {@code job_applications} table. Events are automatically deleted
 * when the parent application is deleted (CASCADE delete).</p>
 *
 * <p>Example events captured:</p>
 * <ul>
 *   <li>Application created with initial status APPLIED</li>
 *   <li>Status changed from APPLIED to TECH_SCREEN</li>
 *   <li>Interview scheduled for 2024-02-15</li>
 *   <li>Salary range updated from $100k-$120k to $110k-$130k</li>
 * </ul>
 *
 * @see EventType
 * @see JobApplication
 */
@Entity
@Table(name = "application_events", indexes = {
    @Index(name = "idx_application_events", columnList = "application_id, created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationEvent {

    /**
     * Unique identifier for this event.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The job application this event belongs to.
     * Uses LAZY fetching to avoid loading the full application when only event data is needed.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @NotNull(message = "Application reference is required")
    private JobApplication application;

    /**
     * The type of event that occurred.
     * See {@link EventType} for the complete list of event types.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    @NotNull(message = "Event type is required")
    private EventType eventType;

    /**
     * The name of the field that was changed.
     * Only populated for FIELD_UPDATED events (e.g., "companyName", "salaryMin").
     * Null for lifecycle events like APPLICATION_CREATED.
     */
    @Column(name = "field_name", length = 100)
    @Size(max = 100)
    private String fieldName;

    /**
     * The previous value before the change.
     * Stored as a string representation, regardless of the original field type.
     * Null for APPLICATION_CREATED events.
     */
    @Column(name = "old_value", length = 500)
    @Size(max = 500)
    private String oldValue;

    /**
     * The new value after the change.
     * Stored as a string representation, regardless of the original field type.
     */
    @Column(name = "new_value", length = 500)
    @Size(max = 500)
    private String newValue;

    /**
     * Additional details or context about the event.
     * Can contain structured information like JSON for complex changes.
     */
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    /**
     * Timestamp when this event was created.
     * Automatically set by JPA auditing and cannot be modified after creation.
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
