package com.nolcox.jobtracking.fixtures;

import com.nolcox.jobtracking.application.dto.request.RegisterRequest;

public class RegisterRequestFixture {

    private String firstName = "John";
    private String lastName = "Doe";
    private String email = "test@example.com";
    private String password = "password123";

    public static RegisterRequestFixture aRegisterRequest() {
        return new RegisterRequestFixture();
    }

    public RegisterRequestFixture withFirstName(String firstName) {
        this.firstName = firstName;
        return this;
    }

    public RegisterRequestFixture withLastName(String lastName) {
        this.lastName = lastName;
        return this;
    }

    public RegisterRequestFixture withEmail(String email) {
        this.email = email;
        return this;
    }

    public RegisterRequestFixture withPassword(String password) {
        this.password = password;
        return this;
    }

    public RegisterRequestFixture withCredentials(String email, String password) {
        this.email = email;
        this.password = password;
        return this;
    }

    public RegisterRequestFixture asAdmin() {
        this.email = "admin@example.com";
        this.firstName = "Admin";
        this.lastName = "User";
        return this;
    }

    public RegisterRequestFixture withValidData() {
        this.firstName = "Jane";
        this.lastName = "Smith";
        this.email = "jane.smith@example.com";
        this.password = "securePassword123";
        return this;
    }

    public RegisterRequestFixture withShortPassword() {
        this.password = "short";
        return this;
    }

    public RegisterRequestFixture withInvalidEmail() {
        this.email = "invalid-email";
        return this;
    }

    public RegisterRequestFixture withEmptyFirstName() {
        this.firstName = "";
        return this;
    }

    public RegisterRequestFixture withEmptyLastName() {
        this.lastName = "";
        return this;
    }

    public RegisterRequestFixture withEmptyEmail() {
        this.email = "";
        return this;
    }

    public RegisterRequestFixture withEmptyPassword() {
        this.password = "";
        return this;
    }

    public RegisterRequestFixture withNullFirstName() {
        this.firstName = null;
        return this;
    }

    public RegisterRequestFixture withNullLastName() {
        this.lastName = null;
        return this;
    }

    public RegisterRequestFixture withNullEmail() {
        this.email = null;
        return this;
    }

    public RegisterRequestFixture withNullPassword() {
        this.password = null;
        return this;
    }

    public RegisterRequest build() {
        return new RegisterRequest(firstName, lastName, email, password);
    }
}