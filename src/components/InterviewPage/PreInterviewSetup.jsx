import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const EXPERIENCE_DISPLAY = {
  fresher: 'Entry Level (0-1 yrs)',
  junior: 'Junior (1-3 yrs)',
  mid: 'Mid Level (3-6 yrs)',
  senior: 'Senior (6-10 yrs)',
  lead: 'Lead / Principal (10+ yrs)',
};

const PreInterviewSetup = ({ 
  onStart, 
  isLoading = false, 
  profileDefaults = null, 
  jobContext = null 
}) => {
  const { theme } = useContext(ThemeContext);
  
  // Map props to internal variables for consistency
  const onStartInterview = onStart;
  const isInitializing = isLoading;
  const defaultProfile = profileDefaults;
  const jobDetails = jobContext;

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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (countdown === 0 && isStarting) {
      Promise.resolve(onStartInterview(profilePayload)).catch((err) => {
        const message = err?.message || 'Unable to start the interview. Please try again.';
        setError(message);
        setIsStarting(false);
        setCountdown(3);
      });
    }
  }, [countdown, isStarting, onStartInterview, profilePayload]);

  if (isStarting) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}>
        <div className="text-center space-y-8">
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-4 ${theme.border} opacity-30`}></div>
            <div className={`absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent ${theme.accentText} animate-spin`}></div>
            <div className="text-6xl font-bold animate-pulse">{countdown}</div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Get Ready!</h2>
            <p className={`text-lg ${theme.textMuted}`}>
              Syncing questions for <span className={theme.accentText}>{profilePayload.role || 'selected role'}</span> at <span className={theme.accentText}>{profilePayload.company || 'your target company'}</span>...
            </p>
          </div>

          <div className={`flex flex-col gap-3 max-w-md mx-auto p-6 rounded-2xl ${theme.glassPanel} border ${theme.border}`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
              <span>Check your camera and microphone</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
              <span>Ensure good lighting</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">✓</div>
              <span>Sit up straight and smile</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${theme.bg} ${theme.text}`}>
      <div className={`w-full max-w-4xl rounded-3xl ${theme.glassPanel} border ${theme.border} shadow-2xl overflow-hidden flex flex-col md:flex-row`}>
        
        {/* Left Side - Header & Info */}
        <div className={`p-8 md:w-2/5 flex flex-col justify-between relative overflow-hidden`}>
           <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-10`}></div>
           <div className="relative z-10 space-y-6">
             <div>
               <h1 className="text-3xl font-bold mb-2">Interview Setup</h1>
               <p className={theme.textMuted}>We’ve already pulled everything we need from the job posting—just review and launch when you’re ready.</p>
             </div>

             {jobDetails && (
               <div className={`p-4 rounded-xl bg-black/20 border border-white/10 space-y-3`}>
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-lg ${theme.iconBg} flex items-center justify-center text-xl`}>💼</div>
                   <div>
                     <h3 className="font-bold leading-tight">{jobDetails.title}</h3>
                     <p className={`text-sm ${theme.textMuted}`}>{jobDetails.company}</p>
                   </div>
                 </div>
                 <div className="space-y-2 pt-2 border-t border-white/10 text-sm">
                    {jobDetails.location && (
                      <div className="flex justify-between">
                        <span className={theme.textMuted}>Location</span>
                        <span>{jobDetails.location}</span>
                      </div>
                    )}
                    {jobDetails.type && (
                      <div className="flex justify-between">
                        <span className={theme.textMuted}>Type</span>
                        <span>{jobDetails.type}</span>
                      </div>
                    )}
                 </div>
               </div>
             )}
           </div>

           <div className="relative z-10 mt-8">
             <div className={`text-xs ${theme.textMuted} p-4 rounded-lg bg-black/20`}>
               <p>All interview inputs are synced from the recruiter’s job post.</p>
               <p className="mt-1">Click start when you’re ready to begin.</p>
             </div>
           </div>
        </div>

        {/* Right Side - Profile & Action */}
        <div className={`p-8 md:w-3/5 bg-black/20 flex flex-col gap-6`}>
           {error && (
             <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
               {error}
             </div>
           )}

           <div className="space-y-4 flex-1">
             <div>
               <h3 className="font-bold text-lg">Your Interview Profile</h3>
               <p className={`text-sm ${theme.textMuted}`}>We tailor the prompts automatically from this job and your saved context.</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className={`p-3 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                 <span className={`text-xs block ${theme.textMuted} mb-1`}>Role Focus</span>
                 <span className="font-medium text-sm">{profilePayload.role || 'Not specified'}</span>
               </div>
               <div className={`p-3 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                 <span className={`text-xs block ${theme.textMuted} mb-1`}>Company</span>
                 <span className="font-medium text-sm">{profilePayload.company || 'Not specified'}</span>
               </div>
               <div className={`p-3 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                 <span className={`text-xs block ${theme.textMuted} mb-1`}>Experience Level</span>
                 <span className="font-medium text-sm">{experienceLabel}</span>
               </div>
               {profilePayload.industry && (
                 <div className={`p-3 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                   <span className={`text-xs block ${theme.textMuted} mb-1`}>Industry</span>
                   <span className="font-medium text-sm">{profilePayload.industry}</span>
                 </div>
               )}
             </div>

             {skillList.length > 0 && (
               <div>
                 <span className={`text-xs ${theme.textMuted} mb-2 block`}>Key Skills</span>
                 <div className="flex flex-wrap gap-2">
                   {skillList.slice(0, 8).map((skill) => (
                     <span key={skill} className={`text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 ${theme.textMuted}`}>
                       {skill}
                     </span>
                   ))}
                   {skillList.length > 8 && (
                     <span className={`text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 ${theme.textMuted}`}>+{skillList.length - 8} more</span>
                   )}
                 </div>
               </div>
             )}
           </div>

           <button
             onClick={startCountdown}
             disabled={isStarting || isInitializing}
             className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${theme.button} ${
               isStarting || isInitializing ? 'opacity-50 cursor-not-allowed' : ''
             }`}
           >
             {isInitializing ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span>Preparing...</span>
               </>
             ) : (
               <>
                 <span>🚀</span>
                 <span>Start My Interview</span>
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default PreInterviewSetup;