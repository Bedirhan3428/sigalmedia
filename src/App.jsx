import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Share from './pages/Share';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import KVKK from './pages/Kvkk';
import InstallBanner from './components/InstallBanner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute><Feed /></ProtectedRoute>
          } />
          <Route path="/share" element={
            <ProtectedRoute><Share /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/verify-email" element={
            <ProtectedRoute><VerifyEmail /></ProtectedRoute>
          } />

          <Route path="/install" element={<InstallBanner />} />

          {/* Legal pages */}
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/kvkk" element={<KVKK />} />



          {/* Legacy redirect */}
          <Route path="/vitrin" element={<Navigate to="/" replace />} />
        </Routes>

          <footer style={{
  marginTop: '32px',
  paddingTop: '16px',
  borderTop: '1px solid #27272a',
  fontSize: '12px',
  color: '#3f3f46',
  textAlign: 'center',
}}>
         © 2026 Şigal Medya. Tüm hakları saklıdır.
        </footer>

      </Router>
    </AuthProvider>
  );
}


