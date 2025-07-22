import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobApplicationsAPI } from '../services/api';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    interviewed: 0,
    offers: 0,
    rejected: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await jobApplicationsAPI.getAll();
      const applicationsData = response.data.content || response.data;
      setApplications(applicationsData);
      
      // Calculate statistics
      const total = applicationsData.length;
      const applied = applicationsData.filter(app => app.status === 'APPLIED').length;
      const interviewed = applicationsData.filter(app => 
        app.status === 'INTERVIEWED' || app.status === 'INTERVIEW_SCHEDULED'
      ).length;
      const offers = applicationsData.filter(app => app.status === 'OFFER_RECEIVED').length;
      const rejected = applicationsData.filter(app => 
        app.status === 'REJECTED' || app.status === 'WITHDRAWN'
      ).length;
      
      setStats({ total, applied, interviewed, offers, rejected });
      setError('');
    } catch (err) {
      setError('Failed to fetch job applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await jobApplicationsAPI.delete(id);
        setApplications(applications.filter(app => app.id !== id));
      } catch (err) {
        setError('Failed to delete application');
      }
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      APPLIED: 'status-applied',
      INTERVIEWED: 'status-interviewed',
      INTERVIEW_SCHEDULED: 'status-interviewed',
      OFFER_RECEIVED: 'status-offer',
      REJECTED: 'status-rejected',
      WITHDRAWN: 'status-rejected'
    };
    return `status ${statusMap[status] || 'status-applied'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading your applications...</div>;
  }

  return (
    <div className="container">
      {/* Welcome Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>
          Welcome back, {user?.firstName || 'there'}! 👋
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          Here's an overview of your job search progress
        </p>
      </div>

      {error && <div className="error" style={{ marginBottom: '2rem' }}>{error}</div>}

      {/* Statistics Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div className="stat-card">
          <h3 style={{ margin: 0, color: '#3498db', fontSize: '2rem' }}>{stats.total}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Total Applications</p>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, color: '#f39c12', fontSize: '2rem' }}>{stats.applied}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Pending</p>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, color: '#9b59b6', fontSize: '2rem' }}>{stats.interviewed}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Interviews</p>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, color: '#27ae60', fontSize: '2rem' }}>{stats.offers}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Offers</p>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, color: '#e74c3c', fontSize: '2rem' }}>{stats.rejected}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Closed</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Recent Applications</h2>
        <button 
          className="btn"
          onClick={() => navigate('/applications/new')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ➕ Add New Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state" style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>No job applications yet</h3>
          <p style={{ color: '#6c757d', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Start tracking your job applications and take control of your job search journey!
          </p>
          <button 
            className="btn" 
            onClick={() => navigate('/applications/new')}
            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
          >
            🚀 Add Your First Application
          </button>
        </div>
      ) : (
        <div>
          {/* Show recent applications (limit to 5) */}
          {applications.slice(0, 5).map(app => (
            <div key={app.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                    {app.positionTitle} at {app.companyName}
                  </h3>
                  <p style={{ margin: '0.25rem 0', color: '#7f8c8d' }}>
                    <strong>Applied:</strong> {formatDate(app.appliedDate)}
                  </p>
                  {app.salaryExpectation && (
                    <p style={{ margin: '0.25rem 0', color: '#7f8c8d' }}>
                      <strong>Salary:</strong> ${Number(app.salaryExpectation).toLocaleString()}
                    </p>
                  )}
                  {app.interviewDate && (
                    <p style={{ margin: '0.25rem 0', color: '#7f8c8d' }}>
                      <strong>Interview:</strong> {formatDate(app.interviewDate)}
                    </p>
                  )}
                  {app.jobUrl && (
                    <p style={{ margin: '0.25rem 0' }}>
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" 
                         style={{ color: '#3498db', textDecoration: 'none' }}>
                        🔗 View Job Posting
                      </a>
                    </p>
                  )}
                </div>
                <div>
                  <span className={getStatusClass(app.status)} style={{ marginBottom: '1rem' }}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              {app.notes && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <strong style={{ color: '#2c3e50' }}>Notes:</strong>
                  <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#495057' }}>{app.notes}</p>
                </div>
              )}

              <div className="card-actions" style={{ marginTop: '1rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/applications/edit/${app.id}`)}
                  style={{ marginRight: '0.5rem' }}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(app.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
          
          {applications.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ color: '#7f8c8d', marginBottom: '1rem' }}>
                Showing 5 of {applications.length} applications
              </p>
              <button 
                className="btn btn-secondary"
                onClick={() => {/* Could navigate to full list view */}}
              >
                View All Applications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;