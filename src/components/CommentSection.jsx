import React, { useState, useEffect } from 'react';
import { Send, Trash2, Heart } from 'lucide-react';
import { Avatar } from './TweetCard';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'az önce';
  if (diff < 3600)  return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  return `${Math.floor(diff / 86400)} gün`;
}

function CommentItem({ comment, deviceId, likedCommentIds, onDelete }) {
  const isOwn     = comment.authorId === deviceId;
  const initLiked = likedCommentIds.includes(comment._id);
  const [likes, setLikes]   = useState(comment.likes || 0);
  const [liked, setLiked]   = useState(initLiked);
  const [bounce, setBounce] = useState(false);

  const handleLike = async () => {
    if (isOwn) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(l => newLiked ? l + 1 : Math.max(0, l - 1));
    if (newLiked) { setBounce(true); setTimeout(() => setBounce(false), 400); }
    try {
      await fetch(`http://localhost:5000/api/like-comment/${comment._id}`, {
        method: newLiked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}
  };

  return (
    <div className="comment-item">
      <Avatar name={comment.authorAvatar} avatarUrl={comment.authorAvatarUrl} size={28} />
      <div className="comment-body" style={{ marginLeft: '8px' }}>
        <div className="comment-meta">
          <span className="comment-author">{comment.authorAvatar}</span>
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
          <div className="comment-actions">
            {!isOwn && (
              <button
                className={`comment-like-btn ${liked ? 'comment-like-btn--active' : ''} ${bounce ? 'like-btn--bounce' : ''}`}
                onClick={handleLike}
              >
                <Heart size={11} fill={liked ? '#f43f5e' : 'none'} />
                {likes > 0 && <span>{likes}</span>}
              </button>
            )}
            {isOwn && (
              <button className="comment-delete" onClick={() => onDelete(comment._id)}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="comment-text">{comment.content}</p>
      </div>
    </div>
  );
}

export default function CommentSection({ tweetId, deviceId, likedCommentIds = [], onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/comments/${tweetId}`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tweetId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true); setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/comment/${tweetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Hata oluştu.'); return; }
      setComments(prev => [...prev, data.comment]);
      setText('');
      onCommentAdded?.();
    } catch { setError('Sunucuya ulaşılamadı.'); }
    finally { setSending(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await fetch(`http://localhost:5000/api/comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch {}
  };

  return (
    <div className="comment-section">
      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="Yorum yaz..."
          value={text}
          onChange={e => setText(e.target.value.slice(0, 280))}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={sending}
        />
        <button className="comment-send-btn" onClick={handleSend} disabled={!text.trim() || sending}>
          {sending ? <span className="spinner-sm" /> : <Send size={14} />}
        </button>
      </div>
      {error && <p className="comment-error">{error}</p>}
      {loading
        ? <p className="comment-loading">Yükleniyor...</p>
        : comments.length === 0
          ? <p className="comment-empty">İlk yorum senden olsun!</p>
          : <div className="comment-list">
              {comments.map(c => (
                <CommentItem key={c._id} comment={c} deviceId={deviceId} likedCommentIds={likedCommentIds} onDelete={handleDelete} />
              ))}
            </div>
      }
    </div>
  );
}