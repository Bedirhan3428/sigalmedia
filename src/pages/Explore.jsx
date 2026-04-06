import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Play, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { API_URL } from '../apiConfig';

const CATEGORIES = ['Hepsi', 'Popüler', 'Yeni', 'Takip Edilenler'];

export default function Explore() {
  const user     = useAuth();
  const navigate = useNavigate();

  const [query,      setQuery]      = useState('');
  const [category,   setCategory]   = useState('Hepsi');
  const [posts,      setPosts]      = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searching,  setSearching]  = useState(false);
  
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const bottomRef                   = useRef();

  // Gönderileri 6'lı bloklara tam uyması için 18'er (3 blok) çekiyoruz
 const FETCH_LIMIT = 18;

  // Fetch explore posts
  const fetchPosts = useCallback(async (reset = false) => {
    if (!hasMore && !reset) return;
    reset ? setLoading(true) : setLoading(false);

    const pageNum = reset ? 1 : page;
    try {
      let url;
      switch (category) {
        case 'Popüler':
          url = `${API_URL}/api/feed?page=${pageNum}&limit=${FETCH_LIMIT}`;
          break;
        case 'Yeni':
          url = `${API_URL}/api/feed/new?page=${pageNum}&limit=${FETCH_LIMIT}`;
          break;
        case 'Takip Edilenler':
          url = `${API_URL}/api/feed/following/${user?.uid}?page=${pageNum}&limit=${FETCH_LIMIT}`;
          break;
        default:
          url = `${API_URL}/api/feed?page=${pageNum}&limit=${FETCH_LIMIT}`;
      }

      const res  = await fetch(url);
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : [];

      if (reset) {
        setPosts(arr);
        setPage(2);
        // Eğer en az 1 tane post geldiyse devam etmeye hakkı olsun
        setHasMore(arr.length > 0); 
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p._id));
          const newPosts = arr.filter(p => !ids.has(p._id));
          
          // Eğer çekilen yeni postların hepsi zaten ekrandaysa veya hiç gelmediyse döngüyü kes
          if (newPosts.length === 0) {
            setHasMore(false);
            return prev;
          }
          return [...prev, ...newPosts];
        });
        
        setPage(p => p + 1);
        // Gelen veri 0'dan büyükse diğer sayfalarda da bir şeyler olma ihtimaline karşı true yap
        setHasMore(arr.length > 0);
      }
    } catch { 
      setHasMore(false); 
    } finally { 
      setLoading(false); 
    }
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
  }, [loading, hasMore, fetchPosts, selectedPostId]); 

  // Seçili posta kaydırma
  useEffect(() => {
    if (selectedPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${selectedPostId}`);
        if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedPostId]);

  // Kullanıcı Arama
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

  const gridPosts = posts.filter(p => p.imageUrl || p.content);

  // ─── DETAY / AKIŞ GÖRÜNÜMÜ ────────────────────────────────────────────────
  if (selectedPostId) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: '12px 16px', borderBottom: '1px solid var(--border)', 
          display: 'flex', alignItems: 'center', gap: 16, 
          position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 99 
        }}>
          <button onClick={() => setSelectedPostId(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Keşfet</span>
        </div>

        <div style={{ flex: 1 }}>
          {posts.map((post) => (
            <div key={post._id} id={`post-${post._id}`} style={{ scrollMarginTop: '55px' }}>
              <PostCard post={post} deviceId={user?.uid} likedTweetIds={[]} likedCommentIds={[]} followingIds={[]} savedTweetIds={[]} />
            </div>
          ))}
          <div ref={bottomRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading && <Loader2 size={24} className="spin" color="#737373" />}
            {!loading && !hasMore && <span style={{ color: '#737373', fontSize: 13 }}>Tüm gönderileri gördün 🎉</span>}
          </div>
        </div>
      </div>
    );
  }

  // ─── GRID (KEŞFET) GÖRÜNÜMÜ ───────────────────────────────────────────────
  return (
    <div className="page">
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
        <>
          {loading && posts.length === 0 ? (
            <div className="explore-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`explore-item ${i % 6 === 0 ? 'explore-item--large' : ''}`}>
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
                  /* EĞER İNDEX 6'YA TAM BÖLÜNÜYORSA (Her bloğun ilk elemanıysa) BÜYÜK KART YAP */
                  style={i % 6 === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}}
                  onClick={() => setSelectedPostId(post._id)}
                >
                  {post.imageUrl ? (
                    <>
                      {post.mediaType === 'video' || post.imageUrl?.includes('/o/videos')
                        ? <>
                            <video src={`${post.imageUrl}#t=0.1`} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} muted playsInline />
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                              <Play size={18} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
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

          <div ref={bottomRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {loading && posts.length > 0 && <Loader2 size={24} className="spin" color="#737373" />}
          </div>
          {!loading && !hasMore && posts.length > 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)', fontSize: 13 }}>
              Hepsi bu kadar! 🎉
            </div>
          )}
        </>
      )}
    </div>
  );
}