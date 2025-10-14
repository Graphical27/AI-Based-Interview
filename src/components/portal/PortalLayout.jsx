import React, { useState, useEffect } from 'react';
import JobsView from './components/JobsView';
import DashboardView from './components/DashboardView';
import InterviewView from './components/InterviewView';

const PortalLayout = ({ onLogout, user }) => {
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
    <div className="min-h-screen flex bg-black">
      {/* Enhanced Sidebar with Auto-hide */}
      <aside 
        className={`fixed lg:relative z-50 h-full w-80 flex-col border-r border-gray-800 bg-gradient-to-b from-gray-900/50 to-black backdrop-blur-xl transition-transform duration-300 ease-in-out ${
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
          className={`absolute -right-12 top-4 z-60 p-3 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-r-xl text-green-400 hover:text-green-300 transition-all hover:shadow-lg hover:shadow-green-400/20 ${
            sidebarVisible ? 'opacity-100' : 'opacity-60 hover:opacity-100'
          }`}
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
        <div className="p-8 border-b border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-lg shadow-green-400/25">
                <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">JobPortal</h1>
              <p className="text-xs text-gray-400">AI-Powered Career Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-3">
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
                  ? 'bg-gradient-to-r from-green-400/20 to-teal-400/20 text-green-400 border border-green-400/30 shadow-lg shadow-green-400/10'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-green-400'
              } ${nav.highlight ? 'ring-2 ring-green-400/30 ring-offset-2 ring-offset-black' : ''}`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                view === nav.key ? 'bg-green-400/20' : 'bg-gray-800/50 group-hover:bg-gray-700/50'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={nav.icon}/>
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm">{nav.label}</span>
                {nav.key === 'interview' && (
                  <div className="text-xs text-gray-400 mt-0.5">Practice & Prepare</div>
                )}
              </div>
              {nav.badge && (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  nav.badge === 'New' 
                    ? 'bg-gradient-to-r from-green-400 to-teal-400 text-black' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {nav.badge}
                </span>
              )}
            </button>
          ))}
          
          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-800/50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                New Application
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6z"/>
                </svg>
                Upload Resume
              </button>
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-6 border-t border-gray-800/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-black font-semibold">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'Student'}</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7L15.59 8.41 18.17 11H8V13H18.17L15.59 15.59 17 17L22 12Z"/>
              <path d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!sidebarVisible ? 'ml-0' : ''}`}>
        {/* Enhanced Header */}
        <header className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-xl sticky top-0 z-50">
          {/* Mobile menu & title */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
            <div className="hidden lg:block">
              <h2 className="text-xl font-semibold text-white capitalize">{view === 'interview' ? 'AI Interview Practice' : view}</h2>
              <p className="text-sm text-gray-400">
                {view === 'jobs' && 'Discover your next opportunity'}
                {view === 'dashboard' && 'Track your application progress'}
                {view === 'interview' && 'Practice with AI-powered mock interviews'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <input 
                className="w-full pl-11 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none transition-all backdrop-blur-sm"
                placeholder="Search jobs, companies, or ask AI..."
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-400/50 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"/>
                </svg>
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-teal-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </div>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 p-4 z-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    <button className="text-xs text-green-400 hover:text-green-300">Mark all read</button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {notifications.map(notif => (
                      <div key={notif.id} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/70 transition-all cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notif.type === 'job' ? 'bg-blue-400' : 
                            notif.type === 'interview' ? 'bg-green-400' : 'bg-purple-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 leading-snug">{notif.msg}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-2 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-black font-semibold text-sm">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-sm text-white">{user?.username || 'User'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10L12 15L17 10H7Z"/>
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={() => { setView('dashboard'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                      </svg>
                      Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9V3H13.5L18.5 8H21ZM9 7V9H21V7H9Z"/>
                      </svg>
                      Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                      Settings
                    </button>
                  </div>
                  <div className="pt-2 border-t border-gray-800">
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 7L15.59 8.41 18.17 11H8V13H18.17L15.59 15.59 17 17L22 12Z"/>
                        <path d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 lg:p-8">
            {view === 'jobs' && <JobsView user={user} />}
            {view === 'dashboard' && <DashboardView user={user} />}
            {view === 'interview' && <InterviewView user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;