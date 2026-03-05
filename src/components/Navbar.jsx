import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/',        icon: Home,       label: 'Ana Sayfa' },
    { path: '/share',   icon: PlusSquare, label: 'Paylaş'   },
    { path: '/profile', icon: User,       label: 'Profil'   },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`nav-btn ${active ? 'nav-btn--active' : ''}`}
            aria-label={label}
          >
            {path === '/share' ? (
              <div className="nav-plus">
                <Icon size={22} strokeWidth={2.5} />
              </div>
            ) : (
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            )}
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}