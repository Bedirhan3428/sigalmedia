import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Grid3X3, Clapperboard, Camera, Bookmark,
  MoreHorizontal, Loader2, LogOut, X, Check, Settings,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile.jsx';
import PostCard from '../components/PostCard';
import ImageCropper from '../components/ImageCropper';
import { useUI } from '../context/UIContext';
import { API_URL } from '../apiConfig';

// ─── Küçük bileşenler ─────────────────────────────────────────────────────────
function ProfileAvatar({ username, avatarUrl, size = 86 }) {
  const letter = (username || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(45deg,#FCAF45,#E1306C,#833AB4)',
      padding: 3, flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: '#121212', border: '3px solid #000',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: Math.round((size - 6) * 0.38), fontWeight: 700, color: '#F5F5F5' }}>{letter}</span>
        }
      </div>
    </div>
  );
}

function MiniAvatar({ username, avatarUrl, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: '#1C1C1C', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontWeight: 700, fontSize: size * 0.38, color: '#F5F5F5' }}>{(username || '?').charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}

function BottomSheet({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2500, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
         onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 470, background: '#121212', border: '1px solid #262626', borderRadius: '16px 16px 0 0', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
           onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#363636', margin: '12px auto 4px' }} />
        {children}
      </div>
    </div>
  );
}

// ─── Ayarlar ──────────────────────────────────────────────────────────────────
function SettingsModal({ onClose, onEditOpen, onLogout }) {
  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center', padding: '12px 16px 16px', borderBottom: '1px solid #262626' }}>
        Ayarlar
      </div>
      {[
        { icon: <Settings size={20} />, label: 'Profili Düzenle', color: '#F5F5F5', action: () => { onClose(); onEditOpen(); } },
        { icon: <LogOut   size={20} />, label: 'Çıkış Yap',       color: '#FF3040', action: onLogout },
        { icon: <X        size={20} />, label: 'İptal',            color: '#737373', action: onClose },
      ].map(({ icon, label, color, action }) => (
        <button key={label} onClick={action}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px', background: 'none', border: 'none', borderBottom: '1px solid #262626', color, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
          {icon} {label}
        </button>
      ))}
    </BottomSheet>
  );
}

