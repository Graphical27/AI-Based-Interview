import React, { useState, useContext } from 'react';
import InterviewPage from '../../InterviewPage/InterviewPage';
import PreInterviewSetup from '../../InterviewPage/PreInterviewSetup';
import { ThemeContext } from '../../../contexts/ThemeContext';

const InterviewView = () => {
  const { theme } = useContext(ThemeContext);
  const [currentStage, setCurrentStage] = useState('overview'); // overview, setup, interview
  const [interviewData, setInterviewData] = useState(null);

  const handleStartSetup = () => {
    setCurrentStage('setup');
  };

  const handleSetupComplete = (data) => {
    setInterviewData(data);
    setCurrentStage('interview');
  };

  const handleInterviewEnd = () => {
    setCurrentStage('overview');
    setInterviewData(null);
  };

  if (currentStage === 'interview') {
    return (
      <div className="h-full">
        <div className={`mb-4 p-4 ${theme.glassPanel} border ${theme.border} rounded-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${theme.text}`}>Interview in Progress</h3>
              <p className={`text-sm ${theme.textMuted}`}>
                {interviewData?.role} - {interviewData?.experience} experience
              </p>
            </div>
            <button
              onClick={handleInterviewEnd}
              className={`px-4 py-2 text-sm ${theme.textMuted} hover:text-red-400 border ${theme.border} hover:border-red-500/50 rounded-lg transition-all`}
            >
              End Interview
            </button>
          </div>
        </div>
        <div className="h-[calc(100vh-200px)]">
          <InterviewPage onEnd={handleInterviewEnd} />
        </div>
      </div>
    );
  }

  if (currentStage === 'setup') {
    return (
      <div className="h-full">
        <div className="mb-6">
          <button
            onClick={() => setCurrentStage('overview')}
            className={`flex items-center gap-2 ${theme.textMuted} hover:text-green-400 text-sm transition-all`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Interview Hub
          </button>
        </div>
        <div className="max-w-2xl mx-auto">
          <PreInterviewSetup onComplete={handleSetupComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className={`relative overflow-hidden rounded-3xl ${theme.glassPanel} border ${theme.border}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-teal-400/5"></div>
        <div className="relative p-8 lg:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-teal-400 shadow-lg shadow-green-400/25">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                </svg>
              </div>
              <div>
                <h1 className={`text-3xl lg:text-4xl font-bold ${theme.text} mb-2`}>AI Interview Practice</h1>
                <p className={`${theme.textMuted} text-lg`}>Master your interviews with personalized AI coaching</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className={`p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className={`font-semibold ${theme.text}`}>Real-time Feedback</h3>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>Get instant analysis of your responses and communication skills</p>
              </div>
              
              <div className={`p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className={`font-semibold ${theme.text}`}>Customized Questions</h3>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>Questions tailored to your role, experience, and target companies</p>
              </div>
              
              <div className={`p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <h3 className={`font-semibold ${theme.text}`}>Performance Analytics</h3>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>Track your progress and identify areas for improvement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl ${theme.glassPanel} border ${theme.border} hover:border-green-400/30 transition-all group`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-lg shadow-green-400/25">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme.text}`}>Start Mock Interview</h3>
              <p className={`${theme.textMuted}`}>Begin a full interview simulation</p>
            </div>
          </div>
          <p className={`${theme.textMuted} mb-6`}>
            Experience a complete interview process with AI-powered questions, real-time feedback, 
            and detailed performance analysis.
          </p>
          <button
            onClick={handleStartSetup}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-teal-400 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-green-400/25 transition-all group-hover:scale-[1.02]"
          >
            Start Interview
          </button>
        </div>

        <div className={`p-6 rounded-2xl ${theme.glassPanel} border ${theme.border} hover:border-purple-400/30 transition-all group`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-400/25">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v8h2v-8zm4 0h-2v8h2v-8zm4 0h-2v8h2v-8zm2.5-9H18V0h-2v2H8V0H6v2H3.5C2.12 2 1 3.12 1 4.5V6h22V4.5C23 3.12 21.88 2 20.5 2z"/>
                <path d="M2 19.5C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5V8H2v11.5z"/>
              </svg>
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme.text}`}>Practice History</h3>
              <p className={`${theme.textMuted}`}>Review your past interview sessions</p>
            </div>
          </div>
          <p className={`${theme.textMuted} mb-6`}>
            Access detailed reports from previous interviews, track your improvement over time, 
            and identify patterns in your performance.
          </p>
          <button className={`w-full px-6 py-3 ${theme.inputBg} hover:bg-gray-500/10 ${theme.text} font-semibold rounded-xl transition-all group-hover:scale-[1.02] border ${theme.border}`}>
            View History
          </button>
        </div>
      </div>

      {/* Interview Types */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${theme.text}`}>Interview Types</h2>
          <button className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-2">
            View all
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Technical Interview',
              description: 'Coding challenges, system design, and technical problem solving',
              icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
              color: 'from-blue-400 to-blue-600',
              bgColor: 'blue-500/10',
              borderColor: 'blue-500/20',
              sessions: '12 sessions'
            },
            {
              title: 'Behavioral Interview',
              description: 'Situational questions, soft skills, and cultural fit assessment',
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
              color: 'from-green-400 to-green-600',
              bgColor: 'green-500/10',
              borderColor: 'green-500/20',
              sessions: '8 sessions'
            },
            {
              title: 'Case Study',
              description: 'Business scenarios, analytical thinking, and strategic planning',
              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
              color: 'from-purple-400 to-purple-600',
              bgColor: 'purple-500/10',
              borderColor: 'purple-500/20',
              sessions: '5 sessions'
            },
            {
              title: 'Leadership Interview',
              description: 'Management scenarios, team leadership, and decision making',
              icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              color: 'from-orange-400 to-orange-600',
              bgColor: 'orange-500/10',
              borderColor: 'orange-500/20',
              sessions: '3 sessions'
            },
            {
              title: 'Product Interview',
              description: 'Product strategy, user experience, and market analysis',
              icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
              color: 'from-pink-400 to-pink-600',
              bgColor: 'pink-500/10',
              borderColor: 'pink-500/20',
              sessions: '6 sessions'
            },
            {
              title: 'Sales Interview',
              description: 'Client interaction, negotiation, and relationship building',
              icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
              color: 'from-teal-400 to-teal-600',
              bgColor: 'teal-500/10',
              borderColor: 'teal-500/20',
              sessions: '4 sessions'
            }
          ].map((type, index) => (
            <div key={index} className={`p-6 rounded-2xl ${theme.glassPanel} border ${theme.border} hover:border-${type.borderColor} transition-all group cursor-pointer`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${type.bgColor} flex items-center justify-center border border-${type.borderColor}`}>
                  <svg className={`w-5 h-5 text-${type.color.split(' ')[1]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon}/>
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold ${theme.text}`}>{type.title}</h3>
                  <p className={`text-xs ${theme.textMuted}`}>{type.sessions}</p>
                </div>
              </div>
              <p className={`text-sm ${theme.textMuted} mb-4`}>{type.description}</p>
              <button className={`w-full px-4 py-2 ${theme.inputBg} hover:bg-gray-500/10 text-green-400 text-sm font-medium rounded-lg transition-all border ${theme.border} hover:border-green-500/30`}>
                Practice Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${theme.text}`}>Recent Activity</h2>
        <div className={`${theme.glassPanel} border ${theme.border} rounded-2xl p-6`}>
          <div className="space-y-4">
            {[
              {
                type: 'Technical Interview',
                score: 85,
                date: '2 hours ago',
                duration: '45 min',
                status: 'completed'
              },
              {
                type: 'Behavioral Interview',
                score: 78,
                date: '1 day ago',
                duration: '30 min',
                status: 'completed'
              },
              {
                type: 'Case Study',
                score: null,
                date: '3 days ago',
                duration: '20 min',
                status: 'incomplete'
              }
            ].map((activity, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {activity.status === 'completed' ? '✓' : '⏳'}
                  </div>
                  <div>
                    <h4 className={`font-medium ${theme.text}`}>{activity.type}</h4>
                    <p className={`text-sm ${theme.textMuted}`}>{activity.date} • {activity.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.score && (
                    <div className="text-lg font-semibold text-green-400">{activity.score}%</div>
                  )}
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {activity.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewView;