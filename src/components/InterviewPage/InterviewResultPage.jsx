import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Interview summary unavailable</h1>
          <p className="text-gray-400">
            We couldn&apos;t find a recent interview result. Launch a new practice session from the job board to generate fresh AI feedback.
          </p>
          <button
            type="button"
            onClick={handleBackToPortal}
            className="px-5 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 transition"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b1215] to-[#050708] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm text-green-400 uppercase tracking-[0.3em]">Interview recap</p>
            <h1 className="text-3xl md:text-4xl font-semibold">
              {job?.title || evaluation.role || 'Role Interview'}
            </h1>
            <p className="text-gray-400">
              {job?.company || evaluation.company || 'Your target company'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="px-3 py-1 rounded-full bg-gray-800/70 border border-gray-700/70">{completionLabel}</span>
              <span className="px-3 py-1 rounded-full bg-gray-800/70 border border-gray-700/70">Duration: {durationDisplay}</span>
              <span className="px-3 py-1 rounded-full bg-gray-800/70 border border-gray-700/70">Prompts covered: {totalQuestions}</span>
              <span className="px-3 py-1 rounded-full bg-gray-800/70 border border-gray-700/70">Responses shared: {totalResponses}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 bg-gray-900/60 border border-gray-800 rounded-2xl px-8 py-6 shadow-lg shadow-black/30">
            <span className="text-sm text-gray-400 uppercase tracking-widest">Overall score</span>
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-teal-400 flex items-center justify-center text-black text-3xl font-bold">
                {scoreDisplay}
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-400">out of 10</span>
            </div>
          </div>
        </header>

        {persistenceError && (
          <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm">
            {persistenceError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">AI session summary</h2>
            <p className="text-gray-300 leading-relaxed">{evaluation.summary}</p>
            <p className="text-sm text-gray-500">{completionHint}</p>
          </article>
          <article className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Key metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-800/70 border border-gray-700 p-4">
                <p className="text-sm text-gray-400">Questions asked</p>
                <p className="text-2xl font-semibold text-white">{totalQuestions}</p>
              </div>
              <div className="rounded-xl bg-gray-800/70 border border-gray-700 p-4">
                <p className="text-sm text-gray-400">Responses delivered</p>
                <p className="text-2xl font-semibold text-white">{totalResponses}</p>
              </div>
              <div className="rounded-xl bg-gray-800/70 border border-gray-700 p-4">
                <p className="text-sm text-gray-400">Session duration</p>
                <p className="text-2xl font-semibold text-white">{durationDisplay}</p>
              </div>
              <div className="rounded-xl bg-gray-800/70 border border-gray-700 p-4">
                <p className="text-sm text-gray-400">Focus areas</p>
                <p className="text-2xl font-semibold text-white">{skills.length || '—'}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-green-300">Strength highlights</h2>
            <ul className="mt-4 space-y-3 text-gray-200">
              {strengths.map((item, index) => (
                <li key={`strength-${index}`} className="flex items-start gap-3">
                  <span className="mt-1 text-green-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-amber-300">Suggested improvements</h2>
            <ul className="mt-4 space-y-3 text-gray-200">
              {improvements.map((item, index) => (
                <li key={`improvement-${index}`} className="flex items-start gap-3">
                  <span className="mt-1 text-amber-300">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Role alignment</h2>
          <p className="text-gray-300 leading-relaxed">{evaluation.requirementsSummary}</p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-gray-800/80 border border-gray-700 text-sm text-gray-200"
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
            className="px-5 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={handlePracticeAgain}
            className="px-5 py-3 rounded-xl border border-gray-700 bg-gray-900 hover:border-green-400 hover:text-green-300 transition"
          >
            Practice again
          </button>
        </footer>
      </div>
    </div>
  );
};

export default InterviewResultPage;
