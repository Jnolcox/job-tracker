package com.nolcox.jobtracking.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "job_applications")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name", nullable = false)
    @NotBlank(message = "Company name is required")
    @Size(max = 255)
    private String companyName;

    @Column(name = "position_title", nullable = false)
    @NotBlank(message = "Position title is required")
    @Size(max = 255)
    private String positionTitle;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApplicationStatus status;

    @Column(name = "applied_date", nullable = false)
    private Instant appliedDate;

    @Column(name = "interview_date")
    private Instant interviewDate;

    @Column(name = "salary_min")
    private Double salaryMin;

    @Column(name = "salary_max")
    private Double salaryMax;

    @Column(name = "location")
    @Size(max = 255)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "rto_type")
    private RtoType rtoType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "job_url", length = 500)
    private String jobUrl;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_email")
    @Email(message = "Invalid email format")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "status_changed_at")
    private Instant statusChangedAt;

    @Version
    private Long version;
}
