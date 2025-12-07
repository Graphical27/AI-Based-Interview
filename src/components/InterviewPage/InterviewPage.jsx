import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import WebcamCapture from './WebcamCapture';
import VoiceRecorder from './VoiceRecorder';
import ChatInterface from './ChatInterface';
import TypingAnimation from './TypingAnimation';
import PreInterviewSetup from './PreInterviewSetup';
import InterviewResultPage from './InterviewResultPage';
import { startInterviewSession, sendInterviewMessage, endInterviewSession, finalizeInterviewSession, getTTS } from '../../services/interviewApi';
import { api } from '../../services/api';

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
  const { theme } = useContext(ThemeContext);
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
  const [audioElement, setAudioElement] = useState(null);
  
  const messagesEndRef = useRef(null);
  const timerNotifiedRef = useRef(false);
  const sessionTerminationRef = useRef(false);
  const finalizationGuardRef = useRef('idle');
  const interviewStartTimestampRef = useRef(null);
  const componentMountedRef = useRef(true);

  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

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

  const speakText = async (text) => {
    if (!text) return;

    // Stop existing speech
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    try {
      const blob = await getTTS(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        console.log('Speech finished');
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
      };

      setAudioElement(audio);
      await audio.play();

    } catch (error) {
      console.error('TTS Error, falling back to browser TTS:', error);
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
         const utterance = new SpeechSynthesisUtterance(text);
         // Enhanced voice settings for more natural speech
         utterance.rate = 0.9; 
         utterance.pitch = 1.0;
         
         const voices = speechSynthesis.getVoices();
         const femaleVoice = voices.find(voice => 
            voice.lang.includes('en') && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('woman') ||
             voice.name.includes('Zira') ||
             voice.name.includes('Samantha'))
          );
          
          if (femaleVoice) utterance.voice = femaleVoice;
          
         speechSynthesis.speak(utterance);
      }
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
      
      if (response.done) {
        setIsInterviewComplete(true);
        setTimerActive(false);
        setCompletionReason('Interview completed successfully.');
        handleFinalizeSession();
      }

      if (isSpeechEnabled) {
        speakText(response.message);
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleFinalizeSession = async () => {
    if (finalizationGuardRef.current !== 'idle') {
      return;
    }
    
    finalizationGuardRef.current = 'processing';
    setIsFinalizing(true);
    setFinalizationStatus('processing');
    setFinalizationError('');

    try {
      const result = await finalizeInterviewSession(sessionId);
      
      if (componentMountedRef.current) {
        setFinalizationStatus('success');
        finalizationGuardRef.current = 'success';
        
        // If we have an application ID, update its status
        if (applicationId) {
          try {
            await api.put(`/applications/${applicationId}/status`, { 
              status: 'interview_completed',
              interviewScore: result.score || 0
            });
          } catch (appErr) {
            console.error('Failed to update application status:', appErr);
            // Non-blocking error
          }
        }

        // Navigate to results page with data
        navigate('/interview/results', { 
          state: { 
            evaluation: result,
            job: jobContext,
            applicationId: applicationId
          } 
        });
      }
    } catch (err) {
      console.error('Failed to finalize session:', err);
      if (componentMountedRef.current) {
        setFinalizationStatus('error');
        setFinalizationError(err.message || 'Failed to generate interview report.');
        finalizationGuardRef.current = 'error';
      }
    } finally {
      if (componentMountedRef.current) {
        setIsFinalizing(false);
      }
    }
  };

  const handleEndInterview = async () => {
    if (!sessionId || isInterviewComplete) return;

    if (window.confirm('Are you sure you want to end the interview early?')) {
      try {
        // We don't need to explicitly end the session here as finalizeInterviewSession handles it
        // and generates the report. Calling endInterviewSession would delete it before we can finalize.
        setIsInterviewComplete(true);
        setTimerActive(false);
        setCompletionReason('Interview ended by user.');
        handleFinalizeSession();
      } catch (err) {
        console.error('Failed to end interview:', err);
        setError('Failed to end interview properly.');
      }
    }
  };

  const handleTranscript = (text) => {
    setCurrentMessage(prev => (prev ? `${prev} ${text}` : text));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(currentMessage);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval;
    if (timerActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => {
          const next = prev - 1;
          
          // Warning at 5 minutes
          if (next === 300 && !timerNotifiedRef.current) {
            timerNotifiedRef.current = true;
            setMessages(prev => [...prev, {
              id: `sys-${Date.now()}`,
              role: 'system',
              message: '⚠️ 5 minutes remaining in the interview.',
              timestamp: new Date(),
              phase: 'system'
            }]);
          }
          
          // Auto-end at 0
          if (next <= 0 && !sessionTerminationRef.current) {
            sessionTerminationRef.current = true;
            setTimerActive(false);
            setIsInterviewComplete(true);
            setCompletionReason('Time limit reached.');
            handleFinalizeSession();
            return 0;
          }
          
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, remainingSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Logic
  if (isInterviewComplete && finalizationStatus === 'success') {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent ${theme.border} rounded-full animate-spin mx-auto mb-4`}></div>
          <h2 className={`text-xl font-bold ${theme.text}`}>Generating Interview Results...</h2>
          <p className={`mt-2 ${theme.textMuted}`}>Redirecting to feedback page...</p>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <PreInterviewSetup 
        onStart={handleStartInterview}
        isLoading={isStartingSession}
        error={error}
        defaultDuration={defaultDurationMinutes}
        jobContext={jobContext}
        profileDefaults={profileDefaults}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-6 flex flex-col`}>
      {/* Header */}
      <header className={`flex justify-between items-center mb-6 px-6 py-4 rounded-2xl ${theme.glassPanel} border ${theme.border} shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${theme.accent}`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Interview Session</h1>
            <p className={`text-xs ${theme.textMuted} font-medium`}>
              {jobContext ? `${jobContext.title} at ${jobContext.company}` : 'General Interview'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${theme.glassPanel} border ${theme.border}`}>
            <div className={`w-2 h-2 rounded-full ${remainingSeconds < 300 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className={`font-mono text-lg font-bold ${remainingSeconds < 300 ? 'text-red-400' : theme.text}`}>
              {formatTime(remainingSeconds)}
            </span>
          </div>
          
          <button 
            onClick={handleEndInterview}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-medium"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: AI Avatar & Webcam */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          {/* AI Avatar Section */}
          <div className={`flex-1 relative rounded-3xl overflow-hidden ${theme.glassPanel} border ${theme.border} shadow-2xl group`}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
            
            {/* AI Visualizer / Avatar Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${theme.accent} blur-3xl opacity-20 animate-pulse`}></div>
              <div className="relative z-20 flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${theme.accent} p-[2px] shadow-lg shadow-purple-500/20`}>
                  <div className="w-full h-full rounded-2xl bg-black/90 flex items-center justify-center backdrop-blur-xl">
                    <span className="text-4xl">🤖</span>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">AI Interviewer</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isAiTyping ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className="text-xs text-gray-400 font-medium">
                      {isAiTyping ? 'Speaking...' : 'Listening'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Visualizer Bars (Decorative) */}
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 pb-8 z-20 opacity-50">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 rounded-t-full bg-gradient-to-t ${theme.accent}`}
                  style={{ 
                    height: isAiTyping ? `${Math.random() * 100}%` : '10%',
                    transition: 'height 0.2s ease'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* User Webcam Section */}
          <div className={`h-64 rounded-3xl overflow-hidden ${theme.glassPanel} border ${theme.border} shadow-xl relative`}>
            <WebcamCapture />
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-9 flex flex-col min-h-0">
          <div className={`flex-1 flex flex-col rounded-3xl overflow-hidden ${theme.glassPanel} border ${theme.border} shadow-2xl`}>
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <ChatInterface 
                messages={messages} 
                isAiTyping={isAiTyping} 
                messagesEndRef={messagesEndRef} 
              />
              {isAiTyping && (
                <div className="flex justify-start">
                  <TypingAnimation />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-black/20 backdrop-blur-md border-t border-white/5">
              <div className="relative flex items-end gap-4">
                <div className="flex-1 relative group">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer here..."
                    className={`w-full bg-black/30 text-white placeholder-gray-500 rounded-2xl py-4 pl-6 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 transition-all h-[60px] max-h-[120px]`}
                    disabled={isAiTyping || isInterviewComplete}
                  />
                  <button 
                    onClick={() => sendMessage(currentMessage)}
                    disabled={!currentMessage.trim() || isAiTyping}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl ${
                      currentMessage.trim() && !isAiTyping 
                        ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg shadow-purple-500/20 hover:scale-105` 
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    } transition-all duration-200`}
                  >
                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                <VoiceRecorder 
                  onSpeechResult={handleTranscript}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  setIsListening={setIsListening}
                  disabled={isAiTyping || isInterviewComplete}
                />
              </div>
              
              <div className="mt-3 flex justify-between items-center px-2">
                <p className="text-xs text-gray-500">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px]">Enter</kbd> to send
                </p>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></span>
                  <span className="text-xs text-gray-500">
                    {isListening ? 'Microphone Active' : 'Microphone Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Finalization Overlay */}
      {isFinalizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`max-w-md w-full p-8 rounded-3xl ${theme.glassPanel} border ${theme.border} text-center`}>
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${theme.accentText} animate-spin`}></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Finalizing Interview</h2>
            <p className="text-gray-400">Analyzing your responses and generating feedback...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;