Job Tracking Application

![img.png](img.png "Dashboard")

A full-stack job application tracking system with React frontend and Spring Boot backend, featuring JWT-based authentication and comprehensive job application management.

## 🚀 Features

- **Full-Stack Architecture**: React frontend with Spring Boot REST API backend
- **User Authentication**: Secure JWT-based authentication system with role-based access
- **Job Application Management**: Complete CRUD operations for tracking job applications
- **Status Tracking**: Monitor application progress through various stages
- **User Isolation**: Each user can only access their own job applications
- **Dashboard Analytics**: Statistics and insights for application tracking
- **Responsive UI**: Modern React interface with professional styling
- **Default Test User**: Pre-configured test credentials for easy development/testing
- **API Documentation**: Integrated Swagger UI for API exploration

## 🛠 Tech Stack

### Backend
- **Language**: Java 17 (Maven compiler targets Java 22)
- **Framework**: Spring Boot 3.4.5
- **Security**: Spring Security with JWT (jjwt 0.12.5)
- **Database**: H2 (development) / MySQL 8.3.0 (production)
- **Build Tool**: Maven
- **Architecture**: Clean/Hexagonal Architecture
- **Documentation**: SpringDoc OpenAPI
- **Testing**: JUnit 5, Mockito, TestContainers

### Frontend
- **Framework**: React 18.2
- **Routing**: React Router DOM
- **HTTP Client**: Axios with interceptors
- **Styling**: CSS3 with responsive design
- **Authentication**: Context API for state management
- **Build Tool**: Create React App

## 📊 Architecture Diagrams

### System Architecture
```mermaid
graph TB
    subgraph "Frontend Layer (Port 3000)"
        A[React App]
        B[Auth Context]
        C[API Service]
        D[Dashboard Component]
        E[Login/Register]
        F[Application Form]
    end
    
    subgraph "Backend Layer (Port 8080/api)"
        G[Spring Boot API]
        H[JWT Security Filter]
        I[Exception Handler]
        J[Auth Controller]
        K[Job App Controller]
        L[Service Layer]
        M[Repository Layer]
    end
    
    subgraph "Data Layer"
        N[(H2 Database)]
        O[Test Data Initializer]
    end
    
    subgraph "Testing Layer"
        P[Unit Tests]
        Q[Integration Tests]
        R[Security Tests]
    end
    
    A --> C
    C -->|JWT Bearer Token| G
    G --> H
    H --> I
    H --> J
    H --> K
    J --> L
    K --> L
    L --> M
    M --> N
    O --> N
    
    P -.->|Tests| L
    Q -.->|E2E Tests| G
    R -.->|Security Tests| H
    
    B -.->|Token Management| C
    D --> B
    E --> B
    F --> B
```

### Authentication & Security Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Security Filter
    participant AC as Auth Controller
    participant JC as Job Controller
    participant SL as Service Layer
    participant D as Database
    
    U->>F: Enter credentials
    F->>AC: POST /api/v1/auth/login
    AC->>D: Validate credentials
    D-->>AC: User data
    AC->>AC: Generate JWT (24h expiry)
    AC-->>F: JWT token + user info
    F->>F: Store token in AuthContext
    F-->>U: Redirect to dashboard
    
    Note over F,JC: Protected API calls with JWT
    F->>S: GET /api/v1/job-applications + JWT
    S->>S: Validate JWT signature
    S->>S: Extract user ID from token
    S->>JC: Request with authenticated user
    JC->>SL: Call service with user ID
    SL->>SL: Check user authorization
    alt User authorized
        SL->>D: Fetch user's applications
        D-->>SL: Application data
        SL-->>JC: Filtered results
        JC-->>F: 200 OK + data
    else User unauthorized
        SL-->>JC: UnauthorizedException
        JC-->>F: 403 Forbidden
    end
```

### Testing Architecture
```mermaid
graph TB
    subgraph "Test Suite (76/77 tests passing)"
        subgraph "Unit Tests"
            A[Service Tests<br/>97% coverage]
            B[Controller Tests<br/>Mockito isolation]
            C[Security Tests<br/>86% coverage]
        end
        
        subgraph "Integration Tests"
            D[API Integration<br/>End-to-end flows]
            E[Auth Integration<br/>JWT validation]
        end
        
        subgraph "Test Infrastructure"
            F[Test Fixtures<br/>Data builders]
            G[Test Configuration<br/>@TestConfiguration]
            H[JaCoCo Coverage<br/>85% minimum]
        end
    end
    
    subgraph "Application Code"
        I[Controllers]
        J[Services]
        K[Security]
        L[Repositories]
    end
    
    B -.->|@ExtendWith(MockitoExtension)| I
    A -.->|Mock dependencies| J
    C -.->|Test JWT & Auth| K
    D -.->|Real HTTP calls| I
    E -.->|End-to-end auth| K
    F -.->|Consistent data| A
    F -.->|Consistent data| D
    H -.->|Coverage reporting| A
    H -.->|Coverage reporting| B
    H -.->|Coverage reporting| C
