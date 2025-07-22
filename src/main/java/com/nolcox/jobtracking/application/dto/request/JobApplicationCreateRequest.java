package com.nolcox.jobtracking.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record JobApplicationCreateRequest(
        @NotBlank(message = "Company name is required")
        @Size(max = 255)
        String companyName,

        @NotBlank(message = "Position title is required")
        @Size(max = 255)
        String positionTitle,

        String jobDescription,

        String jobUrl,

        BigDecimal salaryExpectation,

        String notes,

        String contactName,

        @Email(message = "Invalid email format")
        String contactEmail,

        String contactPhone
) {}
