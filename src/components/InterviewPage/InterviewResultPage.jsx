import React, { useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';

const COMPLETION_LABELS = {
  'agent-complete': 'Session completed',
  'user-quit': 'Ended early by you',
  'time-expired': 'Time limit reached',
  unknown: 'Session ended',
};

const COMPLETION_HINTS = {
  'agent-complete': 'Great work making it through the full interview plan.',
  'user-quit': 'You can always revisit and finish the remaining prompts.',
  'time-expired': 'Consider tightening responses to cover more ground next time.',
  unknown: 'We saved your responses and generated insights from the conversation.',
};

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (minutes === 0) {
    return `${secs}s`;
  }
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
};

const defaultStrengths = ['Consistent participation throughout the conversation.'];
const defaultImprovements = ['Add more specific examples and outcomes to strengthen your responses.'];

const InterviewResultPage = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();

  const evaluation = location.state?.evaluation || null;
  const job = location.state?.job || null;
  const persistenceError = location.state?.persistenceError || '';
  const applicationId = location.state?.applicationId || null;

  const durationDisplay = useMemo(() => formatDuration(evaluation?.durationSeconds ?? 0), [evaluation?.durationSeconds]);
  const completionKey = evaluation?.completionReason || 'unknown';
  const completionLabel = COMPLETION_LABELS[completionKey] || COMPLETION_LABELS.unknown;
  const completionHint = COMPLETION_HINTS[completionKey] || COMPLETION_HINTS.unknown;
  const totalQuestions = evaluation?.totalQuestions ?? 0;
  const totalResponses = evaluation?.totalResponses ?? 0;
  const scoreDisplay = useMemo(() => Number(evaluation?.score ?? 0).toFixed(1), [evaluation?.score]);

  const strengths = evaluation?.strengths?.length ? evaluation.strengths : defaultStrengths;
  const improvements = evaluation?.improvements?.length ? evaluation.improvements : defaultImprovements;
  const skills = evaluation?.skillsCovered || [];

  const handleBackToPortal = () => navigate('/portal');

  const handlePracticeAgain = () => {
    if (!job) {
      navigate('/interview');
      return;
    }

    const fallbackMinutes = Math.max(10, Math.round((evaluation?.durationSeconds || 900) / 60));
    navigate('/interview', {
      state: {
        job,
        durationMinutes: job.interviewDurationMinutes || job.durationMinutes || fallbackMinutes,
        applicationId,
      },
    });
  };

  if (!evaluation) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center px-6`}>
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Interview summary unavailable</h1>
          <p className={`${theme.textMuted}`}>
            We couldn&apos;t find a recent interview result. Launch a new practice session from the job board to generate fresh AI feedback.
          </p>
          <button
            type="button"
            onClick={handleBackToPortal}
            className={`px-5 py-2 rounded-lg ${theme.button} text-white font-semibold transition`}
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <p className={`text-sm ${theme.accentText} uppercase tracking-[0.3em]`}>Interview recap</p>
            <h1 className="text-3xl md:text-4xl font-semibold">
              {job?.title || evaluation.role || 'Role Interview'}
            </h1>
            <p className={theme.textMuted}>
              {job?.company || evaluation.company || 'Your target company'}
            </p>
            <div className={`flex flex-wrap items-center gap-3 text-sm ${theme.textMuted}`}>
              <span className={`px-3 py-1 rounded-full ${theme.glassPanel} border ${theme.border}`}>{completionLabel}</span>
              <span className={`px-3 py-1 rounded-full ${theme.glassPanel} border ${theme.border}`}>Duration: {durationDisplay}</span>
              <span className={`px-3 py-1 rounded-full ${theme.glassPanel} border ${theme.border}`}>Prompts covered: {totalQuestions}</span>
              <span className={`px-3 py-1 rounded-full ${theme.glassPanel} border ${theme.border}`}>Responses shared: {totalResponses}</span>
            </div>
          </div>
          <div className={`flex flex-col items-center justify-center gap-2 ${theme.glassPanel} border ${theme.border} rounded-2xl px-8 py-6 shadow-lg`}>
            <span className={`text-sm ${theme.textMuted} uppercase tracking-widest`}>Overall score</span>
            <div className="relative">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center text-black text-3xl font-bold`}>
                {scoreDisplay}
              </div>
              <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs ${theme.textMuted}`}>out of 10</span>
            </div>
          </div>
        </header>

        {persistenceError && (
          <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm">
            {persistenceError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className={`rounded-2xl ${theme.glassPanel} border ${theme.border} p-6 space-y-4`}>
            <h2 className={`text-xl font-semibold ${theme.text}`}>AI session summary</h2>
            <p className={`${theme.textMuted} leading-relaxed`}>{evaluation.summary}</p>
            <p className={`text-sm ${theme.textMuted}`}>{completionHint}</p>
          </article>
          <article className={`rounded-2xl ${theme.glassPanel} border ${theme.border} p-6 space-y-4`}>
            <h2 className={`text-xl font-semibold ${theme.text}`}>Key metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-xl ${theme.inputBg} border ${theme.border} p-4`}>
                <p className={`text-sm ${theme.textMuted}`}>Questions asked</p>
                <p className={`text-2xl font-semibold ${theme.text}`}>{totalQuestions}</p>
              </div>
              <div className={`rounded-xl ${theme.inputBg} border ${theme.border} p-4`}>
                <p className={`text-sm ${theme.textMuted}`}>Responses delivered</p>
                <p className={`text-2xl font-semibold ${theme.text}`}>{totalResponses}</p>
              </div>
              <div className={`rounded-xl ${theme.inputBg} border ${theme.border} p-4`}>
                <p className={`text-sm ${theme.textMuted}`}>Session duration</p>
                <p className={`text-2xl font-semibold ${theme.text}`}>{durationDisplay}</p>
              </div>
              <div className={`rounded-xl ${theme.inputBg} border ${theme.border} p-4`}>
                <p className={`text-sm ${theme.textMuted}`}>Focus areas</p>
                <p className={`text-2xl font-semibold ${theme.text}`}>{skills.length || '—'}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className={`rounded-2xl ${theme.glassPanel} border ${theme.border} p-6`}>
            <h2 className={`text-xl font-semibold ${theme.accentText}`}>Strength highlights</h2>
            <ul className={`mt-4 space-y-3 ${theme.text}`}>
              {strengths.map((item, index) => (
                <li key={`strength-${index}`} className="flex items-start gap-3">
                  <span className={`mt-1 ${theme.accentText}`}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className={`rounded-2xl ${theme.glassPanel} border ${theme.border} p-6`}>
            <h2 className="text-xl font-semibold text-amber-300">Suggested improvements</h2>
            <ul className={`mt-4 space-y-3 ${theme.text}`}>
              {improvements.map((item, index) => (
                <li key={`improvement-${index}`} className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className={`rounded-2xl ${theme.glassPanel} border ${theme.border} p-6 space-y-4`}>
          <h2 className={`text-xl font-semibold ${theme.text}`}>Role alignment</h2>
          <p className={`${theme.textMuted} leading-relaxed`}>{evaluation.requirementsSummary}</p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className={`px-3 py-1 rounded-full ${theme.inputBg} border ${theme.border} text-sm ${theme.textMuted}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
          <button
            type="button"
            onClick={handleBackToPortal}
            className={`px-5 py-3 rounded-xl bg-gradient-to-r ${theme.accent} text-black font-semibold hover:opacity-90 transition`}
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={handlePracticeAgain}
            className={`px-5 py-3 rounded-xl border ${theme.border} ${theme.glassPanel} hover:border-green-400 hover:text-green-300 transition`}
          >
            Practice again
          </button>
        </footer>
      </div>
    </div>
  );
};

export default InterviewResultPage;
