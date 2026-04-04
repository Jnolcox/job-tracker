package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for stage durations analytics endpoint.
 *
 * <p>Provides average time spent in each application stage and identifies
 * bottleneck stages where applications tend to stall. This helps users
 * understand their pipeline velocity and identify areas for improvement.</p>
 *
 * @param averageTimeByStage map of status to average days spent in that stage
 * @param bottleneckStages list of stages sorted by average duration (descending), identifying slowest stages
 */
public record StageDurationsResponse(
        Map<ApplicationStatus, Double> averageTimeByStage,
        List<BottleneckStage> bottleneckStages
) {
    /**
     * Represents a pipeline stage that may be a bottleneck.
     *
     * @param stage the application status/stage
     * @param avgDays average number of days applications spend in this stage
     */
    public record BottleneckStage(
            ApplicationStatus stage,
            Double avgDays
    ) {}
}
