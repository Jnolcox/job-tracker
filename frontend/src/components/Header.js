import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            Job Tracker
          </h1>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/dashboard')}>
                  Dashboard
                </button>
                <button onClick={() => navigate('/applications/new')}>
                  Add Application
                </button>
                <button onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')}>
                  Login
                </button>
                <button onClick={() => navigate('/register')}>
                  Register
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;