# Job Tracker Frontend

A React-based frontend application for tracking job applications, built to connect with the Spring Boot Job Tracking API.

## Features

- **User Authentication**: Register and login functionality
- **Dashboard**: Overview of all job applications
- **CRUD Operations**: Create, read, update, and delete job applications
- **Application Status Tracking**: Track application progress through different stages
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Running Job Tracking Backend API (Spring Boot)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   The application is configured to proxy API requests to `http://localhost:8080` (your Spring Boot backend).
   
   Make sure your backend is running on port 8080 before starting the frontend.

## Running the Application

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

The application will automatically proxy API requests to your Spring Boot backend running on port 8080.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (irreversible)

## API Integration

The frontend connects to the Spring Boot backend API with the following endpoints:

- **Authentication**:
  - `POST /api/v1/auth/register` - User registration
  - `POST /api/v1/auth/login` - User login
  - `POST /api/v1/auth/logout` - User logout

- **Job Applications**:
  - `GET /api/v1/job-applications` - Get all applications (paginated)
  - `GET /api/v1/job-applications/{id}` - Get specific application
  - `POST /api/v1/job-applications` - Create new application
  - `PUT /api/v1/job-applications/{id}` - Update application
  - `DELETE /api/v1/job-applications/{id}` - Delete application

## Application Structure

```
src/
├── components/           # React components
│   ├── Home.js          # Landing page
│   ├── Header.js        # Navigation header
│   ├── Login.js         # Login form
│   ├── Register.js      # Registration form
│   ├── Dashboard.js     # Main dashboard
│   ├── ApplicationForm.js # Add/Edit job applications
│   └── ProtectedRoute.js # Route protection
├── context/
│   └── AuthContext.js   # Authentication context
├── services/
│   └── api.js          # API service layer
├── App.js              # Main app component
├── index.js            # Application entry point
└── index.css           # Global styles
```

## Key Features

### Authentication
- JWT-based authentication
- Automatic token management
- Protected routes for authenticated users
- Persistent login across browser sessions

### Job Application Management
- Add new job applications with detailed information
- Track application status (Applied, Interview Scheduled, Offer Received, etc.)
- Edit existing applications
- Delete applications with confirmation
- View all applications in a clean dashboard

### User Experience
- Responsive design that works on all devices
- Loading states and error handling
- Form validation
- Clean, professional UI

## Troubleshooting

### Common Issues

1. **API Connection Failed**:
   - Ensure the Spring Boot backend is running on port 8080
   - Check that CORS is properly configured in the backend
   - Verify the API endpoints are accessible

2. **Login/Registration Not Working**:
   - Check the backend database is running
   - Verify the backend authentication endpoints are working
   - Check browser console for error messages

3. **Application Not Loading**:
   - Ensure all dependencies are installed (`npm install`)
   - Check for any console errors
   - Try clearing browser cache

### Development Tips

- Use browser developer tools to inspect API calls
- Check the Network tab for failed API requests
- Monitor the console for JavaScript errors
- Use React Developer Tools browser extension for debugging

## Production Build

To create a production build:

```bash
npm run build
```

This creates a `build` directory with optimized production files that can be deployed to any static file server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Job Tracking System and follows the same licensing terms as the main project.