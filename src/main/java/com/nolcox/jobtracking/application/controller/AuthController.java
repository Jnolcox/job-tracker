package com.nolcox.jobtracking.application.controller;

import com.nolcox.jobtracking.application.dto.request.AuthRequest;
import static com.nolcox.jobtracking.common.constants.ApiConstants.*;
import com.nolcox.jobtracking.application.dto.request.RegisterRequest;
import com.nolcox.jobtracking.application.dto.response.AuthResponse;
import com.nolcox.jobtracking.application.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(AUTH_BASE_PATH)
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping(REGISTER_ENDPOINT)
    @Operation(summary = "Register new user")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping(LOGIN_ENDPOINT)
    @Operation(summary = "Authenticate user")
    public ResponseEntity<AuthResponse> authenticate(
            @Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }
}
