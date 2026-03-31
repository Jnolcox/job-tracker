package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.EventType;

import java.time.Instant;

/**
 * DTO for representing an application event in API responses.
 *
 * <p>This record provides a read-only view of an {@link com.nolcox.jobtracking.domain.entity.ApplicationEvent}
 * suitable for transmission over the API. It excludes the full application object
 * to prevent circular references and reduce payload size.</p>
 *
 * <p>Example JSON representation:</p>
 * <pre>{@code
 * {
 *   "id": 1,
 *   "applicationId": 42,
 *   "eventType": "STATUS_CHANGED",
 *   "fieldName": "status",
 *   "oldValue": "APPLIED",
 *   "newValue": "TECH_SCREEN",
 *   "details": "Status changed by user",
 *   "createdAt": "2024-02-15T10:30:00Z"
 * }
 * }</pre>
 *
 * @param id            unique identifier of the event
 * @param applicationId ID of the associated job application
 * @param eventType     type of event that occurred
 * @param fieldName     name of the field that changed (for FIELD_UPDATED events)
 * @param oldValue      previous value before the change
 * @param newValue      new value after the change
 * @param details       additional context or description of the event
 * @param createdAt     timestamp when the event was recorded
 */
public record ApplicationEventResponse(
        Long id,
        Long applicationId,
        EventType eventType,
        String fieldName,
        String oldValue,
        String newValue,
        String details,
        Instant createdAt
) {}
