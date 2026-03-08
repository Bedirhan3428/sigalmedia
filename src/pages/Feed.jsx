import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Flame, Clock, Zap, Info, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TweetCard from '../components/TweetCard';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

const avatarColors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];

// ─── Skeleton ─────────────────────────────────────────────────────────────
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

// ─── Bomb Tweet ───────────────────────────────────────────────────────────
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

// ─── Nasıl Çalışır ────────────────────────────────────────────────────────
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
          <h4>🚀 Keşfet'in Efendisi Olma Rehberi</h4>
          <p>Şigal Medya'da sesini tüm okula duyurmak sadece şans değil, biraz da strateji işi knk. İşte tweetlerini zirveye taşıyacak o gizli taktikler:</p>
          <h4>⏱️ İlk Dakikalar Altın Değerinde</h4>
          <p>Tweetin paylaşıldığı ilk anlarda aldığın her beğeni ve yorum, puanını roketler. Zaman geçtikçe tweetin "sıcaklığı" düşer ve aşağılara iner. Bu yüzden herkesin telefonda olduğu teneffüs saatlerini iyi kolla!</p>
          <h4>👥 Takipçi Gücünü Arkana Al</h4>
          <p>Daha çok takipçi, daha çok puan demek! Her 10 takipçin sana %10 ekstra puan kazandırır. 100 takipçiye ulaştığında ise attığın her tweet otomatik olarak 2 kat daha güçlü sayılır.</p>
          <h4>💬 Etkileşim Kur, Puanları Topla</h4>
          <p>Sadece kendi tweetine gelen beğeniler değil, altına yapılan yorumlar ve o yorumların aldığı beğeniler bile seni yukarı taşır.</p>
          <h4>🎯 İlk 50'ye Gir, Piyangoyu Yakala</h4>
          <p>Sistem sürekli en yüksek puanlı 50 tweeti seçip bir havuzda toplar. Bu havuzdan rastgele 10 tweet ana sayfada parlar.</p>
          <h4>✨ Her Tweet Yeni Bir Şans</h4>
          <p>Eski tweetin tutmadı diye üzülme. Attığın her yeni tweet 5 bonus puanla başlar. Pes etme!</p>
        </div>
      )}
    </div>
  );
}

// ─── Boş Following ────────────────────────────────────────────────────────
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

