import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebcamCapture from './WebcamCapture';
import VoiceRecorder from './VoiceRecorder';
import ChatInterface from './ChatInterface';
import TypingAnimation from './TypingAnimation';
import PreInterviewSetup from './PreInterviewSetup';
import { startInterviewSession, sendInterviewMessage, endInterviewSession, finalizeInterviewSession } from '../../services/interviewApi';
import { api } from '../../services/api';
import './InterviewPage.css';

const EXPERIENCE_LEVEL_RULES = [
  { key: 'lead', patterns: ['lead', 'principal', 'architect', 'head of'] },
  { key: 'senior', patterns: ['senior', 'sr.', 'staff', 'expert', 'manager'] },
  { key: 'mid', patterns: ['mid', 'mid-level', 'intermediate', 'iii', '3+', '4+', '5+'] },
  { key: 'junior', patterns: ['junior', 'jr.', 'associate', '1-2', '0-2'] },
  { key: 'fresher', patterns: ['entry', 'entry-level', 'fresher', 'intern', 'trainee', 'graduate'] },
];

const normaliseExperienceKey = (value) => {
  const text = (value || '').toString().trim().toLowerCase();
  if (!text) {
    return '';
  }

  for (const rule of EXPERIENCE_LEVEL_RULES) {
    if (rule.patterns.some((pattern) => text.includes(pattern))) {
      return rule.key;
    }
  }

  return '';
};

