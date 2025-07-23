package com.nolcox.jobtracking.application.dto.request;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record JobApplicationUpdateRequest(
        @NotBlank(message = "Company name is required")
        @Size(max = 255)
        String companyName,

        @NotBlank(message = "Position title is required")
        @Size(max = 255)
        String positionTitle,

        String jobDescription,

        @NotNull(message = "Status is required")
        ApplicationStatus status,

        LocalDateTime interviewDate,

        BigDecimal salaryExpectation,

        String notes,

        String contactName,

        @Email(message = "Invalid email format")
        String contactEmail,

        String contactPhone
) {}