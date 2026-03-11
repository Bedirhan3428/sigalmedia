import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Twitter, Activity, Heart, MessageCircle, Settings, X, Check, UserMinus, Users } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TweetCard, { Avatar } from '../components/TweetCard';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

const avatarColors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'az önce';
  if (diff < 3600)  return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

// ─── Beğenilen Tweet satırı ───────────────────────────────────────────────
function LikedTweetRow({ tweet, deviceId, onUnlike }) {
  const [unliking, setUnliking] = useState(false);
  const handleUnlike = async () => {
    setUnliking(true);
    try {
      await fetch(`${API_URL}/api/like/${tweet._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      onUnlike(tweet._id);
    } catch { setUnliking(false); }
  };
  return (
    <div className="activity-row">
      <Avatar name={tweet.authorAvatar} avatarUrl={tweet.authorAvatarUrl} size={32} />
      <div style={{ flex: 1, minWidth: 0, marginLeft: '10px' }}>
        <p className="activity-author">{tweet.authorAvatar}</p>
        <p className="activity-content">{tweet.content}</p>
        <p className="activity-time">{timeAgo(tweet.createdAt)}</p>
      </div>
      <button className={`activity-unlike-btn ${unliking ? 'activity-unlike-btn--loading' : ''}`}
        onClick={handleUnlike} disabled={unliking}>
        <Heart size={14} fill="#f43f5e" color="#f43f5e" />
      </button>
    </div>
  );
}

// ─── Beğenilen Yorum satırı ───────────────────────────────────────────────
function LikedCommentRow({ comment, deviceId, onUnlike }) {
  const [unliking, setUnliking] = useState(false);
  const handleUnlike = async () => {
    setUnliking(true);
    try {
      await fetch(`${API_URL}/api/like-comment/${comment._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      onUnlike(comment._id);
    } catch { setUnliking(false); }
  };
  return (
    <div className="activity-row">
      <Avatar name={comment.authorAvatar} avatarUrl={comment.authorAvatarUrl} size={28} />
      <div style={{ flex: 1, minWidth: 0, marginLeft: '10px' }}>
        <p className="activity-author">{comment.authorAvatar} <span className="activity-badge">yorum</span></p>
        <p className="activity-content">{comment.content}</p>
        <p className="activity-time">{timeAgo(comment.createdAt)}</p>
      </div>
      <button className={`activity-unlike-btn ${unliking ? 'activity-unlike-btn--loading' : ''}`}
        onClick={handleUnlike} disabled={unliking}>
        <Heart size={14} fill="#f43f5e" color="#f43f5e" />
      </button>
    </div>
  );
}

// ─── Ayarlar Modalı ───────────────────────────────────────────────────────
function SettingsModal({ user, profile, onClose, onSave }) {
  const [avatars, setAvatars]       = useState([]);
  const [username, setUsername]     = useState(profile?.username || profile?.avatar || '');
  const [selectedAv, setSelectedAv] = useState(null); // null = değişiklik yok
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/avatars`)
      .then(r => r.json())
      .then(d => setAvatars(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (username.trim().length < 2) return setError('En az 2 karakter gerekli.');
    setSaving(true); setError('');
    try {
      const body = { username: username.trim() };

      // FIX: avatar temizleme logic'i düzeltildi.
      // selectedAv === null  → avatara dokunma (body'ye ekleme)
      // selectedAv?.id === '__clear__' → avatarı kaldır (null gönder)
      // selectedAv?.url var  → yeni avatar seç
      if (selectedAv !== null) {
        body.avatarUrl = selectedAv.id === '__clear__' ? null : selectedAv.url;
      }

      const res  = await fetch(`${API_URL}/api/user/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Hata oluştu.');
      onSave(data.user);
      onClose();
    } catch { setError('Sunucuya ulaşılamadı.'); }
    finally { setSaving(false); }
  };

  const currentAvatarUrl = selectedAv === null
    ? profile?.avatarUrl                          // değişiklik yok → mevcut
    : selectedAv.id === '__clear__'
      ? null                                      // temizlendi
      : selectedAv.url;                           // yeni seçim

  const displayName = username || profile?.username || profile?.avatar || '';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, backgroundColor: '#18181b',
        borderRadius: '16px 16px 0 0', padding: '20px 16px 32px',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Profili Düzenle</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Önizleme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Avatar name={displayName} avatarUrl={currentAvatarUrl} size={56} />
          <div>
            <p style={{ color: '#fff', fontWeight: 600 }}>{displayName || 'Kullanıcı'}</p>
            <p style={{ color: '#71717a', fontSize: '0.8rem' }}>Önizleme</p>
          </div>
        </div>

        {/* Username */}
        <label style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Kullanıcı Adı</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value.slice(0, 30))}
          maxLength={30}
          placeholder="Kullanıcı adı"
          style={{
            width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a',
            borderRadius: '8px', padding: '10px 12px', color: '#fff',
            fontSize: '0.95rem', marginBottom: '16px', boxSizing: 'border-box',
          }}
        />

        {/* Avatar seç */}
        <label style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>Profil Görseli</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
          gap: '10px',
          maxHeight: '200px',
          overflowY: 'auto',
          marginBottom: '16px',
          padding: '4px 2px',
        }}>
          {/* Mevcut avatarı kaldır butonu — sadece mevcut bir avatar varsa göster */}
          {profile?.avatarUrl && (
            <button
              onClick={() => setSelectedAv({ id: '__clear__', url: null })}
              style={{
                aspectRatio: '1/1',
                borderRadius: '50%',
                border: selectedAv?.id === '__clear__' ? '3px solid #6366f1' : '2px solid #3f3f46',
                backgroundColor: '#27272a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#71717a',
                fontSize: '12px',
                width: '100%',
                flexShrink: 0,
              }}
            >✕</button>
          )}
          {avatars.map(av => (
            <button key={av.id} onClick={() => setSelectedAv(av)} style={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: '50%',
              border: selectedAv?.id === av.id ? '3px solid #6366f1' : '2px solid #27272a',
              backgroundColor: '#18181b',
              padding: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: selectedAv?.id === av.id ? '0 0 0 2px rgba(99,102,241,0.3)' : 'none',
            }}>
              <img src={av.url} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </button>
          ))}
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
          backgroundColor: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          {saving ? 'Kaydediliyor...' : <><Check size={16} /> Kaydet</>}
        </button>
      </div>
    </div>
  );
}

