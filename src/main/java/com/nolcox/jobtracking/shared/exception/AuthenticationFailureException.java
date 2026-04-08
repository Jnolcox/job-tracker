package com.nolcox.jobtracking.shared.exception;

/**
 * Exception thrown when authentication fails.
 *
 * <p>This exception is specifically for authentication-related failures such as:
 * <ul>
 *   <li>Invalid email or password combinations</li>
 *   <li>Failed login attempts</li>
 *   <li>Expired or invalid credentials</li>
 * </ul>
 *
 * <p>This is a more specific exception than {@link BusinessException} and allows
 * the global exception handler to return HTTP 401 UNAUTHORIZED status without
 * relying on fragile string matching in error messages.</p>
 *
 * @see BusinessException
 */
public class AuthenticationFailureException extends BusinessException {

    /**
     * Constructs a new authentication failure exception with the specified message.
     *
     * @param message the detail message explaining the authentication failure
     */
    public AuthenticationFailureException(String message) {
        super(message);
    }

    /**
     * Constructs a new authentication failure exception with the specified message and cause.
     *
     * @param message the detail message explaining the authentication failure
     * @param cause the underlying cause of the authentication failure
     */
    public AuthenticationFailureException(String message, Throwable cause) {
        super(message, cause);
    }
}
