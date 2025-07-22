package com.nolcox.jobtracking.application.dto.response;

public record AuthResponse(
        String token,
        String type,
        Long expiresIn,
        UserInfo user
) {}
