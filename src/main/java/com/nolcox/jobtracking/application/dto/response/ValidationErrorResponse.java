package com.nolcox.jobtracking.application.dto.response;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Map;

public record ValidationErrorResponse(
        HttpStatus status,
        String error,
        Map<String, String> errors,
        LocalDateTime timestamp
) {}
