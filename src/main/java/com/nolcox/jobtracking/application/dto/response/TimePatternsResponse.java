package com.nolcox.jobtracking.application.dto.response;

import java.time.DayOfWeek;
import java.util.Map;

/**
 * Response DTO for time patterns analytics endpoint.
 *
 * <p>Provides insights into when a user typically submits job applications,
 * broken down by day of week and hour of day. This can help users identify
 * their most productive application times.</p>
 *
 * @param byDayOfWeek map of day of week to application count
 * @param byHour map of hour (0-23) to application count
 */
public record TimePatternsResponse(
        Map<DayOfWeek, Integer> byDayOfWeek,
        Map<Integer, Integer> byHour
) {}
