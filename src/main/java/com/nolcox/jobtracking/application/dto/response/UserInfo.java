package com.nolcox.jobtracking.application.dto.response;

public record UserInfo(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role
) {}
