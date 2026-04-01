package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.service.ApplicationEventService;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;


/**
 * REST controller for managing job applications and their audit trails.
 *
 * <p>Provides endpoints for CRUD operations on job applications and retrieval
 * of application events (audit trail). All endpoints require authentication.</p>
 *
 * @see JobApplicationService
 * @see ApplicationEventService
 */
@RestController
@RequestMapping("/v1/job-applications")
@RequiredArgsConstructor
@Tag(name = "Job Application", description = "Job application management endpoints")
public class JobApplicationController {

    private final JobApplicationService applicationService;
    private final ApplicationEventService eventService;

    @GetMapping
    @Operation(summary = "Get all job applications for current user")
    public ResponseEntity<Page<JobApplicationResponse>> getAllApplications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String companyName,
            @ParameterObject Pageable pageable,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        Page<JobApplicationResponse> applications =
                applicationService.getUserApplications(userId, status, companyName, pageable);

        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job application by ID")
    public ResponseEntity<JobApplicationResponse> getApplication(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        JobApplicationResponse application = applicationService.getApplication(id, userId);
        return ResponseEntity.ok(application);
    }

    @PostMapping
    @Operation(summary = "Create new job application")
    public ResponseEntity<JobApplicationResponse> createApplication(
            @Valid @RequestBody JobApplicationCreateRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        JobApplicationResponse created = applicationService.createApplication(request, userId);

        try {
            URI location = ServletUriComponentsBuilder
                    .fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(created.id())
                    .toUri();
            return ResponseEntity.created(location).body(created);
        } catch (IllegalStateException e) {
            // For unit tests or when no servlet context is available
            return ResponseEntity.status(201).body(created);
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update job application")
    public ResponseEntity<JobApplicationResponse> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody JobApplicationUpdateRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        JobApplicationResponse updated = applicationService.updateApplication(id, request, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete job application")
    public ResponseEntity<Void> deleteApplication(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        applicationService.deleteApplication(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves all audit events for all of the current user's job applications.
     *
     * <p>This bulk endpoint returns all events across all applications in a single request,
     * which is more efficient than making N parallel requests to the per-application events
     * endpoint. Events are returned in reverse chronological order (newest first).</p>
     *
     * <p>Use this endpoint for dashboard activity feeds or when you need to display
     * a unified timeline of all application activity.</p>
     *
     * @param authentication the current user's authentication
     * @return list of all events for the user's applications, ordered by creation time descending
     */
    @GetMapping("/events/all")
    @Operation(summary = "Get all events for current user's applications",
            description = "Returns all audit events across all applications for the authenticated user in reverse chronological order")
    public ResponseEntity<List<ApplicationEventResponse>> getAllEventsForUser(
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        List<ApplicationEventResponse> events = eventService.getAllEventsForUser(userId);
        return ResponseEntity.ok(events);
    }

    /**
     * Retrieves the audit trail (events) for a specific job application.
     *
     * <p>Returns all events associated with the application in reverse chronological
     * order (newest first). Events include application creation, status changes,
     * interview scheduling, and field updates.</p>
     *
     * @param id the ID of the job application
     * @param authentication the current user's authentication
     * @return list of events ordered by creation time descending
     */
    @GetMapping("/{id}/events")
    @Operation(summary = "Get audit trail for job application",
            description = "Returns all events/changes for the specified application in reverse chronological order")
    public ResponseEntity<List<ApplicationEventResponse>> getApplicationEvents(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        List<ApplicationEventResponse> events = eventService.getEventsForApplication(id, userId);
        return ResponseEntity.ok(events);
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }

}
