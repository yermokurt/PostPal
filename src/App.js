// src/App.js — Main router setup for PostPal
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WallPage from './pages/WallPage';
import CreatePostPage from './pages/CreatePostPage';
import ProfilePage from './pages/ProfilePage';
import AdminModerationPage from './pages/AdminModerationPage';
import ReportsPage from './pages/ReportsPage';
import PdfReportPage from './pages/PdfReportPage';

// Protect routes that require login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-blue-500">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

// Protect routes that require admin role
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-blue-500">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Wall is public (but likes/comments require login) */}
      <Route path="/" element={<WallPage />} />

      {/* Protected routes */}
      <Route path="/create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Admin-only routes */}
      <Route path="/admin/moderation" element={<AdminRoute><AdminModerationPage /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
      <Route path="/admin/report" element={<AdminRoute><PdfReportPage /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="h-screen bg-gradient-to-br from-[#fcc2d7] via-[#b197fc] to-[#a5d8ff] text-[#2b2f5a] flex flex-col overflow-hidden relative">

            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/30 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-rose-200/20 blur-[150px] rounded-full pointer-events-none z-0" />

            <div className="relative z-50 pt-8 pb-4 px-4 flex justify-center">
              <Navbar />
            </div>

            <main className="flex-grow overflow-y-auto custom-scrollbar relative z-10 px-4 pb-20">
              <AppRoutes />
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
