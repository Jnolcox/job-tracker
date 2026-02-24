package com.nolcox.jobtracking.config;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;
import com.nolcox.jobtracking.domain.repository.JobApplicationRepository;
import com.nolcox.jobtracking.domain.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeDefaultUser();
        initializeSampleData();
    }

    private void initializeDefaultUser() {
        // Check if default user already exists
        if (userRepository.findByEmail("test@example.com").isEmpty()) {
            User testUser = User.builder()
                    .firstName("Test")
                    .lastName("User")
                    .email("test@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.USER)
                    .enabled(true)
                    .build();
            
            userRepository.save(testUser);
            log.info("Created default test user: test@example.com / password123");
        }
    }

    private void initializeSampleData() {
        // Add some sample job applications for the test user
        User testUser = userRepository.findByEmail("test@example.com").orElse(null);
        if (testUser != null && jobApplicationRepository.findByUserId(testUser.getId(), 
                org.springframework.data.domain.PageRequest.of(0, 1)).isEmpty()) {
            
            // Create sample applications
            JobApplication app1 = JobApplication.builder()
                    .user(testUser)
                    .companyName("TechCorp Inc")
                    .positionTitle("Senior Software Engineer")
                    .jobDescription("Exciting opportunity to work with cutting-edge technologies including React, Spring Boot, and AWS")
                    .status(ApplicationStatus.APPLIED)
                    .appliedDate(LocalDateTime.now().minusDays(5))
                    .salaryExpectation(new BigDecimal("120000"))
                    .notes("Great company culture, remote-friendly")
                    .jobUrl("https://techcorp.com/jobs/senior-engineer")
                    .contactName("Jane Smith")
                    .contactEmail("jane.smith@techcorp.com")
                    .contactPhone("+1-555-0123")
                    .build();

            JobApplication app2 = JobApplication.builder()
                    .user(testUser)
                    .companyName("StartupXYZ")
                    .positionTitle("Full Stack Developer")
                    .jobDescription("Join our fast-growing startup and help build the next generation platform")
                    .status(ApplicationStatus.INTERVIEW_SCHEDULED)
                    .appliedDate(LocalDateTime.now().minusDays(8))
                    .interviewDate(LocalDateTime.now().plusDays(2))
                    .salaryExpectation(new BigDecimal("95000"))
                    .notes("Interview scheduled for Thursday at 2 PM")
                    .jobUrl("https://startupxyz.com/careers")
                    .contactName("Mike Johnson")
                    .contactEmail("mike@startupxyz.com")
                    .build();

            JobApplication app3 = JobApplication.builder()
                    .user(testUser)
                    .companyName("BigTech Corp")
                    .positionTitle("Frontend Developer")
                    .jobDescription("Work on user-facing features for millions of users")
                    .status(ApplicationStatus.REJECTED)
                    .appliedDate(LocalDateTime.now().minusDays(15))
                    .salaryExpectation(new BigDecimal("110000"))
                    .notes("Not selected for this role, but they encouraged me to apply again in the future")
                    .jobUrl("https://bigtech.com/jobs/frontend-dev")
                    .contactName("Sarah Wilson")
                    .contactEmail("sarah.wilson@bigtech.com")
                    .build();

            JobApplication app4 = JobApplication.builder()
                    .user(testUser)
                    .companyName("FinanceFlow")
                    .positionTitle("Backend Engineer")
                    .jobDescription("Build scalable financial systems and APIs")
                    .status(ApplicationStatus.OFFER_RECEIVED)
                    .appliedDate(LocalDateTime.now().minusDays(20))
                    .interviewDate(LocalDateTime.now().minusDays(3))
                    .salaryExpectation(new BigDecimal("125000"))
                    .notes("Received offer! Need to respond by end of week. Great benefits package.")
                    .jobUrl("https://financeflow.com/careers/backend")
                    .contactName("David Chen")
                    .contactEmail("david.chen@financeflow.com")
                    .contactPhone("+1-555-9876")
                    .build();

            JobApplication app5 = JobApplication.builder()
                    .user(testUser)
                    .companyName("CloudSolutions")
                    .positionTitle("DevOps Engineer")
                    .jobDescription("Manage cloud infrastructure and CI/CD pipelines")
                    .status(ApplicationStatus.APPLIED)
                    .appliedDate(LocalDateTime.now().minusDays(2))
                    .salaryExpectation(new BigDecimal("115000"))
                    .notes("Applied through LinkedIn, waiting for response")
                    .jobUrl("https://cloudsolutions.com/jobs/devops")
                    .contactName("Lisa Rodriguez")
                    .contactEmail("lisa@cloudsolutions.com")
                    .build();

            jobApplicationRepository.save(app1);
            jobApplicationRepository.save(app2);
            jobApplicationRepository.save(app3);
            jobApplicationRepository.save(app4);
            jobApplicationRepository.save(app5);
            
            log.info("Created 5 sample job applications for test user");
        }
    }
}