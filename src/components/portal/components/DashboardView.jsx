import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../../../services/api';

const DashboardView = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await api.dashboardSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback to empty data
      setDashboardData({
        applications: [],
        interviews: [],
        activities: [],
        stats: { totalApplications: 0, activeApplications: 0, interviews: 0, offers: 0, responseRate: 0 }
      });
    }
    setIsLoading(false);
  };

  const stats = useMemo(() => {
    if (!dashboardData) return { totalApplications: 0, activeApplications: 0, interviews: 0, offers: 0, responseRate: 0 };
    
    const applications = dashboardData.applications || [];
    const interviews = dashboardData.interviews || [];
    
    return {
      totalApplications: applications.length,
      activeApplications: applications.filter(a => a.status !== 'rejected' && a.status !== 'offer').length,
      interviews: interviews.filter(i => i.status === 'scheduled').length,
      offers: applications.filter(a => a.status === 'offer').length,
      responseRate: applications.length > 0 ? Math.round((applications.filter(a => a.status !== 'pending').length / applications.length) * 100) : 0
    };
  }, [dashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'interview': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'offer': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getInterviewTypeColor = (type) => {
    switch (type) {
      case 'Technical': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Behavioral': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'System Design': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  const applications = dashboardData?.applications || [];
  const interviews = dashboardData?.interviews || [];
  const activities = dashboardData?.activities || [];

  if (activeTab === 'overview') {
    return (
      <div className="space-y-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: 'Total Applications', value: stats.totalApplications, icon: '📄', color: 'from-blue-400 to-blue-600', change: '+3 this week' },
            { label: 'Active Applications', value: stats.activeApplications, icon: '⏳', color: 'from-yellow-400 to-orange-600', change: '2 in progress' },
            { label: 'Scheduled Interviews', value: stats.interviews, icon: '📅', color: 'from-green-400 to-teal-600', change: 'Next: Tomorrow' },
            { label: 'Job Offers', value: stats.offers, icon: '💰', color: 'from-purple-400 to-pink-600', change: '+1 this week' },
            { label: 'Response Rate', value: `${stats.responseRate}%`, icon: '📊', color: 'from-teal-400 to-cyan-600', change: 'Industry avg: 65%' }
          ].map((stat, index) => (
            <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 hover:border-gray-700/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center text-xl`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 hover:border-green-400/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Find New Jobs</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Discover opportunities that match your skills and preferences</p>
            <button 
              onClick={() => setActiveTab('jobs')}
              className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-2"
            >
              Browse Jobs
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
              </svg>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 hover:border-purple-400/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Practice Interview</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Prepare for upcoming interviews with AI-powered mock sessions</p>
            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-2">
              Start Practice
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
              </svg>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 hover:border-blue-400/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Update Resume</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Keep your resume current with latest experiences and skills</p>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2">
              Edit Resume
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Applications</h3>
              <button 
                onClick={() => setActiveTab('applications')}
                className="text-green-400 hover:text-green-300 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {applications.slice(0, 4).map(app => (
                <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-gray-800/30 hover:bg-black/30 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-xl shadow-lg">
                    {app.logo || '💼'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{app.job}</h4>
                    <p className="text-gray-400 text-xs">{app.company} • {app.stage}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{app.date}</p>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <p className="text-sm">No applications yet</p>
                  <p className="text-xs mt-1">Start applying to jobs to track your progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Upcoming Interviews</h3>
              <button 
                onClick={() => setActiveTab('interviews')}
                className="text-green-400 hover:text-green-300 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {interviews.filter(i => i.status === 'scheduled').map(interview => (
                <div key={interview.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-gray-800/30 hover:bg-black/30 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-xl shadow-lg">
                    {interview.logo || '📅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{interview.role}</h4>
                    <p className="text-gray-400 text-xs">{interview.company} • {interview.interviewer}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getInterviewTypeColor(interview.type)}`}>
                      {interview.type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{interview.date} at {interview.time}</p>
                  </div>
                </div>
              ))}
              {interviews.filter(i => i.status === 'scheduled').length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2"/>
                  </svg>
                  <p className="text-sm">No upcoming interviews</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-gray-800/30">
                <div className="w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center text-lg">
                  {activity.icon || '📝'}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.message}</p>
                  <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'applications') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Applications</h2>
            <p className="text-gray-400 mt-1">Track and manage your job applications</p>
          </div>
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-green-400 border border-gray-700 hover:border-green-400/50 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Overview
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            {applicationsData.map(app => (
              <div 
                key={app.id}
                className={`p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border cursor-pointer transition-all hover:shadow-xl ${
                  selectedApplication?.id === app.id 
                    ? 'border-green-400 ring-2 ring-green-400/20' 
                    : 'border-gray-800/50 hover:border-gray-700'
                }`}
                onClick={() => setSelectedApplication(app)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-2xl shadow-lg">
                    {app.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{app.job}</h3>
                        <p className="text-green-400 font-semibold">{app.company}</p>
                        <p className="text-gray-400 text-sm mt-1">{app.stage}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">Applied: {app.date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-green-400 font-semibold">{app.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-teal-400 h-2 rounded-full transition-all"
                      style={{ width: `${app.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-semibold">{app.salary}</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-xs bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700 rounded-lg transition-all">
                      View Details
                    </button>
                    <button className="px-4 py-2 text-xs bg-green-400 hover:bg-green-500 text-black font-semibold rounded-lg transition-all">
                      Follow Up
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="xl:col-span-1">
            {selectedApplication ? (
              <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-6 sticky top-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-3xl shadow-lg">
                    {selectedApplication.logo}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{selectedApplication.job}</h3>
                    <p className="text-green-400 font-semibold">{selectedApplication.company}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <p className="text-xs text-gray-500 font-medium">Current Stage</p>
                    <p className="text-sm text-gray-200">{selectedApplication.stage}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <p className="text-xs text-gray-500 font-medium">Salary Range</p>
                    <p className="text-sm text-green-400 font-semibold">{selectedApplication.salary}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <p className="text-xs text-gray-500 font-medium">Applied Date</p>
                    <p className="text-sm text-gray-200">{selectedApplication.date}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <p className="text-xs text-gray-500 font-medium">Progress</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-teal-400 h-2 rounded-full"
                          style={{ width: `${selectedApplication.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-green-400 font-semibold">{selectedApplication.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-green-400 to-teal-400 text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-400/25">
                    Send Follow Up
                  </button>
                  <button className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700 font-medium py-3 px-4 rounded-xl transition-all">
                    View Job Details
                  </button>
                  <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-medium py-3 px-4 rounded-xl transition-all">
                    Practice Interview
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-2xl p-8 text-center sticky top-6">
                <div className="text-gray-500 mb-6">
                  <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Select an Application</h3>
                <p className="text-gray-400 text-sm">Click on any application to view details and manage your progress</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'interviews') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Interview Schedule</h2>
            <p className="text-gray-400 mt-1">Manage your upcoming and past interviews</p>
          </div>
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-green-400 border border-gray-700 hover:border-green-400/50 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Overview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Upcoming Interviews</h3>
            {interviewData.filter(i => i.status === 'scheduled').map(interview => (
              <div key={interview.id} className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 hover:border-gray-700 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-2xl shadow-lg">
                    {interview.logo}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-1">{interview.role}</h4>
                    <p className="text-green-400 font-semibold">{interview.company}</p>
                    <p className="text-gray-400 text-sm mt-1">with {interview.interviewer}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getInterviewTypeColor(interview.type)}`}>
                    {interview.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <p className="text-xs text-gray-500 font-medium">Date</p>
                    <p className="text-sm text-gray-200">{interview.date}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-gray-800/30">
                    <p className="text-xs text-gray-500 font-medium">Time</p>
                    <p className="text-sm text-gray-200">{interview.time}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-green-400 hover:bg-green-500 text-black font-semibold py-2 px-4 rounded-lg transition-all text-sm">
                    Join Interview
                  </button>
                  <button className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-medium py-2 px-4 rounded-lg transition-all text-sm">
                    Practice
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Completed Interviews</h3>
            {interviewData.filter(i => i.status === 'completed').map(interview => (
              <div key={interview.id} className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 opacity-75">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-2xl shadow-lg">
                    {interview.logo}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-1">{interview.role}</h4>
                    <p className="text-green-400 font-semibold">{interview.company}</p>
                    <p className="text-gray-400 text-sm mt-1">with {interview.interviewer}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getInterviewTypeColor(interview.type)}`}>
                      {interview.type}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">Completed</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700 font-medium py-2 px-4 rounded-lg transition-all text-sm">
                    View Feedback
                  </button>
                  <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-medium py-2 px-4 rounded-lg transition-all text-sm">
                    Follow Up
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardView;