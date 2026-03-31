import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Share from '../pages/Share';
import { useUI } from '../context/UIContext';

export default function MainLayout() {
  const { isShareOpen, closeShare } = useUI();

  return (
    <div className="main-layout" style={{ position: 'relative', minHeight: '100dvh' }}>
      {/* Dynamic Content */}
      <div className="content-area">
        <Outlet />
      </div>

      {/* Global Navbar */}
      <div className="nav-container" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Navbar />
      </div>

      {/* Share Modal Overlay */}
      {isShareOpen && (
        <Share onClose={closeShare} />
      )}
    </div>
  );
}
