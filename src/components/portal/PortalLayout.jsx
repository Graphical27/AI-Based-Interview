import React, { useState, useEffect, useContext } from 'react';
import JobsView from './components/JobsView';
import DashboardView from './components/DashboardView';
import InterviewView from './components/InterviewView';
import { ThemeContext } from '../../contexts/ThemeContext';

const PortalLayout = ({ onLogout, user }) => {
  const { theme, switchTheme, themes, currentThemeId } = useContext(ThemeContext);
  const [view, setView] = useState('jobs');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {id:1, msg:'New job posted: Frontend Engineer', type:'job', time:'2h ago'},
    {id:2, msg:'Interview request from TechFlow', type:'interview', time:'4h ago'},
    {id:3, msg:'Profile viewed by recruiter', type:'profile', time:'1d ago'}
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Disable auto-hide functionality - keep sidebar always visible
  // useEffect(() => {
  //   let timeout;
  //   if (!isHovered && sidebarVisible) {
  //     timeout = setTimeout(() => {
  //       setSidebarVisible(false);
  //     }, 3000);
  //   }
  //   return () => clearTimeout(timeout);
  // }, [isHovered, sidebarVisible]);

  // Show sidebar on mouse movement near the left edge (for mobile)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientX <= 50 && !sidebarVisible) {
        setSidebarVisible(true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [sidebarVisible]);

  return (
    <div className={`min-h-screen flex ${theme.bg} transition-colors duration-500`}>
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r ${theme.orb1} rounded-full blur-[100px] animate-pulse opacity-40`}></div>
        <div className={`absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-l ${theme.orb2} rounded-full blur-[120px] animate-pulse delay-1000 opacity-40`}></div>
      </div>

      {/* Enhanced Sidebar with Auto-hide */}
      <aside 
        className={`fixed lg:relative z-50 h-full w-80 flex-col border-r ${theme.border} ${theme.glassPanel} transition-transform duration-300 ease-in-out ${
          sidebarVisible ? 'translate-x-0 flex' : '-translate-x-full hidden lg:flex lg:-translate-x-80'
        }`}
        onMouseEnter={() => {
          setIsHovered(true);
          setSidebarVisible(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className={`absolute -right-12 top-4 z-60 p-3 ${theme.glassPanel} border ${theme.border} rounded-r-xl ${theme.accentText} hover:opacity-80 transition-all hover:shadow-lg`}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${sidebarVisible ? 'rotate-0' : 'rotate-180'}`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        {/* Logo Section */}
        <div className={`p-8 border-b ${theme.border}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div className={`absolute -top-1 -right-1 w-4 h-4 ${theme.iconBg} rounded-full border-2 border-black animate-pulse`}></div>
            </div>
            <div>
              <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>JobPortal</h1>
              <p className={`text-xs ${theme.textMuted}`}>AI-Powered Career Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto">
          {[
            {key: 'jobs', icon: 'M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z', label: 'Job Search', badge: '12'},
            {key: 'dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', label: 'Dashboard', badge: null},
            {key: 'interview', icon: 'M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z', label: 'AI Interview', badge: 'New', highlight: true},
          ].map(nav => (
            <button
              key={nav.key}
              onClick={() => setView(nav.key)}
              className={`group relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-medium transition-all duration-300 ${
                view === nav.key
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                  : `${theme.textMuted} hover:${theme.text} hover:bg-white/5`
              }`}
            >
              <svg className={`w-6 h-6 ${view === nav.key ? 'text-white' : 'text-current'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d={nav.icon}/>
              </svg>
              <span className="flex-1">{nav.label}</span>
              {nav.badge && (
                <span className={`px-2 py-1 text-xs rounded-lg ${
                  nav.highlight 
                    ? 'bg-white text-black font-bold' 
                    : 'bg-white/10 text-white'
                }`}>
                  {nav.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Snippet */}
        <div className={`p-6 border-t ${theme.border}`}>
          <div className={`flex items-center gap-4 p-4 rounded-2xl ${theme.inputBg} border ${theme.border}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${theme.text} truncate`}>{user?.username || 'User'}</p>
              <p className={`text-xs ${theme.textMuted} truncate`}>{user?.role || 'Student'}</p>
            </div>
            <button onClick={onLogout} className={`${theme.textMuted} hover:text-red-400 transition-colors`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col h-screen">
        {/* Header */}
        <header className={`h-20 px-8 flex items-center justify-between border-b ${theme.border} ${theme.glassPanel} z-40`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-2xl font-bold ${theme.text}`}>
              {view === 'jobs' && 'Find Your Dream Job'}
              {view === 'dashboard' && 'Dashboard Overview'}
              {view === 'interview' && 'AI Interview Practice'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Theme Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`p-2 rounded-full ${theme.textMuted} hover:${theme.text} hover:bg-white/10 transition-all`}
                title="Change Theme"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              
              {showThemeMenu && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl ${theme.bg} border ${theme.border} shadow-2xl overflow-hidden z-50`}>
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

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full ${theme.textMuted} hover:${theme.text} hover:bg-white/10 transition-all relative`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-4 w-80 ${theme.bg} border ${theme.border} rounded-2xl shadow-2xl overflow-hidden z-50`}>
                  <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
                    <h3 className={`font-semibold ${theme.text}`}>Notifications</h3>
                    <button className={`text-xs ${theme.accentText}`}>Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b ${theme.border} hover:bg-white/5 transition-colors cursor-pointer`}>
                        <div className="flex gap-3">
                          <div className={`w-2 h-2 mt-2 rounded-full ${
                            notif.type === 'job' ? 'bg-blue-400' : 
                            notif.type === 'interview' ? 'bg-green-400' : 'bg-purple-400'
                          }`}></div>
                          <div>
                            <p className={`text-sm ${theme.text}`}>{notif.msg}</p>
                            <p className={`text-xs ${theme.textMuted} mt-1`}>{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {view === 'jobs' && <JobsView />}
            {view === 'dashboard' && <DashboardView user={user} />}
            {view === 'interview' && <InterviewView />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;