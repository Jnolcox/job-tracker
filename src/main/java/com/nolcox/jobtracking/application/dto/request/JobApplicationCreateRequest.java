package com.nolcox.jobtracking.application.dto.request;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record JobApplicationCreateRequest(
        @NotBlank(message = "Company name is required")
        @Size(max = 255, message = "Company name must not exceed 255 characters")
        String companyName,

        @NotBlank(message = "Position title is required")
        @Size(max = 255, message = "Position title must not exceed 255 characters")
        String positionTitle,

        @Size(max = 10000, message = "Job description must not exceed 10000 characters")
        String jobDescription,

        @NotNull(message = "Status is required")
        ApplicationStatus status,

        @Size(max = 500, message = "Job URL must not exceed 500 characters")
        String jobUrl,

        @PositiveOrZero(message = "Salary min must be zero or positive")
        Double salaryMin,

        @PositiveOrZero(message = "Salary max must be zero or positive")
        Double salaryMax,

        @Size(max = 5000, message = "Notes must not exceed 5000 characters")
        String notes,

        @Size(max = 255, message = "Contact name must not exceed 255 characters")
        String contactName,

        @Email(message = "Invalid email format")
        String contactEmail,

        @Size(max = 50, message = "Contact phone must not exceed 50 characters")
        String contactPhone
) {}
