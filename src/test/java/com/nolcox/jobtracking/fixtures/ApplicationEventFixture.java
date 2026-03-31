package com.nolcox.jobtracking.fixtures;

import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.EventType;
import com.nolcox.jobtracking.domain.entity.JobApplication;

import java.time.Instant;

/**
 * Test fixture builder for creating {@link ApplicationEvent} instances in tests.
 *
 * <p>Provides a fluent API to create ApplicationEvent entities with sensible defaults
 * that can be customized for specific test scenarios.</p>
 *
 * <p>Example usage:</p>
 * <pre>{@code
 * // Create a status change event
 * ApplicationEvent event = ApplicationEventFixture.anEvent()
 *     .withEventType(EventType.STATUS_CHANGED)
 *     .withFieldName("status")
 *     .withOldValue("APPLIED")
 *     .withNewValue("TECH_SCREEN")
 *     .build();
 *
 * // Create an application created event
 * ApplicationEvent createdEvent = ApplicationEventFixture.applicationCreatedEvent()
 *     .withApplication(myApplication)
 *     .build();
 * }</pre>
 */
public class ApplicationEventFixture {

    private Long id = 1L;
    private JobApplication application = JobApplicationFixture.aJobApplication().build();
    private EventType eventType = EventType.FIELD_UPDATED;
    private String fieldName = "companyName";
    private String oldValue = "Old Company";
    private String newValue = "New Company";
    private String details = null;
    private Instant createdAt = Instant.now();

    /**
     * Creates a new fixture builder with default values.
     *
     * @return a new ApplicationEventFixture instance
     */
    public static ApplicationEventFixture anEvent() {
        return new ApplicationEventFixture();
    }

    /**
     * Creates a fixture builder pre-configured for an APPLICATION_CREATED event.
     *
     * @return a new ApplicationEventFixture configured for creation event
     */
    public static ApplicationEventFixture applicationCreatedEvent() {
        return new ApplicationEventFixture()
                .withEventType(EventType.APPLICATION_CREATED)
                .withFieldName(null)
                .withOldValue(null)
                .withNewValue(null)
                .withDetails("Application created");
    }

    /**
     * Creates a fixture builder pre-configured for a STATUS_CHANGED event.
     *
     * @return a new ApplicationEventFixture configured for status change event
     */
    public static ApplicationEventFixture statusChangedEvent() {
        return new ApplicationEventFixture()
                .withEventType(EventType.STATUS_CHANGED)
                .withFieldName("status")
                .withOldValue("APPLIED")
                .withNewValue("TECH_SCREEN")
                .withDetails(null);
    }

    /**
     * Creates a fixture builder pre-configured for an INTERVIEW_SCHEDULED event.
     *
     * @return a new ApplicationEventFixture configured for interview scheduled event
     */
    public static ApplicationEventFixture interviewScheduledEvent() {
        return new ApplicationEventFixture()
                .withEventType(EventType.INTERVIEW_SCHEDULED)
                .withFieldName("interviewDate")
                .withOldValue(null)
                .withNewValue(Instant.now().toString())
                .withDetails(null);
    }

    /**
     * Creates a fixture builder pre-configured for an INTERVIEW_UPDATED event.
     *
     * @return a new ApplicationEventFixture configured for interview updated event
     */
    public static ApplicationEventFixture interviewUpdatedEvent() {
        return new ApplicationEventFixture()
                .withEventType(EventType.INTERVIEW_UPDATED)
                .withFieldName("interviewDate")
                .withOldValue(Instant.now().minusSeconds(86400).toString())
                .withNewValue(Instant.now().toString())
                .withDetails(null);
    }

    /**
     * Creates a fixture builder pre-configured for a NOTE_ADDED event.
     *
     * @return a new ApplicationEventFixture configured for note added event
     */
    public static ApplicationEventFixture noteAddedEvent() {
        return new ApplicationEventFixture()
                .withEventType(EventType.NOTE_ADDED)
                .withFieldName("notes")
                .withOldValue(null)
                .withNewValue("First interview went well")
                .withDetails(null);
    }

    public ApplicationEventFixture withId(Long id) {
        this.id = id;
        return this;
    }

    public ApplicationEventFixture withApplication(JobApplication application) {
        this.application = application;
        return this;
    }

    public ApplicationEventFixture withEventType(EventType eventType) {
        this.eventType = eventType;
        return this;
    }

    public ApplicationEventFixture withFieldName(String fieldName) {
        this.fieldName = fieldName;
        return this;
    }

    public ApplicationEventFixture withOldValue(String oldValue) {
        this.oldValue = oldValue;
        return this;
    }

    public ApplicationEventFixture withNewValue(String newValue) {
        this.newValue = newValue;
        return this;
    }

    public ApplicationEventFixture withDetails(String details) {
        this.details = details;
        return this;
    }

    public ApplicationEventFixture withCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    /**
     * Builds an ApplicationEvent entity with the configured values.
     *
     * @return a new ApplicationEvent instance
     */
    public ApplicationEvent build() {
        return ApplicationEvent.builder()
                .id(id)
                .application(application)
                .eventType(eventType)
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .details(details)
                .createdAt(createdAt)
                .build();
    }

    /**
     * Builds an ApplicationEventResponse DTO with the configured values.
     *
     * @return a new ApplicationEventResponse instance
     */
    public ApplicationEventResponse buildResponse() {
        return new ApplicationEventResponse(
                id,
                application != null ? application.getId() : null,
                eventType,
                fieldName,
                oldValue,
                newValue,
                details,
                createdAt
        );
    }
}
