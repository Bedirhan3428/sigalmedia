import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Play, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

const CATEGORIES = ['Hepsi', 'Popüler', 'Yeni', 'Takip Edilenler'];

export default function Explore() {
  const user     = useAuth();
  const navigate = useNavigate();

  const [query,      setQuery]      = useState('');
  const [category,   setCategory]   = useState('Hepsi');
  const [posts,      setPosts]       = useState([]);
  const [users,      setUsers]       = useState([]);
  const [loading,    setLoading]     = useState(true);
  const [searching,  setSearching]   = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [page,       setPage]        = useState(1);
  const [hasMore,    setHasMore]     = useState(true);
  const observerRef                  = useRef();
  const bottomRef                    = useRef();

  // Fetch explore posts
  const fetchPosts = useCallback(async (reset = false) => {
    if (!hasMore && !reset) return;
    reset ? setLoading(true) : setLoading(false);

    const pageNum = reset ? 1 : page;
    try {
      let url;
      switch (category) {
        case 'Popüler':
          url = `${API_URL}/api/feed?page=${pageNum}`;
          break;
        case 'Yeni':
          url = `${API_URL}/api/feed/new?page=${pageNum}`;
          break;
        case 'Takip Edilenler':
          url = `${API_URL}/api/feed/following/${user?.uid}`;
          break;
        default:
          // Mixed: combine popular and new with randomization
          url = `${API_URL}/api/feed?page=${pageNum}`;
      }

      const res  = await fetch(url);
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : [];

      if (reset) {
        setPosts(arr);
        setPage(2);
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p._id));
          return [...prev, ...arr.filter(p => !ids.has(p._id))];
        });
        setPage(p => p + 1);
      }
      setHasMore(arr.length >= 10);
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, [category, page, hasMore, user?.uid]);

  useEffect(() => {
    setHasMore(true);
    fetchPosts(true);
  }, [category]);

  // Infinite scroll
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        fetchPosts(false);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, hasMore, fetchPosts]);

  // User search
  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setUsers([]); return; }
    setSearching(true);
    try {
      const res  = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch { setUsers([]); }
    finally { setSearching(false); }
  };

  // Grid layout: every 7th post is double-sized
  const gridPosts = posts.filter(p => p.imageUrl || p.content);

  if (selectedPost) {
    return (
      <div className="page">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
          <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
          <span style={{ fontWeight: 600 }}>Gönderi</span>
        </div>
        <PostCard
          post={selectedPost}
          deviceId={user?.uid}
          likedTweetIds={[]}
          likedCommentIds={[]}
          followingIds={[]}
          savedTweetIds={[]}
          onDelete={() => setSelectedPost(null)}
        />
        <div className="nav-spacer" />
        <Navbar />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Search bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 99,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px 0',
      }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={16} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none',
          }} />
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Ara"
            style={{
              width: '100%', background: 'var(--surface-2)',
              border: 'none', borderRadius: 10,
              padding: '10px 16px 10px 40px',
              color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font)', outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setUsers([]); }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        {!query && (
          <div style={{ display: 'flex', gap: 8, paddingBottom: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 999,
                  background: category === cat ? 'var(--text)' : 'var(--surface-3)',
                  color: category === cat ? '#000' : 'var(--text)',
                  border: 'none', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      {query ? (
        <div>
          {searching ? (
            <div className="center-loader"><Loader2 size={20} className="spin" color="var(--text-3)" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 36 }}>🔍</div>
              <div className="empty-state-sub">"{query}" için sonuç bulunamadı</div>
            </div>
          ) : (
            users.map(u => (
              <div
                key={u.deviceId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/user/${u.deviceId}`)}
              >
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt="" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                      {(u.username || '?').charAt(0).toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div>
                  <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{u.followerCount || 0} takipçi</div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Explore grid */
        <>
          {loading ? (
            <div className="explore-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`explore-item ${i % 7 === 0 ? 'explore-item--large' : ''}`}>
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="explore-grid">
              {gridPosts.map((post, i) => (
                <div
                  key={post._id}
                  className="explore-item"
                  style={i % 7 === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}}
                  onClick={() => setSelectedPost(post)}
                >
                  {post.imageUrl ? (
                    <>
                      {post.mediaType === 'video' || post.imageUrl?.includes('/o/videos')
                        ? <>
                            <video src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                              <Play size={18} color="#fff" fill="#fff" />
                            </div>
                          </>
                        : <img src={post.imageUrl} alt="" loading="lazy" />
                      }
                    </>
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: `hsl(${(post.authorAvatar?.charCodeAt(0) || 0) * 30 % 360}, 40%, 12%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 8,
                    }}>
                      <p style={{ color: '#fff', fontSize: 11, lineHeight: 1.4, textAlign: 'center' }}>
                        {post.content?.slice(0, 60)}
                      </p>
                    </div>
                  )}

                  <div className="explore-item-overlay">
                    <div className="explore-stat">
                      <span>❤️</span> {post.likes || 0}
                    </div>
                    <div className="explore-stat">
                      <span>💬</span> {post.commentCount || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={bottomRef} style={{ height: 40 }} />
          {!loading && !hasMore && posts.length > 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)', fontSize: 13 }}>
              Hepsi bu kadar! 🎉
            </div>
          )}
        </>
      )}

      <div className="nav-spacer" />
      <Navbar />
    </div>
  );
}
