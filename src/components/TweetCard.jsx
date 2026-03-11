import React, { useState, useEffect, useCallback } from 'react';
import {
    Heart, MessageCircle, Trash2, ChevronUp, X, ZoomIn,
    UserPlus, UserCheck, UserMinus, Flag, Shield, ShieldOff,
    AlertTriangle, Twitter, Users, Loader2,
} from 'lucide-react';
import CommentSection from './CommentSection';
import StoryShare, { LinkShare } from './StoryShare';
import { API_URL } from '../apiConfig';

function timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)    return 'az önce';
    if (diff < 3600)  return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
}

const avatarColors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];

// ─── Avatar ───────────────────────────────────────────────────────────────
export function Avatar({ name, avatarUrl, size = 36, onClick }) {
    const ci = name?.charCodeAt(0) % avatarColors.length || 0;
    const style = {
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: '2px solid #27272a', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
    };
    if (avatarUrl) {
        return (
            <div style={{ ...style, backgroundColor: '#18181b' }} onClick={onClick}>
                <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        );
    }
    return (
        <div
            onClick={onClick}
            style={{
                ...style,
                backgroundColor: avatarColors[ci],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: Math.round(size * 0.38),
            }}
        >
            {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
}

// ─── Aegis Badge ──────────────────────────────────────────────────────────
function AegisBadge() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '4px', padding: '4px 0',
            borderTop: '1px solid rgba(99,102,241,0.1)',
            background: 'rgba(9,9,11,0.7)',
        }}>
            <Shield size={8} color="#6366f145" />
            <span style={{
                fontSize: '8px', fontFamily: "'DM Mono', monospace",
                color: '#6366f145', letterSpacing: '0.1em', fontWeight: 500, userSelect: 'none',
            }}>
                reviewed by aegis · sigal media
            </span>
        </div>
    );
}

// ─── Şikayet Modalı ──────────────────────────────────────────────────────
const REPORT_REASONS = ['Küfür/Hakaret', 'Spam', 'Kişisel Gizlilik İhlali', 'Tehdit', 'Diğer'];

