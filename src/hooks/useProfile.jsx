import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../apiConfig';

// ─── Context ──────────────────────────────────────────────────────────────────
const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const user            = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.uid) { setLoading(false); return; }
    try {
      const res  = await fetch(`${API_URL}/api/user/${user.uid}`);
      const data = await res.json();
      if (res.ok) setProfile(data.user);
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