```

### API Endpoint Architecture
```mermaid
graph LR
    subgraph "Public Endpoints"
        A[POST /api/v1/auth/register]
        B[POST /api/v1/auth/login]
    end
    
    subgraph "Protected Endpoints"
        C[GET /api/v1/job-applications]
        D[GET /api/v1/job-applications/{id}]
        E[POST /api/v1/job-applications]
        F[PUT /api/v1/job-applications/{id}]
        G[DELETE /api/v1/job-applications/{id}]
    end
    
    subgraph "Security Layer"
        H[JWT Authentication Filter]
        I[User Authorization Check]
        J[Exception Handler]
    end
    
    subgraph "Business Logic"
        K[AuthService]
        L[JobApplicationService]
        M[User Isolation Logic]
    end
    
    A --> K
    B --> K
    
    C --> H
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I
    I --> L
    L --> M
    M -.->|UnauthorizedException| J
    J -.->|403 Forbidden| C
    J -.->|403 Forbidden| D
    J -.->|403 Forbidden| F
    J -.->|403 Forbidden| G
```

### Application Status Flow
```mermaid
stateDiagram-v2
    [*] --> APPLIED: Submit Application
    
    APPLIED --> REVIEWING: HR Review
    APPLIED --> REJECTED: Early Rejection
    APPLIED --> WITHDRAWN: Candidate Withdraws
    
    REVIEWING --> INTERVIEW_SCHEDULED: Passed Initial Review
    REVIEWING --> REJECTED: Failed Review
    REVIEWING --> WITHDRAWN: Candidate Withdraws
    
    INTERVIEW_SCHEDULED --> INTERVIEWED: Complete Interview
    INTERVIEW_SCHEDULED --> WITHDRAWN: Candidate Cancels
    
    INTERVIEWED --> OFFER_RECEIVED: Successful Interview
    INTERVIEWED --> REJECTED: Unsuccessful Interview
    INTERVIEWED --> WITHDRAWN: Candidate Withdraws
    
    OFFER_RECEIVED --> ACCEPTED: Accept Offer
    OFFER_RECEIVED --> REJECTED: Decline Offer
    OFFER_RECEIVED --> WITHDRAWN: Candidate Withdraws
    
    ACCEPTED --> [*]: Process Complete
    REJECTED --> [*]: Process Complete
    WITHDRAWN --> [*]: Process Complete
    
    note right of APPLIED
        Initial status when
        job application is created
    end note
    
    note right of OFFER_RECEIVED
        Test data includes this status
        with sample offer details
    end note
```

## 🏗 Project Structure

```
jobtracking/
├── frontend/                        # React frontend application
│   ├── public/
│   │   └── index.html              # HTML template
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── Dashboard.js        # Main dashboard with stats
│   │   │   ├── Login.js           # Login form with test credentials
│   │   │   ├── Register.js        # User registration
│   │   │   ├── ApplicationForm.js  # Job application form
│   │   │   ├── Header.js          # Navigation header
│   │   │   └── ProtectedRoute.js  # Route protection
│   │   ├── context/
│   │   │   └── AuthContext.js     # Authentication state management
│   │   ├── services/
│   │   │   └── api.js            # Axios HTTP client
│   │   ├── App.js                # Main app component
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Dependencies and scripts
│   └── README.md               # Frontend documentation
├── src/main/java/com/nolcox/jobtracking/
│   ├── application/              # Application layer
│   │   ├── controller/          # REST endpoints
│   │   │   ├── AuthController.java
│   │   │   ├── JobApplicationController.java
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── dto/                # Request/Response DTOs
│   │   │   ├── request/        # Request DTOs
│   │   │   └── response/       # Response DTOs
│   │   └── service/            # Business logic interfaces & implementations
│   ├── config/                  # Configuration layer
│   │   ├── SecurityConfig.java  # Spring Security configuration
│   │   ├── DataInitializer.java # Test data initialization
│   │   └── ModelMapperConfig.java
│   ├── domain/                  # Domain layer
│   │   ├── entity/             # JPA entities
│   │   │   ├── User.java
│   │   │   ├── JobApplication.java
│   │   │   ├── Role.java
│   │   │   └── ApplicationStatus.java
│   │   └── repository/         # Data access interfaces
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── mapper/            # Object mapping utilities
│   │   └── security/          # JWT & Security implementations
│   │       ├── JwtService.java
│   │       ├── JwtAuthenticationFilter.java
│   │       ├── JwtAuthenticationEntryPoint.java
│   │       └── CustomUserDetailsService.java
│   └── shared/                  # Shared utilities
│       ├── constants/         # Application constants
│       └── exception/         # Custom exceptions
├── src/main/resources/
│   ├── application.yml         # Configuration
│   └── database/              # Database scripts
├── src/test/java/              # Test suite
│   ├── application/           # Application layer tests
│   ├── infrastructure/        # Infrastructure tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test data builders
└── pom.xml                    # Maven configuration
```

## 🚦 Getting Started

### Prerequisites

- **Java 17** or higher
- **Node.js 16+** and npm
- **Maven 3.6+**
- **MySQL 8.0+** (optional - H2 used by default)

### Quick Start (Development Mode)

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd jobtracking
```

