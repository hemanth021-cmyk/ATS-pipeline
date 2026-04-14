import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

/**
 * Public Job Application page - `/apply/:jobId`
 * Allows candidates to view job details and submit an application.
 */
export function ApplyForJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const jobQuery = useQuery({
    queryKey: ['publicJob', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${jobId}/public`);
      return data;
    },
    enabled: !!jobId,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: (payload) => api.post(`/jobs/${jobId}/apply`, payload),
    onSuccess: (res) => {
      // Redirect to the status page with the new application ID
      const appId = res.data.application.id;
      navigate(`/status?id=${appId}`);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    applyMutation.mutate({
      applicant_name: name.trim(),
      applicant_email: email.trim().toLowerCase(),
    });
  };

  if (jobQuery.isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Job not found</h1>
          <p className="error">{jobQuery.error?.response?.data?.error || 'This job posting might be closed.'}</p>
          <Link to="/login" className="btn btn--ghost">Company login</Link>
        </div>
      </div>
    );
  }

  const job = jobQuery.data;

  return (
    <div className="auth-page">
      <div className="auth-card application-form">
        <header className="auth-header">
          <span className="badge badge--success">Open Role</span>
          <h1>{job.title}</h1>
          <div className="job-description">
            {job.description || 'No description provided.'}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={applyMutation.isPending}
          >
            {applyMutation.isPending ? 'Submitting...' : 'Apply Now'}
          </button>
        </form>

        <footer className="auth-footer">
          <p className="muted small">
            By applying, you agree to enter the selection pipeline. 
            If the capacity is full, you will be placed on a waitlist.
          </p>
        </footer>
      </div>
    </div>
  );
}
