import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Share from './pages/Share';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import KVKK from './pages/Kvkk';
import TermsOfService from './pages/TermsOfService'; // Yeni import
import InstallBanner from './components/InstallBanner';
import VerifyEmail from './pages/VerifyEmail';
import SafetyPage     from './pages/SafetyPage';
import AdminDashboard from './pages/AdminDashboard';
import VerifyHandler   from './pages/VerifyHandler';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Aegis & Admin */}
          <Route path="/admin" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />

          {/* Herkese açık bilgi sayfaları */}
          <Route path="/safety"           element={<SafetyPage />} />
          <Route path="/privacy-policy"   element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} /> {/* Yeni Route */}
          <Route path="/kvkk"             element={<KVKK />} />
          <Route path="/install"          element={<InstallBanner />} />
          <Route path="/verify-email"     element={<VerifyEmail />} />
          <Route path="/verify-email/action" element={<VerifyHandler />} />
          
          {/* Legacy */}
          <Route path="/vitrin" element={<Navigate to="/" replace />} />
        </Routes>

        <footer style={{
          marginTop:   '32px',
          paddingTop:  '16px',
          borderTop:   '1px solid #27272a',
          fontSize:    '12px',
          color:       '#3f3f46',
          textAlign:   'center',
        }}>
          © 2026 Şigal Medya. Tüm hakları saklıdır.
        </footer>
      </Router>
    </AuthProvider>
  );
}
