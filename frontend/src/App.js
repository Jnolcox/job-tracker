import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KeyboardShortcutProvider } from './context/KeyboardShortcutContext';
import { KeyboardShortcutHelp } from './components/KeyboardShortcutHelp';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Lazy-loaded Dashboard component for code splitting.
 * This significantly reduces the initial bundle size since the Dashboard
 * and all its chart/table components are only loaded after authentication.
 */
const JobTracker = lazy(() => import('./Dashboard'));

/**
 * Loading fallback component displayed while Dashboard chunk is being loaded.
 * Styled to match the application's dark theme.
 */
const DashboardLoader = () => (
  <div style={{
    minHeight: "100vh",
    background: "#070B10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono',monospace",
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid #1F2937",
        borderTopColor: "#4E9AF1",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px",
      }}/>
      <p style={{ color: "#6B7280", fontSize: 12 }}>Loading dashboard...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  </div>
);

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
                    <Suspense fallback={<DashboardLoader />}>
                      <JobTracker />
                    </Suspense>
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