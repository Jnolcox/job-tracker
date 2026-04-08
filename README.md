![Metrics](https://github.com/Jnolcox/job-tracker/blob/develop/img2.png)

![Dashboard](https://github.com/Jnolcox/job-tracker/blob/develop/img.png)

A full-stack job application tracking system with React frontend and Spring Boot backend, featuring JWT-based authentication and comprehensive job application management.

## Features

- **Full-Stack Architecture**: React frontend with Spring Boot REST API backend
- **User Authentication**: Secure JWT-based authentication system with role-based access
- **Job Application Management**: Complete CRUD operations for tracking job applications
- **Status Tracking**: Monitor application progress through various stages
- **User Isolation**: Each user can only access their own job applications
- **Dashboard Analytics**: Statistics and insights for application tracking
- **Responsive UI**: Modern React interface with professional styling
- **Default Test User**: Pre-configured test credentials for easy development/testing
- **API Documentation**: Integrated Swagger UI for API exploration

## Tech Stack

### Backend

- **Language**: Java 17
- **Framework**: Spring Boot
- **Security**: Spring Security with JWT
- **Database**: H2 (dev) / MySQL
- **Build Tool**: Maven
- **Architecture**: Clean/Hexagonal Architecture
- **Documentation**: SpringDoc OpenAPI
- **Testing**: JUnit 5, Mockito, TestContainers

### Frontend

- **Framework**: React
- **Routing**: React Router DOM
- **HTTP Client**: Axios with interceptors
- **Styling**: CSS3 with responsive design
- **Authentication**: Context API for state management

## Getting Started

### Prerequisites

- **Java 17** or higher
- **Node.js 16+** and npm
- **Maven 3.6+**
- **MySQL 8.0+** (optional - H2 used by default)

1. **Access the Application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080/api
   - **Swagger UI**: http://localhost:8080/api/swagger-ui.html
   - **H2 Console**: http://localhost:8080/api/h2-console

### Default Test Credentials

The application automatically creates a test user on startup:

- **Email**: `test@example.com`
- **Password**: `password123`

The test user comes with 5 sample job applications across different statuses for immediate testing.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: Check Swagger UI at `/api/swagger-ui.html`
