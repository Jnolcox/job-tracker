package com.nolcox.jobtracking.common.constants;

public final class ApiConstants {
    
    private ApiConstants() {
        // Private constructor to prevent instantiation
    }
    
    // API Versioning
    public static final String API_VERSION_1 = "/v1";
    public static final String CURRENT_API_VERSION = API_VERSION_1;
    
    // API Base Paths
    public static final String AUTH_BASE_PATH = CURRENT_API_VERSION + "/auth";
    public static final String JOB_APPLICATIONS_BASE_PATH = CURRENT_API_VERSION + "/job-applications";
    
    // API Endpoints
    public static final String LOGIN_ENDPOINT = "/login";
    public static final String REGISTER_ENDPOINT = "/register";
    public static final String LOGOUT_ENDPOINT = "/logout";
    
    // Request Headers
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    
    // Pagination Defaults
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    
    // CORS Settings
    public static final String[] DEFAULT_ALLOWED_ORIGINS = {
        "http://localhost:3000",
        "http://localhost:4200"
    };
    
    // Response Messages
    public static final String SUCCESS_MESSAGE = "Operation completed successfully";
    public static final String CREATED_MESSAGE = "Resource created successfully";
    public static final String UPDATED_MESSAGE = "Resource updated successfully";
    public static final String DELETED_MESSAGE = "Resource deleted successfully";
    
    // Error Messages
    public static final String UNAUTHORIZED_MESSAGE = "Unauthorized access";
    public static final String FORBIDDEN_MESSAGE = "Access forbidden";
    public static final String NOT_FOUND_MESSAGE = "Resource not found";
    public static final String BAD_REQUEST_MESSAGE = "Invalid request";
    public static final String INTERNAL_ERROR_MESSAGE = "Internal server error";
}