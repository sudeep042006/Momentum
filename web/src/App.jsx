import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserProvider } from './context/UserContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Journal from './pages/Journal';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import RecentHistory from './pages/RecentHistory';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/dashboard/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/dashboard/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/dashboard/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />

        <Route path="/dashboard/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard/history" element={<ProtectedRoute><RecentHistory /></ProtectedRoute>} />
        
        {/* Public Shareable Profile Route */}
        <Route path="/u/:username" element={<UserProfile />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </UserProvider>
  );
}

export default App;
