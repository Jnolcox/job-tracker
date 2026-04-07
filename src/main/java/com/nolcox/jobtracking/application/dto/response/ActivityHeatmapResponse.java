package com.nolcox.jobtracking.application.dto.response;

import java.util.Map;

/**
 * Response DTO for activity heatmap analytics endpoint.
 *
 * <p>Contains application counts grouped by date for visualization in a heatmap
 * component. Useful for identifying patterns in application submission frequency
 * over time.</p>
 *
 * @param data map of date strings (ISO format YYYY-MM-DD) to application counts for that date
 * @param maxCount the highest daily application count (useful for scaling heatmap colors)
 * @param year the year for which the data is provided
 */
public record ActivityHeatmapResponse(
        Map<String, Integer> data,
        Integer maxCount,
        Integer year
) {}