function ReportModal({ tweetId, deviceId, onClose }) {
    const [selected, setSelected] = useState('');
    const [loading,  setLoading]  = useState(false);
    const [done,     setDone]     = useState(false);
    const [err,      setErr]      = useState('');

    const handleReport = async () => {
        if (!selected || loading) return;
        setLoading(true); setErr('');
        try {
            const res  = await fetch(`${API_URL}/api/report/${tweetId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, reason: selected }),
            });
            const data = await res.json();
            if (!res.ok) setErr(data.error || 'Bir hata oluştu.');
            else setDone(true);
        } catch { setErr('Sunucuya ulaşılamadı.'); }
        finally { setLoading(false); }
    };

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 env(safe-area-inset-bottom)',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#0d0d10', borderRadius: '16px 16px 0 0',
                border: '1px solid #27272a', borderBottom: 'none',
                padding: '20px 16px', width: '100%', maxWidth: '480px',
                display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
                {done ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <Shield size={28} color="#34d399" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', margin: 0 }}>Şikayetin alındı</p>
                        <p style={{ fontSize: '12px', color: '#52525b', marginTop: '4px' }}>Aegis inceleyecek. Teşekkürler!</p>
                        <button onClick={onClose} style={{ marginTop: '16px', padding: '8px 24px', borderRadius: '8px', background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer' }}>
                            Kapat
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Flag size={16} color="#f97316" />
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>Şikayet Et</p>
                            </div>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <X size={16} color="#52525b" />
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>Neden şikayet ediyorsun?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {REPORT_REASONS.map(r => (
                                <button key={r} onClick={() => setSelected(r)} style={{
                                    textAlign: 'left', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                                    background: selected === r ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: selected === r ? '1px solid rgba(249,115,22,0.4)' : '1px solid #1c1c22',
                                    color: selected === r ? '#fb923c' : '#a1a1aa',
                                    fontSize: '13px', fontWeight: selected === r ? 600 : 400, transition: 'all 0.15s',
                                }}>{r}</button>
                            ))}
                        </div>
                        {err && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '12px' }}><AlertTriangle size={13} />{err}</div>}
                        <button onClick={handleReport} disabled={!selected || loading} style={{
                            padding: '11px', borderRadius: '10px', cursor: selected ? 'pointer' : 'not-allowed',
                            background: selected ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${selected ? 'rgba(249,115,22,0.4)' : '#1c1c22'}`,
                            color: selected ? '#fb923c' : '#3f3f46',
                            fontSize: '13px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s',
                        }}>
                            {loading ? <span className="spinner-sm" style={{ borderTopColor: '#fb923c', borderColor: '#7c3a0a' }} /> : <Flag size={13} />}
                            Şikayet Gönder
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Kullanıcı Profil Modalı ──────────────────────────────────────────────
function UserProfileModal({ authorId, myDeviceId, myFollowingIds, onClose, onFollowChange }) {
    const [profile,      setProfile]      = useState(null);
    const [tweets,       setTweets]       = useState([]);
    const [tab,          setTab]          = useState('tweets');   // tweets | followers | following
    const [mutualUsers,  setMutualUsers]  = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [following,    setFollowing]    = useState(myFollowingIds.includes(authorId));
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (!authorId) return;
        setLoading(true);
        Promise.all([
            fetch(`${API_URL}/api/public-user/${authorId}?viewer=${myDeviceId}`).then(r => r.json()),
            fetch(`${API_URL}/api/my-tweets/${authorId}`).then(r => r.json()),
        ]).then(([profileData, tweetsData]) => {
            setProfile(profileData);
            setTweets(Array.isArray(tweetsData) ? tweetsData.filter(t => t.aegisStatus === 'active' || t.aegisStatus === 'cleared') : []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [authorId, myDeviceId]);

    // Takipçi/takip listesi lazy load
    const loadMutualList = useCallback(async (type) => {
        if (!profile?.isMutual) return;
        setTab(type);
        const url = type === 'followers'
            ? `${API_URL}/api/followers/${authorId}`
            : `${API_URL}/api/following/${authorId}`;
        const data = await fetch(url).then(r => r.json());
        setMutualUsers(Array.isArray(data) ? data : []);
    }, [authorId, profile]);

    const handleFollow = async () => {
        if (followLoading) return;
        const newFollowing = !following;
        setFollowing(newFollowing);
        setFollowLoading(true);
        try {
            await fetch(`${API_URL}/api/follow`, {
                method: newFollowing ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId: myDeviceId, targetId: authorId }),
            });
            onFollowChange?.(authorId, newFollowing);
            // follower count güncelle
            setProfile(p => p ? {
                ...p,
                followerCount: newFollowing ? p.followerCount + 1 : Math.max(0, p.followerCount - 1),
            } : p);
        } catch {
            setFollowing(!newFollowing);
        } finally {
            setFollowLoading(false);
        }
    };

    const isOwn = authorId === myDeviceId;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9500,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 480,
                    background: '#09090b',
                    border: '1px solid #27272a', borderBottom: 'none',
                    borderRadius: '20px 20px 0 0',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* Kapat çizgisi */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: '#27272a' }} />
                </div>

                {/* Kapat butonu */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 14, right: 14,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid #27272a',
                        borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#71717a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={15} />
                </button>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                        <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        {/* Profil başlık */}
                        <div style={{ padding: '12px 16px 16px', borderBottom: '1px solid #18181b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Avatar name={profile?.username} avatarUrl={profile?.avatarUrl} size={52} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: '15px', color: '#f4f4f5', margin: 0 }}>
                                        {profile?.username || 'Anonim'}
                                    </p>
                                    {/* Takipçi / Takip sayıları */}
                                    <div style={{ display: 'flex', gap: '14px', marginTop: '5px' }}>
                                        <button
                                            onClick={() => profile?.isMutual ? loadMutualList('followers') : null}
                                            style={{
                                                background: 'none', border: 'none', padding: 0, cursor: profile?.isMutual ? 'pointer' : 'default',
                                                fontSize: '12px', color: '#71717a',
                                                display: 'flex', alignItems: 'center', gap: '3px',
                                            }}
                                        >
                                            <strong style={{ color: '#e4e4e7' }}>{profile?.followerCount || 0}</strong> takipçi
                                            {profile?.isMutual && <span style={{ fontSize: '10px', color: '#6366f1', marginLeft: 2 }}>↗</span>}
                                        </button>
                                        <button
                                            onClick={() => profile?.isMutual ? loadMutualList('following') : null}
                                            style={{
                                                background: 'none', border: 'none', padding: 0, cursor: profile?.isMutual ? 'pointer' : 'default',
                                                fontSize: '12px', color: '#71717a',
                                                display: 'flex', alignItems: 'center', gap: '3px',
                                            }}
                                        >
                                            <strong style={{ color: '#e4e4e7' }}>{profile?.followingCount || 0}</strong> takip
                                            {profile?.isMutual && <span style={{ fontSize: '10px', color: '#6366f1', marginLeft: 2 }}>↗</span>}
                                        </button>
                                    </div>
                                    {profile?.isMutual && (
                                        <p style={{ fontSize: '10px', color: '#6366f1', margin: '3px 0 0', fontFamily: "'DM Mono', monospace" }}>
                                            ✦ birbirinizi takip ediyorsunuz
                                        </p>
                                    )}
                                </div>

                                {/* Takip butonu */}
                                {!isOwn && (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '7px 14px', borderRadius: '999px',
                                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                            transition: 'all 0.15s', flexShrink: 0,
                                            background: following ? 'transparent' : '#6366f1',
                                            color: following ? '#71717a' : '#fff',
                                            border: following ? '1px solid #3f3f46' : '1px solid transparent',
                                            opacity: followLoading ? 0.6 : 1,
                                        }}
                                    >
                                        {followLoading
                                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                            : following ? <><UserCheck size={12} />Takiptesin</> : <><UserPlus size={12} />Takip Et</>
                                        }
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sekmeler */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #18181b' }}>
                            {[
                                { key: 'tweets', label: `Tweetler (${tweets.length})`, icon: <Twitter size={12} /> },
                                ...(profile?.isMutual ? [
                                    { key: 'followers', label: 'Takipçiler', icon: <Users size={12} /> },
                                    { key: 'following', label: 'Takip', icon: <UserCheck size={12} /> },
                                ] : []),
                            ].map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => t.key === 'followers' || t.key === 'following' ? loadMutualList(t.key) : setTab('tweets')}
                                    style={{
                                        flex: 1, padding: '10px 0', background: 'none', border: 'none',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                        color: tab === t.key ? '#6366f1' : '#52525b',
                                        borderBottom: tab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                        transition: 'color 0.15s',
                                    }}
                                >
                                    {t.icon}{t.label}
                                </button>
                            ))}
                        </div>

                        {/* İçerik */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {tab === 'tweets' && (
                                tweets.length === 0
                                    ? <p style={{ color: '#52525b', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
                                        Henüz tweet atılmamış.
                                    </p>
                                    : tweets.map(tweet => (
                                        <MiniTweetRow key={tweet._id} tweet={tweet} />
                                    ))
                            )}

                            {(tab === 'followers' || tab === 'following') && (
                                mutualUsers.length === 0
                                    ? <p style={{ color: '#52525b', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Kimse yok.</p>
                                    : mutualUsers.map(u => (
                                        <div key={u.deviceId} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '10px 16px', borderBottom: '1px solid #18181b',
                                        }}>
                                            <Avatar name={u.username} avatarUrl={u.avatarUrl} size={36} />
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>{u.username}</p>
                                                <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>{u.followerCount} takipçi</p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Mini Tweet satırı (profil modalında) ─────────────────────────────────
function MiniTweetRow({ tweet }) {
    return (
        <div style={{
            padding: '12px 16px', borderBottom: '1px solid #18181b',
            display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
            {tweet.content && (
                <p style={{ fontSize: '13px', color: '#d4d4d8', margin: 0, lineHeight: 1.45 }}>
                    {tweet.content}
                </p>
            )}
            {tweet.imageUrl && (
                <img
                    src={tweet.imageUrl}
                    alt=""
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }}
                />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#52525b' }}>{timeAgo(tweet.createdAt)}</span>
                <span style={{ fontSize: '11px', color: '#52525b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Heart size={10} /> {tweet.likes || 0}
                </span>
            </div>
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
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={src} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: '1px solid #27272a', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
            </button>
        </div>
    );
}

// ─── Takip Butonu (tweet header) ──────────────────────────────────────────
function FollowButton({ deviceId, authorId, followingIds, onFollowChange }) {
    const [following, setFollowing] = useState(followingIds.includes(authorId));
    const [loading,   setLoading]   = useState(false);

    useEffect(() => { setFollowing(followingIds.includes(authorId)); }, [followingIds, authorId]);

    const handleClick = async (e) => {
        e.stopPropagation();
        if (loading) return;
        const newFollowing = !following;
        setFollowing(newFollowing);
        setLoading(true);
        try {
            await fetch(`${API_URL}/api/follow`, {
                method: newFollowing ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId: deviceId, targetId: authorId }),
            });
            onFollowChange?.(authorId, newFollowing);
        } catch { setFollowing(!newFollowing); }
        finally { setLoading(false); }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '999px',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                backgroundColor: following ? 'transparent' : '#6366f1',
                color: following ? '#71717a' : '#fff',
                border: following ? '1px solid #3f3f46' : '1px solid transparent',
                opacity: loading ? 0.6 : 1,
            }}
        >
            {following ? <><UserCheck size={11} />Takiptesin</> : <><UserPlus size={11} />Takip Et</>}
        </button>
    );
}

// ─── Aegis Bildirimi (sahibine) ───────────────────────────────────────────
function AegisNotice({ tweet, isOwn }) {
    if (!isOwn) return null;
    if (tweet.aegisStatus === 'suspended') {
        return (
            <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: '8px' }}>
                <ShieldOff size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', margin: 0 }}>Bu tweet inceleme havuzunda</p>
                    <p style={{ fontSize: '10px', color: '#a1a1aa', margin: '2px 0 0' }}>Aegis denetimi sürerken sadece sen görebilirsin.</p>
                </div>
            </div>
        );
    }
    if (tweet.aegisStatus === 'removed') {
        return (
            <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', gap: '8px' }}>
                <ShieldOff size={14} color="#f43f5e" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', margin: 0 }}>Moderatör tarafından kaldırıldı</p>
                    {tweet.adminAction?.reason && <p style={{ fontSize: '10px', color: '#a1a1aa', margin: '2px 0 0' }}>Neden: {tweet.adminAction.reason}</p>}
                </div>
            </div>
        );
    }
    return null;
}

// ─── Ana TweetCard ────────────────────────────────────────────────────────
export default function TweetCard({ tweet, deviceId, likedTweetIds = [], likedCommentIds = [], followingIds = [], onDelete, onFollowChange }) {
    const initLiked = likedTweetIds.includes(tweet._id?.toString());

    const [likes,         setLikes]         = useState(tweet.likes || 0);
    const [liked,         setLiked]         = useState(initLiked);
    const [bounce,        setBounce]        = useState(false);
    const [showComments,  setShowComments]  = useState(false);
    const [commentCount,  setCommentCount]  = useState(tweet.commentCount || 0);
    const [deleting,      setDeleting]      = useState(false);
    const [lightbox,      setLightbox]      = useState(false);
    const [imgError,      setImgError]      = useState(false);
    const [showReport,    setShowReport]    = useState(false);
    const [showProfile,   setShowProfile]   = useState(false);

    const isOwn    = tweet.authorId === deviceId;
    const imageUrl = tweet.imageUrl || tweet.imageData || null;

    const isSuspended = tweet.aegisStatus === 'suspended';
    const isRemoved   = tweet.aegisStatus === 'removed';

    if ((isSuspended || isRemoved) && !isOwn) return null;

    const handleLike = async () => {
        if (isOwn || isSuspended || isRemoved) return;
        const newLiked = !liked;
        setLiked(newLiked);
        setLikes(l => newLiked ? l + 1 : Math.max(0, l - 1));
        if (newLiked) { setBounce(true); setTimeout(() => setBounce(false), 400); }
        try {
            await fetch(`${API_URL}/api/like/${tweet._id}`, {
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
            await fetch(`${API_URL}/api/tweet/${tweet._id}`, {
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
            {showReport && (
                <ReportModal tweetId={tweet._id} deviceId={deviceId} onClose={() => setShowReport(false)} />
            )}
            {showProfile && (
                <UserProfileModal
                    authorId={tweet.authorId}
                    myDeviceId={deviceId}
                    myFollowingIds={followingIds}
                    onClose={() => setShowProfile(false)}
                    onFollowChange={onFollowChange}
                />
            )}

            <div
                className={`tweet-card ${deleting ? 'tweet-card--deleting' : ''}`}
                style={{ opacity: (isSuspended || isRemoved) ? 0.55 : 1 }}
            >
                {/* ── Header ── */}
                <div className="tweet-header">
                    {/* Avatar — tıklanabilir */}
                    <div
                        onClick={() => !isOwn && setShowProfile(true)}
                        style={{ cursor: isOwn ? 'default' : 'pointer', flexShrink: 0 }}
                    >
                        <Avatar name={tweet.authorAvatar} avatarUrl={tweet.authorAvatarUrl} size={38} />
                    </div>

                    <div style={{ flex: 1, marginLeft: '10px' }}>
                        <p
                            className="tweet-author"
                            onClick={() => !isOwn && setShowProfile(true)}
                            style={{ cursor: isOwn ? 'default' : 'pointer', display: 'inline' }}
                        >
                            {tweet.authorAvatar || 'Anonim'}
                        </p>
                        <p className="tweet-time">{timeAgo(tweet.createdAt)}</p>
                    </div>

                    {!isOwn && deviceId && !isSuspended && !isRemoved && (
                        <FollowButton deviceId={deviceId} authorId={tweet.authorId} followingIds={followingIds} onFollowChange={onFollowChange} />
                    )}
                    {isOwn && !isSuspended && !isRemoved && (
                        <button className="tweet-delete-btn" onClick={handleDelete} disabled={deleting}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {/* ── Metin ── */}
                {tweet.content && <p className="tweet-content">{tweet.content}</p>}

                {/* ── Görsel ── */}
                {imageUrl && !imgError && (
                    <div style={{ marginTop: '10px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#18181b' }}>
                        <div
                            onClick={() => !isSuspended && !isRemoved && setLightbox(true)}
                            style={{ position: 'relative', cursor: (isSuspended || isRemoved) ? 'default' : 'zoom-in', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '400px' }}
                        >
                            <img
                                src={imageUrl} alt="Tweet görseli" loading="lazy"
                                onError={() => setImgError(true)}
                                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                            />
                            {!isSuspended && !isRemoved && (
                                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px', color: '#e4e4e7', fontSize: '0.7rem', pointerEvents: 'none' }}>
                                    <ZoomIn size={12} /> Büyüt
                                </div>
                            )}
                        </div>
                        <AegisBadge />
                    </div>
                )}

                {/* ── Aegis Bildirimi ── */}
                <AegisNotice tweet={tweet} isOwn={isOwn} />

                {/* ── Footer ── */}
                {!isSuspended && !isRemoved && (
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

                        
                        <StoryShare tweet={tweet} />

                        {!isOwn && deviceId && (
                            <button
                                onClick={() => setShowReport(true)}
                                title="Şikayet et"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#3f3f46', padding: '4px 6px', borderRadius: '6px',
                                    fontSize: '11px', transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
                                onMouseLeave={e => e.currentTarget.style.color = '#3f3f46'}
                            >
                                <Flag size={12} />
                            </button>
                        )}
                    </div>
                )}

                {showComments && !isSuspended && !isRemoved && (
                    <CommentSection
                        tweetId={tweet._id} deviceId={deviceId}
                        likedCommentIds={likedCommentIds}
                        onCommentAdded={() => setCommentCount(c => c + 1)}
                    />
                )}
            </div>
        </>
    );
}