// ─── Boş Feed ─────────────────────────────────────────────────────────────
function EmptyFeed({ tab }) {
  if (tab === 'following') return <EmptyFollowing />;
  return (
    <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌵</p>
      <p style={{ fontWeight: 700, fontSize: '1rem', color: '#e4e4e7', marginBottom: '6px' }}>
        Henüz buralar çok sessiz...
      </p>
      <p style={{ fontSize: '0.85rem', color: '#71717a', lineHeight: 1.5 }}>
        İlk tweeti sen at ve vitrini hareketlendir! 🔥
      </p>
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────
export default function Feed() {
  const user = useAuth();

  const [tab,                    setTab]                    = useState('vitrin');
  const [followingSort,          setFollowingSort]          = useState('new');
  const [tweets,                 setTweets]                 = useState([]);
  const [bombTweet,              setBombTweet]              = useState(null);
  const [likedTweetIds,          setLikedTweetIds]          = useState([]);
  const [likedCommentIds,        setLikedCommentIds]        = useState([]);
  const [followingIds,           setFollowingIds]           = useState([]);
  const [loading,                setLoading]                = useState(true);
  const [refreshing,             setRefreshing]             = useState(false);
  const [pullY,                  setPullY]                  = useState(0);
  const [pulling,                setPulling]                = useState(false);

  let touchStartY = 0;

  // ── Beğeni + takip ID'lerini çek ─────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/following-ids/${user.uid}`).then(r => r.json()),
    ])
      .then(([likeData, followData]) => {
        setLikedTweetIds(likeData.tweetIds   || []);
        setLikedCommentIds(likeData.commentIds || []);
        setFollowingIds(followData.followingIds || []);
      })
      .catch(() => {});
  }, [user]);

  // ── Bomb tweet ───────────────────────────────────────────────────────
  const fetchBomb = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/bomb-tweet`);
      const data = await res.json();
      setBombTweet(data);
    } catch {}
  }, []);

  // ── Ana feed fetch ────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!user?.uid) return;

    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      let url;
      if (tab === 'vitrin')      url = `${API_URL}/api/feed`;
      else if (tab === 'new')    url = `${API_URL}/api/feed/new`;
      else                       url = `${API_URL}/api/feed/following/${user.uid}?sort=${followingSort}`;

      const res  = await fetch(url);

      // HTTP hata kontrolü
      if (!res.ok) {
        console.error('Feed fetch hatası:', res.status);
        setTweets([]);
        return;
      }

      const data = await res.json();
      setTweets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Feed fetch exception:', err);
      setTweets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, followingSort, user]);

  useEffect(() => { fetchFeed(); },             [fetchFeed]);
  useEffect(() => { if (tab === 'vitrin') fetchBomb(); }, [tab, fetchBomb]);

  // ── Event handler'lar ─────────────────────────────────────────────────
  const handleDelete       = (id)           => setTweets(prev => prev.filter(t => t._id !== id));
  const handleFollowChange = (targetId, isNowFollowing) => {
    setFollowingIds(prev =>
      isNowFollowing ? [...prev, targetId] : prev.filter(id => id !== targetId)
    );
  };

  // ── Pull-to-refresh ───────────────────────────────────────────────────
  const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    const delta = e.touches[0].clientY - touchStartY;
    if (delta > 0 && window.scrollY === 0) { setPulling(true); setPullY(Math.min(delta * 0.4, 80)); }
  };
  const onTouchEnd = () => {
    if (pullY > 50) fetchFeed(true);
    setPullY(0);
    setPulling(false);
  };

  return (
    <div
      className="page-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indikatörü */}
      {pulling && (
        <div className="pull-indicator" style={{ height: pullY }}>
          <RefreshCw size={18} className={pullY > 50 ? 'spin' : ''} />
          <span>{pullY > 50 ? 'Bırak' : 'Yenile'}</span>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="header-title">
          <Flame size={18} color="#f97316" />
          <h1>Lise Vitrini</h1>
        </div>
        <button className="refresh-btn" onClick={() => fetchFeed(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
        </button>
      </header>

      {/* Tab'lar */}
      <div className="feed-tabs">
        <button className={`feed-tab ${tab === 'vitrin'    ? 'feed-tab--active' : ''}`} onClick={() => setTab('vitrin')}>
          <Flame size={14} /> Vitrin
        </button>
        <button className={`feed-tab ${tab === 'new'       ? 'feed-tab--active' : ''}`} onClick={() => setTab('new')}>
          <Clock size={14} /> Yeni
        </button>
        <button className={`feed-tab ${tab === 'following' ? 'feed-tab--active' : ''}`} onClick={() => setTab('following')}>
          <Users size={14} /> Gönderiler
        </button>
      </div>

      {/* Following alt tab'ları */}
      {tab === 'following' && (
        <div className="feed-subtabs">
          <button
            className={`feed-subtab ${followingSort === 'new' ? 'feed-subtab--active' : ''}`}
            onClick={() => setFollowingSort('new')}
          >
            <Clock size={12} /> Yeni
          </button>
          <button
            className={`feed-subtab ${followingSort === 'hot' ? 'feed-subtab--active' : ''}`}
            onClick={() => setFollowingSort('hot')}
          >
            <TrendingUp size={12} /> Popüler
          </button>
        </div>
      )}

      <main>
        {/* Vitrin'e özel üst kartlar */}
        {tab === 'vitrin' && <BombTweet tweet={bombTweet} />}
        {tab === 'vitrin' && <HowItWorks />}

        {/* Tweet listesi */}
        {loading ? (
          // Skeleton yükleme
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : tweets.length === 0 ? (
          // Boş durum
          <EmptyFeed tab={tab} />
        ) : (
          // ── TweetCard listesi ──────────────────────────────────────────
          // Tüm prop'lar eksiksiz aktarılıyor:
          //   tweet          → tweet objesi
          //   deviceId       → kullanıcının uid'i
          //   likedTweetIds  → beğenilen tweet id'leri (kalp durumu için)
          //   likedCommentIds→ beğenilen yorum id'leri
          //   followingIds   → takip edilen kullanıcı id'leri
          //   onDelete       → tweet silinince feed'den kaldır
          //   onFollowChange → takip değişince followingIds güncelle
          tweets.map(tweet => (
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
        )}
      </main>

      {/* Navbar yüksekliği kadar boşluk */}
      <div style={{ height: '80px' }} />
      <Navbar />
    </div>
  );
}