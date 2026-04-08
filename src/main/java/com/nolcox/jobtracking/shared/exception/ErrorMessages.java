package com.nolcox.jobtracking.shared.exception;

/**
 * Centralized constants for error messages used throughout the application.
 *
 * <p>This class provides consistent error messaging across all services and controllers.
 * Using constants ensures that the same error type always produces the same message,
 * making it easier to:</p>
 * <ul>
 *   <li>Maintain consistent error messaging</li>
 *   <li>Support internationalization in the future</li>
 *   <li>Write tests that assert on specific error messages</li>
 * </ul>
 *
 * <p>Messages are organized by domain area for easier navigation.</p>
 */
public final class ErrorMessages {

    private ErrorMessages() {
        // Prevent instantiation - this is a constants class
    }

    // ============================================================
    // RESOURCE NOT FOUND MESSAGES
    // ============================================================

    /** Error when a job application cannot be found by ID */
    public static final String APPLICATION_NOT_FOUND = "Application not found";

    /** Error when a user cannot be found by ID or email */
    public static final String USER_NOT_FOUND = "User not found";

    // ============================================================
    // AUTHORIZATION MESSAGES
    // ============================================================

    /** Error when a user attempts to access a resource they don't own */
    public static final String ACCESS_DENIED = "Access denied";

    // ============================================================
    // AUTHENTICATION MESSAGES
    // ============================================================

    /** Error when login credentials are invalid */
    public static final String INVALID_CREDENTIALS = "Invalid email or password";

    /** Error when email is already registered during signup */
    public static final String EMAIL_ALREADY_REGISTERED = "Email is already registered";

    /** Error when refresh token is invalid or expired */
    public static final String INVALID_REFRESH_TOKEN = "Invalid refresh token";

    /** Error when token refresh operation fails */
    public static final String TOKEN_REFRESH_FAILED = "Failed to refresh token";
}
