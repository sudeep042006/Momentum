import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import Tasks from './pages/Tasks';
import Today from './pages/Today';
import Schedule from './pages/Schedule';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/today" element={<Today />} />
        <Route path="/dashboard/calendar" element={<PlaceholderPage title="Calendar" />} />
        <Route path="/dashboard/tasks" element={<Tasks />} />
        <Route path="/dashboard/schedule" element={<Schedule />} />
        <Route path="/dashboard/journal" element={<PlaceholderPage title="Journal" />} />
        <Route path="/dashboard/analytics" element={<PlaceholderPage title="Analytics & Progress" />} />
        <Route path="/dashboard/settings" element={<PlaceholderPage title="Settings" />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
