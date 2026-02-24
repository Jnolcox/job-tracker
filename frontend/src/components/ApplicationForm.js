import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationsAPI } from '../services/api';

const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    positionTitle: '',
    jobDescription: '',
    jobUrl: '',
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'APPLIED',
    interviewDate: '',
    salaryExpectation: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await jobApplicationsAPI.getById(id);
        const app = response.data;

        setFormData({
          ...app,
          appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : '',
          interviewDate: app.interviewDate ? app.interviewDate.split('T')[0] : '',
          salaryExpectation: app.salaryExpectation || ''
        });
      } catch (err) {
        setError('Failed to fetch application details');
        console.error('Error fetching application:', err);
      }
    };

    if (isEditing) {
      fetchApplication();
    }
  }, [id, isEditing]);

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
      const submitData = {
        ...formData,
        appliedDate: new Date(formData.appliedDate).toISOString(),
        interviewDate: formData.interviewDate ? new Date(formData.interviewDate).toISOString() : null,
        salaryExpectation: formData.salaryExpectation ? parseFloat(formData.salaryExpectation) : null
      };

      if (isEditing) {
        await jobApplicationsAPI.update(id, submitData);
      } else {
        await jobApplicationsAPI.create(submitData);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} application`);
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'APPLIED', label: 'Applied' },
    { value: 'REVIEWING', label: 'Under Review' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
    { value: 'INTERVIEWED', label: 'Interviewed' },
    { value: 'OFFER_RECEIVED', label: 'Offer Received' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'WITHDRAWN', label: 'Withdrawn' }
  ];

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>{isEditing ? 'Edit' : 'Add'} Job Application</h1>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="companyName">Company Name *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="positionTitle">Position Title *</label>
              <input
                type="text"
                id="positionTitle"
                name="positionTitle"
                value={formData.positionTitle}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobUrl">Job URL</label>
              <input
                type="url"
                id="jobUrl"
                name="jobUrl"
                value={formData.jobUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="appliedDate">Date Applied *</label>
              <input
                type="date"
                id="appliedDate"
                name="appliedDate"
                value={formData.appliedDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="salaryExpectation">Expected Salary</label>
              <input
                type="number"
                id="salaryExpectation"
                name="salaryExpectation"
                value={formData.salaryExpectation}
                onChange={handleChange}
                placeholder="e.g., 75000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="interviewDate">Interview Date</label>
              <input
                type="date"
                id="interviewDate"
                name="interviewDate"
                value={formData.interviewDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactName">Contact Name</label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobDescription">Job Description</label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>

            {error && <div className="error">{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn" 
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Application' : 'Add Application')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;