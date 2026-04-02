import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, PlusSquare, Clapperboard } from 'lucide-react';

// Simple hook to get profile avatar from context
import { useProfile } from '../hooks/useProfile.jsx';
import { useUI }      from '../context/UIContext';

export default function Navbar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = useAuth();
  const { profile } = useProfile();
  const { openShare } = useUI();

  const path = location.pathname;

  const tabs = [
    { id: 'home',     path: '/',          icon: <Home size={26} strokeWidth={path === '/' ? 2.5 : 1.8} />,                 label: 'Ana Sayfa' },
    { id: 'explore',  path: '/explore',   icon: <Search size={26} strokeWidth={path === '/explore' ? 2.5 : 1.8} />,        label: 'Keşfet' },
    { id: 'share',    path: null,         icon: null,                                                                       label: 'Paylaş' },
    { id: 'reels',    path: '/reels',     icon: <Clapperboard size={26} strokeWidth={path === '/reels' ? 2.5 : 1.8} />,   label: 'Reels' },
    { id: 'profile',  path: '/profile',   icon: null,                                                                       label: 'Profil' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const isActive = tab.path ? path === tab.path : false;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'share') {
                openShare();
                return;
              }
              
              // DÜZELTME: Sayfayı yenilemek (reload) yerine, en üste kaydırıyoruz
              if (isActive) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(tab.path);
              }
            }}
            className={`nav-tab ${isActive ? 'nav-tab--active' : ''}`}
            aria-label={tab.label}
          >
            {tab.id === 'share' ? (
              /* Plus / Create button */
              <div className="nav-create-btn">
                <PlusSquare size={20} strokeWidth={2.5} />
              </div>
            ) : tab.id === 'profile' ? (
              /* Profile avatar or letter */
              profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profil"
                  className="nav-profile-img"
                  style={{ borderColor: isActive ? '#fff' : 'transparent' }}
                />
              ) : (
                <div className="nav-tab-letter" style={{ borderColor: isActive ? '#fff' : 'transparent' }}>
                  {(profile?.username || user?.email || '?').charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              tab.icon
            )}
          </button>
        );
      })}
    </nav>
  );
}