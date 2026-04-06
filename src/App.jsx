import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './hooks/useProfile.jsx';
import { UIProvider } from './context/UIContext';
import { StoryProvider } from './context/StoryContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Login, Register } from './pages/Auth';
import Feed       from './pages/Feed';
import Explore    from './pages/Explore';
import Share      from './pages/Share';
import Reels      from './pages/Reels';
import Profile    from './pages/Profile';
import Messages   from './pages/Messages';
import ChatPage   from './pages/ChatPage';
import PostDetail from './pages/PostDetail';
import MainLayout      from './components/MainLayout';
import AdminDashboard from './pages/AdminDashboard';
import Home           from './pages/Home';
import SafetyPage     from './pages/SafetyPage';
import PrivacyPolicy  from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Kvkk           from './pages/Kvkk';
import VerifyEmail    from './pages/VerifyEmail';
import VerifyHandler  from './pages/VerifyHandler';

function Wrap({ children }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <StoryProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </StoryProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <Wrap>
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main app — protected */}
          <Route element={<Protected><MainLayout /></Protected>}>
            <Route path="/"        element={<Feed />} />
            <Route path="/feed"    element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/reels"   element={<Reels />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:uid" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:partnerUid" element={<ChatPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/post-detail" element={<PostDetail />} />
          </Route>

          {/* Public info pages */}
          <Route path="/safety"           element={<SafetyPage />} />
          <Route path="/privacy-policy"   element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/kvkk"             element={<Kvkk />} />
          <Route path="/verify-email"     element={<VerifyEmail />} />
          <Route path="/verify-email/action" element={<VerifyHandler />} />

          {/* Legacy redirects */}
          <Route path="/vitrin" element={<Navigate to="/" replace />} />
          <Route path="*"       element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Wrap>
  );
}
