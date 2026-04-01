package com.nolcox.jobtracking.application.service.impl;

import com.nolcox.jobtracking.application.dto.response.ApplicationEventResponse;
import com.nolcox.jobtracking.application.service.ApplicationEventService;
import com.nolcox.jobtracking.domain.entity.ApplicationEvent;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.EventType;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.ApplicationEventRepository;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.fixtures.ApplicationEventFixture;
import com.nolcox.jobtracking.fixtures.JobApplicationFixture;
import com.nolcox.jobtracking.fixtures.UserFixture;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ApplicationEventServiceImpl.
 *
 * <p>These tests follow TDD principles - they were written before the implementation
 * to define the expected behavior of the service.</p>
 *
 * <p>Test categories:</p>
 * <ul>
 *   <li>Log Event Tests - verifying event creation and persistence</li>
 *   <li>Get Events Tests - verifying event retrieval with authorization</li>
 *   <li>Compare and Generate Events Tests - verifying change detection logic</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApplicationEventService Tests")
class ApplicationEventServiceImplTest {

    @Mock
    private ApplicationEventRepository eventRepository;

    @Mock
    private JobApplicationRepository applicationRepository;

    @InjectMocks
    private ApplicationEventServiceImpl eventService;

    @Captor
    private ArgumentCaptor<ApplicationEvent> eventCaptor;

    private User testUser;
    private JobApplication testApplication;

    @BeforeEach
    void setUp() {
        testUser = UserFixture.aUser()
                .withId(1L)
                .withEmail("test@example.com")
                .build();

        testApplication = JobApplicationFixture.aJobApplication()
                .withId(1L)
                .withUser(testUser)
                .withCompanyName("Tech Corp")
                .withPositionTitle("Software Engineer")
                .withStatus(ApplicationStatus.APPLIED)
                .build();
    }

    @Nested
    @DisplayName("Log Event Tests")
    class LogEventTests {

        @Test
        @DisplayName("Should log APPLICATION_CREATED event")
        void shouldLogApplicationCreatedEvent() {
            // Given
            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.logApplicationCreated(testApplication);

            // Then
            verify(eventRepository).save(eventCaptor.capture());
            ApplicationEvent savedEvent = eventCaptor.getValue();

            assertThat(savedEvent.getApplication()).isEqualTo(testApplication);
            assertThat(savedEvent.getEventType()).isEqualTo(EventType.APPLICATION_CREATED);
            assertThat(savedEvent.getDetails()).contains("Application created");
        }

        @Test
        @DisplayName("Should log STATUS_CHANGED event with old and new values")
        void shouldLogStatusChangedEvent() {
            // Given
            ApplicationStatus oldStatus = ApplicationStatus.APPLIED;
            ApplicationStatus newStatus = ApplicationStatus.TECH_SCREEN;

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.logStatusChanged(testApplication, oldStatus, newStatus);

            // Then
            verify(eventRepository).save(eventCaptor.capture());
            ApplicationEvent savedEvent = eventCaptor.getValue();

            assertThat(savedEvent.getApplication()).isEqualTo(testApplication);
            assertThat(savedEvent.getEventType()).isEqualTo(EventType.STATUS_CHANGED);
            assertThat(savedEvent.getFieldName()).isEqualTo("status");
            assertThat(savedEvent.getOldValue()).isEqualTo(oldStatus.name());
            assertThat(savedEvent.getNewValue()).isEqualTo(newStatus.name());
        }

        @Test
        @DisplayName("Should log INTERVIEW_SCHEDULED event when interview date is set for first time")
        void shouldLogInterviewScheduledEvent() {
            // Given
            Instant newInterviewDate = Instant.now().plus(Duration.ofDays(7));

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.logInterviewScheduled(testApplication, newInterviewDate);

            // Then
            verify(eventRepository).save(eventCaptor.capture());
            ApplicationEvent savedEvent = eventCaptor.getValue();

            assertThat(savedEvent.getApplication()).isEqualTo(testApplication);
            assertThat(savedEvent.getEventType()).isEqualTo(EventType.INTERVIEW_SCHEDULED);
            assertThat(savedEvent.getFieldName()).isEqualTo("interviewDate");
            assertThat(savedEvent.getOldValue()).isNull();
            assertThat(savedEvent.getNewValue()).isEqualTo(newInterviewDate.toString());
        }

