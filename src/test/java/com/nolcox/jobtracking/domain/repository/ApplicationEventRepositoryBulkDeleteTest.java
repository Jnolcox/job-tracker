package com.nolcox.jobtracking.domain.repository;

import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.EventType;
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

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for bulk delete operations on ApplicationEvent entities.
 *
 * <p>These tests verify the correct behavior of bulk deletion methods which are
 * critical for maintaining data consistency when deleting job applications or
 * cleaning up user data.</p>
 *
 * <p>IMPORTANT: Due to the foreign key relationship between ApplicationEvent and
 * JobApplication, events MUST be deleted BEFORE their parent applications to
 * maintain JPA/database consistency. The bulk delete service should always call
 * event deletion methods before application deletion methods.</p>
 *
 * @see JobApplicationRepositoryBulkDeleteTest
 */
@DataJpaTest
@ActiveProfiles("test")
class ApplicationEventRepositoryBulkDeleteTest {

    @Autowired
    private ApplicationEventRepository applicationEventRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private User otherUser;
    private JobApplication testUserApp1;
    private JobApplication testUserApp2;
    private JobApplication otherUserApp;

    @BeforeEach
    void setUp() {
        // Clean slate for each test
        applicationEventRepository.deleteAll();
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

        // Create applications for both users
        testUserApp1 = jobApplicationRepository.save(JobApplication.builder()
                .user(testUser)
                .companyName("Company A")
                .positionTitle("Developer")
                .status(ApplicationStatus.APPLIED)
                .appliedDate(Instant.now())
                .build());

        testUserApp2 = jobApplicationRepository.save(JobApplication.builder()
                .user(testUser)
                .companyName("Company B")
                .positionTitle("Engineer")
                .status(ApplicationStatus.TECH_SCREEN)
                .appliedDate(Instant.now())
                .build());

        otherUserApp = jobApplicationRepository.save(JobApplication.builder()
                .user(otherUser)
                .companyName("Company C")
                .positionTitle("Manager")
                .status(ApplicationStatus.APPLIED)
                .appliedDate(Instant.now())
                .build());
    }

    /**
     * Helper method to create an event for a given application.
     */
    private ApplicationEvent createEvent(JobApplication application, EventType eventType, String details) {
        return applicationEventRepository.save(ApplicationEvent.builder()
                .application(application)
                .eventType(eventType)
                .fieldName(eventType == EventType.STATUS_CHANGED ? "status" : null)
                .oldValue(eventType == EventType.STATUS_CHANGED ? "APPLIED" : null)
                .newValue(eventType == EventType.STATUS_CHANGED ? "TECH_SCREEN" : null)
                .details(details)
                .createdAt(Instant.now())
                .build());
    }

    @Nested
    @DisplayName("deleteAllByUserId")
    class DeleteAllByUserIdTests {

        @Test
        @DisplayName("should delete all events for all applications owned by specified user")
        void deleteAllByUserId_existingEvents_deletesAll() {
            // Given - Create events for test user's applications
            createEvent(testUserApp1, EventType.APPLICATION_CREATED, "App 1 created");
            createEvent(testUserApp1, EventType.STATUS_CHANGED, "App 1 status change");
            createEvent(testUserApp2, EventType.APPLICATION_CREATED, "App 2 created");

            // Create events for other user (should NOT be deleted)
            createEvent(otherUserApp, EventType.APPLICATION_CREATED, "Other user app created");

            // Verify initial state
            assertThat(applicationEventRepository.findAllByUserId(testUser.getId())).hasSize(3);
            assertThat(applicationEventRepository.findAllByUserId(otherUser.getId())).hasSize(1);

            // When
            applicationEventRepository.deleteAllByUserId(testUser.getId());

            // Then - Test user's events are deleted
            assertThat(applicationEventRepository.findAllByUserId(testUser.getId())).isEmpty();
            // Other user's events remain untouched
            assertThat(applicationEventRepository.findAllByUserId(otherUser.getId())).hasSize(1);
        }

        @Test
        @DisplayName("should handle user with no events gracefully")
        void deleteAllByUserId_noEvents_noException() {
            // Given - No events for test user
            assertThat(applicationEventRepository.findAllByUserId(testUser.getId())).isEmpty();

            // When & Then - Should not throw exception
            applicationEventRepository.deleteAllByUserId(testUser.getId());

            // Verify no side effects
            assertThat(applicationEventRepository.findAllByUserId(testUser.getId())).isEmpty();
        }

        @Test
        @DisplayName("should handle non-existent user ID gracefully")
        void deleteAllByUserId_nonExistentUser_noException() {
            // Given
            Long nonExistentUserId = 99999L;

            // When & Then - Should not throw exception
            applicationEventRepository.deleteAllByUserId(nonExistentUserId);
        }

