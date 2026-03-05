import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Flame, Clock, Zap, Info, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TweetCard from '../components/TweetCard';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

const avatarColors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];

function SkeletonCard() {
  return (
    <div className="tweet-card skeleton">
      <div className="tweet-header">
        <div className="skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton-line short" />
          <div className="skeleton-line mid" />
        </div>
      </div>
    </div>
  );
}

function BombTweet({ tweet }) {
  if (!tweet) return null;
  const ci = tweet.authorAvatar?.charCodeAt(0) % avatarColors.length || 0;
  const totalInteraction = (tweet.likes * 2) + (tweet.commentCount || 0);
  return (
    <div className="bomb-card">
      <div className="bomb-header">
        <Zap size={16} color="#f97316" fill="#f97316" />
        <span>Günün Bomba Olayı</span>
        <span className="bomb-score">🔥 {totalInteraction} etkileşim</span>
      </div>
      <div className="bomb-body">
        <div className="tweet-header" style={{ marginBottom: '0.5rem' }}>
          <div className="tweet-avatar" style={{ backgroundColor: avatarColors[ci], width: 32, height: 32, fontSize: '0.85rem' }}>
            {tweet.authorAvatar?.charAt(0) || '?'}
          </div>
          <p className="tweet-author" style={{ fontSize: '0.8rem' }}>{tweet.authorAvatar}</p>
        </div>
        <p className="tweet-content" style={{ fontSize: '0.9rem' }}>{tweet.content}</p>
        <div className="bomb-stats">
          <span>❤️ {tweet.likes}</span>
          <span>💬 {tweet.commentCount || 0}</span>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="how-it-works">
      <button className="how-toggle" onClick={() => setOpen(v => !v)}>
        <Info size={14} />
        <span>Vitrin nasıl çalışır?</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#52525b' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="how-body">
          <p><strong>🏆 Hot Score Formülü</strong></p>
          <code className="formula">Skor = (Beğeni×2 + Yorum + YorumBeğenisi) × 10 / (Saat ^ 1.5) × TakipçiBonusu</code>
          <p>Her 10 dakikada yeniden hesaplanır.</p>
          <p><strong>⭐ Takipçi Bonusu</strong></p>
          <p>Her 10 takipçi için +%10 skor artışı, en fazla <strong>×2</strong> (100 takipçide).</p>
          <p><strong>🎰 Rastgele Havuz</strong></p>
          <p>En yüksek puanlı <strong>50 tweet</strong> havuza alınır, buradan <strong>rastgele 10 tweet</strong> seçilir.</p>
          <p><strong>⭐ Yeni Tweet Avantajı</strong></p>
          <p>Her tweet <strong>5 puan</strong> ile başlar.</p>
        </div>
      )}
    </div>
  );
}

function EmptyFollowing() {
  return (
    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
      <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</p>
      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Henüz kimseyi takip etmiyorsun</p>
      <p style={{ fontSize: '0.85rem', color: '#71717a' }}>
        Vitrindeki ya da yeni tweetlerde birine rastla, takip et — burada tweetleri çıksın.
      </p>
    </div>
  );
}

