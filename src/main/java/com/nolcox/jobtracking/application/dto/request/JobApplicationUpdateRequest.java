package com.nolcox.jobtracking.application.dto.request;

import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.Level;
import com.nolcox.jobtracking.domain.entity.RtoType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record JobApplicationUpdateRequest(
        @NotBlank(message = "Company name is required")
        @Size(max = 255, message = "Company name must not exceed 255 characters")
        String companyName,

        @NotBlank(message = "Position title is required")
        @Size(max = 255, message = "Position title must not exceed 255 characters")
        String positionTitle,

        @Size(max = 10000, message = "Job description must not exceed 10000 characters")
        String jobDescription,

        @Size(max = 500, message = "Job URL must not exceed 500 characters")
        String jobUrl,

        @NotNull(message = "Status is required")
        ApplicationStatus status,

        Instant appliedDate,

        Instant statusChangedAt,

        Instant interviewDate,

        @PositiveOrZero(message = "Salary min must be zero or positive")
        Double salaryMin,

        @PositiveOrZero(message = "Salary max must be zero or positive")
        Double salaryMax,

        @Size(max = 255, message = "Location must not exceed 255 characters")
        String location,

        RtoType rtoType,

        Level level,

        @Size(max = 5000, message = "Notes must not exceed 5000 characters")
        String notes,

        @Size(max = 255, message = "Contact name must not exceed 255 characters")
        String contactName,

        @Email(message = "Invalid email format")
        String contactEmail,

        @Size(max = 50, message = "Contact phone must not exceed 50 characters")
        String contactPhone
) {

    /**
     * Cross-field check that the salary range is the right way round.
     *
     * <p>Nothing previously stopped a minimum above a maximum, and such a record flowed
     * into the salary averages and the distribution chart unchallenged.</p>
     *
     * @return true when either bound is absent or the maximum is not below the minimum
     */
    @JsonIgnore
    @AssertTrue(message = "Salary max must be greater than or equal to salary min")
    public boolean isSalaryRangeValid() {
        return salaryMin == null || salaryMax == null || salaryMax >= salaryMin;
    }
}