2. **Start the Backend:**
```bash
# The backend uses H2 in-memory database by default
mvn spring-boot:run
```
Backend will start on `http://localhost:8080/api`

3. **Start the Frontend:**
```bash
cd frontend
npm install
npm start
```
Frontend will start on `http://localhost:3000`

4. **Access the Application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080/api
   - **Swagger UI**: http://localhost:8080/api/swagger-ui.html
   - **H2 Console**: http://localhost:8080/api/h2-console

### 🔑 Default Test Credentials

The application automatically creates a test user on startup:

- **Email**: `test@example.com`
- **Password**: `password123`

The test user comes with 5 sample job applications across different statuses for immediate testing.

### Database Configuration

#### Development (Default - H2)
The application uses H2 in-memory database by default. No setup required.

#### Production (MySQL)
1. **Create the database:**
```bash
mysql -u root -p < src/main/resources/database/job_tracking_db_1.sql
```

2. **Update `application.yml`:**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/job_tracking_db
    username: your_username
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
```

## 📡 API Documentation

### Base URLs
- **Backend**: `http://localhost:8080/api`
- **Frontend Proxy**: `http://localhost:3000/api` (proxied to backend)

### Authentication Endpoints (Public)
```http
POST /api/v1/auth/register     # Register new user
POST /api/v1/auth/login        # Login user
```

### Job Application Endpoints (Authenticated)
```http
GET    /api/v1/job-applications           # List applications (paginated)
GET    /api/v1/job-applications/{id}      # Get specific application
POST   /api/v1/job-applications          # Create new application
PUT    /api/v1/job-applications/{id}     # Update application
DELETE /api/v1/job-applications/{id}     # Delete application
```

### Example Requests

#### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Get Applications (with JWT)
```bash
curl -X GET http://localhost:8080/api/v1/job-applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Application Statuses

The system tracks job applications through these statuses:
- `APPLIED` - Initial application submitted
- `REVIEWING` - Application under review
- `INTERVIEW_SCHEDULED` - Interview scheduled
- `INTERVIEWED` - Interview completed
- `OFFER_RECEIVED` - Job offer received
- `ACCEPTED` - Offer accepted
- `REJECTED` - Application rejected
- `WITHDRAWN` - Application withdrawn

## 🔐 Security Features

- **JWT Authentication**: 24-hour token expiration
- **Password Encryption**: BCrypt hashing
- **User Isolation**: Users can only access their own data
- **CORS Configuration**: Configured for frontend origins
- **Request Validation**: Comprehensive input validation
- **Error Handling**: Standardized error responses

## 🧪 Testing

### Backend Testing

The project includes comprehensive test coverage with recent improvements for better reliability:

```bash
# Run all tests
mvn test

# Run specific test categories
mvn test -Dtest="*Service*Test"        # Service layer tests
mvn test -Dtest="*Security*Test"       # Security tests
mvn test -Dtest="*Integration*Test"    # Integration tests
mvn test -Dtest="*Controller*Test"     # Controller unit tests

# Generate coverage report
mvn test jacoco:report
# View report: target/site/jacoco/index.html

