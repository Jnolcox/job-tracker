package com.nolcox.jobtracking.fixtures;

import com.nolcox.jobtracking.application.dto.request.AuthRequest;

public class AuthRequestFixture {

    private String email = "test@example.com";
    private String password = "password123";

    public static AuthRequestFixture anAuthRequest() {
        return new AuthRequestFixture();
    }

    public AuthRequestFixture withEmail(String email) {
        this.email = email;
        return this;
    }

    public AuthRequestFixture withPassword(String password) {
        this.password = password;
        return this;
    }

    public AuthRequestFixture withCredentials(String email, String password) {
        this.email = email;
        this.password = password;
        return this;
    }

    public AuthRequestFixture asAdmin() {
        this.email = "admin@example.com";
        return this;
    }

    public AuthRequestFixture withInvalidEmail() {
        this.email = "invalid-email";
        return this;
    }

    public AuthRequestFixture withEmptyPassword() {
        this.password = "";
        return this;
    }

    public AuthRequestFixture withNullPassword() {
        this.password = null;
        return this;
    }

    public AuthRequestFixture withEmptyEmail() {
        this.email = "";
        return this;
    }

    public AuthRequestFixture withNullEmail() {
        this.email = null;
        return this;
    }

    public AuthRequest build() {
        return new AuthRequest(email, password);
    }
}