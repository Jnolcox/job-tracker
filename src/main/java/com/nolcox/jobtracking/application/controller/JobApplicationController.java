package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.ActivityHeatmapResponse;
import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.application.dto.response.ApplicationHealthResponse;
import com.nolcox.jobtracking.application.dto.response.FunnelAnalyticsResponse;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.dto.response.MetricsResponse;
import com.nolcox.jobtracking.application.dto.response.SalaryDistributionResponse;
import com.nolcox.jobtracking.application.dto.response.StageDurationsResponse;
import com.nolcox.jobtracking.application.dto.response.TimePatternsResponse;
import com.nolcox.jobtracking.application.dto.response.TransitionMatrixResponse;
import com.nolcox.jobtracking.application.service.AnalyticsService;
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
import java.time.Year;
import java.util.List;
import java.util.Map;


/**
 * REST controller for managing job applications, audit trails, and analytics.
 *
 * <p>Provides endpoints for CRUD operations on job applications, retrieval
 * of application events (audit trail), and analytics/metrics endpoints.
 * All endpoints require authentication.</p>
 *
 * @see JobApplicationService
 * @see ApplicationEventService
 * @see AnalyticsService
 */
@RestController
@RequestMapping("/v1/job-applications")
@RequiredArgsConstructor
@Tag(name = "Job Application", description = "Job application management and analytics endpoints")
public class JobApplicationController {

