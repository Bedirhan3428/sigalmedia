import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const user = useAuth();

  if (user === undefined) {
    return (
      <div style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', backgroundColor: '#09090b' 
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}