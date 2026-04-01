import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KeyboardShortcutProvider } from './context/KeyboardShortcutContext';
import { KeyboardShortcutHelp } from './components/KeyboardShortcutHelp';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import JobTracker from './Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * @component App
 * @description Root application component with routing and context providers.
 * Provides authentication and keyboard shortcut context to all routes.
 *
 * @returns {JSX.Element} The root application element
 */
function App() {
  return (
    <AuthProvider>
      <KeyboardShortcutProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <JobTracker />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <KeyboardShortcutHelp />
          </div>
        </Router>
      </KeyboardShortcutProvider>
    </AuthProvider>
  );
}

export default App;