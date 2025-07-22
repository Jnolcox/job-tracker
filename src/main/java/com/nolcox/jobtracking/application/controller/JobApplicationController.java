package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.request.JobApplicationCreateRequest;
import static com.nolcox.jobtracking.common.constants.ApiConstants.JOB_APPLICATIONS_BASE_PATH;
import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.application.dto.response.JobApplicationResponse;
import com.nolcox.jobtracking.application.service.JobApplicationService;
import com.nolcox.jobtracking.domain.entity.ApplicationStatus;
import com.nolcox.jobtracking.domain.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping(JOB_APPLICATIONS_BASE_PATH)
@RequiredArgsConstructor
@Tag(name = "Job Application", description = "Job application management endpoints")
public class JobApplicationController {

    private final JobApplicationService applicationService;

    @GetMapping
    @Operation(summary = "Get all job applications for current user")
    public ResponseEntity<Page<JobApplicationResponse>> getAllApplications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String companyName,
            @ParameterObject Pageable pageable,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        Page<JobApplicationResponse> applications =
                applicationService.getUserApplications(userId, status, companyName, pageable);

        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job application by ID")
    public ResponseEntity<JobApplicationResponse> getApplication(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        JobApplicationResponse application = applicationService.getApplication(id, userId);
        return ResponseEntity.ok(application);
    }

    @PostMapping
    @Operation(summary = "Create new job application")
    public ResponseEntity<JobApplicationResponse> createApplication(
            @Valid @RequestBody JobApplicationCreateRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        JobApplicationResponse created = applicationService.createApplication(request, userId);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();

        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update job application")
    public ResponseEntity<JobApplicationResponse> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody JobApplicationUpdateRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        JobApplicationResponse updated = applicationService.updateApplication(id, request, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete job application")
    public ResponseEntity<Void> deleteApplication(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserIdFromAuthentication(authentication);
        applicationService.deleteApplication(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }

}
