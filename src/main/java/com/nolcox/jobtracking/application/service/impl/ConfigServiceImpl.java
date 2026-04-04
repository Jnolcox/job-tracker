package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse;
import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse.EnumOption;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse.StatusInfo;
import com.nolcox.jobtracking.application.service.ConfigService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.Level;
import com.nolcox.jobtracking.domain.entity.RtoType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ConfigService} for application configuration.
 *
 * <p>Provides enum definitions and their display properties for the frontend
 * to dynamically render UI components. This centralizes the mapping between
 * enum values and their human-readable representations.</p>
 *
 * <p>Color codes follow a consistent scheme:
 * <ul>
 *   <li>Blue tones for waiting/applied states</li>
 *   <li>Purple tones for screening stages</li>
 *   <li>Cyan/teal for technical stages</li>
 *   <li>Green for offers and success</li>
 *   <li>Red for rejections and negative outcomes</li>
 *   <li>Orange for withdrawn/on-hold</li>
 *   <li>Gray for ghosted/inactive</li>
 * </ul>
 * </p>
 */
@Service
@Slf4j
public class ConfigServiceImpl implements ConfigService {

    /**
     * Maps each status to its display properties.
     * Includes label, color, and group assignment.
     */
    private static final Map<ApplicationStatus, StatusMetadata> STATUS_METADATA = new HashMap<>();

    /**
     * Defines logical groupings for statuses.
     */
    private static final Map<String, List<String>> STATUS_GROUPS = new HashMap<>();

    static {
        // Initialize status metadata with colors and labels
        // Blue tones for initial/waiting states
        STATUS_METADATA.put(ApplicationStatus.APPLIED,
                new StatusMetadata("Applied", "#4E9AF1", "WAITING"));
        STATUS_METADATA.put(ApplicationStatus.WAITING_FOR_RESPONSE,
                new StatusMetadata("Waiting for Response", "#60A5FA", "WAITING"));

        // Purple tones for recruiter/initial screening
        STATUS_METADATA.put(ApplicationStatus.RECRUITER_SCREEN,
                new StatusMetadata("Recruiter Screen", "#A78BFA", "INTERVIEWING"));

        // Cyan/teal for technical stages
        STATUS_METADATA.put(ApplicationStatus.TECH_SCREEN,
                new StatusMetadata("Technical Screen", "#22D3EE", "TECHNICAL"));
        STATUS_METADATA.put(ApplicationStatus.TAKE_HOME,
                new StatusMetadata("Take Home Assignment", "#06B6D4", "TECHNICAL"));
        STATUS_METADATA.put(ApplicationStatus.SYSTEM_DESIGN,
                new StatusMetadata("System Design", "#0891B2", "TECHNICAL"));
        STATUS_METADATA.put(ApplicationStatus.TECHNICAL_I,
                new StatusMetadata("Technical Interview I", "#14B8A6", "TECHNICAL"));
        STATUS_METADATA.put(ApplicationStatus.TECHNICAL_II,
                new StatusMetadata("Technical Interview II", "#0D9488", "TECHNICAL"));

        // Blue-green for final stages
        STATUS_METADATA.put(ApplicationStatus.REFERENCE_CHECK,
                new StatusMetadata("Reference Check", "#10B981", "INTERVIEWING"));

        // Green for offers
        STATUS_METADATA.put(ApplicationStatus.OFFER_RECEIVED,
                new StatusMetadata("Offer Received", "#22C55E", "OFFER"));
        STATUS_METADATA.put(ApplicationStatus.NEGOTIATING,
                new StatusMetadata("Negotiating", "#84CC16", "OFFER"));
        STATUS_METADATA.put(ApplicationStatus.OFFER_ACCEPTED,
                new StatusMetadata("Offer Accepted", "#16A34A", "OFFER"));

        // Orange/yellow for declined/rescinded offers
        STATUS_METADATA.put(ApplicationStatus.OFFER_DECLINED,
                new StatusMetadata("Offer Declined", "#F59E0B", "REJECTED"));
        STATUS_METADATA.put(ApplicationStatus.OFFER_RESCINDED,
                new StatusMetadata("Offer Rescinded", "#EF4444", "REJECTED"));

        // Red for rejections
        STATUS_METADATA.put(ApplicationStatus.REJECTED,
                new StatusMetadata("Rejected", "#EF4444", "REJECTED"));

        // Orange for withdrawn
        STATUS_METADATA.put(ApplicationStatus.WITHDRAWN,
                new StatusMetadata("Withdrawn", "#F97316", "WITHDRAWN"));

        // Yellow for on-hold
        STATUS_METADATA.put(ApplicationStatus.ON_HOLD,
                new StatusMetadata("On Hold", "#EAB308", "WAITING"));

        // Gray for ghosted
        STATUS_METADATA.put(ApplicationStatus.GHOSTED,
                new StatusMetadata("Ghosted", "#6B7280", "REJECTED"));

        // Initialize status groups
        STATUS_GROUPS.put("REJECTED", List.of(
                "REJECTED", "OFFER_DECLINED", "OFFER_RESCINDED", "GHOSTED"));
        STATUS_GROUPS.put("WITHDRAWN", List.of("WITHDRAWN"));
        STATUS_GROUPS.put("INTERVIEWING", List.of(
                "RECRUITER_SCREEN", "REFERENCE_CHECK"));
        STATUS_GROUPS.put("TECHNICAL", List.of(
                "TECH_SCREEN", "TAKE_HOME", "SYSTEM_DESIGN", "TECHNICAL_I", "TECHNICAL_II"));
        STATUS_GROUPS.put("OFFER", List.of(
                "OFFER_RECEIVED", "NEGOTIATING", "OFFER_ACCEPTED"));
        STATUS_GROUPS.put("WAITING", List.of(
                "APPLIED", "WAITING_FOR_RESPONSE", "ON_HOLD"));
    }

    /**
     * Maps RTO type enums to their human-readable labels.
     */
    private static final Map<RtoType, String> RTO_LABELS = Map.of(
            RtoType.REMOTE, "Remote",
            RtoType.HYBRID_2, "Hybrid (2 days/week)",
            RtoType.HYBRID_3, "Hybrid (3 days/week)",
            RtoType.HYBRID_4, "Hybrid (4 days/week)",
            RtoType.ONSITE, "On-site"
    );

    /**
     * Maps Level enums to their human-readable labels.
     */
    private static final Map<Level, String> LEVEL_LABELS = Map.of(
            Level.JUNIOR, "Junior",
            Level.MID, "Mid-Level",
            Level.SENIOR, "Senior",
            Level.STAFF, "Staff",
            Level.PRINCIPAL, "Principal",
            Level.LEAD, "Lead",
            Level.MANAGER, "Manager",
            Level.DIRECTOR, "Director",
            Level.VP, "VP"
    );

    @Override
    public StatusConfigResponse getStatusConfig() {
        log.debug("Getting status configuration");

        List<StatusInfo> statuses = Arrays.stream(ApplicationStatus.values())
                .map(status -> {
                    StatusMetadata metadata = STATUS_METADATA.getOrDefault(status,
                            new StatusMetadata(formatEnumName(status.name()), "#9CA3AF", "OTHER"));
                    return new StatusInfo(
                            status.name(),
                            metadata.label(),
                            metadata.color(),
                            metadata.group()
                    );
                })
                .collect(Collectors.toList());

        return new StatusConfigResponse(statuses, STATUS_GROUPS);
    }

    @Override
    public OptionsConfigResponse getOptionsConfig() {
        log.debug("Getting options configuration");

        List<EnumOption> rtoTypes = Arrays.stream(RtoType.values())
                .map(rto -> new EnumOption(
                        rto.name(),
                        RTO_LABELS.getOrDefault(rto, formatEnumName(rto.name()))
                ))
                .collect(Collectors.toList());

        List<EnumOption> levels = Arrays.stream(Level.values())
                .map(level -> new EnumOption(
                        level.name(),
                        LEVEL_LABELS.getOrDefault(level, formatEnumName(level.name()))
                ))
                .collect(Collectors.toList());

        return new OptionsConfigResponse(rtoTypes, levels);
    }

    /**
     * Converts an UPPER_SNAKE_CASE enum name to a Title Case label.
     *
     * <p>Example: "TECH_SCREEN" becomes "Tech Screen"</p>
     *
     * @param enumName the enum constant name
     * @return a human-readable label
     */
    private String formatEnumName(String enumName) {
        return Arrays.stream(enumName.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() +
                        word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    /**
     * Internal record to hold status display metadata.
     */
    private record StatusMetadata(String label, String color, String group) {}
}
