import React, { useState, useEffect } from 'react';
import { jobApplicationsAPI } from '../services/api';

const ApplicationModal = ({ isOpen, onClose, onSuccess, application }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    positionTitle: '',
    jobDescription: '',
    jobUrl: '',
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'APPLIED',
    interviewDate: '',
    salaryMin: '',
    salaryMax: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const isEditing = !!application;

  useEffect(() => {
    if (application) {
      // Helper function to convert date to YYYY-MM-DD format for input fields
      const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        
        let date;
        if (Array.isArray(dateValue)) {
          // Handle Java LocalDateTime array format [year, month, day, hour, minute, second, nano]
          const [year, month, day] = dateValue;
          date = new Date(year, month - 1, day);
        } else if (typeof dateValue === 'string') {
          // Handle ISO string format
          date = new Date(dateValue);
        } else {
          return '';
        }
        
        // Format as YYYY-MM-DD for input[type="date"]
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setFormData({
        ...application,
        appliedDate: formatDateForInput(application.appliedDate),
        interviewDate: formatDateForInput(application.interviewDate),
        salaryMin: application.salaryMin || '',
        salaryMax: application.salaryMax || ''
      });
    } else {
      // Reset form when modal opens for new application
      setFormData({
        companyName: '',
        positionTitle: '',
        jobDescription: '',
        jobUrl: '',
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'APPLIED',
        interviewDate: '',
        salaryMin: '',
        salaryMax: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        notes: ''
      });
    }
    setActiveTab('basic');
    setError('');
  }, [application, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let submitData;
      
      if (isEditing) {
        // For update, include all fields including status and dates
        submitData = {
          companyName: formData.companyName,
          positionTitle: formData.positionTitle,
          jobDescription: formData.jobDescription,
          jobUrl: formData.jobUrl,
          status: formData.status,
          appliedDate: formData.appliedDate ? new Date(formData.appliedDate).toISOString() : null,
          interviewDate: formData.interviewDate ? new Date(formData.interviewDate).toISOString() : null,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
          notes: formData.notes,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone
        };
        await jobApplicationsAPI.update(application.id, submitData);
      } else {
        // For create, only include fields that exist in JobApplicationCreateRequest
        submitData = {
          companyName: formData.companyName,
          positionTitle: formData.positionTitle,
          jobDescription: formData.jobDescription,
          jobUrl: formData.jobUrl,
          status: formData.status,
          appliedDate: formData.appliedDate ? new Date(formData.appliedDate).toISOString() : null,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
          notes: formData.notes,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone
        };
        await jobApplicationsAPI.create(submitData);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} application`);
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'APPLIED', label: 'Applied', color: '#f39c12' },
    { value: 'REVIEWING', label: 'Under Review', color: '#3498db' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: '#9b59b6' },
    { value: 'INTERVIEWED', label: 'Interviewed', color: '#8e44ad' },
    { value: 'OFFER_RECEIVED', label: 'Offer Received', color: '#27ae60' },
    { value: 'ACCEPTED', label: 'Accepted', color: '#2ecc71' },
    { value: 'REJECTED', label: 'Rejected', color: '#e74c3c' },
    { value: 'WITHDRAWN', label: 'Withdrawn', color: '#95a5a6' }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target.className === 'modal-overlay' && onClose()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem' }}>
              {isEditing ? '✏️ Edit Application' : '🚀 Add New Application'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
              Track your job application details
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e9ecef',
          padding: '0 1.5rem'
        }}>
          {['basic', 'details', 'contact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === tab ? '#3498db' : '#6c757d',
                borderBottom: activeTab === tab ? '2px solid #3498db' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.2s',
                fontWeight: activeTab === tab ? '600' : '400'
              }}
            >
              {tab === 'basic' && '📋 Basic Info'}
              {tab === 'details' && '📝 Details'}
              {tab === 'contact' && '👤 Contact'}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          <form onSubmit={handleSubmit} id="applicationForm">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="tab-content">
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g., TechCorp Inc"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Position Title *
                  </label>
                  <input
                    type="text"
                    name="positionTitle"
                    value={formData.positionTitle}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Senior Software Engineer"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#495057',
                      fontWeight: '500'
                    }}>
                      Date Applied *
                    </label>
                    <input
                      type="date"
                      name="appliedDate"
                      value={formData.appliedDate}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#495057',
                      fontWeight: '500'
                    }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Job URL
                  </label>
                  <input
                    type="url"
                    name="jobUrl"
                    value={formData.jobUrl}
                    onChange={handleChange}
                    placeholder="https://company.com/careers/job-id"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="tab-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#495057',
                      fontWeight: '500'
                    }}>
                      Salary Min
                    </label>
                    <input
                      type="number"
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleChange}
                      placeholder="70000"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#495057',
                      fontWeight: '500'
                    }}>
                      Salary Max
                    </label>
                    <input
                      type="number"
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleChange}
                      placeholder="90000"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Interview Date
                  </label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Job Description
                  </label>
                  <textarea
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Key responsibilities, requirements, and other details..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes, impressions, follow-up tasks..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="tab-content">
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="e.g., Jane Smith"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="jane.smith@company.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+1-555-0123"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>

                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
                    💡 <strong>Tip:</strong> Keep track of your contacts to easily follow up on applications
                  </p>
                </div>
              </div>
            )}
          </form>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              background: 'white',
              color: '#6c757d',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#dee2e6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e9ecef';
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            form="applicationForm"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '8px',
              background: loading ? '#6c757d' : '#3498db',
              color: 'white',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2980b9')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3498db')}
          >
            {loading ? (
              <>
                <span style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Saving...
              </>
            ) : (
              <>
                {isEditing ? '💾' : '🚀'} {isEditing ? 'Update' : 'Add'} Application
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ApplicationModal;