package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse;
import com.nolcox.jobtracking.application.dto.response.OptionsConfigResponse.EnumOption;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse;
import com.nolcox.jobtracking.application.dto.response.StatusConfigResponse.StatusInfo;
import com.nolcox.jobtracking.application.service.ConfigService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ConfigController.
 *
 * <p>Tests verify that controller endpoints correctly delegate
 * to the ConfigService and return appropriate responses.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConfigController Tests")
class ConfigControllerTest {

    @Mock
    private ConfigService configService;

    @InjectMocks
    private ConfigController configController;

    @Nested
    @DisplayName("Get Status Config Tests")
    class GetStatusConfigTests {

        @Test
        @DisplayName("Should return status configuration with 200 OK")
        void shouldReturnStatusConfigurationWith200() {
            // Given
            List<StatusInfo> statuses = List.of(
                    new StatusInfo("APPLIED", "Applied", "#4E9AF1", "WAITING"),
                    new StatusInfo("TECH_SCREEN", "Technical Screen", "#22D3EE", "TECHNICAL")
            );
            Map<String, List<String>> groups = Map.of(
                    "WAITING", List.of("APPLIED"),
                    "TECHNICAL", List.of("TECH_SCREEN")
            );
            StatusConfigResponse expectedResponse = new StatusConfigResponse(statuses, groups);

            when(configService.getStatusConfig()).thenReturn(expectedResponse);

            // When
            ResponseEntity<StatusConfigResponse> response = configController.getStatusConfig();

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().statuses()).hasSize(2);
            assertThat(response.getBody().groups()).containsKey("WAITING");
            assertThat(response.getBody().groups()).containsKey("TECHNICAL");

            verify(configService).getStatusConfig();
        }

        @Test
        @DisplayName("Should return all statuses with required fields")
        void shouldReturnAllStatusesWithRequiredFields() {
            // Given
            List<StatusInfo> statuses = List.of(
                    new StatusInfo("APPLIED", "Applied", "#4E9AF1", "WAITING")
            );
            StatusConfigResponse expectedResponse = new StatusConfigResponse(statuses, Map.of());

            when(configService.getStatusConfig()).thenReturn(expectedResponse);

            // When
            ResponseEntity<StatusConfigResponse> response = configController.getStatusConfig();

            // Then
            assertThat(response.getBody()).isNotNull();
            StatusInfo firstStatus = response.getBody().statuses().get(0);
            assertThat(firstStatus.key()).isEqualTo("APPLIED");
            assertThat(firstStatus.label()).isEqualTo("Applied");
            assertThat(firstStatus.color()).isEqualTo("#4E9AF1");
            assertThat(firstStatus.group()).isEqualTo("WAITING");
        }
    }

    @Nested
    @DisplayName("Get Options Config Tests")
    class GetOptionsConfigTests {

        @Test
        @DisplayName("Should return options configuration with 200 OK")
        void shouldReturnOptionsConfigurationWith200() {
            // Given
            List<EnumOption> rtoTypes = List.of(
                    new EnumOption("REMOTE", "Remote"),
                    new EnumOption("HYBRID_2", "Hybrid (2 days/week)")
            );
            List<EnumOption> levels = List.of(
                    new EnumOption("JUNIOR", "Junior"),
                    new EnumOption("SENIOR", "Senior")
            );
            OptionsConfigResponse expectedResponse = new OptionsConfigResponse(rtoTypes, levels);

            when(configService.getOptionsConfig()).thenReturn(expectedResponse);

            // When
            ResponseEntity<OptionsConfigResponse> response = configController.getOptionsConfig();

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().rtoTypes()).hasSize(2);
            assertThat(response.getBody().levels()).hasSize(2);

            verify(configService).getOptionsConfig();
        }

        @Test
        @DisplayName("Should return RTO types with key and label")
        void shouldReturnRtoTypesWithKeyAndLabel() {
            // Given
            List<EnumOption> rtoTypes = List.of(
                    new EnumOption("HYBRID_3", "Hybrid (3 days/week)")
            );
            OptionsConfigResponse expectedResponse = new OptionsConfigResponse(rtoTypes, List.of());

            when(configService.getOptionsConfig()).thenReturn(expectedResponse);

            // When
            ResponseEntity<OptionsConfigResponse> response = configController.getOptionsConfig();

            // Then
            assertThat(response.getBody()).isNotNull();
            EnumOption firstRto = response.getBody().rtoTypes().get(0);
            assertThat(firstRto.key()).isEqualTo("HYBRID_3");
            assertThat(firstRto.label()).isEqualTo("Hybrid (3 days/week)");
        }

        @Test
        @DisplayName("Should return levels with key and label")
        void shouldReturnLevelsWithKeyAndLabel() {
            // Given
            List<EnumOption> levels = List.of(
                    new EnumOption("STAFF", "Staff")
            );
            OptionsConfigResponse expectedResponse = new OptionsConfigResponse(List.of(), levels);

            when(configService.getOptionsConfig()).thenReturn(expectedResponse);

            // When
            ResponseEntity<OptionsConfigResponse> response = configController.getOptionsConfig();

            // Then
            assertThat(response.getBody()).isNotNull();
            EnumOption firstLevel = response.getBody().levels().get(0);
            assertThat(firstLevel.key()).isEqualTo("STAFF");
            assertThat(firstLevel.label()).isEqualTo("Staff");
        }
    }
}