        @Test
        @DisplayName("Should log INTERVIEW_UPDATED event when interview date is changed")
        void shouldLogInterviewUpdatedEvent() {
            // Given
            Instant oldInterviewDate = Instant.now().plus(Duration.ofDays(7));
            Instant newInterviewDate = Instant.now().plus(Duration.ofDays(14));

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.logInterviewUpdated(testApplication, oldInterviewDate, newInterviewDate);

            // Then
            verify(eventRepository).save(eventCaptor.capture());
            ApplicationEvent savedEvent = eventCaptor.getValue();

            assertThat(savedEvent.getApplication()).isEqualTo(testApplication);
            assertThat(savedEvent.getEventType()).isEqualTo(EventType.INTERVIEW_UPDATED);
            assertThat(savedEvent.getFieldName()).isEqualTo("interviewDate");
            assertThat(savedEvent.getOldValue()).isEqualTo(oldInterviewDate.toString());
            assertThat(savedEvent.getNewValue()).isEqualTo(newInterviewDate.toString());
        }

        @Test
        @DisplayName("Should log FIELD_UPDATED event for generic field changes")
        void shouldLogFieldUpdatedEvent() {
            // Given
            String fieldName = "companyName";
            String oldValue = "Old Corp";
            String newValue = "New Corp";

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.logFieldUpdated(testApplication, fieldName, oldValue, newValue);

            // Then
            verify(eventRepository).save(eventCaptor.capture());
            ApplicationEvent savedEvent = eventCaptor.getValue();

            assertThat(savedEvent.getApplication()).isEqualTo(testApplication);
            assertThat(savedEvent.getEventType()).isEqualTo(EventType.FIELD_UPDATED);
            assertThat(savedEvent.getFieldName()).isEqualTo(fieldName);
            assertThat(savedEvent.getOldValue()).isEqualTo(oldValue);
            assertThat(savedEvent.getNewValue()).isEqualTo(newValue);
        }

        @Test
        @DisplayName("Should log NOTE_ADDED event when notes are added")
        void shouldLogNoteAddedEvent() {
            // Given
            String oldNotes = null;
            String newNotes = "Had a great conversation with the recruiter";

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.logNoteAdded(testApplication, oldNotes, newNotes);

            // Then
            verify(eventRepository).save(eventCaptor.capture());
            ApplicationEvent savedEvent = eventCaptor.getValue();

            assertThat(savedEvent.getApplication()).isEqualTo(testApplication);
            assertThat(savedEvent.getEventType()).isEqualTo(EventType.NOTE_ADDED);
            assertThat(savedEvent.getFieldName()).isEqualTo("notes");
            assertThat(savedEvent.getOldValue()).isNull();
            assertThat(savedEvent.getNewValue()).isEqualTo(newNotes);
        }
    }

    @Nested
    @DisplayName("Get All Events For User Tests")
    class GetAllEventsForUserTests {

        @Test
        @DisplayName("Should return all events for user's applications")
        void shouldReturnAllEventsForUserApplications() {
            // Given
            Long userId = 1L;

            JobApplication application1 = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withCompanyName("Company A")
                    .build();

            JobApplication application2 = JobApplicationFixture.aJobApplication()
                    .withId(2L)
                    .withUser(testUser)
                    .withCompanyName("Company B")
                    .build();

            List<ApplicationEvent> allEvents = List.of(
                    ApplicationEventFixture.statusChangedEvent()
                            .withId(3L)
                            .withApplication(application2)
                            .withCreatedAt(Instant.now())
                            .build(),
                    ApplicationEventFixture.applicationCreatedEvent()
                            .withId(2L)
                            .withApplication(application2)
                            .withCreatedAt(Instant.now().minus(Duration.ofHours(1)))
                            .build(),
                    ApplicationEventFixture.applicationCreatedEvent()
                            .withId(1L)
                            .withApplication(application1)
                            .withCreatedAt(Instant.now().minus(Duration.ofDays(1)))
                            .build()
            );

            when(eventRepository.findAllByUserId(userId)).thenReturn(allEvents);

            // When
            List<ApplicationEventResponse> result = eventService.getAllEventsForUser(userId);

            // Then
            assertThat(result).hasSize(3);
            // Events should be ordered by createdAt desc (newest first)
            assertThat(result.get(0).id()).isEqualTo(3L);
            assertThat(result.get(1).id()).isEqualTo(2L);
            assertThat(result.get(2).id()).isEqualTo(1L);

            verify(eventRepository).findAllByUserId(userId);
        }

