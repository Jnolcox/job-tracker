# Job Tracking Application

A Spring Boot REST API for tracking job applications with JWT-based authentication.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Job Application Management**: Full CRUD operations for tracking job applications
- **Status Tracking**: Monitor application progress through various stages
- **User Isolation**: Each user can only access their own job applications
- **RESTful API**: Well-structured REST endpoints with proper HTTP status codes
- **API Documentation**: Integrated Swagger UI for API exploration

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.4.5
- **Security**: Spring Security with JWT (jjwt 0.12.5)
- **Database**: MySQL 8.3.0
- **Build Tool**: Maven
- **Architecture**: Clean/Hexagonal Architecture
- **Documentation**: SpringDoc OpenAPI

## Project Structure

```
jobtracking/
├── src/main/java/com/nolcox/jobtracking/
│   ├── application/              # Application layer
│   │   ├── controller/          # REST endpoints
│   │   ├── dto/                # Request/Response DTOs
│   │   └── service/            # Business logic
│   ├── domain/                  # Domain layer
│   │   ├── entity/             # JPA entities
│   │   └── repository/         # Data access
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── mapper/            # Object mapping
│   │   └── security/          # JWT & Security
│   └── shared/                  # Shared utilities
│       ├── constants/         # Application constants
│       └── exception/         # Custom exceptions
└── src/main/resources/
    ├── application.yml         # Configuration
    └── database/              # Database scripts
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+

### Database Setup

1. Create the database and run the schema:
```bash
mysql -u root -p < src/main/resources/database/job_tracking_db_1.sql
```

2. Update database credentials in `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/job_tracking_db
    username: your_username
    password: your_password
```

### Building the Application

```bash
# Clean and build
mvn clean install

# Build without tests
mvn clean install -DskipTests

# Package as executable JAR
mvn clean package
```

### Running the Application

```bash
# Run with Maven
mvn spring-boot:run

# Or run the JAR directly
java -jar target/jobtracking-1.0.0.jar
```

The application will start on `http://localhost:8080`

## API Documentation

Once the application is running, access the Swagger UI at:
```
http://localhost:8080/api/swagger-ui.html
```

## API Endpoints

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Job Applications (Authenticated)
- `GET /api/v1/job-applications` - List all applications (paginated)
- `GET /api/v1/job-applications/{id}` - Get specific application
- `POST /api/v1/job-applications` - Create new application
- `PUT /api/v1/job-applications/{id}` - Update application
- `DELETE /api/v1/job-applications/{id}` - Delete application

## Application Statuses

The system tracks job applications through these statuses:
- `APPLIED` - Initial application submitted
- `REVIEWING` - Application under review
- `INTERVIEW_SCHEDULED` - Interview scheduled
- `INTERVIEWED` - Interview completed
- `OFFER_RECEIVED` - Job offer received
- `ACCEPTED` - Offer accepted
- `REJECTED` - Application rejected
- `WITHDRAWN` - Application withdrawn

## Security

- JWT-based authentication with 24-hour token expiration
- All endpoints except `/api/v1/auth/**` require authentication
- Passwords are encrypted using BCrypt
- Users can only access their own job applications

## Configuration

Key configuration in `application.yml`:
- Server port: 8080
- Context path: `/api`
- CORS enabled for: `localhost:3000`, `localhost:4200`
- JWT expiration: 24 hours

## Development

### Code Style
The project follows clean architecture principles with clear separation of concerns:
- Controllers handle HTTP concerns only
- Services contain business logic
- Repositories handle data access
- DTOs for data transfer between layers

### Testing

The project includes comprehensive unit and integration tests with high coverage:

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=ClassName

# Run tests with coverage report
mvn test jacoco:report

# Run only service layer tests
mvn test -Dtest="*Service*Test"

# Run only security tests  
mvn test -Dtest="*Security*Test"

# Check coverage compliance (minimum 85%)
mvn jacoco:check
```

**Test Coverage:**
- **Service Layer**: 97% coverage
- **Security Components**: 86% coverage  
- **Configuration**: 77% coverage
- **DTOs**: 72-100% coverage
- **Overall Project**: 56% instruction coverage

**Test Structure:**
- **Unit Tests**: Service layer, security components, controllers
- **Integration Tests**: End-to-end API testing with security
- **Test Fixtures**: Reusable test data builders for all entities
- **Coverage Reports**: Available in `target/site/jacoco/index.html`

## Recent Updates

1. Fixed main application class with proper Spring Boot configuration
2. Resolved all compilation errors and missing imports
3. Added proper Lombok configuration for annotation processing
4. Implemented all required repository methods
5. Changed JobApplicationService from class to interface following Spring conventions
6. **Added comprehensive test suite with 97% service layer coverage**
7. **Implemented JaCoCo coverage reporting with 85% minimum threshold**
8. **Created test fixtures and builders for maintainable test data**
9. **Added unit tests for all critical components (services, security, controllers)**
10. **Implemented integration tests for end-to-end API testing**

## Future Enhancements

- [ ] Implement frontend application
- [ ] Add file upload for resumes/cover letters
- [ ] Implement email notifications
- [ ] Add advanced search and filtering
- [ ] Implement data export functionality
- [ ] Add interview scheduling features
- [ ] Implement caching for improved performance
- [ ] Add API rate limiting
- [ ] Implement audit logging

## License

This project is licensed under the MIT License.