# Check coverage compliance (85% minimum)
mvn jacoco:check

# Run tests without integration tests (faster for development)
mvn test -Dtest="*Service*Test,*Controller*Test,*Security*Test"
```

**Test Coverage Achieved:**
- **Service Layer**: 97% coverage
- **Security Components**: 86% coverage
- **Overall Test Coverage**: 76 out of 77 tests passing (99% pass rate)
- **Critical Business Logic**: >85% coverage
- **Unit Tests**: All service and controller unit tests passing
- **Integration Tests**: All critical integration scenarios covered

**Test Types:**
- **Unit Tests**: Services, security, controllers (using Mockito for isolation)
- **Integration Tests**: End-to-end API testing with real HTTP calls
- **Test Fixtures**: Reusable test data builders for consistent test data
- **Security Tests**: Authentication and authorization scenarios
- **Authorization Tests**: Proper exception handling for unauthorized access

### Frontend Testing

```bash
cd frontend
npm test                    # Run React tests
npm run test:coverage      # Generate coverage report
```

## 🚀 Deployment

### Building for Production

#### Backend
```bash
mvn clean package
java -jar target/jobtracking-1.0.0.jar
```

#### Frontend
```bash
cd frontend
npm run build
# Deploy the build/ directory to your web server
```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example for backend
FROM openjdk:17-jdk-slim
COPY target/jobtracking-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

## 🔧 Configuration

### Backend Configuration (`application.yml`)
```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: 
  
security:
  jwt:
    secret-key: your-secret-key
    expiration: 86400000  # 24 hours

logging:
  level:
    com.nolcox.jobtracking: DEBUG
```

### Frontend Configuration
- **Proxy**: Configured in `package.json` to proxy API calls to backend
- **Environment Variables**: Can be configured via `.env` files
- **CORS**: Backend configured to accept requests from `localhost:3000`

## 📈 Recent Updates

### Major Features Added
1. **Complete React Frontend**: Modern, responsive UI with authentication
2. **Default Test User**: Automatic test data creation for easy development
3. **Enhanced Dashboard**: Statistics and analytics for job applications
4. **Improved Security**: Fixed authentication flow and error handling
5. **Context Path Support**: Proper API routing with `/api` context path

### Technical Improvements
1. **Fixed Authentication Flow**: JWT authentication now works end-to-end
2. **Error Handling**: Proper HTTP status codes and error responses
3. **Database Migration**: Switched to H2 for development ease
4. **Test Coverage**: Comprehensive test suite with >85% coverage
5. **API Documentation**: Swagger UI integration
6. **Test Suite Overhaul**: Converted controller tests to unit tests for better performance
7. **Authorization Security**: Enhanced security with proper UnauthorizedException handling
8. **Code Quality**: Removed unused imports, fields, and improved code cleanliness

### Bug Fixes
1. **Controller Mappings**: Fixed context path issues
2. **Security Configuration**: Proper endpoint protection
3. **Exception Handling**: Standardized error responses
4. **JWT Token Handling**: Fixed token validation and refresh
5. **Test Framework**: Fixed ApplicationContext loading issues in controller tests
6. **Authorization Logic**: Fixed service layer to throw UnauthorizedException instead of ResourceNotFoundException
7. **Integration Tests**: Updated status code expectations (403 Forbidden vs 404 Not Found)
8. **Unit Test Isolation**: Converted @WebMvcTest to @ExtendWith(MockitoExtension.class) for cleaner tests

## 🔮 Future Enhancements

### Planned Features
- [ ] **File Upload**: Resume/cover letter attachments
- [ ] **Email Notifications**: Application status updates
- [ ] **Advanced Search**: Filter by multiple criteria
- [ ] **Data Export**: CSV/PDF export functionality
- [ ] **Calendar Integration**: Interview scheduling
- [ ] **Analytics Dashboard**: Advanced reporting
- [ ] **Mobile App**: React Native implementation

### Technical Improvements
- [ ] **Caching**: Redis integration for performance
- [ ] **Rate Limiting**: API protection
- [ ] **Audit Logging**: User activity tracking
- [ ] **Monitoring**: Application health metrics
- [ ] **CI/CD Pipeline**: Automated testing and deployment

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow clean architecture principles
- Write comprehensive tests for new features
- Maintain >85% test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: Check Swagger UI at `/api/swagger-ui.html`
- **API Reference**: Available in the running application
- **Test Credentials**: `test@example.com` / `password123`

---

**Built with ❤️ using Spring Boot and React**