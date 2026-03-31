package com.nolcox.jobtracking.application.dto.response;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.Level;
import com.nolcox.jobtracking.domain.entity.RtoType;

import java.time.Instant;

public record JobApplicationResponse(
        Long id,
        String companyName,
        String positionTitle,
        String jobDescription,
        ApplicationStatus status,
        Instant appliedDate,
        Instant interviewDate,
        Double salaryMin,
        Double salaryMax,
        String location,
        RtoType rtoType,
        Level level,
        String notes,
        String jobUrl,
        String contactName,
        String contactEmail,
        String contactPhone,
        Instant createdAt,
        Instant updatedAt,
        Instant statusChangedAt
) {}
