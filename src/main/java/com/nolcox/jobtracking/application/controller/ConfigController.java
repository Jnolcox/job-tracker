package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse;
import com.nolcox.jobtracking.application.service.ConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for application configuration endpoints.
 *
 * <p>Provides endpoints for retrieving enum definitions and configuration
 * values that the frontend needs to dynamically render UI components.
 * These endpoints are public and do not require authentication since
 * they contain no user-specific data.</p>
 *
 * @see ConfigService
 */
@RestController
@RequestMapping("/v1/config")
@RequiredArgsConstructor
@Tag(name = "Configuration", description = "Application configuration endpoints")
public class ConfigController {

    private final ConfigService configService;

    /**
     * Retrieves all application status definitions.
     *
     * <p>Returns status information including display labels, colors for UI
     * rendering, and logical groupings for organizing statuses by category.</p>
     *
     * <p>Example response:
     * <pre>
     * {
     *   "statuses": [
     *     {"key": "APPLIED", "label": "Applied", "color": "#4E9AF1", "group": "WAITING"},
     *     {"key": "TECH_SCREEN", "label": "Technical Screen", "color": "#22D3EE", "group": "TECHNICAL"}
     *   ],
     *   "groups": {
     *     "WAITING": ["APPLIED", "WAITING_FOR_RESPONSE"],
     *     "TECHNICAL": ["TECH_SCREEN", "TAKE_HOME"]
     *   }
     * }
     * </pre>
     * </p>
     *
     * @return StatusConfigResponse with all status definitions and groups
     */
    @GetMapping("/statuses")
    @Operation(summary = "Get all status definitions",
            description = "Returns all application status definitions with labels, colors, and groupings")
    public ResponseEntity<StatusConfigResponse> getStatusConfig() {
        StatusConfigResponse config = configService.getStatusConfig();
        return ResponseEntity.ok(config);
    }

    /**
     * Retrieves all enum options for form fields.
     *
     * <p>Returns options for RTO types (Remote, Hybrid, On-site), job levels
     * (Junior, Senior, etc.), and other enums that are used in dropdown menus
     * and form fields throughout the application.</p>
     *
     * <p>Example response:
     * <pre>
     * {
     *   "rtoTypes": [
     *     {"key": "REMOTE", "label": "Remote"},
     *     {"key": "HYBRID_2", "label": "Hybrid (2 days/week)"}
     *   ],
     *   "levels": [
     *     {"key": "JUNIOR", "label": "Junior"},
     *     {"key": "SENIOR", "label": "Senior"}
     *   ]
     * }
     * </pre>
     * </p>
     *
     * @return OptionsConfigResponse with all enum options
     */
    @GetMapping("/options")
    @Operation(summary = "Get all enum options",
            description = "Returns RTO types, levels, and other enum options for form fields")
    public ResponseEntity<OptionsConfigResponse> getOptionsConfig() {
        OptionsConfigResponse config = configService.getOptionsConfig();
        return ResponseEntity.ok(config);
    }
}
