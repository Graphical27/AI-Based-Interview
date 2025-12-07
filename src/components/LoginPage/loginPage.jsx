import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const { theme, switchTheme, themes, currentThemeId } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Backend login
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.login({ username, password, role: userType });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (e) {
      setError('Invalid credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 transition-colors duration-500`}>
      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative">
          <button 
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`p-3 rounded-full ${theme.glassPanel} ${theme.text} hover:bg-white/10 transition-all duration-300 border ${theme.border} shadow-lg backdrop-blur-md`}
            title="Change Theme"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
          
          {showThemeMenu && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl ${theme.glassPanel} border ${theme.border} shadow-2xl overflow-hidden backdrop-blur-xl z-50`}>
              <div className="p-2 space-y-1">
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>Select Theme</div>
                {Object.values(themes).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      switchTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${
                      currentThemeId === t.id 
                        ? `bg-white/10 ${theme.text}` 
                        : `${theme.textMuted} hover:bg-white/5 hover:${theme.text}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${t.accent} shadow-sm`}></div>
                      <span className="font-medium">{t.name}</span>
                    </div>
                    {currentThemeId === t.id && (
                      <svg className={`w-4 h-4 ${theme.accentText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r ${theme.orb1} rounded-full blur-[100px] animate-pulse opacity-60`}></div>
        <div className={`absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-l ${theme.orb2} rounded-full blur-[120px] animate-pulse delay-1000 opacity-60`}></div>
      </div>

      <div className={`relative w-full max-w-6xl ${theme.glassPanel} rounded-3xl ${theme.shadow} overflow-hidden border ${theme.border} transition-all duration-500`}>
        <div className="flex flex-col lg:flex-row min-h-[700px]">
          {/* Left Panel - Brand Section */}
          <div className={`lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-r ${theme.border} bg-black/20`}>
            {/* Decorative elements */}
            <div className={`absolute top-0 right-0 w-60 h-60 bg-gradient-to-br ${theme.orb1} rounded-full blur-3xl opacity-30`}></div>
            <div className={`absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr ${theme.orb2} rounded-full blur-3xl opacity-30`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 ${theme.iconBg} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
                  JobPortal
                </h1>
              </div>
              
              <h2 className={`text-4xl lg:text-5xl font-bold ${theme.text} mb-6 leading-tight`}>
                Your Career Journey Starts Here
              </h2>
              
              <p className={`${theme.textMuted} text-lg mb-8 leading-relaxed`}>
                Connect with top companies, practice with AI-powered interviews, and land your dream job with our comprehensive job portal.
              </p>
              
              <div className={`flex flex-wrap gap-4 text-sm ${theme.textMuted}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 bg-gradient-to-r ${theme.accent} rounded-full`}></div>
                  <span>AI Interview Practice</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 bg-gradient-to-r ${theme.accent} rounded-full`}></div>
                  <span>Smart Job Matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 bg-gradient-to-r ${theme.accent} rounded-full`}></div>
                  <span>Real-time Feedback</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center relative">
            <div className="max-w-md mx-auto w-full relative z-10">
              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold ${theme.text} mb-2`}>Welcome Back</h3>
                <p className={theme.textMuted}>Sign in to continue your journey</p>
              </div>

              {/* User Type Selector */}
              <div className={`flex gap-2 mb-6 p-1 ${theme.inputBg} rounded-xl border ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    userType === 'student'
                      ? `${theme.button} text-white shadow-lg`
                      : `${theme.textMuted} hover:${theme.text} hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9V3H13.5L18.5 8H21ZM9 7V9H21V7H9Z"/>
                    </svg>
                    Student
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('recruiter')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    userType === 'recruiter'
                      ? `${theme.button} text-white shadow-lg`
                      : `${theme.textMuted} hover:${theme.text} hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    </svg>
                    Recruiter
                  </div>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 ${theme.textMuted} group-focus-within:${theme.accentText} transition-colors`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 ${theme.inputBg} border border-transparent rounded-xl ${theme.text} placeholder-gray-500 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all duration-300 backdrop-blur-sm`}
                      style={{ '--tw-ring-color': `var(--${theme.id}-ring)` }} // Dynamic ring color hack or just rely on border
                      required
                    />
                    {/* Add a dynamic border on focus via class logic if needed, but inputBg handles it */}
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 ${theme.textMuted} group-focus-within:${theme.accentText} transition-colors`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 ${theme.inputBg} border border-transparent rounded-xl ${theme.text} placeholder-gray-500 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all duration-300 backdrop-blur-sm`}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className={`flex items-center gap-2 ${theme.textMuted} text-sm cursor-pointer hover:${theme.text} transition-colors`}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`w-4 h-4 rounded bg-gray-800 border-gray-600 focus:ring-offset-0 focus:ring-2`}
                    />
                    Remember me
                  </label>
                  <button type="button" className={`${theme.accentText} text-sm hover:opacity-80 transition-opacity`}>
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 ${theme.button} text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${theme.border}`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`px-4 ${theme.glassPanel} ${theme.textMuted} rounded-full text-xs`}>Don't have an account?</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/signup?role=student')}
                    className={`flex-1 py-3 px-4 border ${theme.border} ${theme.textMuted} rounded-xl hover:bg-white/5 hover:${theme.text} transition-all duration-300 text-sm font-medium`}
                  >
                    Create Student Account
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signup?role=recruiter')}
                    className={`flex-1 py-3 px-4 border ${theme.border} ${theme.textMuted} rounded-xl hover:bg-white/5 hover:${theme.text} transition-all duration-300 text-sm font-medium`}
                  >
                    Create Recruiter Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


