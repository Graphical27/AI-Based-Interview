import React, { useState, useRef, useEffect, useMemo } from 'react';
import './PreInterviewSetup.css';

const EXPERIENCE_DISPLAY = {
  fresher: 'Entry Level (0-1 yrs)',
  junior: 'Junior (1-3 yrs)',
  mid: 'Mid Level (3-6 yrs)',
  senior: 'Senior (6-10 yrs)',
  lead: 'Lead / Principal (10+ yrs)',
};

const PreInterviewSetup = ({ onStartInterview, isInitializing = false, defaultProfile = null, jobDetails = null }) => {
  const profile = useMemo(() => {
    const base = defaultProfile || {};
    const derivedSkills = Array.isArray(jobDetails?.tags) ? jobDetails.tags.join(', ') : '';
    const experienceKey = base.experience || jobDetails?.experienceKey || 'mid';

    return {
      role: base.role || jobDetails?.title || '',
      experience: experienceKey || 'mid',
      company: base.company || jobDetails?.company || '',
      skills: (base.skills || derivedSkills || '').trim(),
      industry: base.industry || jobDetails?.industry || jobDetails?.category || '',
      focus: base.focus || '',
    };
  }, [defaultProfile, jobDetails]);

  const profilePayload = useMemo(() => {
    const trimmedSkills = (profile.skills || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .join(', ');

    return {
      ...profile,
      skills: trimmedSkills,
    };
  }, [profile]);

  const skillList = useMemo(() => {
    return (profilePayload.skills || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [profilePayload.skills]);

  const experienceLabel = useMemo(() => {
    if (jobDetails?.experienceLabel) {
      return jobDetails.experienceLabel;
    }
    return EXPERIENCE_DISPLAY[profilePayload.experience] || 'Mid Level';
  }, [jobDetails?.experienceLabel, profilePayload.experience]);

  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  const startCountdown = () => {
    if (isStarting || isInitializing) {
      return;
    }

    if (!profilePayload.role || !profilePayload.company) {
      setError('Missing role or company details from the job. Please relaunch the interview from the job board.');
      return;
    }

    setError('');
    setIsStarting(true);
    setCountdown(3);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }

          Promise.resolve(onStartInterview(profilePayload)).catch((err) => {
            const message = err?.message || 'Unable to start the interview. Please try again.';
            setError(message);
            setIsStarting(false);
            setCountdown(3);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
                  strokeDasharray: `${314 * (countdown / 3)} 314`
                }}
              />
            </svg>
          </div>
          <h2>Get Ready!</h2>
          <p>Syncing questions for the {profilePayload.role || 'selected role'} at {profilePayload.company || 'your target company'}...</p>
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
          <p>We’ve already pulled everything we need from the job posting—just review and launch when you’re ready.</p>
        </div>

        <div className="setup-body">
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
                {jobDetails.experienceLabel && (
                  <div className="job-context-row">
                    <span className="label">Experience</span>
                    <span>{jobDetails.experienceLabel}</span>
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

          {error && (
            <div className="setup-general-error">
              {error}
            </div>
          )}

          <div className="profile-summary">
            <div>
              <h3>Your Interview Profile</h3>
              <p className="profile-note">We tailor the prompts automatically from this job and your saved context.</p>
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Role Focus</span>
                <span className="summary-value">{profilePayload.role || 'Not specified'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Company</span>
                <span className="summary-value">{profilePayload.company || 'Not specified'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Experience Level</span>
                <span className="summary-value">{experienceLabel}</span>
              </div>
              {profilePayload.focus && (
                <div className="summary-item">
                  <span className="summary-label">Primary Focus</span>
                  <span className="summary-value">{profilePayload.focus}</span>
                </div>
              )}
              {profilePayload.industry && (
                <div className="summary-item">
                  <span className="summary-label">Industry Context</span>
                  <span className="summary-value">{profilePayload.industry}</span>
                </div>
              )}
            </div>
            {skillList.length > 0 && (
              <div className="profile-badges">
                {skillList.slice(0, 8).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
                {skillList.length > 8 && (
                  <span>+{skillList.length - 8} more</span>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={startCountdown}
              className="start-interview-btn"
              disabled={isStarting || isInitializing}
            >
              <span className="btn-icon">🚀</span>
              {isInitializing ? 'Preparing…' : 'Start My Interview'}
            </button>
            
            <div className="form-note">
              <p>All interview inputs are synced from the recruiter’s job post.</p>
              <p>Click start when you’re ready to begin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreInterviewSetup;