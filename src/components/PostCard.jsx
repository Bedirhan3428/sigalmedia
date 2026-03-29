import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Trash2, Flag, Play, Volume2, VolumeX, Shield, Link2,
  CheckCircle, Copy, X, AlertTriangle, Loader2,
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import { renderWithHashtags } from '../utils/renderWithHashtags.jsx';

// ─── Time helper ──────────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'az önce';
  if (diff < 3600)  return `${Math.floor(diff / 60)} dakika`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function PostAvatar({ username, avatarUrl, size = 30, hasStory = true, onClick }) {
  const first = (username || '?').charAt(0).toUpperCase();
  return (
    <button className="post-avatar-btn" onClick={onClick} style={{ flexShrink: 0 }}>
      <div className={`post-avatar-ring ${hasStory ? '' : 'post-avatar-ring--no-story'}`}
           style={{ width: size + 6, height: size + 6 }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={username} className="post-avatar-img"
                 style={{ width: size, height: size }} />
          : <div className="post-avatar-letter"
                 style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
              {first}
            </div>
        }
      </div>
    </button>
  );
}

// ─── Comment section ──────────────────────────────────────────────────────────
function CommentSection({ tweetId, deviceId, likedCommentIds = [] }) {
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/comments/${tweetId}`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tweetId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res  = await fetch(`${API_URL}/api/comment/${tweetId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, content: text.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setComments(prev => [...prev, data.comment]); setText(''); }
    } catch {}
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="comment-section">
      <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Yorumlar yükleniyor...</div>
    </div>
  );

  return (
    <div className="comment-section">
      {comments.map(c => (
        <div key={c._id} className="comment-item">
          {c.authorAvatarUrl
            ? <img src={c.authorAvatarUrl} alt="" className="comment-avatar" />
            : <div className="comment-avatar-letter">{c.authorAvatar?.charAt(0)?.toUpperCase() || '?'}</div>
          }
          <div className="comment-body">
            <span className="comment-author">{c.authorAvatar} </span>
            <span className="comment-text">{c.content}</span>
            <div className="comment-time">{timeAgo(c.createdAt)}</div>
          </div>
          <button
            className={`comment-like ${likedCommentIds.includes(c._id) ? 'comment-like--active' : ''}`}
            onClick={async () => {
              const liked = likedCommentIds.includes(c._id);
              await fetch(`${API_URL}/api/like-comment/${c._id}`, {
                method: liked ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
              });
            }}
          >
            <Heart size={12} />
          </button>
        </div>
      ))}

      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="Yorum ekle..."
          value={text}
          onChange={e => setText(e.target.value.slice(0, 280))}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={sending}
        />
        <button className="comment-post-btn" onClick={handleSend} disabled={!text.trim() || sending}>
          {sending ? <Loader2 size={14} className="spin" /> : 'Paylaş'}
        </button>
      </div>
    </div>
  );
}

// ─── Options modal ────────────────────────────────────────────────────────────
function OptionsModal({ isOwn, onDelete, onReport, onClose, onCopyLink }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        {isOwn ? (
          <button className="modal-option modal-option--danger" onClick={onDelete}>
            <Trash2 size={20} /> Gönderiyi Sil
          </button>
        ) : (
          <button className="modal-option modal-option--danger" onClick={onReport}>
            <Flag size={20} /> Şikayet Et
          </button>
        )}
        <button className="modal-option" onClick={onCopyLink}>
          <Link2 size={20} /> Linki Kopyala
        </button>
        <button className="modal-option" onClick={onClose}>
          <X size={20} /> Kapat
        </button>
      </div>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ tweetId, deviceId, onClose }) {
  const REASONS = ['Küfür/Hakaret', 'Spam', 'Kişisel Gizlilik İhlali', 'Diğer'];
  const [selected, setSelected] = useState(null);
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null); // 'success' | 'error' | 'already'

  const handleReport = async () => {
    if (selected === null || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/report/${tweetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, reason: REASONS[selected] }),
      });
      const data = await res.json();
      if (res.ok) { setResult('success'); }
      else if (res.status === 400 && data.error?.includes('Zaten')) { setResult('already'); }
      else { setResult('error'); }
    } catch { setResult('error'); }
    finally { setSending(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet fade-in" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="modal-handle" />
        <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center', padding: '12px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          Şikayet Et
        </div>

        {result ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            {result === 'success' && (
              <>
                <CheckCircle size={40} color="var(--green)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 15 }}>Şikayetin alındı</div>
                <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6 }}>
                  İçerik incelemeye alınacak. Teşekkürler.
                </div>
              </>
            )}
            {result === 'already' && (
              <>
                <AlertTriangle size={40} color="#FCAF45" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 15 }}>Bu gönderiyi zaten şikayet ettin</div>
              </>
            )}
            {result === 'error' && (
              <>
                <AlertTriangle size={40} color="var(--red)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 15 }}>Bir hata oluştu</div>
                <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6 }}>Lütfen tekrar dene.</div>
              </>
            )}
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 28px', borderRadius: 8, background: 'var(--surface-3)', border: 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
              Kapat
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-2)' }}>
              Bu gönderiyi neden şikayet ediyorsun?
            </div>
            {REASONS.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 20px', background: 'none',
                  border: 'none', borderBottom: '1px solid var(--border)',
                  color: selected === i ? 'var(--accent)' : 'var(--text)',
                  fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected === i ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected === i ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selected === i && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
                {r}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 10, padding: '16px 20px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 8, background: 'var(--surface-3)', border: 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
                İptal
              </button>
              <button
                onClick={handleReport}
                disabled={selected === null || sending}
                style={{ flex: 1, padding: '11px 0', borderRadius: 8, background: selected !== null ? 'var(--red)' : 'var(--surface-3)', border: 'none', color: '#fff', cursor: selected !== null ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, opacity: selected === null ? 0.5 : 1 }}
              >
                {sending ? <Loader2 size={16} className="spin" /> : 'Gönder'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────
export default function PostCard({
  post,
  deviceId,
  likedTweetIds   = [],
  likedCommentIds = [],
  followingIds    = [],
  savedTweetIds   = [],
  onDelete,
  onFollowChange,
  onSaveChange,
}) {
  const navigate        = useNavigate();
  const videoRef        = useRef(null);

  const isOwn           = post.authorId === deviceId;
  const initLiked       = likedTweetIds.includes(post._id?.toString());
  const initSaved       = savedTweetIds.includes(post._id?.toString());
  const [liked,         setLiked]         = useState(initLiked);
  const [likes,         setLikes]         = useState(post.likes || 0);
  const [saved,         setSaved]         = useState(initSaved);
  const [showComments,  setShowComments]  = useState(false);
  const [showOptions,   setShowOptions]   = useState(false);
  const [showReport,    setShowReport]    = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [muted,         setMuted]         = useState(true);
  const [playing,       setPlaying]       = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const isVideo = post.mediaType === 'video' || post.imageUrl?.includes('/o/videos');
  const isSuspended = post.aegisStatus === 'suspended';
  const isRemoved   = post.aegisStatus === 'removed';

  // Auto-play videos when they enter the screen, pause when they exit
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
          video.pause();
          setPlaying(false);
        }
      });
    }, { threshold: 0.6 });

    observer.observe(video);
    return () => observer.disconnect();
  }, [isVideo]);

  if ((isSuspended || isRemoved) && !isOwn) return null;

  // Double-tap to like
  const lastTap = useRef(0);
  const [heartPos, setHeartPos] = useState({ x: '50%', y: '50%' });

  const handleMediaTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Tıklanan konumu hesapla
      if (e?.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
        const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
        setHeartPos({ x, y });
      }
      // Double tap → beğen
      setDoubleTapHeart(false);
      requestAnimationFrame(() => {
        setDoubleTapHeart(true);
        setTimeout(() => setDoubleTapHeart(false), 800);
      });
      if (!liked && !isOwn) {
        setLiked(true);
        setLikes(l => l + 1);
        fetch(`${API_URL}/api/like/${post._id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId }),
        }).catch(() => {});
      }
    }
    lastTap.current = now;
  };

  const handleLike = async () => {
    if (isOwn) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(l => newLiked ? l + 1 : Math.max(0, l - 1));
    try {
      await fetch(`${API_URL}/api/like/${post._id}`, {
        method: newLiked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}
  };

  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      await fetch(`${API_URL}/api/save/${post._id}`, {
        method: newSaved ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      onSaveChange?.(post._id, newSaved);
    } catch { setSaved(!newSaved); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu gönderiyi silmek istiyor musun?')) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/tweet/${post._id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      onDelete?.(post._id);
    } catch { setDeleting(false); }
    setShowOptions(false);
  };

  const handleCopyLink = () => {
    const url = `https://sigalmedia.site/post-detail?id=${post._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
    setShowOptions(false);
  };

  const handleShare = async () => {
    const url = `https://sigalmedia.site/post-detail?id=${post._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Şigal Medya', text: post.content || '', url }); return; }
      catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const goToProfile = () => {
    if (!isOwn) navigate(`/user/${post.authorId}`);
  };

  return (
    <>
      {showOptions && (
        <OptionsModal
          isOwn={isOwn}
          onDelete={handleDelete}
          onReport={() => { setShowReport(true); setShowOptions(false); }}
          onClose={() => setShowOptions(false)}
          onCopyLink={handleCopyLink}
        />
      )}

      {showReport && (
        <ReportModal
          tweetId={post._id}
          deviceId={deviceId}
          onClose={() => setShowReport(false)}
        />
      )}

      <article className="post-card" style={{ opacity: deleting ? 0.4 : 1 }}>
        {/* Header */}
        <div className="post-header">
          <PostAvatar
            username={post.authorAvatar}
            avatarUrl={post.authorAvatarUrl}
            onClick={goToProfile}
          />
          <div className="post-user-info">
            <button className="post-username-btn" onClick={goToProfile}>
              <span className="post-username">{post.authorAvatar || 'anonim'}</span>
            </button>
          </div>
          <button className="post-more-btn" onClick={() => setShowOptions(true)}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Media */}
        {(post.imageUrl || post.content) && (
          <div
            className="post-media post-media--square"
            style={{ position: 'relative', WebkitUserSelect: 'none', userSelect: 'none' }}
            onContextMenu={e => e.preventDefault()}
            onClick={(e) => {
              // Video ise oynat/durdur + çift tıklama
              if (isVideo && videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
                } else {
                  videoRef.current.pause();
                  setPlaying(false);
                }
              }
              handleMediaTap(e);
            }}
          >
            {post.imageUrl && !isVideo && (
              <img src={post.imageUrl} alt="" loading="lazy" />
            )}
            
            {/* Şeffaf koruma katmanı: sağ tık ve uzun basmayı engeller */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 4, background: 'transparent', WebkitTouchCallout: 'none' }} />

            {post.imageUrl && isVideo && (
              <>
                <video
                  ref={videoRef}
                  src={post.imageUrl}
                  loop
                  muted={muted}
                  playsInline
                  preload="metadata"
                  onEnded={() => setPlaying(false)}
                  onPlay={(e) => {
                    setPlaying(true);
                    document.querySelectorAll('video').forEach(v => {
                      if (v !== e.target && !v.paused) v.pause();
                    });
                  }}
                  onPause={() => setPlaying(false)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
                />
                {/* Play overlay — pointer-events:none → tıklama video'ya geçiyor */}
                {!playing && (
                  <div className="post-play-overlay">
                    <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '50%', padding: 14 }}>
                      <Play size={30} color="#fff" fill="#fff" />
                    </div>
                  </div>
                )}
                {/* Ses butonu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newMuted = !muted;
                    setMuted(newMuted);
                    if (videoRef.current) videoRef.current.muted = newMuted;
                  }}
                  style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 5 }}
                >
                  {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </>
            )}
            {!post.imageUrl && post.content && (
              /* Text-only post with background */
              <div style={{
                width: '100%', height: '100%',
                background: `hsl(${(post.authorAvatar?.charCodeAt(0) || 0) * 30 % 360}, 40%, 12%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
              }}>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 600, lineHeight: 1.5, textAlign: 'center' }}>
                  {post.content.slice(0, 150)}
                </p>
              </div>
            )}

            {/* Double-tap heart — tıklanan pozisyonda çıkar */}
            {doubleTapHeart && (
              <div className="post-double-tap-heart" style={{ pointerEvents: 'none' }}>
                <span className="heart-pop" style={{ top: heartPos.y, left: heartPos.x }}>❤️</span>
              </div>
            )}

            {/* Aegis suspended overlay */}
            {isSuspended && isOwn && (
              <div className="post-media-overlay">
                <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <Shield size={20} color="#FCAF45" />
                  <p style={{ color: '#FCAF45', fontSize: 12, fontWeight: 700, marginTop: 4 }}>İnceleme altında</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="post-actions">
          <button
            className={`post-action-btn ${liked ? 'post-action-btn--liked' : ''}`}
            onClick={handleLike}
            style={{ marginLeft: -6 }}
          >
            <Heart size={26} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
          </button>

          <button
            className="post-action-btn"
            onClick={() => setShowComments(v => !v)}
          >
            <MessageCircle size={26} strokeWidth={1.8} style={{ transform: 'scaleX(-1)' }} />
          </button>

          <button className="post-action-btn" onClick={handleShare}>
            {copied
              ? <CheckCircle size={24} color="var(--green)" />
              : <Send size={24} strokeWidth={1.8} style={{ transform: 'rotate(10deg)' }} />
            }
          </button>

          <button
            className={`post-action-btn post-save ${saved ? 'post-action-btn--saved' : ''}`}
            onClick={handleSave}
          >
            <Bookmark size={26} fill={saved ? 'currentColor' : 'none'} strokeWidth={saved ? 0 : 2} />
          </button>
        </div>

        {/* Likes */}
        {likes > 0 && (
          <div className="post-likes">{likes.toLocaleString('tr-TR')} beğeni</div>
        )}

        {/* Caption */}
        {post.content && post.imageUrl && (
          <div className="post-caption">
            <span className="post-caption-user" onClick={goToProfile}>
              {post.authorAvatar}
            </span>
            <span className="post-caption-text">
              {renderWithHashtags(post.content)}
            </span>
          </div>
        )}

        {/* Comment count */}
        {(post.commentCount || 0) > 0 && (
          <button className="post-view-comments" onClick={() => setShowComments(v => !v)}>
            {showComments ? 'Yorumları gizle' : `${post.commentCount} yorumun tümünü gör`}
          </button>
        )}

        {/* Time */}
        <div className="post-time">{timeAgo(post.createdAt)}</div>

        {/* Aegis badge */}
        {post.aegisStatus === 'cleared' && (
          <div className="aegis-badge">
            <Shield size={9} /> aegis onaylı
          </div>
        )}

        {/* Comments */}
        {showComments && (
          <CommentSection
            tweetId={post._id}
            deviceId={deviceId}
            likedCommentIds={likedCommentIds}
          />
        )}
      </article>
    </>
  );
}
