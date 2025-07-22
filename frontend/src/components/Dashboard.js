import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApplicationsAPI } from '../services/api';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await jobApplicationsAPI.getAll();
      setApplications(response.data.content || response.data);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Job Applications</h1>
        <button 
          className="btn"
          onClick={() => navigate('/applications/new')}
        >
          Add New Application
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>No job applications yet</h3>
          <p>Start tracking your job applications by adding your first one.</p>
          <button 
            className="btn" 
            onClick={() => navigate('/applications/new')}
            style={{ marginTop: '1rem' }}
          >
            Add Your First Application
          </button>
        </div>
      ) : (
        <div>
          {applications.map(app => (
            <div key={app.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3>{app.positionTitle} at {app.companyName}</h3>
                  <p><strong>Applied:</strong> {formatDate(app.appliedDate)}</p>
                  {app.salaryExpectation && (
                    <p><strong>Salary:</strong> ${Number(app.salaryExpectation).toLocaleString()}</p>
                  )}
                  {app.interviewDate && (
                    <p><strong>Interview:</strong> {formatDate(app.interviewDate)}</p>
                  )}
                  {app.jobUrl && (
                    <p><a href={app.jobUrl} target="_blank" rel="noopener noreferrer">View Job Posting</a></p>
                  )}
                </div>
                <div>
                  <span className={getStatusClass(app.status)}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              {app.notes && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Notes:</strong>
                  <p style={{ marginTop: '0.5rem' }}>{app.notes}</p>
                </div>
              )}

              <div className="card-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/applications/edit/${app.id}`)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(app.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;