// ─── Profil Düzenle ───────────────────────────────────────────────────────────
function EditProfileModal({ profile, onClose, onSave, onEditAvatar }) {
  const user               = useAuth();
  const [username, setUser] = useState(profile?.username || '');
  const [bio,      setBio]  = useState(profile?.bio      || '');
  const [saving,   setSave] = useState(false);
  const [error,    setErr]  = useState('');

  const save = async () => {
    if (username.trim().length < 2) { setErr('En az 2 karakter gerekli.'); return; }
    setSave(true); setErr('');
    try {
      const res  = await fetch(`${API_URL}/api/user/${user.uid}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), bio: bio.trim().slice(0, 150) }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Hata oluştu.'); return; }
      onSave(data.user);
      onClose();
    } catch { setErr('Bağlantı hatası.'); }
    finally { setSave(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2500, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
         onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 470, background: '#121212', border: '1px solid #262626', borderRadius: '16px 16px 0 0', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
           onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #262626' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#F5F5F5', cursor: 'pointer', padding: 6, minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center' }}>
            <X size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Profili Düzenle</span>
          <button onClick={save} disabled={saving}
                  style={{ background: 'none', border: 'none', color: '#0095F6', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', padding: 6, minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', gap: 4, opacity: saving ? 0.5 : 1 }}>
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            Kaydet
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 12, border: '1px solid #262626' }}>
            <MiniAvatar username={profile?.username} avatarUrl={profile?.avatarUrl} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#F5F5F5' }}>Profil Fotoğrafı</div>
              <button
                onClick={() => { onEditAvatar(); }}
                style={{ background: 'none', border: 'none', color: '#0095F6', fontSize: 13, fontWeight: 700, padding: '4px 0', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Fotoğrafı Değiştir
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#A8A8A8', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
              KULLANICI ADI
            </label>
            <input
              value={username}
              onChange={e => setUser(e.target.value.slice(0, 30))}
              style={{ width: '100%', background: '#1C1C1C', border: '1px solid #262626', borderRadius: 8, padding: '11px 12px', color: '#F5F5F5', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              placeholder="kullanici_adi"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#A8A8A8', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
              BİYOGRAFİ
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 150))}
              rows={3}
              style={{ width: '100%', background: '#1C1C1C', border: '1px solid #262626', borderRadius: 8, padding: '11px 12px', color: '#F5F5F5', fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              placeholder="Kendin hakkında bir şeyler yaz..."
            />
            <div style={{ fontSize: 12, color: '#737373', textAlign: 'right', marginTop: 4 }}>{bio.length}/150</div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#FF6B7A', padding: '8px 12px', background: 'rgba(255,48,64,0.08)', borderRadius: 8, border: '1px solid rgba(255,48,64,0.2)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kullanıcı Listesi Modal ──────────────────────────────────────────────────
function UsersModal({ title, users, onClose }) {
  const navigate = useNavigate();
  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center', padding: '12px 16px 16px', borderBottom: '1px solid #262626' }}>{title}</div>
      <div style={{ maxHeight: '60dvh', overflowY: 'auto' }}>
        {users.length === 0
          ? <div style={{ textAlign: 'center', padding: 40, color: '#737373', fontSize: 14 }}>Kimse yok.</div>
          : users.map(u => (
              <div key={u.deviceId}
                   style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #1C1C1C', cursor: 'pointer' }}
                   onClick={() => { navigate(`/user/${u.deviceId}`); onClose(); }}>
                <MiniAvatar username={u.username} avatarUrl={u.avatarUrl} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div>
                  <div style={{ color: '#A8A8A8', fontSize: 13 }}>{u.followerCount || 0} takipçi</div>
                </div>
              </div>
            ))
        }
      </div>
    </BottomSheet>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANA PROFILE SAYFASI
// ══════════════════════════════════════════════════════════════════════════════
export default function Profile() {
  const { uid: paramUid } = useParams();
  const currentUser       = useAuth();
  const { profile: myProfile, setProfile, refetch } = useProfile();
  const { openShare } = useUI();
  const navigate = useNavigate();
  const fileRef  = useRef();

  const uid   = paramUid || currentUser?.uid;
  const isOwn = uid === currentUser?.uid;

  const [profile,      setProfileState] = useState(null);
  const [posts,        setPosts]        = useState([]);
  const [savedPosts,   setSavedPosts]   = useState([]);
  const [savedIds,     setSavedIds]     = useState([]);
  const [tab,          setTab]          = useState('grid');
  const [followers,    setFollowers]    = useState([]);
  const [following,    setFollowing]    = useState([]);
  const [modal,        setModal]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [isFollowing,  setIsFollowing]  = useState(false);
  const [cropSrc,      setCropSrc]      = useState(null);
  const [uploadingAvatar, setUpAvatar]  = useState(false);
  
  // Seçilen gönderinin indeksi
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);

  const displayProfile = isOwn ? (myProfile || profile) : profile;
  const p              = displayProfile;

  // ── Veri yükle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const promises = [
      fetch(`${API_URL}/api/${isOwn ? 'user' : 'public-user'}/${uid}`).then(r => r.json()),
      fetch(`${API_URL}/api/my-tweets/${uid}`).then(r => r.json()),
    ];

    if (isOwn && currentUser?.uid) {
      promises.push(
        fetch(`${API_URL}/api/saved-posts/${currentUser.uid}`).then(r => r.json()),
        fetch(`${API_URL}/api/saved-ids/${currentUser.uid}`).then(r => r.json()),
      );
    }

    Promise.all(promises).then(([profileData, postsData, savedData, savedIdsData]) => {
      const prof = profileData.user || profileData;
      setProfileState(prof);
      setPosts((Array.isArray(postsData) ? postsData : []).filter(post =>
        isOwn || ['active', 'cleared'].includes(post.aegisStatus)
      ));
      if (isOwn) {
        setSavedPosts(Array.isArray(savedData) ? savedData : []);
        setSavedIds(savedIdsData?.savedIds || []);
      }
      if (!isOwn && currentUser?.uid) {
        setIsFollowing((prof.followers || []).includes(currentUser.uid));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uid, isOwn, currentUser]);

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropDone = async (blob) => {
    const prevSrc = cropSrc;
    setCropSrc(null);
    if (!blob || !currentUser?.uid) return;
    setUpAvatar(true);
    try {
      const path = `avatars/${currentUser.uid}/profile.jpg`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, blob, { contentType: 'image/jpeg' });
      const url  = await getDownloadURL(sRef);
      const res  = await fetch(`${API_URL}/api/user/${currentUser.uid}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (res.ok) {
        await refetch();
        setProfileState(prev => prev ? { ...prev, avatarUrl: url } : prev);
      }
    } catch (err) {
      alert('Fotoğraf yüklenemedi: ' + err.message);
    } finally {
      setUpAvatar(false);
      URL.revokeObjectURL(prevSrc);
    }
  };

  // ── Takip ────────────────────────────────────────────────────────────────────
  const handleFollow = async () => {
    const now = !isFollowing;
    setIsFollowing(now);
    try {
      await fetch(`${API_URL}/api/follow`, {
        method: now ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.uid, targetId: uid }),
      });
      setProfileState(prev => prev ? {
        ...prev,
        followers: now ? [...(prev.followers || []), currentUser.uid]
                       : (prev.followers || []).filter(f => f !== currentUser.uid),
      } : prev);
    } catch { setIsFollowing(!now); }
  };

  const openFollowers = async () => {
    const res  = await fetch(`${API_URL}/api/followers/${uid}`);
    const data = await res.json();
    setFollowers(Array.isArray(data) ? data : []);
    setModal('followers');
  };

  const openFollowing = async () => {
    const res  = await fetch(`${API_URL}/api/following/${uid}`);
    const data = await res.json();
    setFollowing(Array.isArray(data) ? data : []);
    setModal('following');
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const postCount  = posts.length;
  const follCount  = p?.followers?.length  ?? p?.followerCount  ?? 0;
  const followCnt  = p?.following?.length  ?? p?.followingCount ?? 0;
  const videoPosts = posts.filter(post => post.mediaType === 'video');

  const currentTabPosts = tab === 'reels' ? videoPosts : tab === 'saved' ? savedPosts : posts;

  if (loading) return (
    <div className="page">
      <div className="center-loader" style={{ paddingTop: 100 }}><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="page">
      {/* ── Kırpma Popup ────────────────────────────────────────────────────── */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={1}
          onCrop={handleCropDone}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal === 'settings' && (
        <SettingsModal
          onClose={() => setModal('')}
          onEditOpen={() => setModal('edit')}
          onLogout={handleLogout}
        />
      )}
      {modal === 'edit' && (
        <EditProfileModal
          profile={myProfile || profile}
          onClose={() => setModal('')}
          onSave={(updated) => { setProfile(updated); setProfileState(updated); }}
          onEditAvatar={() => { setModal(''); fileRef.current?.click(); }}
        />
      )}
      {modal === 'followers' && (
        <UsersModal title={`Takipçiler (${follCount})`} users={followers} onClose={() => setModal('')} />
      )}
      {modal === 'following' && (
        <UsersModal title={`Takip Edilenler (${followCnt})`} users={following} onClose={() => setModal('')} />
      )}

      {/* Gizli file input */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic"
             style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #262626',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        paddingTop: 'max(10px, env(safe-area-inset-top))',
      }}>
        {!isOwn
          ? <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F5F5F5', cursor: 'pointer', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={22} />
            </button>
          : <div style={{ width: 40 }} />
        }
        <span style={{ fontWeight: 700, fontSize: 17 }}>{p?.username || 'Profil'}</span>
        {isOwn
          ? <button onClick={() => setModal('settings')} style={{ background: 'none', border: 'none', color: '#F5F5F5', cursor: 'pointer', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <MoreHorizontal size={24} />
            </button>
          : <div style={{ width: 40 }} />
        }
      </header>

      {/* ── PROFİL ÜSTÜ ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#000' }}>
        {/* Avatar + Stats */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: '20px 16px 16px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ProfileAvatar username={p?.username} avatarUrl={p?.avatarUrl} size={86} />
            {isOwn && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#0095F6',
                  boxShadow: '0 0 0 2.5px #000',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                }}
              >
                {uploadingAvatar
                  ? <Loader2 size={13} color="#fff" className="spin" />
                  : <Camera size={13} color="#fff" />
                }
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1, color: '#F5F5F5' }}>{postCount}</span>
              <span style={{ fontSize: 13, color: '#F5F5F5', lineHeight: 1 }}>gönderi</span>
            </div>
            <button onClick={openFollowers} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#F5F5F5', padding: '4px 8px' }}>
              <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{follCount}</span>
              <span style={{ fontSize: 13, lineHeight: 1 }}>takipçi</span>
            </button>
            <button onClick={openFollowing} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#F5F5F5', padding: '4px 8px' }}>
              <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{followCnt}</span>
              <span style={{ fontSize: 13, lineHeight: 1 }}>takip</span>
            </button>
          </div>
        </div>

        {/* Bio */}
        <div style={{ padding: '0 16px 12px' }}>
          {p?.username && <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#F5F5F5' }}>{p.username}</div>}
          {p?.bio && <div style={{ fontSize: 14, lineHeight: 1.5, color: '#F5F5F5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{p.bio}</div>}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
          {isOwn ? (
            <>
              <button onClick={() => setModal('edit')} style={{ flex: 1, padding: '7px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #262626', color: '#F5F5F5', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Profili Düzenle
              </button>
              <button onClick={openShare} style={{ flex: 1, padding: '7px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #262626', color: '#F5F5F5', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                İçerik Paylaş
              </button>
            </>
          ) : (
            <>
              <button onClick={handleFollow} style={{ flex: 2, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', background: isFollowing ? 'transparent' : '#0095F6', border: isFollowing ? '1px solid #262626' : 'none', color: '#F5F5F5', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
                {isFollowing ? 'Takiptesin' : 'Takip Et'}
              </button>
              <button onClick={() => navigate(`/messages/${uid}`)} style={{ flex: 2, padding: '7px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #262626', color: '#F5F5F5', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Mesaj
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderTop: '1px solid #262626' }}>
          {[
            { id: 'grid',  icon: <Grid3X3     size={22} /> },
            { id: 'reels', icon: <Clapperboard size={22} /> },
            ...(isOwn ? [{ id: 'saved', icon: <Bookmark size={22} /> }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? '#F5F5F5' : '#737373', borderBottom: `2px solid ${tab === t.id ? '#F5F5F5' : 'transparent'}`, marginBottom: -1, minHeight: 46 }}>
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── GÖNDERİLER (YENİ IZGARA / KAYDIRILABİLİR GÖRÜNÜM VE VİDEO DÜZELTMESİ) ───────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {currentTabPosts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 40 }}>{tab === 'reels' ? '🎬' : tab === 'saved' ? '🔖' : '📸'}</span>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#F5F5F5', margin: 0 }}>
              {tab === 'reels' ? 'Henüz video yok' : tab === 'saved' ? 'Kaydedilen gönderi yok' : 'Henüz gönderi yok'}
            </p>
            {isOwn && tab !== 'saved' && <p style={{ fontSize: 14, color: '#737373', margin: 0 }}>İlk gönderini paylaş!</p>}
            {tab === 'saved' && <p style={{ fontSize: 14, color: '#737373', margin: 0 }}>Kaydettiğin gönderiler burada görünür.</p>}
          </div>
        ) : selectedPostIndex === null ? (
          // IZGARA GÖRÜNÜMÜ
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', paddingBottom: '60px' }}>
              {currentTabPosts.map((post, index) => (
                  <div 
                      key={post._id} 
                      onClick={() => setSelectedPostIndex(index)}
                      style={{ aspectRatio: '1', background: '#262626', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  >
                      {post.imageUrl ? (
                          <img 
                              src={post.imageUrl} 
                              alt="Gönderi" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                      ) : post.videoUrl ? (
                          <video 
                              src={`${post.videoUrl}#t=0.1`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
                              muted 
                              playsInline 
                          />
                      ) : (
                          <div style={{ padding: '8px', fontSize: '10px', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', wordBreak: 'break-word' }}>
                              {post.content?.slice(0, 45)}{post.content?.length > 45 ? '...' : ''}
                          </div>
                      )}
                  </div>
              ))}
          </div>
        ) : (
          // TAM EKRAN KAYDIRILABİLİR AKIŞ GÖRÜNÜMÜ
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000', overflowY: 'auto' }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1001, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #262626' }}>
                  <button 
                      onClick={() => setSelectedPostIndex(null)} 
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                      <ArrowLeft size={24} />
                  </button>
                  <span style={{ color: '#fff', marginLeft: '16px', fontWeight: 'bold', fontSize: '16px' }}>Gönderiler</span>
              </div>
              <div style={{ paddingBottom: '80px' }}>
                  {currentTabPosts.slice(selectedPostIndex).map(post => (
                      <PostCard
                        key={post._id}
                        post={post}
                        deviceId={currentUser?.uid}
                        likedTweetIds={[]}
                        likedCommentIds={[]}
                        followingIds={[]}
                        savedTweetIds={savedIds}
                        onDelete={() => setPosts(prev => prev.filter(p => p._id !== post._id))}
                        onSaveChange={(id, isSaved) => {
                          setSavedIds(prev => isSaved ? [...prev, id] : prev.filter(x => x !== id));
                          if (isSaved) setSavedPosts(prev => [post, ...prev]);
                          else setSavedPosts(prev => prev.filter(p => p._id !== id));
                        }}
                      />
                  ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}