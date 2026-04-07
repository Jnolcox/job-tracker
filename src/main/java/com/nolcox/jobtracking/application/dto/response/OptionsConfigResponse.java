package com.nolcox.jobtracking.application.dto.response;

import java.util.List;

/**
 * Response DTO for options configuration endpoint.
 *
 * <p>Provides all enum options (RTO types, levels, etc.) with their display labels.
 * This allows the frontend to dynamically render dropdown options without
 * hardcoding enum values.</p>
 *
 * @param rtoTypes list of available remote/office work type options
 * @param levels list of available job level/seniority options
 */
public record OptionsConfigResponse(
        List<EnumOption> rtoTypes,
        List<EnumOption> levels
) {
    /**
     * Generic representation of an enum option for UI display.
     *
     * @param key the enum value/key (e.g., "REMOTE", "SENIOR")
     * @param label human-readable display label (e.g., "Remote", "Senior")
     */
    public record EnumOption(
            String key,
            String label
    ) {}
}
