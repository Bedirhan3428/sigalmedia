import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import PostCard from '../components/PostCard';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

export default function PostDetail() {
    const [searchParams]    = useSearchParams();
    const navigate          = useNavigate();
    const user              = useAuth();

    const id = searchParams.get('id');

    const [tweet,           setTweet]           = useState(null);
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState('');
    const [likedTweetIds,   setLikedTweetIds]   = useState([]);
    const [likedCommentIds, setLikedCommentIds] = useState([]);
    const [followingIds,    setFollowingIds]    = useState([]);
    const [savedIds,        setSavedIds]        = useState([]);

    // ── Beğeni + takip + kayıt ID'leri ──────────────────────────────────────
    useEffect(() => {
        if (!user?.uid) return;
        Promise.all([
            fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()),
            fetch(`${API_URL}/api/following-ids/${user.uid}`).then(r => r.json()),
            fetch(`${API_URL}/api/saved-ids/${user.uid}`).then(r => r.json()),
        ])
            .then(([likeData, followData, saveData]) => {
                setLikedTweetIds(likeData.tweetIds     || []);
                setLikedCommentIds(likeData.commentIds || []);
                setFollowingIds(followData.followingIds || []);
                setSavedIds(saveData.savedIds || []);
            })
            .catch(() => {});
    }, [user]);

    // ── Tweet çek ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) {
            setError('Geçersiz bağlantı — ID bulunamadı.');
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`${API_URL}/api/posts/${id}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Tweet yüklenemedi.');
                setTweet(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleFollowChange = (targetId, isNowFollowing) => {
        setFollowingIds(prev =>
            isNowFollowing ? [...prev, targetId] : prev.filter(fid => fid !== targetId)
        );
    };

    return (
        <div className="page">
            {/* Header */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #262626',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                paddingTop: 'max(10px, env(safe-area-inset-top))',
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#F5F5F5', fontSize: 14, padding: '4px 0',
                    }}
                >
                    <ArrowLeft size={18} />
                    <span>Geri</span>
                </button>
                <span style={{ fontWeight: 700, fontSize: 16, marginLeft: 8 }}>Gönderi</span>
            </header>

            <main style={{ paddingTop: 8 }}>
                {loading && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 12, padding: '4rem 0', color: '#737373',
                    }}>
                        <Loader2 size={28} className="spin" />
                        <span style={{ fontSize: 13 }}>Yükleniyor...</span>
                    </div>
                )}

                {!loading && error && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 12, padding: '4rem 1rem', textAlign: 'center',
                    }}>
                        <AlertTriangle size={32} color="#FCAF45" />
                        <p style={{ fontWeight: 700, color: '#F5F5F5', margin: 0 }}>Gönderi bulunamadı</p>
                        <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>{error}</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                marginTop: 8, padding: '8px 20px', borderRadius: 10,
                                background: 'rgba(0,149,246,0.1)', border: '1px solid rgba(0,149,246,0.3)',
                                color: '#0095F6', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                )}

                {!loading && tweet && (
                    <PostCard
                        post={tweet}
                        deviceId={user?.uid}
                        likedTweetIds={likedTweetIds}
                        likedCommentIds={likedCommentIds}
                        followingIds={followingIds}
                        savedTweetIds={savedIds}
                        onDelete={() => navigate('/')}
                        onFollowChange={handleFollowChange}
                        onSaveChange={(id, isSaved) => setSavedIds(prev =>
                            isSaved ? [...prev, id] : prev.filter(x => x !== id)
                        )}
                    />
                )}
            </main>

            <div className="nav-spacer" />
            <Navbar />
        </div>
    );
}