        @Test
        @DisplayName("Should return empty list when user has no events")
        void shouldReturnEmptyListWhenUserHasNoEvents() {
            // Given
            Long userId = 1L;

            when(eventRepository.findAllByUserId(userId)).thenReturn(List.of());

            // When
            List<ApplicationEventResponse> result = eventService.getAllEventsForUser(userId);

            // Then
            assertThat(result).isEmpty();
            verify(eventRepository).findAllByUserId(userId);
        }
    }

    @Nested
    @DisplayName("Get Events Tests")
    class GetEventsTests {

        @Test
        @DisplayName("Should get events for authorized user's application")
        void shouldGetEventsForAuthorizedUserApplication() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;

            List<ApplicationEvent> events = List.of(
                    ApplicationEventFixture.statusChangedEvent()
                            .withId(2L)
                            .withApplication(testApplication)
                            .withCreatedAt(Instant.now())
                            .build(),
                    ApplicationEventFixture.applicationCreatedEvent()
                            .withId(1L)
                            .withApplication(testApplication)
                            .withCreatedAt(Instant.now().minus(Duration.ofHours(1)))
                            .build()
            );

            when(applicationRepository.findById(applicationId))
                    .thenReturn(Optional.of(testApplication));
            when(eventRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId))
                    .thenReturn(events);