export default function Feed() {
  const user = useAuth();
  const [tab, setTab]                       = useState('vitrin');
  const [followingSort, setFollowingSort]   = useState('new');
  const [tweets, setTweets]                 = useState([]);
  const [bombTweet, setBombTweet]           = useState(null);
  const [likedTweetIds, setLikedTweetIds]   = useState([]);
  const [likedCommentIds, setLikedCommentIds] = useState([]);
  const [followingIds, setFollowingIds]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [pullY, setPullY]                   = useState(0);
  const [pulling, setPulling]               = useState(false);
  let touchStartY = 0;

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/following-ids/${user.uid}`).then(r => r.json()),
    ]).then(([likeData, followData]) => {
      setLikedTweetIds(likeData.tweetIds || []);
      setLikedCommentIds(likeData.commentIds || []);
      setFollowingIds(followData.followingIds || []);
    }).catch(() => {});
  }, [user]);

  const fetchBomb = useCallback(async () => {
    try {
      const res  = await fetch('${API_URL}/api/bomb-tweet');
      const data = await res.json();
      setBombTweet(data);
    } catch {}
  }, []);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      let url;
      if (tab === 'vitrin')        url = '${API_URL}/api/feed';
      else if (tab === 'new')      url = '${API_URL}/api/feed/new';
      else url = `${API_URL}/api/feed/following/${user?.uid}?sort=${followingSort}`;

      const res  = await fetch(url);
      const data = await res.json();
      setTweets(Array.isArray(data) ? data : []);
    } catch {
      setTweets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, followingSort, user]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);
  useEffect(() => { if (tab === 'vitrin') fetchBomb(); }, [tab, fetchBomb]);

  const handleDelete = (id) => setTweets(prev => prev.filter(t => t._id !== id));

  const handleFollowChange = (targetId, isNowFollowing) => {
    setFollowingIds(prev =>
      isNowFollowing ? [...prev, targetId] : prev.filter(id => id !== targetId)
    );
  };

  const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    const delta = e.touches[0].clientY - touchStartY;
    if (delta > 0 && window.scrollY === 0) { setPulling(true); setPullY(Math.min(delta * 0.4, 80)); }
  };
  const onTouchEnd = () => {
    if (pullY > 50) fetchFeed(true);
    setPullY(0); setPulling(false);
  };

  return (
    <div className="page-container" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pulling && (
        <div className="pull-indicator" style={{ height: pullY }}>
          <RefreshCw size={18} className={pullY > 50 ? 'spin' : ''} />
          <span>{pullY > 50 ? 'Bırak' : 'Yenile'}</span>
        </div>
      )}

      <header className="page-header">
        <div className="header-title">
          <Flame size={18} color="#f97316" />
          <h1>Lise Vitrini</h1>
        </div>
        <button className="refresh-btn" onClick={() => fetchFeed(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
        </button>
      </header>

      <div className="feed-tabs">
        <button className={`feed-tab ${tab === 'vitrin' ? 'feed-tab--active' : ''}`} onClick={() => setTab('vitrin')}>
          <Flame size={14} /> Vitrin
        </button>
        <button className={`feed-tab ${tab === 'new' ? 'feed-tab--active' : ''}`} onClick={() => setTab('new')}>
          <Clock size={14} /> Yeni
        </button>
        <button className={`feed-tab ${tab === 'following' ? 'feed-tab--active' : ''}`} onClick={() => setTab('following')}>
          <Users size={14} /> Gönderiler
        </button>
      </div>

      {tab === 'following' && (
        <div className="feed-subtabs">
          <button className={`feed-subtab ${followingSort === 'new' ? 'feed-subtab--active' : ''}`} onClick={() => setFollowingSort('new')}>
            <Clock size={12} /> Yeni
          </button>
          <button className={`feed-subtab ${followingSort === 'hot' ? 'feed-subtab--active' : ''}`} onClick={() => setFollowingSort('hot')}>
            <TrendingUp size={12} /> Popüler
          </button>
        </div>
      )}

      <main>
        {tab === 'vitrin' && <BombTweet tweet={bombTweet} />}
        {tab === 'vitrin' && <HowItWorks />}

        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : tweets.length === 0
            ? tab === 'following'
              ? <EmptyFollowing />
              : <div className="empty-state"><p>🌵 Henüz hiç tweet yok!</p><p>İlk tweeti sen at.</p></div>
            : tweets.map(tweet => (
                <TweetCard
                  key={tweet._id}
                  tweet={tweet}
                  deviceId={user?.uid}
                  likedTweetIds={likedTweetIds}
                  likedCommentIds={likedCommentIds}
                  followingIds={followingIds}
                  onDelete={handleDelete}
                  onFollowChange={handleFollowChange}
                />
              ))
        }
      </main>

      <div style={{ height: '80px' }} />
      <Navbar />
    </div>
  );
}