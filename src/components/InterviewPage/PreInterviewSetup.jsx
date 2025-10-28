import React, { useState, useRef, useEffect } from 'react';
import './PreInterviewSetup.css';

const buildInitialState = (defaults = {}) => ({
  role: defaults.role || '',
  experience: defaults.experience || '',
  company: defaults.company || '',
  skills: defaults.skills || '',
  industry: defaults.industry || '',
  focus: defaults.focus || ''
});

const PreInterviewSetup = ({ onStartInterview, isInitializing = false, defaultProfile = null, jobDetails = null }) => {
  const [formData, setFormData] = useState(() => buildInitialState(defaultProfile));

  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [errors, setErrors] = useState({});
  const countdownTimerRef = useRef(null);

  const experienceLevels = [
    { value: 'fresher', label: '0-1 years (Fresher/Entry Level)' },
    { value: 'junior', label: '1-3 years (Junior)' },
    { value: 'mid', label: '3-6 years (Mid-Level)' },
    { value: 'senior', label: '6-10 years (Senior)' },
    { value: 'lead', label: '10+ years (Lead/Principal)' }
  ];

  const focusAreas = [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'Mobile Development',
    'DevOps/Cloud',
    'Data Science/ML',
    'System Design',
    'Product Management',
    'UI/UX Design',
    'Quality Assurance'
  ];

  const industries = [
    'Technology/Software',
    'Finance/Banking',
    'Healthcare',
    'E-commerce',
    'Education',
    'Gaming',
    'Media/Entertainment',
    'Consulting',
    'Startup',
    'Government'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name] || errors.general) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.role.trim()) {
      newErrors.role = 'Please specify the role you are interviewing for';
    }
    
    if (!formData.experience) {
      newErrors.experience = 'Please select your experience level';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Please enter the target company name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startCountdown = () => {
    if (isStarting || isInitializing) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setErrors({});
    setIsStarting(true);
    setCountdown(5);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }

          Promise.resolve(onStartInterview(formData)).catch((err) => {
            const message = err?.message || 'Unable to start the interview. Please try again.';
            setErrors(prev => ({
              ...prev,
              general: message
            }));
            setIsStarting(false);
            setCountdown(5);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!defaultProfile) {
      return;
    }
    setFormData(prev => {
      const next = { ...prev };
      Object.entries(buildInitialState(defaultProfile)).forEach(([key, value]) => {
        if (value && !prev[key]) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [defaultProfile]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  if (isStarting) {
    return (
      <div className="pre-interview-setup">
        <div className="countdown-container">
          <div className="countdown-circle">
            <div className="countdown-number">{countdown}</div>
            <svg className="countdown-progress" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="countdown-track"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="countdown-fill"
                style={{
                  animation: `countdown 1s linear infinite`,
                  strokeDasharray: `${314 * (countdown / 5)} 314`
                }}
              />
            </svg>
          </div>
          <h2>Get Ready!</h2>
          <p>Your interview will begin in {countdown} seconds...</p>
          <div className="preparation-tips">
            <div className="tip">✓ Check your camera and microphone</div>
            <div className="tip">✓ Ensure good lighting</div>
            <div className="tip">✓ Sit up straight and smile</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pre-interview-setup">
      <div className="setup-container">
        <div className="setup-header">
          <h1>Interview Setup</h1>
          <p>Please review and confirm the details below to personalize your interview experience</p>
        </div>

        {jobDetails && (
          <div className="job-context-card">
            <div className="job-context-header">
              <div className="job-context-icon">💼</div>
              <div>
                <h2>{jobDetails.title}</h2>
                <p>{jobDetails.company}</p>
              </div>
            </div>
            <div className="job-context-body">
              {jobDetails.location && (
                <div className="job-context-row">
                  <span className="label">Location</span>
                  <span>{jobDetails.location}</span>
                </div>
              )}
              {jobDetails.type && (
                <div className="job-context-row">
                  <span className="label">Role Type</span>
                  <span>{jobDetails.type}</span>
                </div>
              )}
              {jobDetails.salary && (
                <div className="job-context-row">
                  <span className="label">Salary</span>
                  <span>{jobDetails.salary}</span>
                </div>
              )}
              {jobDetails.tags?.length ? (
                <div className="job-context-row">
                  <span className="label">Focus Skills</span>
                  <span className="chips">{jobDetails.tags.slice(0, 6).map(tag => (
                    <span key={tag}>{tag}</span>
                  ))}</span>
                </div>
              ) : null}
              {jobDetails.interviewDurationMinutes ? (
                <div className="job-context-row">
                  <span className="label">Interview Duration</span>
                  <span>{jobDetails.interviewDurationMinutes} minutes</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {errors.general && (
          <div className="setup-general-error">
            {errors.general}
          </div>
        )}

        <form className="setup-form">
          {/* Required Fields */}
          <div className="form-section">
            <h3>Essential Information</h3>
            
            <div className="form-group">
              <label htmlFor="role">
                Position/Role You're Applying For *
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                className={errors.role ? 'error' : ''}
              />
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="experience">
                Experience Level *
              </label>
              <select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className={errors.experience ? 'error' : ''}
              >
                <option value="">Select your experience level</option>
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {errors.experience && <span className="error-message">{errors.experience}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="company">
                Target Company *
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="e.g., Google, Microsoft, Apple, Netflix"
                className={errors.company ? 'error' : ''}
              />
              {errors.company && <span className="error-message">{errors.company}</span>}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="form-section">
            <h3>Additional Context (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="focus">
                Primary Focus Area
              </label>
              <select
                id="focus"
                name="focus"
                value={formData.focus}
                onChange={handleInputChange}
              >
                <option value="">Select a focus area (optional)</option>
                {focusAreas.map(focus => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="industry">
                Industry Preference
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
              >
                <option value="">Select industry (optional)</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="skills">
                Key Skills/Technologies
              </label>
              <textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="e.g., React, Node.js, Python, AWS, Machine Learning..."
                rows="3"
              />
              <small className="help-text">
                List your key technical skills to get more relevant questions
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={startCountdown}
              className="start-interview-btn"
              disabled={isStarting || isInitializing}
            >
              <span className="btn-icon">🚀</span>
              Start My Interview
            </button>
            
            <div className="form-note">
              <p>* Required fields</p>
              <p>Your interview will be tailored based on this information</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreInterviewSetup;