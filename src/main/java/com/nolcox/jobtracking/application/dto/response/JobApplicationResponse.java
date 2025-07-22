package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record JobApplicationResponse(
        Long id,
        String companyName,
        String positionTitle,
        String jobDescription,
        ApplicationStatus status,
        LocalDateTime appliedDate,
        LocalDateTime interviewDate,
        BigDecimal salaryExpectation,
        String notes,
        String jobUrl,
        String contactName,
        String contactEmail,
        String contactPhone,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
