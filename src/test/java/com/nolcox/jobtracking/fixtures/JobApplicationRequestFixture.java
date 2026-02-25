package com.nolcox.jobtracking.fixtures;

import java.time.LocalDateTime;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.RtoType;

public class JobApplicationRequestFixture {

    // Common fields
    private String companyName = "Tech Corp";
    private String positionTitle = "Senior Software Engineer";
    private String jobDescription = "Exciting opportunity to work with cutting-edge technologies";
    private String jobUrl = "https://example.com/jobs/123";
    private Double salaryMin = 100000.0;
    private Double salaryMax = 150000.0;
    private String location = "San Francisco, CA";
    private RtoType rtoType = RtoType.HYBRID_3;
    private String notes = "Great company culture";
    private String contactName = "Jane Smith";
    private String contactEmail = "jane.smith@techcorp.com";
    private String contactPhone = "+1-555-0123";
    
    // Fields specific to update request
    private ApplicationStatus status = ApplicationStatus.APPLIED;
    private LocalDateTime appliedDate = null;
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

    public JobApplicationRequestFixture withSalaryMin(Double salaryMin) {
        this.salaryMin = salaryMin;
        return this;
    }

    public JobApplicationRequestFixture withSalaryMax(Double salaryMax) {
        this.salaryMax = salaryMax;
        return this;
    }

    public JobApplicationRequestFixture withLocation(String location) {
        this.location = location;
        return this;
    }

    public JobApplicationRequestFixture withRtoType(RtoType rtoType) {
        this.rtoType = rtoType;
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

    public JobApplicationRequestFixture withAppliedDate(LocalDateTime appliedDate) {
        this.appliedDate = appliedDate;
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
        this.salaryMin = null;
        this.salaryMax = null;
        this.location = null;
        this.rtoType = null;
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
        this.salaryMin = 90000.0;
        this.salaryMax = 120000.0;
        return this;
    }

    public JobApplicationRequestFixture forBackendPosition() {
        this.positionTitle = "Backend Developer";
        this.jobDescription = "Design and implement scalable microservices using Java and Spring Boot";
        this.salaryMin = 100000.0;
        this.salaryMax = 130000.0;
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
                status,
                jobUrl,
                salaryMin,
                salaryMax,
                location,
                rtoType,
                notes,
                contactName,
                contactEmail,
                contactPhone,
                appliedDate
        );
    }

    public JobApplicationUpdateRequest buildUpdateRequest() {
        return new JobApplicationUpdateRequest(
                companyName,
                positionTitle,
                jobDescription,
                jobUrl,
                status,
                appliedDate,
                interviewDate,
                salaryMin,
                salaryMax,
                location,
                rtoType,
                notes,
                contactName,
                contactEmail,
                contactPhone
        );
    }
}