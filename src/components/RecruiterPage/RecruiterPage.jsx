import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const RecruiterPage = ({ onLogout, user }) => {
  const [jobs, setJobs] = useState([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJobApplications, setSelectedJobApplications] = useState({});
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    experience: 'Entry Level',
    salary: '',
    description: '',
    requirements: '',
    skills: '',
    interviewDurationMinutes: 20,
  });

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const jobsData = await api.listJobs();
      setJobs(jobsData.items || jobsData);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchJobApplications = async (jobId) => {
    try {
      const applications = await api.getJobApplications(jobId);
      setSelectedJobApplications(prev => ({ ...prev, [jobId]: applications }));
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await api.updateApplicationStatus(applicationId, status);
      // Refresh applications for all jobs that are currently displayed
      Object.keys(selectedJobApplications).forEach(jobId => {
        fetchJobApplications(jobId);
      });
    } catch (err) {
      console.error('Failed to update application status:', err);
      setError('Failed to update application status');
    }
  };

  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobForm({
      ...jobForm,
      [name]: name === 'interviewDurationMinutes' ? Number(value) : value
    });
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const jobData = {
        ...jobForm,
        skills: jobForm.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        requirements: jobForm.requirements.split('\n').filter(req => req.trim()),
        interviewDurationMinutes: Number(jobForm.interviewDurationMinutes) || 20,
        postedBy: user._id
      };

      await api.createJob(jobData);
      await fetchJobs(); // Refresh jobs list
      setShowAddJob(false);
      setJobForm({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        experience: 'Entry Level',
        salary: '',
        description: '',
        requirements: '',
        skills: '',
        interviewDurationMinutes: 20,
      });
    } catch (err) {
      setError(err.message || 'Failed to create job');
    }
    setIsLoading(false);
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await api.deleteJob(jobId);
      await fetchJobs(); // Refresh jobs list
    } catch (err) {
      setError(err.message || 'Failed to delete job');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  Recruiter Portal
                </h1>
                <p className="text-gray-400">Welcome back, {user?.username || 'Recruiter'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Jobs Posted</p>
                <p className="text-2xl font-bold text-white">{jobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Applications</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <div className="w-12 h-12 bg-teal-400/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9V3H13.5L18.5 8H21ZM9 7V9H21V7H9Z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Profile Views</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Management Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Job Management</h2>
              <button
                onClick={() => setShowAddJob(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-green-400/25 transition-all"
              >
                + Add New Job
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Jobs List */}
          <div className="p-6">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No jobs posted yet</h3>
                <p className="text-gray-500">Create your first job posting to start attracting candidates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job._id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{job.title}</h3>
                        <p className="text-gray-400">{job.company} • {job.location}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchJobApplications(job._id)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-sm"
                        >
                          View Applications
                        </button>
                        <button
                          onClick={() => deleteJob(job._id)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-sm">{job.type}</span>
                      <span className="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-full text-sm">{job.experience}</span>
                      {job.salary && (
                        <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm">{job.salary}</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.skills?.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Applications Display */}
                    {selectedJobApplications[job._id] && (
                      <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                        <h4 className="text-md font-semibold text-white mb-3">
                          Applications ({selectedJobApplications[job._id].length})
                        </h4>
                        {selectedJobApplications[job._id].length === 0 ? (
                          <p className="text-gray-400 text-sm">No applications yet</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedJobApplications[job._id].map((application) => (
                              <div key={application._id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700">
                                <div>
                                  <p className="text-white font-medium">{application.user.username}</p>
                                  <p className="text-gray-400 text-sm">{application.user.email}</p>
                                  <p className="text-gray-500 text-xs">
                                    Applied {new Date(application.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    application.status === 'submitted' ? 'bg-yellow-400/20 text-yellow-400' :
                                    application.status === 'interview' ? 'bg-blue-400/20 text-blue-400' :
                                    application.status === 'offer' ? 'bg-green-400/20 text-green-400' :
                                    'bg-red-400/20 text-red-400'
                                  }`}>
                                    {application.status}
                                  </span>
                                  <select
                                    value={application.status}
                                    onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                  >
                                    <option value="submitted">Submitted</option>
                                    <option value="interview">Interview</option>
                                    <option value="offer">Offer</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Add New Job</h3>
            </div>
            <form onSubmit={handleAddJob} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={jobForm.title}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={jobForm.company}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={jobForm.location}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Salary</label>
                  <input
                    type="text"
                    name="salary"
                    value={jobForm.salary}
                    onChange={handleJobFormChange}
                    placeholder="e.g., $80,000 - $120,000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Type *</label>
                  <select
                    name="type"
                    value={jobForm.type}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level *</label>
                  <select
                    name="experience"
                    value={jobForm.experience}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                  >
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Lead">Lead</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Interview Duration *</label>
                <select
                  name="interviewDurationMinutes"
                  value={String(jobForm.interviewDurationMinutes)}
                  onChange={handleJobFormChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                >
                  {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
                    <option key={minutes} value={minutes}>{minutes} minutes</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Candidates will see this timer during their mock interview. Defaults to 20 minutes if left unchanged.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Description *</label>
                <textarea
                  name="description"
                  value={jobForm.description}
                  onChange={handleJobFormChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Requirements (one per line)</label>
                <textarea
                  name="requirements"
                  value={jobForm.requirements}
                  onChange={handleJobFormChange}
                  rows={3}
                  placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience with React&#10;Strong problem-solving skills"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={jobForm.skills}
                  onChange={handleJobFormChange}
                  placeholder="React, JavaScript, Node.js, MongoDB"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-green-400/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Job'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddJob(false)}
                  className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterPage;