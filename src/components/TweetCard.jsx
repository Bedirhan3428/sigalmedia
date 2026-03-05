import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trash2, ChevronUp, X, ZoomIn, UserPlus, UserCheck } from 'lucide-react';
import CommentSection from './CommentSection';

function timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)    return 'az önce';
    if (diff < 3600)  return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
}

const avatarColors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];

// ─── Ortak Avatar ─────────────────────────────────────────────────────────
export function Avatar({ name, avatarUrl, size = 36 }) {
    const ci = name?.charCodeAt(0) % avatarColors.length || 0;
    if (avatarUrl) {
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0, backgroundColor: '#18181b',
                border: '2px solid #27272a',
            }}>
                <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            backgroundColor: avatarColors[ci], border: '2px solid #27272a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: Math.round(size * 0.38),
        }}>
            {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', animation: 'fadeIn 0.15s ease',
        }}>
            <button onClick={onClose} style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.12)', border: 'none',
                borderRadius: '50%', width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
            }}><X size={18} /></button>
            <img src={src} alt="Büyük görsel" onClick={e => e.stopPropagation()} style={{
                maxWidth: '100%', maxHeight: '90vh', borderRadius: '10px',
                objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                animation: 'scaleIn 0.18s ease',
            }} />
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{transform:scale(0.93)}to{transform:scale(1)}}`}</style>
        </div>
    );
}

// ─── Takip Butonu ─────────────────────────────────────────────────────────
function FollowButton({ deviceId, authorId, followingIds, onFollowChange }) {
    const [following, setFollowing] = useState(followingIds.includes(authorId));
    const [loading, setLoading]     = useState(false);

    useEffect(() => { setFollowing(followingIds.includes(authorId)); }, [followingIds, authorId]);

    const handleClick = async (e) => {
        e.stopPropagation();
        if (loading) return;
        const newFollowing = !following;
        setFollowing(newFollowing);
        setLoading(true);
        try {
            await fetch('http://localhost:5000/api/follow', {
                method: newFollowing ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId: deviceId, targetId: authorId }),
            });
            onFollowChange?.(authorId, newFollowing);
        } catch {
            setFollowing(!newFollowing);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handleClick} disabled={loading} title={following ? 'Takibi bırak' : 'Takip et'} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.18s',
            backgroundColor: following ? 'transparent' : '#6366f1',
            color: following ? '#71717a' : '#fff',
            border: following ? '1px solid #3f3f46' : '1px solid transparent',
            opacity: loading ? 0.6 : 1,
        }}>
            {following ? <><UserCheck size={11} /> Takiptesin</> : <><UserPlus size={11} /> Takip Et</>}
        </button>
    );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────
export default function TweetCard({ tweet, deviceId, likedTweetIds = [], likedCommentIds = [], followingIds = [], onDelete, onFollowChange }) {
    const initLiked = likedTweetIds.includes(tweet._id?.toString());

    const [likes, setLikes]               = useState(tweet.likes || 0);
    const [liked, setLiked]               = useState(initLiked);
    const [bounce, setBounce]             = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(tweet.commentCount || 0);
    const [deleting, setDeleting]         = useState(false);
    const [lightbox, setLightbox]         = useState(false);
    const [imgError, setImgError]         = useState(false);

    const isOwn    = tweet.authorId === deviceId;
    const imageUrl = tweet.imageUrl || tweet.imageData || null;

    const handleLike = async () => {
        if (isOwn) return;
        const newLiked = !liked;
        setLiked(newLiked);
        setLikes(l => newLiked ? l + 1 : Math.max(0, l - 1));
        if (newLiked) { setBounce(true); setTimeout(() => setBounce(false), 400); }
        try {
            await fetch(`http://localhost:5000/api/like/${tweet._id}`, {
                method: newLiked ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
            });
        } catch {}
    };

    const handleDelete = async () => {
        if (!window.confirm('Bu tweeti silmek istediğinden emin misin?')) return;
        setDeleting(true);
        try {
            await fetch(`http://localhost:5000/api/tweet/${tweet._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
            });
            onDelete?.(tweet._id);
        } catch { setDeleting(false); }
    };

    return (
        <>
            {lightbox && imageUrl && <Lightbox src={imageUrl} onClose={() => setLightbox(false)} />}

            <div className={`tweet-card ${deleting ? 'tweet-card--deleting' : ''}`}>
                <div className="tweet-header">
                    <Avatar name={tweet.authorAvatar} avatarUrl={tweet.authorAvatarUrl} size={38} />
                    <div style={{ flex: 1, marginLeft: '10px' }}>
                        <p className="tweet-author">{tweet.authorAvatar || 'Anonim'}</p>
                        <p className="tweet-time">{timeAgo(tweet.createdAt)}</p>
                    </div>
                    {!isOwn && deviceId && (
                        <FollowButton
                            deviceId={deviceId}
                            authorId={tweet.authorId}
                            followingIds={followingIds}
                            onFollowChange={onFollowChange}
                        />
                    )}
                    {isOwn && (
                        <button className="tweet-delete-btn" onClick={handleDelete} disabled={deleting}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {tweet.content && <p className="tweet-content">{tweet.content}</p>}

                {imageUrl && !imgError && (
                    <div onClick={() => setLightbox(true)} style={{
                        position: 'relative', marginTop: '10px', borderRadius: '10px',
                        overflow: 'hidden', cursor: 'zoom-in', backgroundColor: '#18181b',
                        maxHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img src={imageUrl} alt="Tweet görseli" loading="lazy" onError={() => setImgError(true)}
                            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block', borderRadius: '10px' }} />
                        <div style={{
                            position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)',
                            borderRadius: '6px', padding: '4px 6px', display: 'flex', alignItems: 'center',
                            gap: '4px', color: '#e4e4e7', fontSize: '0.7rem', pointerEvents: 'none',
                        }}><ZoomIn size={12} /> Büyüt</div>
                    </div>
                )}

                <div className="tweet-footer">
                    <button
                        className={`like-btn ${liked ? 'like-btn--active' : ''} ${bounce ? 'like-btn--bounce' : ''} ${isOwn ? 'like-btn--disabled' : ''}`}
                        onClick={handleLike}
                        title={isOwn ? 'Kendi tweetini beğenemezsin' : liked ? 'Beğeniyi geri çek' : 'Beğen'}
                    >
                        <Heart size={15} fill={liked ? '#f43f5e' : 'none'} />
                        <span>{likes}</span>
                    </button>
                    <button
                        className={`comment-toggle-btn ${showComments ? 'comment-toggle-btn--active' : ''}`}
                        onClick={() => setShowComments(v => !v)}
                    >
                        {showComments ? <ChevronUp size={15} /> : <MessageCircle size={15} />}
                        <span>{commentCount}</span>
                    </button>
                </div>

                {showComments && (
                    <CommentSection
                        tweetId={tweet._id}
                        deviceId={deviceId}
                        likedCommentIds={likedCommentIds}
                        onCommentAdded={() => setCommentCount(c => c + 1)}
                    />
                )}
            </div>
        </>
    );
}