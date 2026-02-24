package com.nolcox.jobtracking.fixtures;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class JobApplicationRequestFixture {

    // Common fields
    private String companyName = "Tech Corp";
    private String positionTitle = "Senior Software Engineer";
    private String jobDescription = "Exciting opportunity to work with cutting-edge technologies";
    private String jobUrl = "https://example.com/jobs/123";
    private BigDecimal salaryExpectation = new BigDecimal("120000");
    private String notes = "Great company culture";
    private String contactName = "Jane Smith";
    private String contactEmail = "jane.smith@techcorp.com";
    private String contactPhone = "+1-555-0123";
    
    // Fields specific to update request
    private ApplicationStatus status = ApplicationStatus.APPLIED;
    private LocalDateTime interviewDate = null;

    public static JobApplicationRequestFixture aJobApplicationRequest() {
        return new JobApplicationRequestFixture();
    }

    public JobApplicationRequestFixture withCompanyName(String companyName) {
        this.companyName = companyName;
        return this;
    }

    public JobApplicationRequestFixture withPositionTitle(String positionTitle) {
        this.positionTitle = positionTitle;
        return this;
    }

    public JobApplicationRequestFixture withJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
        return this;
    }

    public JobApplicationRequestFixture withJobUrl(String jobUrl) {
        this.jobUrl = jobUrl;
        return this;
    }

    public JobApplicationRequestFixture withSalaryExpectation(BigDecimal salaryExpectation) {
        this.salaryExpectation = salaryExpectation;
        return this;
    }

    public JobApplicationRequestFixture withSalaryExpectation(String salaryExpectation) {
        this.salaryExpectation = new BigDecimal(salaryExpectation);
        return this;
    }

    public JobApplicationRequestFixture withNotes(String notes) {
        this.notes = notes;
        return this;
    }

    public JobApplicationRequestFixture withContactName(String contactName) {
        this.contactName = contactName;
        return this;
    }

    public JobApplicationRequestFixture withContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
        return this;
    }

    public JobApplicationRequestFixture withContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
        return this;
    }

    public JobApplicationRequestFixture withStatus(ApplicationStatus status) {
        this.status = status;
        return this;
    }

    public JobApplicationRequestFixture withInterviewDate(LocalDateTime interviewDate) {
        this.interviewDate = interviewDate;
        return this;
    }

    public JobApplicationRequestFixture withInterviewScheduled() {
        this.status = ApplicationStatus.TECH_SCREEN;
        this.interviewDate = LocalDateTime.now().plusDays(7);
        return this;
    }

    public JobApplicationRequestFixture withMinimalData() {
        this.jobDescription = null;
        this.jobUrl = null;
        this.salaryExpectation = null;
        this.notes = null;
        this.contactName = null;
        this.contactEmail = null;
        this.contactPhone = null;
        return this;
    }

    public JobApplicationRequestFixture withInvalidContactEmail() {
        this.contactEmail = "invalid-email";
        return this;
    }

    public JobApplicationRequestFixture withEmptyCompanyName() {
        this.companyName = "";
        return this;
    }

    public JobApplicationRequestFixture withEmptyPositionTitle() {
        this.positionTitle = "";
        return this;
    }

    public JobApplicationRequestFixture forFrontendPosition() {
        this.positionTitle = "Frontend Developer";
        this.jobDescription = "Build modern web applications using React and TypeScript";
        this.salaryExpectation = new BigDecimal("100000");
        return this;
    }

    public JobApplicationRequestFixture forBackendPosition() {
        this.positionTitle = "Backend Developer";
        this.jobDescription = "Design and implement scalable microservices using Java and Spring Boot";
        this.salaryExpectation = new BigDecimal("110000");
        return this;
    }

    public JobApplicationRequestFixture forStartup() {
        this.companyName = "Innovative Startup Inc.";
        this.notes = "Fast-paced environment, equity options available";
        return this;
    }

    public JobApplicationCreateRequest buildCreateRequest() {
        return new JobApplicationCreateRequest(
                companyName,
                positionTitle,
                jobDescription,
                jobUrl,
                salaryExpectation,
                notes,
                contactName,
                contactEmail,
                contactPhone
        );
    }

    public JobApplicationUpdateRequest buildUpdateRequest() {
        return new JobApplicationUpdateRequest(
                companyName,
                positionTitle,
                jobDescription,
                jobUrl,
                status,
                interviewDate,
                salaryExpectation,
                notes,
                contactName,
                contactEmail,
                contactPhone
        );
    }
}