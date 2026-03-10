import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TweetCard from '../components/TweetCard';
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

    // ── Beğeni + takip ID'leri ─────────────────────────────────────────────
    useEffect(() => {
        if (!user?.uid) return;
        Promise.all([
            fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()),
            fetch(`${API_URL}/api/following-ids/${user.uid}`).then(r => r.json()),
        ])
            .then(([likeData, followData]) => {
                setLikedTweetIds(likeData.tweetIds     || []);
                setLikedCommentIds(likeData.commentIds || []);
                setFollowingIds(followData.followingIds || []);
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
        <div className="page-container">
            {/* Header */}
            <header className="page-header">
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#a1a1aa', fontSize: '14px', padding: '4px 0',
                    }}
                >
                    <ArrowLeft size={18} />
                    <span>Geri</span>
                </button>
                <div className="header-title" style={{ marginLeft: '12px' }}>
                    <h1 style={{ fontSize: '1rem' }}>Gönderi</h1>
                </div>
            </header>

            <main style={{ paddingTop: '8px' }}>
                {loading && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: '12px', padding: '4rem 0', color: '#52525b',
                    }}>
                        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '13px' }}>Yükleniyor...</span>
                    </div>
                )}

                {!loading && error && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: '12px', padding: '4rem 1rem', textAlign: 'center',
                    }}>
                        <AlertTriangle size={32} color="#f97316" />
                        <p style={{ fontWeight: 700, color: '#e4e4e7', margin: 0 }}>Gönderi bulunamadı</p>
                        <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>{error}</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                marginTop: '8px', padding: '8px 20px', borderRadius: '10px',
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                                color: '#818cf8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                )}

                {!loading && tweet && (
                    <TweetCard
                        tweet={tweet}
                        deviceId={user?.uid}
                        likedTweetIds={likedTweetIds}
                        likedCommentIds={likedCommentIds}
                        followingIds={followingIds}
                        onDelete={() => navigate('/')}
                        onFollowChange={handleFollowChange}
                    />
                )}
            </main>

            <div style={{ height: '80px' }} />
            <Navbar />
        </div>
    );
}