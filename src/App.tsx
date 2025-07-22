import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import CompleteProfile from './components/CompleteProfile';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import FeedbackForm from './components/FeedbackForm';
import Layout from './components/Layout';
import TeamCreatePage from './components/TeamCreatePage';
import TeamListPage from './components/TeamListPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/complete-profile" element={<ProtectedRoute requireProfileComplete={false}><CompleteProfile /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Layout><Calendar /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><Layout><AIInsights /></Layout></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><Layout><TeamListPage /></Layout></ProtectedRoute>} />
            <Route path="/teams/create" element={<ProtectedRoute><Layout><TeamCreatePage /></Layout></ProtectedRoute>} />
            {/* Placeholder for edit route */}
            <Route path="/teams/edit/:id" element={<ProtectedRoute><Layout><div>Edit Team Page (Coming Soon)</div></Layout></ProtectedRoute>} />
            <Route path="/feedback/:meetingId" element={<FeedbackForm />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute({ children, requireProfileComplete = true }: { children: React.ReactNode, requireProfileComplete?: boolean }) {
  const { user, profileComplete, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (
    requireProfileComplete &&
    !profileComplete &&
    location.pathname !== '/profile'
  ) {
    return <Navigate to="/profile" replace state={{ showCompletePrompt: true }} />;
  }
  return <>{children}</>;
}

export default App;