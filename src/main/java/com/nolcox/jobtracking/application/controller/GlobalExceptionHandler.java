package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.response.ApiErrorResponse;
import com.nolcox.jobtracking.application.dto.response.ValidationErrorResponse;
import com.nolcox.jobtracking.shared.exception.AuthenticationFailureException;
import com.nolcox.jobtracking.shared.exception.BusinessException;
import com.nolcox.jobtracking.shared.exception.ResourceNotFoundException;
import com.nolcox.jobtracking.shared.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiErrorResponse handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return new ApiErrorResponse(
                HttpStatus.NOT_FOUND,
                "Resource Not Found",
                ex.getMessage(),
                Instant.now()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        return new ValidationErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Validation Failed",
                errors,
                Instant.now()
        );
    }

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiErrorResponse handleUnauthorized(UnauthorizedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return new ApiErrorResponse(
                HttpStatus.FORBIDDEN,
                "Access Denied",
                ex.getMessage(),
                Instant.now()
        );
    }

    /**
     * Handles authentication failures with HTTP 401 UNAUTHORIZED.
     *
     * <p>This handler is specifically for authentication-related failures such as
     * invalid credentials. It uses a dedicated exception type rather than string
     * matching, making the code more robust and maintainable.</p>
     *
     * @param ex the authentication failure exception
     * @return an API error response with 401 status
     */
    @ExceptionHandler(AuthenticationFailureException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiErrorResponse handleAuthenticationFailure(AuthenticationFailureException ex) {
        log.warn("Authentication failure: {}", ex.getMessage());
        return new ApiErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Authentication Failed",
                ex.getMessage(),
                Instant.now()
        );
    }

    /**
     * Handles generic business logic exceptions with HTTP 400 BAD REQUEST.
     *
     * <p>This is a catch-all for business rule violations that don't fit into
     * more specific exception categories. The error message is passed through
     * to help the client understand what went wrong.</p>
     *
     * @param ex the business exception
     * @return an API error response with 400 status
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleBusinessException(BusinessException ex) {
        log.warn("Business logic error: {}", ex.getMessage());
        return new ApiErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Business Logic Error",
                ex.getMessage(),
                Instant.now()
        );
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiErrorResponse handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return new ApiErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "An unexpected error occurred",
                Instant.now()
        );
    }
}
