import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Send, PaperclipIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import StoriesBar from '../components/Stories';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';
import { useProfile } from '../hooks/useProfile.jsx';
import { subscribeToUnreadCount } from '../utils/rtdb';

// ── Logo SVG ──────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="ig-logo">
      <span>Şigal</span> Medya
    </div>
  );
}

// ── Skeleton post ─────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="post-card post-skeleton">
      <div className="post-header">
        <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
        <div style={{ flex: 1, marginLeft: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ height: 12, width: '30%' }} />
          <div className="skeleton" style={{ height: 10, width: '20%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 0 }} />
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '25%' }} />
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
        <div className="skeleton" style={{ height: 10, width: '40%' }} />
      </div>
    </div>
  );
}

// ── Unverified banner ─────────────────────────────────────────────────────────
function UnverifiedBanner({ onResend }) {
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handle = async () => {
    setSending(true);
    await onResend();
    setSent(true);
    setSending(false);
  };

  return (
    <div className="verify-banner">
      <span style={{ flex: 1 }}>
        {sent ? '✅ Doğrulama maili gönderildi!' : 'Mailini doğrula — gönderi ve beğeni için gerekli.'}
      </span>
      {!sent && (
        <button className="verify-btn" onClick={handle} disabled={sending}>
          {sending ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      )}
    </div>
  );
}

// ── Main Feed ─────────────────────────────────────────────────────────────────
export default function Feed() {
  const user     = useAuth();
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [tab,          setTab]          = useState('vitrin');
  const [posts,        setPosts]        = useState([]);
  const [likedIds,     setLikedIds]     = useState([]);
  const [likedCmtIds,  setLikedCmtIds]  = useState([]);
  const [savedIds,     setSavedIds]     = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const isVerified = user?.emailVerified;

  // Unread messages count
  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToUnreadCount(user.uid, setUnreadCount);
  }, [user]);

  // Load liked IDs + following IDs + saved IDs
  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/following-ids/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/saved-ids/${user.uid}`).then(r => r.json()),
    ]).then(([likeData, followData, saveData]) => {
      setLikedIds(likeData.tweetIds     || []);
      setLikedCmtIds(likeData.commentIds || []);
      setFollowingIds(followData.followingIds || []);
      setSavedIds(saveData.savedIds || []);
    }).catch(() => {});
  }, [user]);

  // Fetch posts
  const fetchPosts = useCallback(async (refresh = false) => {
    if (!user?.uid) return;
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const urls = {
        vitrin:    `${API_URL}/api/feed`,
        new:       `${API_URL}/api/feed/new`,
        following: `${API_URL}/api/feed/following/${user.uid}`,
      };
      const res  = await fetch(urls[tab]);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch { setPosts([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tab, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleResendVerification = async () => {
    try {
      await fetch(`${API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid, email: user?.email }),
      });
    } catch {}
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="ig-header">
        <Logo />
        <div className="ig-header-actions">
          <button className="ig-icon-btn" style={{ position: 'relative' }} onClick={() => navigate('/messages')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, background: 'var(--red)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
            )}
          </button>
        </div>
      </header>

      {/* Unverified banner */}
      {!isVerified && (
        <UnverifiedBanner onResend={handleResendVerification} />
      )}

      {/* Feed tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 52, zIndex: 99,
      }}>
        {[
          { id: 'vitrin',    label: 'Keşfet 🔥' },
          { id: 'new',       label: 'Yeni ✨' },
          { id: 'following', label: 'Takip 👥' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? 'var(--text)' : 'transparent'}`,
              color: tab === t.id ? 'var(--text)' : 'var(--text-3)',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stories */}
      <StoriesBar followingIds={followingIds} />

      {/* Posts */}
      <main>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
          : posts.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  {tab === 'following' ? '👥' : '📸'}
                </div>
                <div className="empty-state-title">
                  {tab === 'following' ? 'Henüz gönderi yok' : 'İlk sen paylaş!'}
                </div>
                <div className="empty-state-sub">
                  {tab === 'following'
                    ? 'Takip ettiğin kişilerin gönderileri burada görünür.'
                    : 'Şigal Medya\'ya hoş geldin. İlk gönderiyi paylaşarak başla.'}
                </div>
              </div>
            )
            : posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  deviceId={user?.uid}
                  likedTweetIds={likedIds}
                  likedCommentIds={likedCmtIds}
                  followingIds={followingIds}
                  savedTweetIds={savedIds}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
                  onFollowChange={(tid, isNow) => setFollowingIds(prev =>
                    isNow ? [...prev, tid] : prev.filter(x => x !== tid)
                  )}
                  onSaveChange={(id, isSaved) => setSavedIds(prev =>
                    isSaved ? [...prev, id] : prev.filter(x => x !== id)
                  )}
                />
              ))
        }
      </main>

      <div className="nav-spacer" />
      <Navbar />
    </div>
  );
}