// ─── Takipçi/Takip Listesi Modalı ────────────────────────────────────────
function UserListModal({ title, users, myDeviceId, myFollowingIds, onClose, onUnfollow }) {
  const [followingIds, setFollowingIds] = useState(myFollowingIds);
  const [loadingId, setLoadingId]       = useState(null);

  const handleUnfollow = async (targetId) => {
    setLoadingId(targetId);
    try {
      await fetch(`${API_URL}/api/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: myDeviceId, targetId }),
      });
      setFollowingIds(prev => prev.filter(id => id !== targetId));
      onUnfollow?.(targetId);
    } catch {}
    finally { setLoadingId(null); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, backgroundColor: '#18181b',
        borderRadius: '16px 16px 0 0', padding: '20px 0 32px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 16px' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {users.length === 0
            ? <p style={{ color: '#52525b', textAlign: 'center', padding: '32px 0', fontSize: '0.9rem' }}>Kimse yok.</p>
            : users.map(u => {
                const isFollowing = followingIds.includes(u.deviceId);
                const isMe = u.deviceId === myDeviceId;
                return (
                  <div key={u.deviceId} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 16px', borderBottom: '1px solid #27272a',
                  }}>
                    <Avatar name={u.username} avatarUrl={u.avatarUrl} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{u.username}</p>
                      <p style={{ color: '#71717a', fontSize: '0.75rem', margin: 0 }}>{u.followerCount} takipçi</p>
                    </div>
                    {!isMe && isFollowing && (
                      <button
                        onClick={() => handleUnfollow(u.deviceId)}
                        disabled={loadingId === u.deviceId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 12px', borderRadius: '999px',
                          border: '1px solid #3f3f46', backgroundColor: 'transparent',
                          color: '#f43f5e', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          opacity: loadingId === u.deviceId ? 0.5 : 1,
                        }}
                      >
                        <UserMinus size={12} /> Bırak
                      </button>
                    )}
                    {!isMe && !isFollowing && (
                      <span style={{ color: '#52525b', fontSize: '0.75rem' }}>Takip etmiyorsun</span>
                    )}
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

// ─── Ana Profil Bileşeni ──────────────────────────────────────────────────
export default function Profile() {
  const user     = useAuth();
  const navigate = useNavigate();

  const [profileTab, setProfileTab]   = useState('tweets');
  const [activityTab, setActivityTab] = useState('liked-tweets');

  const [profile, setProfile]               = useState(null);
  const [myTweets, setMyTweets]             = useState([]);
  const [likedTweets, setLikedTweets]       = useState([]);
  const [likedComments, setLikedComments]   = useState([]);
  const [likedTweetIds, setLikedTweetIds]   = useState([]);
  const [likedCommentIds, setLikedCommentIds] = useState([]);
  const [followingIds, setFollowingIds]     = useState([]);
  const [loading, setLoading]               = useState(true);

  const [showSettings, setShowSettings]         = useState(false);
  const [showFollowers, setShowFollowers]       = useState(false);
  const [showFollowing, setShowFollowing]       = useState(false);
  const [followerList, setFollowerList]         = useState([]);
  const [followingList, setFollowingList]       = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      fetch(`${API_URL}/api/user/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/my-tweets/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/my-likes/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/liked-ids/${user.uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/following-ids/${user.uid}`).then(r => r.json()),
    ]).then(([profileData, tweetsData, likesData, idsData, followData]) => {
      setProfile(profileData?.user || null);
      setMyTweets(Array.isArray(tweetsData) ? tweetsData : []);
      setLikedTweets(Array.isArray(likesData?.likedTweets) ? likesData.likedTweets : []);
      setLikedComments(Array.isArray(likesData?.likedComments) ? likesData.likedComments : []);
      setLikedTweetIds(idsData?.tweetIds || []);
      setLikedCommentIds(idsData?.commentIds || []);
      setFollowingIds(followData?.followingIds || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const openFollowers = async () => {
    const data = await fetch(`${API_URL}/api/followers/${user.uid}`).then(r => r.json());
    setFollowerList(Array.isArray(data) ? data : []);
    setShowFollowers(true);
  };
  const openFollowing = async () => {
    const data = await fetch(`${API_URL}/api/following/${user.uid}`).then(r => r.json());
    setFollowingList(Array.isArray(data) ? data : []);
    setShowFollowing(true);
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  const limitDots = Array.from({ length: 3 }, (_, i) => i < (profile?.dailyLimit || 0));

  return (
    <div className="page-container">
      {showSettings && (
        <SettingsModal
          user={user}
          profile={profile}
          onClose={() => setShowSettings(false)}
          onSave={(updated) => setProfile(updated)}
        />
      )}
      {showFollowers && (
        <UserListModal
          title={`Takipçiler (${profile?.followers?.length || 0})`}
          users={followerList}
          myDeviceId={user?.uid}
          myFollowingIds={followingIds}
          onClose={() => setShowFollowers(false)}
          onUnfollow={(id) => setFollowingIds(prev => prev.filter(x => x !== id))}
        />
      )}
      {showFollowing && (
        <UserListModal
          title={`Takip Edilenler (${profile?.following?.length || 0})`}
          users={followingList}
          myDeviceId={user?.uid}
          myFollowingIds={followingIds}
          onClose={() => setShowFollowing(false)}
          onUnfollow={(id) => {
            setFollowingIds(prev => prev.filter(x => x !== id));
            setFollowingList(prev => prev.filter(u => u.deviceId !== id));
            setProfile(prev => prev ? { ...prev, following: (prev.following || []).filter(x => x !== id) } : prev);
          }}
        />
      )}

      <header className="page-header">
        <h1>Profil</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="logout-btn" onClick={() => setShowSettings(true)} style={{ gap: '6px' }}>
            <Settings size={15} /> Ayarlar
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Çıkış
          </button>
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        {loading ? (
          <div className="profile-skeleton">
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-line mid" />
          </div>
        ) : (
          <>
            <div className="profile-card">
              <Avatar name={profile?.username || profile?.avatar} avatarUrl={profile?.avatarUrl} size={56} />
              <div style={{ marginLeft: '12px', flex: 1 }}>
                <h2 className="profile-name">{profile?.username || profile?.avatar || 'Anonim'}</h2>
                <p className="profile-email">{user?.email}</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <button onClick={openFollowers} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: '0.82rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <strong style={{ color: '#e4e4e7' }}>{profile?.followers?.length || 0}</strong> takipçi
                  </button>
                  <button onClick={openFollowing} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: '0.82rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <strong style={{ color: '#e4e4e7' }}>{profile?.following?.length || 0}</strong> takip
                  </button>
                </div>
              </div>
            </div>

            <div className="limit-card">
              <p className="limit-title">Günlük Tweet Hakkı</p>
              <div className="limit-dots">
                {limitDots.map((active, i) => (
                  <div key={i} className={`limit-dot ${active ? 'limit-dot--active' : ''}`} />
                ))}
              </div>
              <p className="limit-sub">
                {profile?.dailyLimit === 0
                  ? 'Bugünlük hakkın bitti. Yarın sıfırlanır!'
                  : `${profile?.dailyLimit || 0} tweet hakkın kaldı.`}
              </p>
            </div>

            <div className="profile-tabs">
              <button className={`profile-tab ${profileTab === 'tweets' ? 'profile-tab--active' : ''}`} onClick={() => setProfileTab('tweets')}>
                <Twitter size={14} /> Tweetlerim ({myTweets.length})
              </button>
              <button className={`profile-tab ${profileTab === 'activity' ? 'profile-tab--active' : ''}`} onClick={() => setProfileTab('activity')}>
                <Activity size={14} /> Hareketlerim
              </button>
            </div>

            {profileTab === 'tweets' && (
              myTweets.length === 0
                ? <div className="empty-state"><p>Henüz tweet atmadın.</p></div>
                : myTweets.map(tweet => (
                    <TweetCard key={tweet._id} tweet={tweet} deviceId={user?.uid}
                      likedTweetIds={likedTweetIds} likedCommentIds={likedCommentIds}
                      followingIds={followingIds}
                      onDelete={(id) => setMyTweets(prev => prev.filter(t => t._id !== id))}
                    />
                  ))
            )}

            {profileTab === 'activity' && (
              <div>
                <div className="activity-subtabs">
                  <button className={`activity-subtab ${activityTab === 'liked-tweets' ? 'activity-subtab--active' : ''}`} onClick={() => setActivityTab('liked-tweets')}>
                    <Heart size={13} /> Beğenilen Tweetler {likedTweets.length > 0 && <span className="activity-count">{likedTweets.length}</span>}
                  </button>
                  <button className={`activity-subtab ${activityTab === 'liked-comments' ? 'activity-subtab--active' : ''}`} onClick={() => setActivityTab('liked-comments')}>
                    <MessageCircle size={13} /> Beğenilen Yorumlar {likedComments.length > 0 && <span className="activity-count">{likedComments.length}</span>}
                  </button>
                </div>

                {activityTab === 'liked-tweets' && (
                  likedTweets.length === 0
                    ? <div className="empty-state"><p>❤️ Henüz hiç tweet beğenmedin.</p></div>
                    : <div className="activity-list">
                        {likedTweets.map(tweet => (
                          <LikedTweetRow key={tweet._id} tweet={tweet} deviceId={user?.uid}
                            onUnlike={(id) => setLikedTweets(prev => prev.filter(t => t._id !== id))} />
                        ))}
                      </div>
                )}
                {activityTab === 'liked-comments' && (
                  likedComments.length === 0
                    ? <div className="empty-state"><p>💬 Henüz hiç yorum beğenmedin.</p></div>
                    : <div className="activity-list">
                        {likedComments.map(comment => (
                          <LikedCommentRow key={comment._id} comment={comment} deviceId={user?.uid}
                            onUnlike={(id) => setLikedComments(prev => prev.filter(c => c._id !== id))} />
                        ))}
                      </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <div style={{ height: '80px' }} />
      <Navbar />
    </div>
  );
}