const inferExperienceLevel = (job) => {
  if (!job) {
    return 'mid';
  }

  const explicit = normaliseExperienceKey(job.experience);
  if (explicit) {
    return explicit;
  }

  const aggregatedText = [
    job.title,
    job.description,
    Array.isArray(job.tags) ? job.tags.join(' ') : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (aggregatedText) {
    for (const rule of EXPERIENCE_LEVEL_RULES) {
      if (rule.patterns.some((pattern) => aggregatedText.includes(pattern))) {
        return rule.key;
      }
    }
  }

  return 'mid';
};

const withTimeout = (promise, timeoutMs, timeoutMessage) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage || 'Request timed out.'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const jobContext = location.state?.job || null;
  const applicationId = location.state?.applicationId || null;
  const defaultDurationMinutes = Number(location.state?.durationMinutes) || Number(jobContext?.interviewDurationMinutes) || Number(jobContext?.durationMinutes) || 20;
  const experienceKey = useMemo(() => inferExperienceLevel(jobContext), [jobContext]);

  const profileDefaults = useMemo(() => {
    if (location.state?.profileDefaults) {
      return location.state.profileDefaults;
    }
    if (!jobContext) {
      return null;
    }
    const tags = Array.isArray(jobContext.tags) ? jobContext.tags : [];
    return {
      role: jobContext.title || '',
      company: jobContext.company || '',
      skills: tags.join(', '),
      focus: jobContext.category || '',
      industry: jobContext.industry || jobContext.category || '',
      experience: experienceKey,
    };
  }, [experienceKey, jobContext, location.state?.profileDefaults]);

  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [interviewPhase, setInterviewPhase] = useState('introduction');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultDurationMinutes * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [completionReason, setCompletionReason] = useState('');
  const [finalizationStatus, setFinalizationStatus] = useState('idle');
  const [finalizationError, setFinalizationError] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const messagesEndRef = useRef(null);
  const timerNotifiedRef = useRef(false);
  const sessionTerminationRef = useRef(false);
  const finalizationGuardRef = useRef('idle');
  const interviewStartTimestampRef = useRef(null);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!interviewStarted) {
      setRemainingSeconds(defaultDurationMinutes * 60);
    }
  }, [defaultDurationMinutes, interviewStarted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice settings for more natural speech
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for friendliness
      utterance.volume = 0.9; // Good volume level
      
      // Function to find the best available voice
      const findBestVoice = () => {
        const voices = speechSynthesis.getVoices();
        
        // Priority order for more natural voices
        const preferredVoices = [
          // Google voices (very natural)
          'Google UK English Female',
          'Google UK English Male', 
          'Google US English Female',
          'Google US English Male',
          // Microsoft voices (natural sounding)
          'Microsoft Zira - English (United States)',
          'Microsoft David - English (United States)',
          'Microsoft Hazel - English (Great Britain)',
          'Microsoft Susan - English (Great Britain)',
          // Samantha (Mac - very natural)
          'Samantha',
          'Alex',
          // Fallback to any English voice
          ...voices.filter(voice => voice.lang.includes('en')),
        ];

        // Find the first available preferred voice
        for (const preferred of preferredVoices) {
          const voice = voices.find(v => 
            v.name.includes(preferred) || 
            v.name === preferred
          );
          if (voice) return voice;
        }

        // Enhanced fallback - prefer female voices as they often sound more natural
        const femaleVoice = voices.find(voice => 
          voice.lang.includes('en') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('woman') ||
           voice.name.includes('Zira') ||
           voice.name.includes('Hazel') ||
           voice.name.includes('Samantha'))
        );
        
        if (femaleVoice) return femaleVoice;
        
        // Final fallback to any English voice
        return voices.find(voice => voice.lang.includes('en')) || voices[0];
      };

      // Wait for voices to load if not already loaded
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = () => {
          const voice = findBestVoice();
          if (voice) {
            utterance.voice = voice;
            console.log(`Using voice: ${voice.name} (${voice.lang})`);
          }
          speechSynthesis.speak(utterance);
        };
      } else {
        const voice = findBestVoice();
        if (voice) {
          utterance.voice = voice;
          console.log(`Using voice: ${voice.name} (${voice.lang})`);
        }
        speechSynthesis.speak(utterance);
      }

      // Add pauses for more natural speech
      utterance.onend = () => {
        console.log('Speech finished');
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };
    }
  };

  const handleStartInterview = async (profileData) => {
    if (isStartingSession) {
      return;
    }

    setIsStartingSession(true);
    setError('');
    setMessages([]);
    setInterviewPhase('introduction');
    setIsInterviewComplete(false);
    setRemainingSeconds(defaultDurationMinutes * 60);
    setCompletionReason('');
    setFinalizationStatus('idle');
    setFinalizationError('');
    setIsFinalizing(false);
    timerNotifiedRef.current = false;
    sessionTerminationRef.current = false;
    finalizationGuardRef.current = 'idle';
    interviewStartTimestampRef.current = null;

    try {
      const response = await startInterviewSession(profileData);
      const initialMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        message: response.message,
        timestamp: new Date(),
        phase: response.phase
      };

      setSessionId(response.sessionId);
      setMessages([initialMessage]);
      setInterviewPhase(response.phase);
      setInterviewStarted(true);
      setIsInterviewComplete(Boolean(response.done));
      setTimerActive(true);
      interviewStartTimestampRef.current = Date.now();

      if (isSpeechEnabled) {
        speakText(response.message);
      }

      return response;
    } catch (err) {
      console.error('Failed to start interview session', err);
      throw err;
    } finally {
      setIsStartingSession(false);
    }
  };

  const sendMessage = async (message) => {
    const trimmed = message.trim();
    if (!trimmed || !sessionId || isAiTyping || isInterviewComplete) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: trimmed,
      timestamp: new Date(),
      phase: interviewPhase
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsAiTyping(true);
    setError('');

    try {
      const response = await sendInterviewMessage(sessionId, trimmed);
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        message: response.message,
        timestamp: new Date(),
        phase: response.phase
      };

      setMessages(prev => [...prev, aiMessage]);
      setInterviewPhase(response.phase);
      setIsInterviewComplete(Boolean(response.done));
      if (response.done) {
        setCompletionReason(prev => prev || 'agent-complete');
      }

      if (isSpeechEnabled) {
        speakText(response.message);
      }
    } catch (err) {
      console.error('Failed to send interview message', err);
      setError(err.message || 'Unable to process your response. Please try again.');
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    if (!timerActive || isInterviewComplete) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsInterviewComplete(true);
          setTimerActive(false);
          setCompletionReason(prevReason => prevReason || 'time-expired');
          if (!timerNotifiedRef.current) {
            timerNotifiedRef.current = true;
            setMessages(prevMessages => {
              const alreadyLogged = prevMessages.some(msg => msg.meta === 'timer-expired');
              if (alreadyLogged) {
                return prevMessages;
              }
              return [...prevMessages, {
                id: `system-${Date.now()}`,
                role: 'ai',
                message: 'We have reached the end of the scheduled interview time. Thank you for your responses!',
                timestamp: new Date(),
                phase: 'closing',
                meta: 'timer-expired'
              }];
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, isInterviewComplete]);

  useEffect(() => {
    if (isInterviewComplete) {
      setTimerActive(false);
    }
  }, [isInterviewComplete]);

  useEffect(() => {
    if (!isInterviewComplete || !sessionId) {
      return;
    }

    const reason = completionReason || 'agent-complete';

    if (finalizationGuardRef.current === 'pending' || finalizationGuardRef.current === 'succeeded') {
      return;
    }

    if (finalizationStatus !== 'idle') {
      return;
    }

    finalizationGuardRef.current = 'pending';
    setFinalizationStatus('pending');
    setFinalizationError('');
    setIsFinalizing(true);

    const elapsedSeconds = interviewStartTimestampRef.current
      ? Math.max(0, Math.round((Date.now() - interviewStartTimestampRef.current) / 1000))
      : Math.max(0, (defaultDurationMinutes * 60) - remainingSeconds);

    let isMounted = true;

    const runFinalization = async () => {
      try {
        const evaluation = await withTimeout(
          finalizeInterviewSession(sessionId, {
            completionReason: reason,
            durationSeconds: elapsedSeconds,
          }),
          15000,
          'The AI feedback is taking longer than expected. Please try again.'
        );

        let persistenceErrorMessage = '';
        if (applicationId) {
          try {
            await withTimeout(
              api.saveInterviewResult(applicationId, {
                score: evaluation.score,
                summary: evaluation.summary,
                strengths: evaluation.strengths,
                improvements: evaluation.improvements,
                completionReason: evaluation.completionReason,
                durationSeconds: evaluation.durationSeconds,
                totalQuestions: evaluation.totalQuestions,
                totalResponses: evaluation.totalResponses,
                skillsCovered: evaluation.skillsCovered,
                requirementsSummary: evaluation.requirementsSummary,
              }),
              12000,
              'Saved locally, but the dashboard did not confirm in time.'
            );
          } catch (persistErr) {
            console.error('Failed to persist interview result', persistErr);
            persistenceErrorMessage = persistErr?.message || 'Interview summary saved locally, but not stored to your profile.';
          }
        }

        finalizationGuardRef.current = 'succeeded';
        if (!isMounted) {
          return;
        }
        setFinalizationStatus('succeeded');
        sessionTerminationRef.current = true;

        navigate('/interview/results', {
          replace: true,
          state: {
            evaluation,
            job: jobContext,
            applicationId,
            completionReason: evaluation.completionReason,
            persistenceError: persistenceErrorMessage,
          },
        });
      } catch (err) {
        console.error('Failed to finalize interview session', err);
        finalizationGuardRef.current = 'failed';
        if (!isMounted) {
          return;
        }
        setFinalizationStatus('failed');
        setFinalizationError(err?.message || 'Unable to generate your interview feedback.');
      } finally {
        if (isMounted) {
          setIsFinalizing(false);
        }
      }
    };

    runFinalization();

    return () => {
      isMounted = false;
    };
  }, [isInterviewComplete, sessionId, completionReason, finalizationStatus, defaultDurationMinutes, remainingSeconds, applicationId, jobContext, navigate]);

  useEffect(() => {
    if (!isInterviewComplete || !sessionId || sessionTerminationRef.current) {
      return;
    }

    if (finalizationGuardRef.current === 'pending' || finalizationGuardRef.current === 'failed') {
      return;
    }

    if (finalizationGuardRef.current === 'succeeded') {
      sessionTerminationRef.current = true;
      return;
    }
    sessionTerminationRef.current = true;
    endInterviewSession(sessionId).catch((err) => {
      console.warn('Failed to close interview session', err);
    });
  }, [isInterviewComplete, sessionId]);

  const handleSpeechResult = (transcript) => {
    if (transcript.trim()) {
      sendMessage(transcript);
    }
  };

  const retryFinalize = () => {
    if (finalizationGuardRef.current === 'pending') {
      return;
    }
    finalizationGuardRef.current = 'idle';
    setFinalizationStatus('idle');
    setFinalizationError('');
  };

  const getPhaseDisplay = (phase) => {
    const phaseMap = {
      introduction: { text: 'Introduction', color: '#00F2C3' },
      'technical-basic': { text: 'Basic Questions', color: '#4CAF50' },
      'technical-intermediate': { text: 'Technical Skills', color: '#FFB84D' },
      'technical-advanced': { text: 'Advanced Technical', color: '#FF9800' },
      behavioral: { text: 'Behavioral Questions', color: '#FF6B9D' },
      closing: { text: 'Interview Closing', color: '#8B5CF6' }
    };
    return phaseMap[phase] || phaseMap.introduction;
  };

  const phaseInfo = getPhaseDisplay(interviewPhase);

  const formatTimer = (seconds) => {
    const safeSeconds = Math.max(0, seconds | 0);
    const minutes = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuitInterview = () => {
    if (isInterviewComplete) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to end this interview early?');
    if (!confirmed) {
      return;
    }

    speechSynthesis.cancel();
    setIsAiTyping(false);
    setIsRecording(false);
    setIsListening(false);
    setTimerActive(false);
    setCompletionReason('user-quit');
    setIsInterviewComplete(true);
    setCurrentMessage('');
    setMessages((prev) => {
      const alreadyLogged = prev.some((msg) => msg.meta === 'user-quit');
      if (alreadyLogged) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: 'ai',
          message: 'You chose to end the session early. Thanks for practicing—come back anytime for another run!',
          timestamp: new Date(),
          phase: 'closing',
          meta: 'user-quit',
        },
      ];
    });
  };

  if (!jobContext && !profileDefaults) {
    return (
      <div className="interview-page interview-page--empty">
        <div className="interview-empty-state">
          <h1>No Interview Selected</h1>
          <p>Please choose a role from the job board to launch an interview.</p>
          <button onClick={() => navigate('/portal')} className="empty-state-button">
            Return to Jobs
          </button>
        </div>
      </div>
    );
  }

  // Show pre-interview setup if interview hasn't started
  if (!interviewStarted) {
    return (
      <PreInterviewSetup
        onStartInterview={handleStartInterview}
        isInitializing={isStartingSession}
        defaultProfile={profileDefaults}
        jobDetails={jobContext ? {
          title: jobContext.title,
          company: jobContext.company,
          location: jobContext.location,
          type: jobContext.type,
          salary: jobContext.salary,
          tags: Array.isArray(jobContext.tags) ? jobContext.tags : [],
          interviewDurationMinutes: defaultDurationMinutes,
          experienceLabel: jobContext.experience || '',
          experienceKey,
          industry: jobContext.industry || jobContext.category || '',
          category: jobContext.category || '',
        } : null}
      />
    );
  }

  return (
    <div className="interview-page">
      {/* Header */}
      <div className="interview-header">
        <h1>AI Mock Interview</h1>
        <div className="header-controls">
          <div className="interview-phase">
            <span 
              className="phase-indicator" 
              style={{ backgroundColor: phaseInfo.color }}
            ></span>
            <span className="phase-text">{phaseInfo.text}</span>
          </div>
          <div className="interview-timer" title="Remaining interview time">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M15.07 1L14 2.07l1.9 1.9A8.93 8.93 0 0 0 12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7c1.1 0 2.15.24 3.07.67L13 7h6V1z"/>
            </svg>
            <span>{formatTimer(remainingSeconds)}</span>
          </div>
          <button 
            className={`speech-toggle ${isSpeechEnabled ? 'enabled' : 'disabled'}`}
            onClick={() => {
              const nextState = !isSpeechEnabled;
              setIsSpeechEnabled(nextState);
              if (!nextState) {
                // Stop any ongoing speech when disabling
                speechSynthesis.cancel();
              }
            }}
            title={isSpeechEnabled ? 'Click to mute AI voice' : 'Click to enable AI voice'}
          >
            {isSpeechEnabled ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12S16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12S18.01 4.14 14 3.23Z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.21 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.46 14 18.7V20.77C15.38 20.45 16.63 19.82 17.68 18.96L19.73 21L21 19.73L12 10.73L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z"/>
              </svg>
            )}
            <span>{isSpeechEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
          <button
            className="quit-interview-button"
            onClick={handleQuitInterview}
            disabled={isInterviewComplete}
            title="End interview early"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M10 17v-3h4v3h5V7h-5v3h-4V7H5v10h5zm-5 2a2 2 0 0 1-2-2V7c0-1.105.892-2 1.998-2H9V3h6v2h4.002C20.108 5 21 5.895 21 7v10c0 1.105-.892 2-1.998 2z" />
            </svg>
            <span>Quit</span>
          </button>
        </div>
      </div>

      <div className="interview-container">
        <div className="interview-left">
          {jobContext && (
            <aside className="job-brief">
              <header>
                <h2>{jobContext.title}</h2>
                <p>{jobContext.company}</p>
              </header>
              <dl>
                {jobContext.location && (
                  <div>
                    <dt>Location</dt>
                    <dd>{jobContext.location}</dd>
                  </div>
                )}
                {jobContext.type && (
                  <div>
                    <dt>Type</dt>
                    <dd>{jobContext.type}</dd>
                  </div>
                )}
                {(jobContext.interviewDurationMinutes || defaultDurationMinutes) && (
                  <div>
                    <dt>Duration</dt>
                    <dd>{jobContext.interviewDurationMinutes || defaultDurationMinutes} minutes</dd>
                  </div>
                )}
                {jobContext.salary && (
                  <div>
                    <dt>Salary</dt>
                    <dd>{jobContext.salary}</dd>
                  </div>
                )}
              </dl>
              {Array.isArray(jobContext.tags) && jobContext.tags.length > 0 && (
                <div className="skills">
                  <span className="skills-label">Key Skills</span>
                  <div className="skills-list">
                    {jobContext.tags.slice(0, 8).map(tag => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {jobContext.description && (
                <div className="job-description">
                  <span className="skills-label">Highlights</span>
                  <p>{jobContext.description}</p>
                </div>
              )}
            </aside>
          )}

          {/* Webcam Section */}
          <div className="webcam-section">
            <WebcamCapture />
            <div className="controls-section">
              <VoiceRecorder
                onSpeechResult={handleSpeechResult}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                setIsListening={setIsListening}
                disabled={isAiTyping || isInterviewComplete}
              />
              <div className="recording-status">
                {isListening && (
                  <div className="listening-indicator">
                    <div className="pulse-dot"></div>
                    <span>Listening...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <ChatInterface
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={sendMessage}
            messagesEndRef={messagesEndRef}
            disabled={isAiTyping || isInterviewComplete}
            completionReason={completionReason}
          />
          
          {/* Typing Animation */}
          {isAiTyping && (
            <div className="ai-typing-container">
              <div className="ai-message">
                <div className="ai-avatar">AI</div>
                <div className="message-bubble ai-bubble">
                  <TypingAnimation />
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <span>{error}</span>
              <button onClick={() => setError('')} className="error-close">×</button>
            </div>
          )}

          {isInterviewComplete && (
            <div className="completion-message">
              <span>
                {completionReason === 'time-expired'
                  ? 'Time is up. Feel free to review the transcript or close the session.'
                  : completionReason === 'user-quit'
                    ? 'You ended the interview early. Review the conversation or start another session when you are ready.'
                    : 'The interviewer has wrapped up the session. Feel free to review the transcript or close the session.'}
              </span>
              {finalizationStatus === 'pending' && (
                <div className="finalization-status">
                  <span>{isFinalizing ? 'Generating your AI feedback...' : 'Preparing your AI feedback...'}</span>
                </div>
              )}
              {finalizationStatus === 'failed' && (
                <div className="finalization-status finalization-status--error">
                  <span>{finalizationError || 'We could not generate your interview summary.'}</span>
                  <button type="button" onClick={retryFinalize} disabled={isFinalizing}>
                    Retry summary
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="interview-footer">
        <div className="instructions">
          <div className="instruction-item">
            <span className="instruction-icon">💬</span>
            <span><strong>Type your responses</strong> in the chat box below (always available)</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">🎤</span>
            <span><strong>Optional:</strong> Click the microphone to speak your answers</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">🤖</span>
            <span>The AI remembers everything and adapts questions accordingly</span>
          </div>
          <div className="instruction-item">
            <span className="instruction-icon">🔊</span>
            <span>AI responses are spoken aloud automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;