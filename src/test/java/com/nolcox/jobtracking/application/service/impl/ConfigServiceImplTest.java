package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.Level;
import com.nolcox.jobtracking.domain.entity.RtoType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ConfigServiceImpl.
 *
 * <p>Tests verify that all enum values are properly represented
 * in the configuration responses with appropriate labels and groupings.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConfigService Tests")
class ConfigServiceImplTest {

    @InjectMocks
    private ConfigServiceImpl configService;

    @Nested
    @DisplayName("Get Status Config Tests")
    class GetStatusConfigTests {

        @Test
        @DisplayName("Should return all application statuses")
        void shouldReturnAllApplicationStatuses() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then: All ApplicationStatus enum values should be present
            assertThat(result.statuses()).isNotNull();
            List<String> statusKeys = result.statuses().stream()
                    .map(StatusConfigResponse.StatusInfo::key)
                    .collect(Collectors.toList());

            for (ApplicationStatus status : ApplicationStatus.values()) {
                assertThat(statusKeys).contains(status.name());
            }
        }

        @Test
        @DisplayName("Should have human-readable labels for all statuses")
        void shouldHaveHumanReadableLabels() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then: Each status should have a non-empty label
            for (StatusConfigResponse.StatusInfo status : result.statuses()) {
                assertThat(status.label())
                        .as("Status %s should have a label", status.key())
                        .isNotBlank();
            }
        }

        @Test
        @DisplayName("Should have valid color codes for all statuses")
        void shouldHaveValidColorCodes() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then: Each status should have a valid hex color code
            for (StatusConfigResponse.StatusInfo status : result.statuses()) {
                assertThat(status.color())
                        .as("Status %s should have a valid color", status.key())
                        .matches("^#[0-9A-Fa-f]{6}$");
            }
        }

        @Test
        @DisplayName("Should have group assignments for all statuses")
        void shouldHaveGroupAssignments() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then: Each status should have a group
            for (StatusConfigResponse.StatusInfo status : result.statuses()) {
                assertThat(status.group())
                        .as("Status %s should have a group", status.key())
                        .isNotBlank();
            }
        }

        @Test
        @DisplayName("Should define standard status groups")
        void shouldDefineStandardStatusGroups() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then: Expected groups should be present
            assertThat(result.groups()).isNotNull();
            assertThat(result.groups()).containsKey("REJECTED");
            assertThat(result.groups()).containsKey("WITHDRAWN");
            assertThat(result.groups()).containsKey("INTERVIEWING");
            assertThat(result.groups()).containsKey("OFFER");
            assertThat(result.groups()).containsKey("WAITING");
        }

        @Test
        @DisplayName("Should include REJECTED in rejected group")
        void shouldIncludeRejectedInRejectedGroup() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then
            assertThat(result.groups().get("REJECTED"))
                    .contains("REJECTED", "GHOSTED");
        }

        @Test
        @DisplayName("Should include interview stages in interviewing group")
        void shouldIncludeInterviewStagesInInterviewingGroup() {
            // When
            StatusConfigResponse result = configService.getStatusConfig();

            // Then: RECRUITER_SCREEN is in INTERVIEWING, TECH_SCREEN is in TECHNICAL group
            assertThat(result.groups().get("INTERVIEWING"))
                    .contains("RECRUITER_SCREEN");
            assertThat(result.groups().get("TECHNICAL"))
                    .contains("TECH_SCREEN");
        }
    }

    @Nested
    @DisplayName("Get Options Config Tests")
    class GetOptionsConfigTests {

        @Test
        @DisplayName("Should return all RTO types")
        void shouldReturnAllRtoTypes() {
            // When
            OptionsConfigResponse result = configService.getOptionsConfig();

            // Then: All RtoType enum values should be present
            assertThat(result.rtoTypes()).isNotNull();
            List<String> rtoKeys = result.rtoTypes().stream()
                    .map(OptionsConfigResponse.EnumOption::key)
                    .collect(Collectors.toList());

            for (RtoType rtoType : RtoType.values()) {
                assertThat(rtoKeys).contains(rtoType.name());
            }
        }

        @Test
        @DisplayName("Should return all levels")
        void shouldReturnAllLevels() {
            // When
            OptionsConfigResponse result = configService.getOptionsConfig();

            // Then: All Level enum values should be present
            assertThat(result.levels()).isNotNull();
            List<String> levelKeys = result.levels().stream()
                    .map(OptionsConfigResponse.EnumOption::key)
                    .collect(Collectors.toList());

            for (Level level : Level.values()) {
                assertThat(levelKeys).contains(level.name());
            }
        }

        @Test
        @DisplayName("Should have human-readable labels for RTO types")
        void shouldHaveHumanReadableLabelsForRtoTypes() {
            // When
            OptionsConfigResponse result = configService.getOptionsConfig();

            // Then
            for (OptionsConfigResponse.EnumOption option : result.rtoTypes()) {
                assertThat(option.label())
                        .as("RTO type %s should have a label", option.key())
                        .isNotBlank();
            }
        }

        @Test
        @DisplayName("Should have human-readable labels for levels")
        void shouldHaveHumanReadableLabelsForLevels() {
            // When
            OptionsConfigResponse result = configService.getOptionsConfig();

            // Then
            for (OptionsConfigResponse.EnumOption option : result.levels()) {
                assertThat(option.label())
                        .as("Level %s should have a label", option.key())
                        .isNotBlank();
            }
        }

        @Test
        @DisplayName("Should have descriptive labels for hybrid options")
        void shouldHaveDescriptiveLabelsForHybridOptions() {
            // When
            OptionsConfigResponse result = configService.getOptionsConfig();

            // Then: Hybrid options should include the number of days
            OptionsConfigResponse.EnumOption hybrid2 = result.rtoTypes().stream()
                    .filter(opt -> opt.key().equals("HYBRID_2"))
                    .findFirst()
                    .orElseThrow();

            assertThat(hybrid2.label()).contains("2");
        }
    }
}