            // When
            List<ApplicationEventResponse> result = eventService.getEventsForApplication(applicationId, userId);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).eventType()).isEqualTo(EventType.STATUS_CHANGED);
            assertThat(result.get(1).eventType()).isEqualTo(EventType.APPLICATION_CREATED);

            verify(applicationRepository).findById(applicationId);
            verify(eventRepository).findByApplicationIdOrderByCreatedAtDesc(applicationId);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when application not found")
        void shouldThrowResourceNotFoundExceptionWhenApplicationNotFound() {
            // Given
            Long applicationId = 999L;
            Long userId = 1L;

            when(applicationRepository.findById(applicationId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> eventService.getEventsForApplication(applicationId, userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Application not found");

            verify(applicationRepository).findById(applicationId);
            verify(eventRepository, never()).findByApplicationIdOrderByCreatedAtDesc(any());
        }

        @Test
        @DisplayName("Should throw UnauthorizedException when user not authorized")
        void shouldThrowUnauthorizedExceptionWhenUserNotAuthorized() {
            // Given
            Long applicationId = 1L;
            Long userId = 2L; // Different user

            when(applicationRepository.findById(applicationId))
                    .thenReturn(Optional.of(testApplication));

            // When & Then
            assertThatThrownBy(() -> eventService.getEventsForApplication(applicationId, userId))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessage("Access denied");

            verify(applicationRepository).findById(applicationId);
            verify(eventRepository, never()).findByApplicationIdOrderByCreatedAtDesc(any());
        }

        @Test
        @DisplayName("Should return empty list when no events exist")
        void shouldReturnEmptyListWhenNoEventsExist() {
            // Given
            Long applicationId = 1L;
            Long userId = 1L;

            when(applicationRepository.findById(applicationId))
                    .thenReturn(Optional.of(testApplication));
            when(eventRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId))
                    .thenReturn(List.of());

            // When
            List<ApplicationEventResponse> result = eventService.getEventsForApplication(applicationId, userId);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Compare and Generate Events Tests")
    class CompareAndGenerateEventsTests {

        @Test
        @DisplayName("Should detect status change and generate STATUS_CHANGED event")
        void shouldDetectStatusChangeAndGenerateEvent() {
            // Given
            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.APPLIED)
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.TECH_SCREEN)
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeastOnce()).save(eventCaptor.capture());
            List<ApplicationEvent> savedEvents = eventCaptor.getAllValues();

            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.STATUS_CHANGED &&
                    "APPLIED".equals(event.getOldValue()) &&
                    "TECH_SCREEN".equals(event.getNewValue())
            );
        }

        @Test
        @DisplayName("Should detect interview date scheduled and generate INTERVIEW_SCHEDULED event")
        void shouldDetectInterviewScheduledAndGenerateEvent() {
            // Given
            Instant interviewDate = Instant.now().plus(Duration.ofDays(7));

            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withInterviewDate(null)
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withInterviewDate(interviewDate)
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeastOnce()).save(eventCaptor.capture());
            List<ApplicationEvent> savedEvents = eventCaptor.getAllValues();

            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.INTERVIEW_SCHEDULED &&
                    event.getOldValue() == null &&
                    event.getNewValue().equals(interviewDate.toString())
            );
        }

        @Test
        @DisplayName("Should detect interview date updated and generate INTERVIEW_UPDATED event")
        void shouldDetectInterviewUpdatedAndGenerateEvent() {
            // Given
            Instant oldInterviewDate = Instant.now().plus(Duration.ofDays(7));
            Instant newInterviewDate = Instant.now().plus(Duration.ofDays(14));

            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withInterviewDate(oldInterviewDate)
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withInterviewDate(newInterviewDate)
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeastOnce()).save(eventCaptor.capture());
            List<ApplicationEvent> savedEvents = eventCaptor.getAllValues();

            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.INTERVIEW_UPDATED &&
                    event.getOldValue().equals(oldInterviewDate.toString()) &&
                    event.getNewValue().equals(newInterviewDate.toString())
            );
        }

        @Test
        @DisplayName("Should detect notes added and generate NOTE_ADDED event")
        void shouldDetectNotesAddedAndGenerateEvent() {
            // Given
            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withNotes(null)
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withNotes("Had a great interview!")
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeastOnce()).save(eventCaptor.capture());
            List<ApplicationEvent> savedEvents = eventCaptor.getAllValues();

            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.NOTE_ADDED &&
                    event.getNewValue().equals("Had a great interview!")
            );
        }

        @Test
        @DisplayName("Should detect company name change and generate FIELD_UPDATED event")
        void shouldDetectCompanyNameChangeAndGenerateEvent() {
            // Given
            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withCompanyName("Old Corp")
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withCompanyName("New Corp")
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeastOnce()).save(eventCaptor.capture());
            List<ApplicationEvent> savedEvents = eventCaptor.getAllValues();

            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.FIELD_UPDATED &&
                    "companyName".equals(event.getFieldName()) &&
                    "Old Corp".equals(event.getOldValue()) &&
                    "New Corp".equals(event.getNewValue())
            );
        }

        @Test
        @DisplayName("Should detect multiple changes and generate multiple events")
        void shouldDetectMultipleChangesAndGenerateMultipleEvents() {
            // Given
            Instant interviewDate = Instant.now().plus(Duration.ofDays(7));

            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.APPLIED)
                    .withCompanyName("Old Corp")
                    .withInterviewDate(null)
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.TECH_SCREEN)
                    .withCompanyName("New Corp")
                    .withInterviewDate(interviewDate)
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeast(3)).save(any(ApplicationEvent.class));
        }

        @Test
        @DisplayName("Should not generate events when no changes detected")
        void shouldNotGenerateEventsWhenNoChangesDetected() {
            // Given
            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.APPLIED)
                    .withCompanyName("Tech Corp")
                    .build();

            // Same values - no changes
            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withStatus(ApplicationStatus.APPLIED)
                    .withCompanyName("Tech Corp")
                    .build();

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, never()).save(any(ApplicationEvent.class));
        }

        @Test
        @DisplayName("Should detect salary change and generate FIELD_UPDATED event")
        void shouldDetectSalaryChangeAndGenerateEvent() {
            // Given
            JobApplication oldApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withSalaryMin(100000.0)
                    .withSalaryMax(150000.0)
                    .build();

            JobApplication newApplication = JobApplicationFixture.aJobApplication()
                    .withId(1L)
                    .withUser(testUser)
                    .withSalaryMin(120000.0)
                    .withSalaryMax(180000.0)
                    .build();

            when(eventRepository.save(any(ApplicationEvent.class)))
                    .thenAnswer(invocation -> {
                        ApplicationEvent event = invocation.getArgument(0);
                        event.setId(1L);
                        return event;
                    });

            // When
            eventService.compareAndLogChanges(oldApplication, newApplication);

            // Then
            verify(eventRepository, atLeast(2)).save(eventCaptor.capture());
            List<ApplicationEvent> savedEvents = eventCaptor.getAllValues();

            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.FIELD_UPDATED &&
                    "salaryMin".equals(event.getFieldName())
            );
            assertThat(savedEvents).anyMatch(event ->
                    event.getEventType() == EventType.FIELD_UPDATED &&
                    "salaryMax".equals(event.getFieldName())
            );
        }
    }
}