    private final JobApplicationService applicationService;
    private final ApplicationEventService eventService;
    private final AnalyticsService analyticsService;

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
        } catch (IllegalStateException ignored) {
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

    // ==================== Analytics Endpoints ====================

    /**
     * Retrieves comprehensive metrics about the user's job search.
     *
     * <p>Calculates response rates, interview rates, offer rates, average
     * response time, weekly application pace, and stage conversion rates.</p>
     *
     * @param authentication the current user's authentication
     * @return metrics response with aggregated statistics
     */
    @GetMapping("/metrics")
    @Operation(summary = "Get job search metrics",
            description = "Returns aggregated metrics including response rates, interview rates, " +
                    "offer rates, average days to response, and weekly application pace")
    public ResponseEntity<MetricsResponse> getMetrics(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        MetricsResponse metrics = analyticsService.getMetrics(userId);
        return ResponseEntity.ok(metrics);
    }

    /**
     * Retrieves application counts grouped by status.
     *
     * <p>Returns a map where each key is an ApplicationStatus and the value
     * is the count of applications in that status.</p>
     *
     * @param authentication the current user's authentication
     * @return map of status to count
     */
    @GetMapping("/counts-by-status")
    @Operation(summary = "Get application counts by status",
            description = "Returns the number of applications in each status")
    public ResponseEntity<Map<ApplicationStatus, Long>> getCountsByStatus(
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        Map<ApplicationStatus, Long> counts = analyticsService.getCountsByStatus(userId);
        return ResponseEntity.ok(counts);
    }

    /**
     * Retrieves salary distribution statistics for active applications.
     *
     * <p>Only includes applications that are not in terminal states
     * (rejected, withdrawn, ghosted) and have salary information.</p>
     *
     * @param authentication the current user's authentication
     * @return salary distribution statistics
     */
    @GetMapping("/analytics/salary-distribution")
    @Operation(summary = "Get salary distribution statistics",
            description = "Returns min, max, and average salary data for active applications")
    public ResponseEntity<SalaryDistributionResponse> getSalaryDistribution(
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        SalaryDistributionResponse distribution = analyticsService.getSalaryDistribution(userId);
        return ResponseEntity.ok(distribution);
    }

    /**
     * Retrieves application activity data for heatmap visualization.
     *
     * <p>Returns application counts grouped by date for the specified year.
     * If no year is specified, defaults to the current year.</p>
     *
     * @param year the year to filter by (defaults to current year)
     * @param authentication the current user's authentication
     * @return activity heatmap data with date-based counts
     */
    @GetMapping("/analytics/activity-heatmap")
    @Operation(summary = "Get activity heatmap data",
            description = "Returns application counts by date for heatmap visualization")
    public ResponseEntity<ActivityHeatmapResponse> getActivityHeatmap(
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        Integer targetYear = year != null ? year : Year.now().getValue();
        ActivityHeatmapResponse heatmap = analyticsService.getActivityHeatmap(userId, targetYear);
        return ResponseEntity.ok(heatmap);
    }

    /**
     * Retrieves time-based patterns in application submissions.
     *
     * <p>Analyzes when the user typically submits applications, broken
     * down by day of week and hour of day.</p>
     *
     * @param authentication the current user's authentication
     * @return time patterns with day and hour distributions
     */
    @GetMapping("/analytics/time-patterns")
    @Operation(summary = "Get application time patterns",
            description = "Returns distribution of applications by day of week and hour of day")
    public ResponseEntity<TimePatternsResponse> getTimePatterns(
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        TimePatternsResponse patterns = analyticsService.getTimePatterns(userId);
        return ResponseEntity.ok(patterns);
    }

    /**
     * Retrieves average time spent in each application stage.
     *
     * <p>Calculates the average duration applications spend in each status
     * and identifies bottleneck stages where applications tend to stall.</p>
     *
     * @param authentication the current user's authentication
     * @return stage duration statistics and bottleneck identification
     */
    @GetMapping("/analytics/stage-durations")
    @Operation(summary = "Get stage duration analytics",
            description = "Returns average time spent in each application stage and identifies bottlenecks")
    public ResponseEntity<StageDurationsResponse> getStageDurations(
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        StageDurationsResponse durations = analyticsService.getStageDurations(userId);
        return ResponseEntity.ok(durations);
    }

    // ==================== Event-Based Analytics Endpoints ====================

    /**
     * Retrieves the status transition matrix for heatmap visualization.
     *
     * <p>Analyzes all status change events to count transitions between different
     * application statuses. The response data is suitable for rendering as a heatmap
     * where rows represent "from" statuses, columns represent "to" statuses, and
     * cell values represent the count of that specific transition.</p>
     *
     * <p>Example use case: Understanding common application flow patterns, such as
     * how many applications went from APPLIED to RECRUITER_SCREEN vs. straight to REJECTED.</p>
     *
     * @param authentication the current user's authentication
     * @return transition matrix with status transitions and counts
     */
    @GetMapping("/analytics/transition-matrix")
    @Operation(summary = "Get status transition matrix",
            description = "Returns counts of status transitions for heatmap visualization. " +
                    "Shows how applications flow between different statuses.")
    public ResponseEntity<TransitionMatrixResponse> getTransitionMatrix(
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        TransitionMatrixResponse matrix = analyticsService.getTransitionMatrix(userId);
        return ResponseEntity.ok(matrix);
    }

    /**
     * Retrieves funnel analytics showing conversion rates and drop-off points.
     *
     * <p>Provides comprehensive funnel analysis including:</p>
     * <ul>
     *   <li>Stage conversion rates - percentage of applications advancing from each status</li>
     *   <li>Drop-off points - terminal statuses where applications commonly end</li>
     *   <li>Success rate by company - offer rates grouped by company name</li>
     *   <li>Success rate by position type - offer rates grouped by seniority/role keywords</li>
     *   <li>Overall success rate - total percentage of applications resulting in offers</li>
     * </ul>
     *
     * @param authentication the current user's authentication
     * @return funnel analytics with conversion rates and success metrics
     */
    @GetMapping("/analytics/funnel")
    @Operation(summary = "Get funnel analytics",
            description = "Returns stage conversion rates, drop-off points, and success rates " +
                    "by company and position type for pipeline analysis.")
    public ResponseEntity<FunnelAnalyticsResponse> getFunnelAnalytics(
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        FunnelAnalyticsResponse funnel = analyticsService.getFunnelAnalytics(userId);
        return ResponseEntity.ok(funnel);
    }

    /**
     * Retrieves application health indicators.
     *
     * <p>Categorizes applications into health-based groups:</p>
     * <ul>
     *   <li><b>Stale</b>: Active applications with no events in X days (needs follow-up)</li>
     *   <li><b>Hot</b>: Applications with 3+ events in last 7 days (high activity)</li>
     *   <li><b>Quick Wins</b>: Applications that received offers within 7 days</li>
     *   <li><b>Quick Losses</b>: Applications rejected/ghosted within 7 days</li>
     * </ul>
     *
     * <p>The staleDays parameter is configurable to adjust what "stale" means
     * for the user's job search velocity. Default is 14 days.</p>
     *
     * @param staleDays number of days without events to consider an application stale (default: 14)
     * @param authentication the current user's authentication
     * @return application health indicators with categorized applications
     */
    @GetMapping("/analytics/health")
    @Operation(summary = "Get application health indicators",
            description = "Returns stale applications, hot applications (high activity), " +
                    "quick wins, and quick losses for pipeline health monitoring.")
    public ResponseEntity<ApplicationHealthResponse> getApplicationHealth(
            @RequestParam(required = false, defaultValue = "14") Integer staleDays,
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        ApplicationHealthResponse health = analyticsService.getApplicationHealth(userId, staleDays);
        return ResponseEntity.ok(health);
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }

}