        @Test
        @DisplayName("should delete events across multiple applications for same user")
        void deleteAllByUserId_multipleApplications_deletesAllEvents() {
            // Given - Events spread across multiple applications for test user
            createEvent(testUserApp1, EventType.APPLICATION_CREATED, "Created");
            createEvent(testUserApp1, EventType.STATUS_CHANGED, "Status 1");
            createEvent(testUserApp1, EventType.STATUS_CHANGED, "Status 2");
            createEvent(testUserApp2, EventType.APPLICATION_CREATED, "Created");
            createEvent(testUserApp2, EventType.NOTE_ADDED, "Note added");

            // Verify initial count
            assertThat(applicationEventRepository.findAllByUserId(testUser.getId())).hasSize(5);

            // When
            applicationEventRepository.deleteAllByUserId(testUser.getId());

            // Then
            assertThat(applicationEventRepository.findAllByUserId(testUser.getId())).isEmpty();
        }
    }

    @Nested
    @DisplayName("deleteAllByApplicationIdIn")
    class DeleteAllByApplicationIdInTests {

        @Test
        @DisplayName("should delete all events for specified application IDs")
        void deleteAllByApplicationIdIn_existingApplications_deletesEvents() {
            // Given - Create events for multiple applications
            createEvent(testUserApp1, EventType.APPLICATION_CREATED, "App 1 created");
            createEvent(testUserApp1, EventType.STATUS_CHANGED, "App 1 status");
            createEvent(testUserApp2, EventType.APPLICATION_CREATED, "App 2 created");
            ApplicationEvent otherUserEvent = createEvent(otherUserApp, EventType.APPLICATION_CREATED, "Other created");

            List<Long> applicationIdsToDelete = List.of(testUserApp1.getId(), testUserApp2.getId());

            // Verify initial state
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp1.getId())).hasSize(2);
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp2.getId())).hasSize(1);

            // When
            applicationEventRepository.deleteAllByApplicationIdIn(applicationIdsToDelete);

            // Then - Events for specified applications are deleted
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp1.getId())).isEmpty();
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp2.getId())).isEmpty();
            // Other user's events remain untouched
            assertThat(applicationEventRepository.findById(otherUserEvent.getId())).isPresent();
        }

        @Test
        @DisplayName("should handle empty application ID list gracefully")
        void deleteAllByApplicationIdIn_emptyList_noException() {
            // Given
            ApplicationEvent event = createEvent(testUserApp1, EventType.APPLICATION_CREATED, "Created");
            List<Long> emptyList = List.of();

            // When & Then - Should not throw exception
            applicationEventRepository.deleteAllByApplicationIdIn(emptyList);

            // Verify no side effects
            assertThat(applicationEventRepository.findById(event.getId())).isPresent();
        }

        @Test
        @DisplayName("should handle non-existent application IDs gracefully")
        void deleteAllByApplicationIdIn_nonExistentIds_noException() {
            // Given
            ApplicationEvent event = createEvent(testUserApp1, EventType.APPLICATION_CREATED, "Created");
            List<Long> nonExistentIds = List.of(99999L, 99998L);

            // When & Then - Should not throw exception
            applicationEventRepository.deleteAllByApplicationIdIn(nonExistentIds);

            // Verify existing events are unaffected
            assertThat(applicationEventRepository.findById(event.getId())).isPresent();
        }

        @Test
        @DisplayName("should handle mix of existing and non-existent application IDs")
        void deleteAllByApplicationIdIn_mixedIds_deletesOnlyExisting() {
            // Given
            createEvent(testUserApp1, EventType.APPLICATION_CREATED, "App 1 created");
            ApplicationEvent app2Event = createEvent(testUserApp2, EventType.APPLICATION_CREATED, "App 2 created");

            List<Long> mixedIds = List.of(testUserApp1.getId(), 99999L);

            // When
            applicationEventRepository.deleteAllByApplicationIdIn(mixedIds);

            // Then - Events for testUserApp1 are deleted, testUserApp2 events remain
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp1.getId())).isEmpty();
            assertThat(applicationEventRepository.findById(app2Event.getId())).isPresent();
        }

        @Test
        @DisplayName("should delete all events for single application")
        void deleteAllByApplicationIdIn_singleApplicationWithMultipleEvents_deletesAll() {
            // Given - Multiple events for a single application
            createEvent(testUserApp1, EventType.APPLICATION_CREATED, "Created");
            createEvent(testUserApp1, EventType.STATUS_CHANGED, "Status change 1");
            createEvent(testUserApp1, EventType.STATUS_CHANGED, "Status change 2");
            createEvent(testUserApp1, EventType.NOTE_ADDED, "Note added");
            createEvent(testUserApp1, EventType.INTERVIEW_SCHEDULED, "Interview scheduled");

            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp1.getId())).hasSize(5);

            // When
            applicationEventRepository.deleteAllByApplicationIdIn(List.of(testUserApp1.getId()));

            // Then
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp1.getId())).isEmpty();
        }

        @Test
        @DisplayName("should work correctly when deleting events across users")
        void deleteAllByApplicationIdIn_crossUserApplications_deletesAll() {
            // Given - Events from different users' applications
            createEvent(testUserApp1, EventType.APPLICATION_CREATED, "Test user app");
            createEvent(otherUserApp, EventType.APPLICATION_CREATED, "Other user app");

            List<Long> idsToDelete = List.of(testUserApp1.getId(), otherUserApp.getId());

            // When
            applicationEventRepository.deleteAllByApplicationIdIn(idsToDelete);

            // Then - Both are deleted
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(testUserApp1.getId())).isEmpty();
            assertThat(applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(otherUserApp.getId())).isEmpty();
        }
    }
}
