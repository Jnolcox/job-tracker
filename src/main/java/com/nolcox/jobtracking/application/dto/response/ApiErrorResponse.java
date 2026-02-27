package com.nolcox.jobtracking.application.dto.response;

import org.springframework.http.HttpStatus;

import java.time.Instant;

public record ApiErrorResponse(
        HttpStatus status,
        String error,
        String message,
        Instant timestamp
) {}
