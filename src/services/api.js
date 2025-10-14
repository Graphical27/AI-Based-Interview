const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  const contentType = res.headers.get('content-type') || '';
  let bodyText = '';
  let json;
  try {
    bodyText = await res.text();
    if (contentType.includes('application/json') && bodyText) {
      json = JSON.parse(bodyText);
    }
  } catch (parseErr) {
    // ignore parse errors; will fallback to raw text
  }

  if (!res.ok) {
    const errMsg = json?.error || json?.message || bodyText || `Request failed with status ${res.status}`;
    const error = new Error(errMsg);
    error.status = res.status;
    error.details = json?.details;
    throw error;
  }
  return json !== undefined ? json : (bodyText ? JSON.parse(bodyText) : {});
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  dashboardSummary: () => request('/dashboard/summary'),
  listJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (data) => request('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  
  // Application methods
  applyForJob: (jobId) => request('/applications', { method: 'POST', body: JSON.stringify({ jobId }) }),
  getJobApplications: (jobId) => request(`/applications/job/${jobId}`),
  getMyApplications: () => request('/applications/my-applications'),
  updateApplicationStatus: (applicationId, status) => request(`/applications/${applicationId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  
  saveJob: (jobId) => request(`/users/saved-jobs/${jobId}`, { method: 'POST' }),
  unsaveJob: (jobId) => request(`/users/saved-jobs/${jobId}`, { method: 'DELETE' }),
  savedJobs: () => request('/users/saved-jobs'),
  me: () => request('/users/me'),
};
