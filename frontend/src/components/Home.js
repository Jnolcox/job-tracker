import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#2c3e50' }}>
          Job Tracker
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Keep track of your job applications, interviews, and offers all in one place. 
          Stay organized and never miss a follow-up again.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn"
            onClick={() => navigate('/register')}
            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
          >
            Get Started
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
          >
            Login
          </button>
        </div>

        <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '800px', margin: '4rem auto 0' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#3498db', marginBottom: '1rem' }}>Track Applications</h3>
            <p>Keep a detailed record of every job application with company info, dates, and status updates.</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#e67e22', marginBottom: '1rem' }}>Manage Interviews</h3>
            <p>Schedule and track your interviews, never miss an important meeting again.</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#27ae60', marginBottom: '1rem' }}>Track Offers</h3>
            <p>Monitor salary expectations and job offers to make informed career decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;