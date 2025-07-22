package com.nolcox.jobtracking.application.dto.response;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public record ApiErrorResponse(
        HttpStatus status,
        String error,
        String message,
        LocalDateTime timestamp
) {}
