import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Send, Volume2, VolumeX, Play, X, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

// ─── Yorum Paneli ─────────────────────────────────────────────────────────────
function CommentPanel({ tweetId, deviceId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/comments/${tweetId}`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tweetId]);

  const handleSend = async () => {
    if (!text.trim() || sending || !deviceId) return;
    setSending(true);
    try {
      const res  = await fetch(`${API_URL}/api/comment/${tweetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, content: text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments(prev => [...prev, data.comment]);
        setText('');
        // Aşağı kaydır
        setTimeout(() => listRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100);
      }
    } catch {}
    finally { setSending(false); }
  };

  function timeAgo(date) {
    if (!date) return '';
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)    return 'şimdi';
    if (diff < 3600)  return `${Math.floor(diff / 60)}dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
    return `${Math.floor(diff / 86400)}g`;
  }

  return (
    <>
      {/* Backdrop — sadece panel dışı */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 50 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '55%',          // Ekranın yarısından az
        background: '#1C1C1C',
        borderRadius: '16px 16px 0 0',
        border: '1px solid #262626',
        borderBottom: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 51,
        overflow: 'hidden',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#363636', margin: '12px auto 4px', flexShrink: 0 }} />

        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px', borderBottom: '1px solid #262626', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#F5F5F5' }}>Yorumlar</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#A8A8A8', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Yorum listesi */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={20} className="spin" color="#737373" />
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#737373', fontSize: 14 }}>
              Henüz yorum yok. İlk yorumu sen yap!
            </div>
          ) : comments.map(c => (
            <div key={c._id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#363636', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>
                {c.authorAvatarUrl
                  ? <img src={c.authorAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (c.authorAvatar?.charAt(0)?.toUpperCase() || '?')
                }
              </div>
              {/* İçerik */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#F5F5F5' }}>{c.authorAvatar}</span>
                  <span style={{ fontSize: 13, color: '#E0E0E0', lineHeight: 1.45 }}>{c.content}</span>
                </div>
                <span style={{ fontSize: 11, color: '#737373', marginTop: 3, display: 'block' }}>{timeAgo(c.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid #262626', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, background: '#1C1C1C' }}>
          <input
            value={text}
            onChange={e => setText(e.target.value.slice(0, 280))}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Yorum ekle..."
            style={{
              flex: 1, background: '#262626', border: '1px solid #363636',
              borderRadius: 20, padding: '9px 16px',
              color: '#F5F5F5', fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !deviceId}
            style={{
              background: 'none', border: 'none', padding: '6px',
              color: text.trim() && deviceId ? '#0095F6' : '#363636',
              cursor: text.trim() && deviceId ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {sending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Tek Reel Kartı ───────────────────────────────────────────────────────────
function ReelCard({ post, isActive, isRendered, deviceId, likedTweetIds }) {
  const navigate  = useNavigate();
  const videoRef  = useRef(null);
  const lastTap   = useRef(0);

  const initLiked = likedTweetIds.includes(post._id?.toString());
  const [liked,        setLiked]        = useState(initLiked);
  const [likes,        setLikes]        = useState(post.likes || 0);
  const [muted,        setMuted]        = useState(true);
  const [playing,      setPlaying]      = useState(false);
  const [paused,       setPaused]       = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [heartAnim,    setHeartAnim]    = useState(false);
  const [heartPos,     setHeartPos]     = useState({ x: '50%', y: '50%' });

  const isVideo = post.mediaType === 'video' || post.imageUrl?.includes('/o/videos');

  // Auto-play/pause
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      vid.play().then(() => { setPlaying(true); setPaused(false); }).catch(() => {});
    } else {
      vid.pause();
      vid.currentTime = 0;
      setPlaying(false); setPaused(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true);  setPaused(false); }
    else            { vid.pause(); setPlaying(false); setPaused(true); }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!deviceId) return;
    const now = !liked;
    setLiked(now);
    setLikes(l => now ? l + 1 : Math.max(0, l - 1));
    try {
      await fetch(`${API_URL}/api/like/${post._id}`, {
        method: now ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}
  };

  // Tap → oynat/durdur + çift tıklama kalp
  const handleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Çift tıklama: kalp animasyonu + beğen
      if (e?.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
        const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
        setHeartPos({ x, y });
      }
      setHeartAnim(false);
      requestAnimationFrame(() => {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 800);
      });
      if (!liked && deviceId) {
        setLiked(true);
        setLikes(l => l + 1);
        fetch(`${API_URL}/api/like/${post._id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId }),
        }).catch(() => {});
      }
    } else {
      // Tek tıklama: oynat/durdur
      if (isVideo) togglePlay();
    }
    lastTap.current = now;
  };

  const bgHue = (post.authorAvatar?.charCodeAt(0) || 0) * 37 % 360;
  const navbarH = 52;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>

      {/* ── Media ─────────────────────────────────────────────────────────── */}
      <div
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
        onClick={handleTap}
      >
        {/* Yalnızca shouldRenderMedia (isRendered) true ise videoyu veya resmi DOM'a ekle */}
        {isRendered ? (
          isVideo && post.imageUrl ? (
            <video
              ref={videoRef}
              src={post.imageUrl}
              loop muted={muted} playsInline
              autoPlay={isActive}
              preload={isActive ? 'auto' : 'metadata'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : post.imageUrl ? (
            <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, hsl(${bgHue},40%,10%), hsl(${bgHue+30},50%,16%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 600, lineHeight: 1.55, textAlign: 'center', maxWidth: 340 }}>{post.content}</p>
            </div>
          )
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#000' }} />
        )}

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 45%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Pause indicator */}
        {paused && isVideo && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={32} color="#fff" fill="#fff" />
            </div>
          </div>
        )}

        {/* ✦ Çift-tıklama kalp animasyonu */}
        {heartAnim && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
            <span style={{
              position: 'absolute',
              top: heartPos.y,
              left: heartPos.x,
              fontSize: 90,
              lineHeight: 1,
              animation: 'heartPop 0.75s ease-out forwards',
              filter: 'drop-shadow(0 4px 16px rgba(255,48,63,0.5))',
              pointerEvents: 'none',
              userSelect: 'none',
            }}>❤️</span>
          </div>
        )}
      </div>

      {/* ── Sağ sidebar ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', right: 12, bottom: navbarH + 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, zIndex: 10,
      }}>
        {/* Avatar */}
        <div onClick={() => navigate(`/user/${post.authorId}`)}
             style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', background: '#1C1C1C', cursor: 'pointer' }}>
          {post.authorAvatarUrl
            ? <img src={post.authorAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff' }}>{(post.authorAvatar || '?').charAt(0).toUpperCase()}</div>
          }
        </div>

        {/* Like */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Heart size={30} fill={liked ? '#FF3040' : 'none'} color={liked ? '#FF3040' : '#fff'} strokeWidth={liked ? 0 : 2}
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))', transition: 'transform 0.15s', transform: liked ? 'scale(1.15)' : 'scale(1)' }} />
          </button>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
            {likes > 999 ? `${(likes/1000).toFixed(1)}B` : likes}
          </span>
        </div>

        {/* Comment */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <MessageCircle size={30} color="#fff" strokeWidth={1.8}
                           style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
          </button>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
            {post.commentCount || 0}
          </span>
        </div>

        {/* Share */}
        <button onClick={(e) => {
          e.stopPropagation();
          const url = `https://sigalmedia.site/post-detail?id=${post._id}`;
          navigator.share?.({ url }).catch(() => navigator.clipboard?.writeText(url));
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Send size={28} color="#fff" strokeWidth={1.8}
                style={{ transform: 'rotate(10deg)', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
        </button>

        {/* Mute */}
        {isVideo && (
          <button onClick={(e) => {
            e.stopPropagation();
            const nm = !muted;
            setMuted(nm);
            if (videoRef.current) videoRef.current.muted = nm;
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {muted ? <VolumeX size={26} color="#fff" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
                   : <Volume2 size={26} color="#fff" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />}
          </button>
        )}
      </div>

      {/* ── Alt bilgi ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 14, bottom: navbarH + 24, right: 72, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <span onClick={() => navigate(`/user/${post.authorId}`)}
              style={{ fontWeight: 700, fontSize: 15, color: '#fff', cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
          @{post.authorAvatar}
        </span>
        {post.content && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.45, margin: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
            {post.content.length > 100 ? post.content.slice(0, 100) + '…' : post.content}
          </p>
        )}
      </div>

      {/* ── Yorum Paneli ──────────────────────────────────────────────────── */}
      {showComments && (
        <CommentPanel
          tweetId={post._id}
          deviceId={deviceId}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

// ─── Ana Reels Sayfası ────────────────────────────────────────────────────────
export default function Reels() {
  const user          = useAuth();
  const [posts,       setPosts]       = useState([]);
  const [likedIds,    setLikedIds]    = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const scrollRef                     = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/feed`).then(r => r.json()),
      user?.uid ? fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()) : Promise.resolve({ tweetIds: [] }),
    ]).then(([feedData, likeData]) => {
      setPosts(Array.isArray(feedData) ? feedData : []);
      setLikedIds(likeData.tweetIds || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.uid]);

  // Aktif index takip et
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !posts.length) return;

    const items = container.querySelectorAll('[data-reel-index]');
    const obs   = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveIndex(parseInt(entry.target.dataset.reelIndex));
          }
        });
      },
      { threshold: 0.5, root: container }
    );
    items.forEach(item => obs.observe(item));
    return () => obs.disconnect();
  }, [posts]);

  return (
    <div style={{
      position: 'relative', height: '100dvh', width: '100%',
      maxWidth: 470, margin: '0 auto',
      background: '#000', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#737373' }}>
          <span style={{ fontSize: 48 }}>🎬</span>
          <p style={{ fontSize: 16, color: '#A8A8A8', fontWeight: 600, margin: 0 }}>Henüz içerik yok</p>
          <p style={{ fontSize: 14, color: '#737373', margin: 0 }}>Takip ettiklerinin gönderileri burada çıkacak.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {posts.map((post, i) => (
            <div
              key={post._id}
              data-reel-index={i}
              style={{
                height: 'calc(100dvh - 52px)',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <ReelCard
                post={post}
                isActive={i === activeIndex}
                isRendered={i >= activeIndex - 1 && i <= activeIndex + 2}
                deviceId={user?.uid}
                likedTweetIds={likedIds}
              />
            </div>
          ))}
        </div>
      )}

      <Navbar />
    </div>
  );
}
