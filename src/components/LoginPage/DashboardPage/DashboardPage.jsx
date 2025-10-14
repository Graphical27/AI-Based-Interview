import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import DashboardCard from './DashboardCard'; // Reusable component for job cards
import { api } from '../../../services/api';

const DashboardPage = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleStartInterview = () => {
    navigate('/interview');
  };

  const [summary, setSummary] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.dashboardSummary();
        if (mounted) {
          setSummary(data);
          setJobs(data.recommendedJobs || []);
        }
      } catch (e) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="dashboard-layout"><main className="dashboard-main-content"><p>Loading...</p></main></div>;
  if (error) return <div className="dashboard-layout"><main className="dashboard-main-content"><p>{error}</p></main></div>;

  return (
    <div className="dashboard-layout">
      {/* Sidebar - Enhanced with better icons */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><a href="#" className="active">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1c.55 0 .85-.68.53-1.08l-8.5-8.52c-.3-.3-.78-.3-1.08 0L2.47 11.92C2.15 12.32 2.45 13 3 13zM12 4.5L18.5 11H5.5L12 4.5z"/>
                <circle cx="12" cy="16" r="2"/>
              </svg> 
              Dashboard</a>
            </li>
            <li>
              <button onClick={handleStartInterview} className="sidebar-interview-btn">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                  <circle cx="12" cy="9" r="2"/>
                  <path d="M7 17H17V15H7V17Z"/>
                </svg>
                AI Interview
              </button>
            </li>
            <li><a href="#">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6h-2.18C17.4 4.84 16.3 4 15 4H9c-1.3 0-2.4.84-2.82 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c.83 0 1.5.67 1.5 1.5 0 .83-.67 1.5-1.5 1.5-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5zM9 9c.83 0 1.5.67 1.5 1.5 0 .83-.67 1.5-1.5 1.5-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5z"/>
                <path d="M12 15c-1.5 0-2.8-.8-3.5-2h7c-.7 1.2-2 2-3.5 2z"/>
              </svg>
              Jobs</a>
            </li>
            <li><a href="#">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              Applications</a>
            </li>
            <li><a href="#">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9V3H13.5L18.5 8H21ZM9 7V9H21V7H9Z"/>
                <circle cx="12" cy="15.5" r="3.5"/>
                <path d="M12 22v-4l1.5 1.5L16 17l-4-4-4 4 2.5 2.5L12 18v4z"/>
              </svg>
              Profile</a>
            </li>
            <li><a href="#">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              Settings</a>
            </li>
          </ul>
        </nav>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7L15.59 8.41 18.17 11H8V13H18.17L15.59 15.59 17 17L22 12Z"/>
            <path d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"/>
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <div>
              <h1>Welcome back{summary?.userName ? `, ${summary.userName}` : ''}!</h1>
              <p className="header-subtitle">Here's what's happening with your job search today</p>
            </div>
            <div className="header-actions">
              <button className="notification-btn">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"/>
                </svg>
                <span className="notification-badge">3</span>
              </button>
              <div className="user-avatar">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Top Stat Cards */}
        <section className="stat-cards">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon applications">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"/>
                  <circle cx="12" cy="14" r="2"/>
                </svg>
              </div>
              <div>
                <h3>My Applications</h3>
                <p className="stat-value">{summary?.applicationsCount ?? 0}</p>
                <p className="stat-description">Active applications</p>
              </div>
            </div>
            <div className="stat-trend positive">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 6L10.5 16.5L6 12L7.5 10.5L10.5 13.5L14.5 4.5L16 6Z"/>
              </svg>
              +12% from last month
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon interviews">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                  <circle cx="12" cy="9" r="1"/>
                </svg>
              </div>
              <div>
                <h3>Interview Requests</h3>
                <p className="stat-value">{summary?.interviewRequests ?? 0}</p>
                <p className="stat-description">Pending interviews</p>
              </div>
            </div>
            <div className="stat-trend positive">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 14L12 9L17 14H7Z"/>
              </svg>
              +5 this week
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon success">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                </svg>
              </div>
              <div>
                <h3>Success Rate</h3>
                <p className="stat-value">{summary?.successRate ?? 0}%</p>
                <p className="stat-description">Interview conversion</p>
              </div>
            </div>
            <div className="stat-trend positive">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 14L12 9L17 14H7Z"/>
              </svg>
              +8% improvement
            </div>
          </div>
        </section>

        {/* AI Interview Banner */}
        <section className="ai-interview-banner">
          <div className="banner-content">
            <div className="banner-left">
              <div className="banner-icon">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                  <circle cx="12" cy="9" r="2"/>
                </svg>
              </div>
              <div className="banner-text">
                <h3>Practice with AI Interview</h3>
                <p>Get personalized interview practice with our AI-powered mock interviews</p>
                <ul className="banner-features">
                  <li>✓ Real-time voice conversation</li>
                  <li>✓ Adaptive questioning based on your responses</li>
                  <li>✓ Comprehensive feedback and analysis</li>
                </ul>
              </div>
            </div>
            <div className="banner-right">
              <button onClick={handleStartInterview} className="start-interview-btn">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5V19L19 12L8 5Z"/>
                </svg>
                Start AI Interview
              </button>
              <p className="banner-note">Takes 15-30 minutes</p>
            </div>
          </div>
        </section>

        {/* Browse Available Jobs */}
        <section className="available-jobs">
          <div className="section-header">
            <div>
              <h2>Recommended for You</h2>
              <p>Jobs matching your profile and preferences</p>
            </div>
            <button className="view-all-btn">
              View All
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6L8.59 7.41 13.17 12L8.59 16.59 10 18L16 12L10 6Z"/>
              </svg>
            </button>
          </div>

          <div className="job-cards-scroll-container">
            {/* Enhanced job cards */}
            {jobs.map(j => (
              <DashboardCard key={j._id} title={j.title} company={j.company} location={`${j.location}${j.remote ? ' • Remote' : ''}`} color="purple" salary={j.salary || ''} />
            ))}
          </div>
        </section>

        {/* Recent Activity & Quick Actions */}
        <div className="bottom-section">
          <section className="recent-activity">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <button className="view-all-btn secondary">
                View All
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6L8.59 7.41 13.17 12L8.59 16.59 10 18L16 12L10 6Z"/>
                </svg>
              </button>
            </div>
            
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon interview">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <h4>Interview Scheduled</h4>
                  <p>TechFlow Inc. • Software Engineer Role</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon application">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <h4>Application Submitted</h4>
                  <p>DataMinds Analytics • Data Scientist</p>
                  <span className="activity-time">1 day ago</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon success">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <h4>Profile Viewed</h4>
                  <p>Creative Studio • UX Designer Position</p>
                  <span className="activity-time">2 days ago</span>
                </div>
              </div>
            </div>
          </section>

          <section className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn primary">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                Create New Application
              </button>
              
              <button className="action-btn secondary">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 13C9.33 13 4 14.34 4 17V18H20V17C20 14.34 14.67 13 12 13ZM12 4C13.1 4 14 4.9 14 6S13.1 8 12 8 10 7.1 10 6 10.9 4 12 4Z"/>
                </svg>
                Update Profile
              </button>
              
              <button className="action-btn secondary">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"/>
                </svg>
                Upload Resume
              </button>
              
              <button className="action-btn secondary">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6H16L14 4H10L8 6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM20 19H4V8H20V19ZM12 18C15.31 18 18 15.31 18 12S15.31 6 12 6 6 8.69 6 12 8.69 18 12 18ZM12 8C14.21 8 16 9.79 16 12S14.21 16 12 16 8 14.21 8 12 9.79 8 12 8Z"/>
                </svg>
                Browse Companies
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;