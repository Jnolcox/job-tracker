package com.nolcox.jobtracking.application.service;

import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse;

/**
 * Service interface for application configuration data.
 *
 * <p>Provides enum definitions and configuration values that the frontend
 * needs to dynamically render UI components. This eliminates the need for
 * hardcoded enum values in the frontend.</p>
 */
public interface ConfigService {

    /**
     * Retrieves all application status definitions.
     *
     * <p>Returns status information including display labels, colors, and
     * logical groupings for organizing statuses in the UI.</p>
     *
     * @return StatusConfigResponse with status definitions and groups
     */
    StatusConfigResponse getStatusConfig();

    /**
     * Retrieves all enum options for form fields.
     *
     * <p>Returns options for RTO types, job levels, and other enums that
     * are used in dropdown menus and form fields.</p>
     *
     * @return OptionsConfigResponse with enum options
     */
    OptionsConfigResponse getOptionsConfig();
}
