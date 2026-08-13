package com.nolcox.jobtracking.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
        @Email(message = "Invalid email format")
        @NotBlank(message = "Email is required")
        String email,

        // Deliberately no @Size here. Login checks a credential, it does not enforce the
        // registration policy: stating the minimum length to an unauthenticated caller
        // leaks it, and it would lock out any account created before the rule existed.
        @NotBlank(message = "Password is required")
        String password
) {}
