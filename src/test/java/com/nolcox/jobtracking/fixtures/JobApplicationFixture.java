package com.nolcox.jobtracking.fixtures;

import java.time.LocalDateTime;

import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.JobApplication;
import com.nolcox.jobtracking.domain.entity.User;

public class JobApplicationFixture {

    private Long id = 1L;
    private User user = UserFixture.aUser().build();
    private String companyName = "Test Company";
    private String positionTitle = "Software Engineer";
    private String jobDescription = "Exciting opportunity to work with cutting-edge technologies";
    private ApplicationStatus status = ApplicationStatus.APPLIED;
    private LocalDateTime appliedDate = LocalDateTime.now();
    private LocalDateTime interviewDate = null;
    private Double salaryMin = 100000.0;
    private Double salaryMax = 150000.0;
    private String notes = "Great company culture";
    private String jobUrl = "https://example.com/jobs/123";
    private String contactName = "Jane Smith";
    private String contactEmail = "jane.smith@techcorp.com";
    private String contactPhone = "+1-555-0123";
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime statusChangedAt = LocalDateTime.now();
    private Long version = 0L;

    public static JobApplicationFixture aJobApplication() {
        return new JobApplicationFixture();
    }

    public JobApplicationFixture withId(Long id) {
        this.id = id;
        return this;
    }

    public JobApplicationFixture withUser(User user) {
        this.user = user;
        return this;
    }

    public JobApplicationFixture withCompanyName(String companyName) {
        this.companyName = companyName;
        return this;
    }

    public JobApplicationFixture withPositionTitle(String positionTitle) {
        this.positionTitle = positionTitle;
        return this;
    }

    public JobApplicationFixture withJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
        return this;
    }

    public JobApplicationFixture withStatus(ApplicationStatus status) {
        this.status = status;
        return this;
    }

    public JobApplicationFixture withAppliedDate(LocalDateTime appliedDate) {
        this.appliedDate = appliedDate;
        return this;
    }

    public JobApplicationFixture withInterviewDate(LocalDateTime interviewDate) {
        this.interviewDate = interviewDate;
        return this;
    }

    public JobApplicationFixture withInterviewScheduled() {
        this.status = ApplicationStatus.TECH_SCREEN;
        this.interviewDate = LocalDateTime.now().plusDays(7);
        return this;
    }

    public JobApplicationFixture withSalaryMin(Double salaryMin) {
        this.salaryMin = salaryMin;
        return this;
    }

    public JobApplicationFixture withSalaryMax(Double salaryMax) {
        this.salaryMax = salaryMax;
        return this;
    }

    public JobApplicationFixture withNotes(String notes) {
        this.notes = notes;
        return this;
    }

    public JobApplicationFixture withJobUrl(String jobUrl) {
        this.jobUrl = jobUrl;
        return this;
    }

    public JobApplicationFixture withContactName(String contactName) {
        this.contactName = contactName;
        return this;
    }

    public JobApplicationFixture withContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
        return this;
    }

    public JobApplicationFixture withContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
        return this;
    }

    public JobApplicationFixture withCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public JobApplicationFixture withUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    public JobApplicationFixture withStatusChangedAt(LocalDateTime statusChangedAt) {
        this.statusChangedAt = statusChangedAt;
        return this;
    }

    public JobApplicationFixture withVersion(Long version) {
        this.version = version;
        return this;
    }

    public JobApplicationFixture rejected() {
        this.status = ApplicationStatus.REJECTED;
        return this;
    }

    public JobApplicationFixture offerReceived() {
        this.status = ApplicationStatus.OFFER_RECEIVED;
        return this;
    }

    public JobApplicationFixture accepted() {
        this.status = ApplicationStatus.OFFER_ACCEPTED;
        return this;
    }

    public JobApplication build() {
        return JobApplication.builder()
                .id(id)
                .user(user)
                .companyName(companyName)
                .positionTitle(positionTitle)
                .jobDescription(jobDescription)
                .status(status)
                .appliedDate(appliedDate)
                .interviewDate(interviewDate)
                .salaryMin(salaryMin)
                .salaryMax(salaryMax)
                .notes(notes)
                .jobUrl(jobUrl)
                .contactName(contactName)
                .contactEmail(contactEmail)
                .contactPhone(contactPhone)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .statusChangedAt(statusChangedAt)
                .version(version)
                .build();
    }

    public JobApplicationResponse buildResponse() {
        return new JobApplicationResponse(
                id,
                companyName,
                positionTitle,
                jobDescription,
                status,
                appliedDate,
                interviewDate,
                salaryMin,
                salaryMax,
                notes,
                jobUrl,
                contactName,
                contactEmail,
                contactPhone,
                createdAt,
                updatedAt,
                statusChangedAt
        );
    }
}