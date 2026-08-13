package com.nolcox.jobtracking.domain.repository;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for bulk delete operations on JobApplication entities.
 *
 * <p>These tests verify the correct behavior of bulk deletion methods which are
 * critical for data cleanup operations such as user account deletion or batch
 * processing of applications by status.</p>
 *
 * <p>IMPORTANT: Events must be deleted BEFORE applications to maintain JPA
 * consistency due to the foreign key relationship. These tests focus on the
 * JobApplication repository; see ApplicationEventRepositoryBulkDeleteTest
 * for the corresponding event deletion tests.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
class JobApplicationRepositoryBulkDeleteTest {

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        // Clean slate for each test
        jobApplicationRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        testUser = userRepository.save(User.builder()
                .email("test@example.com")
                .password("hashedPassword")
                .firstName("Test")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@example.com")
                .password("hashedPassword")
                .firstName("Other")
                .lastName("User")
                .role(Role.USER)
                .enabled(true)
                .build());
    }

    /**
     * Helper method to create a job application with specified parameters.
     */
    private JobApplication createApplication(User user, String companyName, ApplicationStatus status) {
        return jobApplicationRepository.save(JobApplication.builder()
                .user(user)
                .companyName(companyName)
                .positionTitle("Software Engineer")
                .status(status)
                .appliedDate(Instant.now())
                .build());
    }

    @Nested
    @DisplayName("deleteAllByUserId")
    class DeleteAllByUserIdTests {

        @Test
        @DisplayName("should delete all applications for specified user")
        void deleteAllByUserId_existingApplications_deletesAll() {
            // Given - Create applications for test user
            createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            createApplication(testUser, "Company B", ApplicationStatus.TECH_SCREEN);
            createApplication(testUser, "Company C", ApplicationStatus.REJECTED);

            // Create applications for other user (should NOT be deleted)
            createApplication(otherUser, "Company D", ApplicationStatus.APPLIED);

            // Verify initial state
            assertThat(jobApplicationRepository.findAllByUserId(testUser.getId())).hasSize(3);
            assertThat(jobApplicationRepository.findAllByUserId(otherUser.getId())).hasSize(1);

            // When
            jobApplicationRepository.deleteAllByUserId(testUser.getId());

            // Then - Test user's applications are deleted
            assertThat(jobApplicationRepository.findAllByUserId(testUser.getId())).isEmpty();
            // Other user's applications remain untouched
            assertThat(jobApplicationRepository.findAllByUserId(otherUser.getId())).hasSize(1);
        }

        @Test
        @DisplayName("should handle user with no applications gracefully")
        void deleteAllByUserId_noApplications_noException() {
            // Given - No applications for test user
            assertThat(jobApplicationRepository.findAllByUserId(testUser.getId())).isEmpty();

            // When & Then - Should not throw exception
            jobApplicationRepository.deleteAllByUserId(testUser.getId());

            // Verify no side effects
            assertThat(jobApplicationRepository.findAllByUserId(testUser.getId())).isEmpty();
        }

        @Test
        @DisplayName("should handle non-existent user ID gracefully")
        void deleteAllByUserId_nonExistentUser_noException() {
            // Given
            Long nonExistentUserId = 99999L;

            // When & Then - Should not throw exception
            jobApplicationRepository.deleteAllByUserId(nonExistentUserId);
        }
    }

    @Nested
    @DisplayName("findIdsByUserIdAndStatusIn")
    class FindIdsByUserIdAndStatusInTests {

        @Test
        @DisplayName("should find application IDs matching specified statuses")
        void findIdsByUserIdAndStatusIn_matchingStatuses_returnsIds() {
            // Given
            JobApplication app1 = createApplication(testUser, "Company A", ApplicationStatus.REJECTED);
            JobApplication app2 = createApplication(testUser, "Company B", ApplicationStatus.WITHDRAWN);
            createApplication(testUser, "Company C", ApplicationStatus.APPLIED); // Should NOT match
            createApplication(testUser, "Company D", ApplicationStatus.OFFER_ACCEPTED); // Should NOT match

            Set<ApplicationStatus> targetStatuses = Set.of(
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.WITHDRAWN
            );

            // When
            List<Long> foundIds = jobApplicationRepository.findIdsByUserIdAndStatusIn(
                    testUser.getId(), targetStatuses);

            // Then
            assertThat(foundIds)
                    .hasSize(2)
                    .containsExactlyInAnyOrder(app1.getId(), app2.getId());
        }

        @Test
        @DisplayName("should only return IDs for specified user")
        void findIdsByUserIdAndStatusIn_multipleUsers_onlyReturnsSpecifiedUserIds() {
            // Given
            JobApplication testUserApp = createApplication(testUser, "Company A", ApplicationStatus.REJECTED);
            createApplication(otherUser, "Company B", ApplicationStatus.REJECTED); // Same status, different user

            Set<ApplicationStatus> targetStatuses = Set.of(ApplicationStatus.REJECTED);

            // When
            List<Long> foundIds = jobApplicationRepository.findIdsByUserIdAndStatusIn(
                    testUser.getId(), targetStatuses);

            // Then - Only test user's application ID is returned
            assertThat(foundIds)
                    .hasSize(1)
                    .containsExactly(testUserApp.getId());
        }

        @Test
        @DisplayName("should return empty list when no applications match statuses")
        void findIdsByUserIdAndStatusIn_noMatchingStatuses_returnsEmptyList() {
            // Given
            createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            createApplication(testUser, "Company B", ApplicationStatus.TECH_SCREEN);

            Set<ApplicationStatus> targetStatuses = Set.of(
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.WITHDRAWN
            );

            // When
            List<Long> foundIds = jobApplicationRepository.findIdsByUserIdAndStatusIn(
                    testUser.getId(), targetStatuses);

            // Then
            assertThat(foundIds).isEmpty();
        }

        @Test
        @DisplayName("should return empty list for user with no applications")
        void findIdsByUserIdAndStatusIn_noApplications_returnsEmptyList() {
            // Given - No applications
            Set<ApplicationStatus> targetStatuses = Set.of(ApplicationStatus.REJECTED);

            // When
            List<Long> foundIds = jobApplicationRepository.findIdsByUserIdAndStatusIn(
                    testUser.getId(), targetStatuses);

            // Then
            assertThat(foundIds).isEmpty();
        }

        @Test
        @DisplayName("should handle single status in set")
        void findIdsByUserIdAndStatusIn_singleStatus_returnsMatchingIds() {
            // Given
            JobApplication app1 = createApplication(testUser, "Company A", ApplicationStatus.GHOSTED);
            createApplication(testUser, "Company B", ApplicationStatus.APPLIED);

            Set<ApplicationStatus> targetStatuses = Set.of(ApplicationStatus.GHOSTED);

            // When
            List<Long> foundIds = jobApplicationRepository.findIdsByUserIdAndStatusIn(
                    testUser.getId(), targetStatuses);

            // Then
            assertThat(foundIds)
                    .hasSize(1)
                    .containsExactly(app1.getId());
        }

        @Test
        @DisplayName("should handle multiple matching applications with same status")
        void findIdsByUserIdAndStatusIn_multipleAppsWithSameStatus_returnsAllIds() {
            // Given - Multiple applications with REJECTED status
            JobApplication app1 = createApplication(testUser, "Company A", ApplicationStatus.REJECTED);
            JobApplication app2 = createApplication(testUser, "Company B", ApplicationStatus.REJECTED);
            JobApplication app3 = createApplication(testUser, "Company C", ApplicationStatus.REJECTED);

            Set<ApplicationStatus> targetStatuses = Set.of(ApplicationStatus.REJECTED);

            // When
            List<Long> foundIds = jobApplicationRepository.findIdsByUserIdAndStatusIn(
                    testUser.getId(), targetStatuses);

            // Then
            assertThat(foundIds)
                    .hasSize(3)
                    .containsExactlyInAnyOrder(app1.getId(), app2.getId(), app3.getId());
        }
    }

    @Nested
    @DisplayName("deleteAllByIdIn")
    class DeleteAllByIdInTests {

        @Test
        @DisplayName("should delete all applications with specified IDs")
        void deleteAllByIdIn_existingIds_deletesAll() {
            // Given
            JobApplication app1 = createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            JobApplication app2 = createApplication(testUser, "Company B", ApplicationStatus.TECH_SCREEN);
            JobApplication app3 = createApplication(testUser, "Company C", ApplicationStatus.REJECTED);

            List<Long> idsToDelete = List.of(app1.getId(), app2.getId());

            // When
            jobApplicationRepository.deleteAllByIdIn(idsToDelete);

            // Then - app1 and app2 are deleted, app3 remains
            assertThat(jobApplicationRepository.findById(app1.getId())).isEmpty();
            assertThat(jobApplicationRepository.findById(app2.getId())).isEmpty();
            assertThat(jobApplicationRepository.findById(app3.getId())).isPresent();
        }

        @Test
        @DisplayName("should handle empty ID list gracefully")
        void deleteAllByIdIn_emptyList_noException() {
            // Given
            JobApplication app = createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            List<Long> emptyList = List.of();

            // When & Then - Should not throw exception
            jobApplicationRepository.deleteAllByIdIn(emptyList);

            // Verify no side effects
            assertThat(jobApplicationRepository.findById(app.getId())).isPresent();
        }

        @Test
        @DisplayName("should handle non-existent IDs gracefully")
        void deleteAllByIdIn_nonExistentIds_noException() {
            // Given
            JobApplication app = createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            List<Long> nonExistentIds = List.of(99999L, 99998L);

            // When & Then - Should not throw exception
            jobApplicationRepository.deleteAllByIdIn(nonExistentIds);

            // Verify existing application is unaffected
            assertThat(jobApplicationRepository.findById(app.getId())).isPresent();
        }

        @Test
        @DisplayName("should handle mix of existing and non-existent IDs")
        void deleteAllByIdIn_mixedIds_deletesOnlyExisting() {
            // Given
            JobApplication app1 = createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            JobApplication app2 = createApplication(testUser, "Company B", ApplicationStatus.TECH_SCREEN);

            List<Long> mixedIds = List.of(app1.getId(), 99999L, 99998L);

            // When
            jobApplicationRepository.deleteAllByIdIn(mixedIds);

            // Then - app1 is deleted, app2 remains
            assertThat(jobApplicationRepository.findById(app1.getId())).isEmpty();
            assertThat(jobApplicationRepository.findById(app2.getId())).isPresent();
        }

        @Test
        @DisplayName("should delete applications regardless of owner")
        void deleteAllByIdIn_multipleUsers_deletesAll() {
            // Given - Applications from different users
            JobApplication testUserApp = createApplication(testUser, "Company A", ApplicationStatus.APPLIED);
            JobApplication otherUserApp = createApplication(otherUser, "Company B", ApplicationStatus.APPLIED);

            List<Long> idsToDelete = List.of(testUserApp.getId(), otherUserApp.getId());

            // When
            jobApplicationRepository.deleteAllByIdIn(idsToDelete);

            // Then - Both are deleted
            assertThat(jobApplicationRepository.findById(testUserApp.getId())).isEmpty();
            assertThat(jobApplicationRepository.findById(otherUserApp.getId())).isEmpty();
        }
    }
}
