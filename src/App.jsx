import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage/loginPage.jsx';
import SignupPage from './components/LoginPage/SignupPage.jsx';
import PortalLayout from './components/portal/PortalLayout.jsx';
import RecruiterPage from './components/RecruiterPage/RecruiterPage.jsx';
import InterviewPage from './components/InterviewPage/InterviewPage.jsx';
import { api } from './services/api.js';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await api.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                (user?.role === 'recruiter' ? 
                  <Navigate to="/recruiter" replace /> : 
                  <Navigate to="/portal" replace />
                ) : 
                <LoginPage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? 
                (user?.role === 'recruiter' ? 
                  <Navigate to="/recruiter" replace /> : 
                  <Navigate to="/portal" replace />
                ) : 
                <SignupPage onSignup={handleLogin} />
            } 
          />
          <Route 
            path="/portal" 
            element={
              isAuthenticated && user?.role !== 'recruiter' ? 
                <PortalLayout onLogout={handleLogout} user={user} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/recruiter" 
            element={
              isAuthenticated && user?.role === 'recruiter' ? 
                <RecruiterPage onLogout={handleLogout} user={user} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/interview" 
            element={
              isAuthenticated ? 
                <InterviewPage /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;