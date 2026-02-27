import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobApplicationsAPI } from '../services/api';
import { APPLICATION_STATUS, STATUS_CONFIG, ERROR_MESSAGES } from '../constants';
import ApplicationModal from './ApplicationModal';

/**
 * Statuses that are considered "inactive" - applications no longer being actively pursued.
 * Used for the 'active' filter which excludes these statuses.
 */
const INACTIVE_STATUSES = [
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.WITHDRAWN,
  APPLICATION_STATUS.GHOSTED
];

/**
 * @component Dashboard
 * @description Main dashboard component for displaying and managing job applications.
 * Features include:
 * - Statistics cards showing application counts by status
 * - Filtering capabilities (all, active, applied, interviewed, offers, rejected)
 * - Default sort by lastUpdated date (newest first)
 * - Default filter is 'active' (excludes rejected/withdrawn/ghosted applications)
 * - CRUD operations for job applications via modal
 *
 * @example
 * <Dashboard />
 *
 * @returns {JSX.Element} The Dashboard component
 */
const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    applied: 0,
    interviewed: 0,
    offers: 0,
    rejected: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await jobApplicationsAPI.getAll();
      const applicationsData = response.data.content || response.data;
      
      /**
       * Converts a date value to a JavaScript Date object.
       * Handles both array format [year, month, day, ...] from Java LocalDateTime
       * and ISO string format.
       * @param {Array|string|null} dateValue - The date to convert
       * @returns {Date} A Date object, or Date(0) if null/undefined
       */
      const toDate = (dateValue) => {
        if (!dateValue) return new Date(0);
        if (Array.isArray(dateValue)) {
          // Array format: [year, month, day, hour?, minute?, second?]
          const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
          return new Date(year, month - 1, day, hour, minute, second);
        }
        return new Date(dateValue);
      };

      // Sort applications by lastUpdated date (newest first), with fallback to appliedDate
      const sortedApplications = [...applicationsData].sort((a, b) => {
        // Use lastUpdated if available, otherwise fall back to appliedDate
        const dateA = toDate(a.lastUpdated || a.appliedDate);
        const dateB = toDate(b.lastUpdated || b.appliedDate);

        // Sort in descending order (newest first)
        return dateB - dateA;
      });
      
      setApplications(sortedApplications);

      // Apply 'active' filter by default - exclude rejected/withdrawn/ghosted
      const activeApplications = sortedApplications.filter(
        app => !INACTIVE_STATUSES.includes(app.status)
      );
      setFilteredApplications(activeApplications);

      // Calculate statistics
      const total = sortedApplications.length;
      const active = activeApplications.length;
      const applied = applicationsData.filter(app => app.status === APPLICATION_STATUS.APPLIED).length;
      const interviewed = applicationsData.filter(app =>
        app.status === APPLICATION_STATUS.INTERVIEWED || app.status === APPLICATION_STATUS.INTERVIEW_SCHEDULED
      ).length;
      const offers = applicationsData.filter(app => app.status === APPLICATION_STATUS.OFFER_RECEIVED).length;
      const rejected = applicationsData.filter(app =>
        app.status === APPLICATION_STATUS.REJECTED || app.status === APPLICATION_STATUS.WITHDRAWN
      ).length;

      setStats({ total, active, applied, interviewed, offers, rejected });
      setError('');
    } catch (err) {
      setError(ERROR_MESSAGES.SERVER_ERROR);
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
        setFilteredApplications(filteredApplications.filter(app => app.id !== id));

        // Update statistics after deletion
        const updatedApplications = applications.filter(app => app.id !== id);
        const total = updatedApplications.length;
        const active = updatedApplications.filter(app => !INACTIVE_STATUSES.includes(app.status)).length;
        const applied = updatedApplications.filter(app => app.status === APPLICATION_STATUS.APPLIED).length;
        const interviewed = updatedApplications.filter(app =>
          app.status === APPLICATION_STATUS.INTERVIEWED || app.status === APPLICATION_STATUS.INTERVIEW_SCHEDULED
        ).length;
        const offers = updatedApplications.filter(app => app.status === APPLICATION_STATUS.OFFER_RECEIVED).length;
        const rejected = updatedApplications.filter(app =>
          app.status === APPLICATION_STATUS.REJECTED || app.status === APPLICATION_STATUS.WITHDRAWN
        ).length;

        setStats({ total, active, applied, interviewed, offers, rejected });
      } catch (err) {
        setError(ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

  const handleEdit = (application) => {
    setEditingApplication(application);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingApplication(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingApplication(null);
  };

  const handleModalSuccess = () => {
    fetchApplications();
  };

  /**
   * Handles filter selection from stat cards.
   * Updates the active filter and filters the applications list accordingly.
   * @param {string} filterType - The type of filter to apply ('all' | 'active' | 'applied' | 'interviewed' | 'offers' | 'rejected')
   */
  const handleFilterClick = (filterType) => {
    setActiveFilter(filterType);

    let filtered = [...applications];

    switch (filterType) {
      case 'all':
        filtered = [...applications];
        break;
      case 'active':
        // Show all applications EXCEPT rejected, withdrawn, and ghosted
        filtered = applications.filter(app => !INACTIVE_STATUSES.includes(app.status));
        break;
      case 'applied':
        filtered = applications.filter(app => app.status === APPLICATION_STATUS.APPLIED);
        break;
      case 'interviewed':
        filtered = applications.filter(app =>
          app.status === APPLICATION_STATUS.INTERVIEWED || app.status === APPLICATION_STATUS.INTERVIEW_SCHEDULED
        );
        break;
      case 'offers':
        filtered = applications.filter(app => app.status === APPLICATION_STATUS.OFFER_RECEIVED);
        break;
      case 'rejected':
        filtered = applications.filter(app =>
          app.status === APPLICATION_STATUS.REJECTED || app.status === APPLICATION_STATUS.WITHDRAWN
        );
        break;
      default:
        filtered = [...applications];
    }

    setFilteredApplications(filtered);
  };

  const getStatusClass = (status) => {
    const config = STATUS_CONFIG[status];
    return `status ${config?.className || 'status-applied'}`;
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    try {
      let date;
      
      // Handle different date formats
      if (Array.isArray(dateInput)) {
        // Handle Java LocalDateTime array format [year, month, day, hour, minute, second, nano]
        const [year, month, day] = dateInput;
        date = new Date(year, month - 1, day); // month is 0-indexed in JS
      } else if (typeof dateInput === 'string') {
        // Handle ISO string format
        date = new Date(dateInput);
      } else {
        console.error('Unexpected date format:', dateInput);
        return '';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateInput);
        return '';
      }
      
      // Format as MM/DD/YYYY or use locale-specific format
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return '';
    }
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
        <div
          className={`stat-card ${activeFilter === 'all' ? 'stat-card-active' : ''}`}
          onClick={() => handleFilterClick('all')}
          style={{
            cursor: 'pointer',
            border: activeFilter === 'all' ? '2px solid #3498db' : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <h3 style={{ margin: 0, color: '#3498db', fontSize: '2rem' }}>{stats.total}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Total Applications</p>
        </div>
        <div
          className={`stat-card ${activeFilter === 'active' ? 'stat-card-active' : ''}`}
          onClick={() => handleFilterClick('active')}
          style={{
            cursor: 'pointer',
            border: activeFilter === 'active' ? '2px solid #2ecc71' : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <h3 style={{ margin: 0, color: '#2ecc71', fontSize: '2rem' }}>{stats.active}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Active</p>
        </div>
        <div
          className={`stat-card ${activeFilter === 'applied' ? 'stat-card-active' : ''}`}
          onClick={() => handleFilterClick('applied')}
          style={{
            cursor: 'pointer',
            border: activeFilter === 'applied' ? '2px solid #f39c12' : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <h3 style={{ margin: 0, color: '#f39c12', fontSize: '2rem' }}>{stats.applied}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Pending</p>
        </div>
        <div 
          className={`stat-card ${activeFilter === 'interviewed' ? 'stat-card-active' : ''}`}
          onClick={() => handleFilterClick('interviewed')}
          style={{ 
            cursor: 'pointer',
            border: activeFilter === 'interviewed' ? '2px solid #9b59b6' : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <h3 style={{ margin: 0, color: '#9b59b6', fontSize: '2rem' }}>{stats.interviewed}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Interviews</p>
        </div>
        <div 
          className={`stat-card ${activeFilter === 'offers' ? 'stat-card-active' : ''}`}
          onClick={() => handleFilterClick('offers')}
          style={{ 
            cursor: 'pointer',
            border: activeFilter === 'offers' ? '2px solid #27ae60' : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <h3 style={{ margin: 0, color: '#27ae60', fontSize: '2rem' }}>{stats.offers}</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Offers</p>
        </div>
        <div 
          className={`stat-card ${activeFilter === 'rejected' ? 'stat-card-active' : ''}`}
          onClick={() => handleFilterClick('rejected')}
          style={{ 
            cursor: 'pointer',
            border: activeFilter === 'rejected' ? '2px solid #e74c3c' : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
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
        <h2 style={{ margin: 0, color: '#2c3e50' }}>
          {activeFilter === 'all' || activeFilter === 'active'
            ? 'Recent Applications'
            : `Filtered: ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`}
        </h2>
        <button 
          className="btn"
          onClick={handleAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ➕ Add New Application
        </button>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="empty-state" style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {activeFilter === 'all' || activeFilter === 'active' ? '📋' : '🔍'}
          </div>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>
            {activeFilter === 'all'
              ? 'No job applications yet'
              : activeFilter === 'active'
                ? 'No active applications'
                : `No ${activeFilter} applications`}
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '2rem', fontSize: '1.1rem' }}>
            {activeFilter === 'all'
              ? 'Start tracking your job applications and take control of your job search journey!'
              : activeFilter === 'active'
                ? 'All your applications are either rejected, withdrawn, or ghosted. Add a new application to get started!'
                : `You don't have any applications in the "${activeFilter}" category.`}
          </p>
          <button
            className="btn"
            onClick={activeFilter === 'all' || activeFilter === 'active' ? handleAdd : () => handleFilterClick('all')}
            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
          >
            {activeFilter === 'all' || activeFilter === 'active' ? '🚀 Add Your First Application' : '🔙 View All Applications'}
          </button>
        </div>
      ) : (
        <div>
          {/* Show filtered applications */}
          {filteredApplications.map(app => (
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
                    {STATUS_CONFIG[app.status]?.label || app.status}
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
                  onClick={() => handleEdit(app)}
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
          
          {activeFilter !== 'all' && activeFilter !== 'active' && filteredApplications.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ color: '#7f8c8d', marginBottom: '1rem' }}>
                Showing {filteredApplications.length} of {applications.length} total applications
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => handleFilterClick('active')}
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Application Modal */}
      <ApplicationModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        application={editingApplication}
      />
    </div>
  );
};

export default Dashboard;