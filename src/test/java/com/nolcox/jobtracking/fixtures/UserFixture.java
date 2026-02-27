package com.nolcox.jobtracking.fixtures;

import com.nolcox.jobtracking.domain.entity.Role;
import com.nolcox.jobtracking.domain.entity.User;

import java.time.Instant;
import java.util.ArrayList;

public class UserFixture {

    private Long id = 1L;
    private String email = "test@example.com";
    private String password = "hashedPassword123";
    private String firstName = "John";
    private String lastName = "Doe";
    private Role role = Role.USER;
    private boolean enabled = true;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public static UserFixture aUser() {
        return new UserFixture();
    }

    public UserFixture withId(Long id) {
        this.id = id;
        return this;
    }

    public UserFixture withEmail(String email) {
        this.email = email;
        return this;
    }

    public UserFixture withPassword(String password) {
        this.password = password;
        return this;
    }

    public UserFixture withFirstName(String firstName) {
        this.firstName = firstName;
        return this;
    }

    public UserFixture withLastName(String lastName) {
        this.lastName = lastName;
        return this;
    }

    public UserFixture withRole(Role role) {
        this.role = role;
        return this;
    }

    public UserFixture asAdmin() {
        this.role = Role.ADMIN;
        return this;
    }

    public UserFixture disabled() {
        this.enabled = false;
        return this;
    }

    public UserFixture withEnabled(boolean enabled) {
        this.enabled = enabled;
        return this;
    }

    public UserFixture withCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public UserFixture withUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    public User build() {
        return User.builder()
                .id(id)
                .email(email)
                .password(password)
                .firstName(firstName)
                .lastName(lastName)
                .role(role)
                .enabled(enabled)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .jobApplications(new ArrayList<>())
                .build();
    }
}