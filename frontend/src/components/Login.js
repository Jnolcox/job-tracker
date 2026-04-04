import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Show test credentials only in development environment
  const showTestCredentials = process.env.NODE_ENV === 'development';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#2c3e50' }}>
          Login to Job Tracker
        </h2>

        {/* Test Credentials Info - only shown in development */}
        {showTestCredentials && (
          <div style={{
            backgroundColor: '#e8f4fd',
            border: '1px solid #3498db',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Test Credentials</h4>
            <p style={{ margin: '0.25rem 0', color: '#34495e' }}>
              <strong>Email:</strong> test@example.com
            </p>
            <p style={{ margin: '0.25rem 0', color: '#34495e' }}>
              <strong>Password:</strong> password123
            </p>
            <button
              type="button"
              onClick={() => {
                setFormData({ email: 'test@example.com', password: 'password123' });
              }}
              style={{
                background: 'none',
                border: '1px solid #3498db',
                color: '#3498db',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginTop: '0.5rem'
              }}
            >
              Fill Test Credentials
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#7f8c8d' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;