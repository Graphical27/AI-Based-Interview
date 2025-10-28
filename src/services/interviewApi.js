const BASE_URL = (import.meta.env.VITE_INTERVIEW_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

async function post(path, payload) {
  const url = `${BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    throw new Error(networkError?.message || 'Network error while contacting interview service');
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    if (!response.ok) {
      throw new Error(`Interview service error (${response.status})`);
    }
    throw new Error('Unexpected response from interview service');
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message || data?.error;
    throw new Error(detail || 'Interview service rejected the request');
  }

  return data;
}

export const startInterviewSession = (profile) => {
  return post('/interview/start', { profile });
};

export const sendInterviewMessage = (sessionId, message) => {
  return post('/interview/message', { sessionId, message });
};

async function del(path) {
  const url = `${BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, { method: 'DELETE' });
  } catch (networkError) {
    throw new Error(networkError?.message || 'Network error while contacting interview service');
  }

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // Ignore parse errors when body is plain text
      data = { message: text };
    }
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message || data?.error;
    throw new Error(detail || 'Interview service rejected the request');
  }

  return data;
}

export const endInterviewSession = (sessionId) => {
  if (!sessionId) {
    return Promise.resolve({ status: 'unknown-session' });
  }
  return del(`/interview/${sessionId}`);
};
