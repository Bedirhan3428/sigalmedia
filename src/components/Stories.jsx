import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, ImagePlus, Video, Loader2, Camera, Play } from 'lucide-react';
import { ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../context/StoryContext';
import { useProfile } from '../hooks/useProfile.jsx';
import { storage } from '../firebase';
import { Trash2 } from 'lucide-react';
import { compressImage, compressVideo } from '../utils/mediaCompressor';
import { API_URL } from '../apiConfig';

// ─── Story Viewer (resim + video desteği) ─────────────────────────────────────
function StoryViewer({ story, onClose, isOwn, onDelete, onView }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const viewedRef = useRef(false);

  const isVideo = story.mediaType === 'video' || story.imageUrl?.includes('/o/videos');

  useEffect(() => {
    // 2 saniye sonra veya video bitince 'viewed' olarak işaretle
    if (!viewedRef.current) {
        onView?.(story._id);
        viewedRef.current = true;
    }
  }, [story._id, onView]);

  useEffect(() => {
    setProgress(0);

    if (isVideo && videoRef.current) {
      // Video story: süre video süresine göre
      const vid = videoRef.current;
      vid.play().catch(() => {});

      const onTimeUpdate = () => {
        if (vid.duration) {
          setProgress((vid.currentTime / vid.duration) * 100);
        }
      };
      const onEnded = () => {
        setProgress(100);
        onClose();
      };
      vid.addEventListener('timeupdate', onTimeUpdate);
      vid.addEventListener('ended', onEnded);

      return () => {
        vid.removeEventListener('timeupdate', onTimeUpdate);
        vid.removeEventListener('ended', onEnded);
        vid.pause();
      };
    } else {
      // Resim veya metin story: 5 saniye
      const duration = 5000;
      const step     = 100;
      let elapsed    = 0;

      timerRef.current = setInterval(() => {
        elapsed += step;
        setProgress(elapsed / duration * 100);
        if (elapsed >= duration) {
          clearInterval(timerRef.current);
          onClose();
        }
      }, step);

      return () => clearInterval(timerRef.current);
    }
  }, [onClose, isVideo]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 3, padding: '12px 12px 0', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 2, transition: isVideo ? 'none' : 'width 0.1s linear' }} />
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#1C1C1C', flexShrink: 0 }}>
          {story.avatarUrl
            ? <img src={story.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>{story.username?.charAt(0)?.toUpperCase()}</div>
          }
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#fff' }}>{story.username}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{timeAgo(story.createdAt)}</span>
        
        {isOwn && (
          <button 
            onClick={(e) => { e.stopPropagation(); if (window.confirm('Hikayeyi silmek istediğine emin misin?')) onDelete?.(story._id); }}
            style={{ background: 'rgba(255,48,64,0.1)', border: 'none', color: '#FF3040', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={18} />
          </button>
        )}

        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6 }}>
          <X size={22} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
           onClick={onClose}>
        {story.imageUrl ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={story.imageUrl}
              playsInline
              muted={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <img src={story.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `hsl(${(story.username?.charCodeAt(0) || 0) * 37 % 360}, 45%, 20%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
          }}>
            {story.text && (
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 600, lineHeight: 1.5, textAlign: 'center' }}>
                {story.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return '';
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
  return `${Math.floor(diff / 86400)}g`;
}

// ─── Story Create Modal (resim + video desteği) ───────────────────────────────
function StoryCreateModal({ onClose, onSuccess }) {
  const user        = useAuth();
  const { profile } = useProfile();
  const imgRef     = useRef();
  const vidRef     = useRef();
  const [preview,   setPreview] = useState(null);  // { url, type: 'image'|'video' }
  const [file,      setFile]    = useState(null);
  const [uploading, setUploading] = useState(false);
  const [text,      setText]    = useState('');
  const [progress,  setProgress] = useState(0);

  const handleImageChange = async (e) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    e.target.value = '';
    try {
      const { file: compressed, url } = await compressImage(raw);
      setPreview({ url, type: 'image' });
      setFile(compressed);
    } catch {}
  };

  const handleVideoChange = async (e) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    e.target.value = '';

    const sizeMB = raw.size / (1024 * 1024);
    if (sizeMB > 100) {
      alert('Video çok büyük (maks. 100MB)');
      return;
    }

    setUploading(true);
    setProgress(0);

    let finalFile = raw;
    let url = URL.createObjectURL(raw);

    try {
      const result = await compressVideo(raw, (p) => setProgress(Math.round(p.ratio * 100)));
      finalFile = result.file;
      url = result.url;
    } catch (err) {
      console.warn('Sıkıştırma hatası:', err);
    }

    setUploading(false);
    setProgress(0);

    setPreview({ url, type: 'video' });
    setFile(finalFile);
  };

  const clearPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setFile(null);
  };

  const handleShare = async () => {
    if (!user?.uid || (!file && !text.trim())) return;
    setUploading(true);
    setProgress(0);
    try {
      let imageUrl  = null;
      let imagePath = null;
      let mediaType = 'story';

      if (file) {
        const isVid = preview?.type === 'video';
        const ext   = isVid ? 'mp4' : 'jpg';
        const mime  = isVid ? 'video/mp4' : 'image/jpeg';
        const folder = isVid ? 'stories/videos' : 'stories';
        const path = `${folder}/${user.uid}/${Date.now()}.${ext}`;
        const sRef = storageRef(storage, path);

        // Progress'li yükleme
        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(sRef, file, { contentType: mime });
          task.on('state_changed',
            (snap) => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            (err) => reject(err),
            async () => {
              imageUrl = await getDownloadURL(task.snapshot.ref);
              imagePath = path;
              resolve();
            }
          );
        });

        // Video hikaye ise mediaType'ı story olarak bırak (backend'de story olarak işlenecek)
      }

      const res = await fetch(`${API_URL}/api/tweet`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId:  user.uid,
          content:   text.trim(),
          imageUrl,
          imagePath,
          mediaType: 'story',
        }),
      });

      if (res.ok) { 
        onSuccess?.(); 
        onClose(); 
      } else {
        const errorData = await res.json();
        alert('Hikaye paylaşılamadı: ' + (errorData.error || 'Sunucu hatası!'));
      }
    } catch (err) {
      alert('Hikaye paylaşılamadı: ' + err.message);
    } finally { setUploading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))', borderBottom: '1px solid #262626' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#F5F5F5', cursor: 'pointer' }}>
          <X size={22} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#F5F5F5' }}>Hikaye Ekle</span>
        <button onClick={handleShare} disabled={uploading || (!file && !text.trim())}
                style={{ background: 'none', border: 'none', color: '#0095F6', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', opacity: uploading || (!file && !text.trim()) ? 0.4 : 1 }}>
          {uploading ? <Loader2 size={18} className="spin" color="#0095F6" /> : 'Paylaş'}
        </button>
      </div>

      <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
      <input ref={vidRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: 'none' }} onChange={handleVideoChange} />

      {/* Upload progress */}
      {uploading && progress > 0 && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ height: 3, background: '#262626', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#0095F6', borderRadius: 2, transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
        {preview ? (
          <div style={{ position: 'relative', maxHeight: '55dvh', borderRadius: 12, overflow: 'hidden' }}>
            {preview.type === 'video' ? (
              <video
                src={preview.url}
                controls
                playsInline
                style={{ maxHeight: '55dvh', maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 12, background: '#000' }}
              />
            ) : (
              <img src={preview.url} alt="" style={{ maxHeight: '55dvh', maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 12 }} />
            )}
            <button onClick={clearPreview}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Fotoğraf butonu */}
            <button onClick={() => imgRef.current?.click()}
                    style={{ width: 100, height: 100, borderRadius: '50%', border: '2px dashed #363636', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#737373' }}>
              <Camera size={28} />
              <span style={{ fontSize: 11, fontFamily: 'inherit' }}>Fotoğraf</span>
            </button>
            {/* Video butonu */}
            <button onClick={() => vidRef.current?.click()}
                    style={{ width: 100, height: 100, borderRadius: '50%', border: '2px dashed #363636', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#737373' }}>
              <Video size={28} />
              <span style={{ fontSize: 11, fontFamily: 'inherit' }}>Video</span>
            </button>
          </div>
        )}

        <input
          value={text}
          onChange={e => setText(e.target.value.slice(0, 150))}
          placeholder="Bir şeyler yaz... (opsiyonel)"
          style={{ width: '100%', maxWidth: 360, background: 'rgba(255,255,255,0.08)', border: '1px solid #262626', borderRadius: 10, padding: '12px 16px', color: '#F5F5F5', fontSize: 16, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
        />

        {!file && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => imgRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: '#1C1C1C', border: '1px solid #262626', color: '#F5F5F5', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              <ImagePlus size={16} /> Galeri
            </button>
            <button onClick={() => vidRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: '#1C1C1C', border: '1px solid #262626', color: '#F5F5F5', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              <Video size={16} /> Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ana StoriesBar ───────────────────────────────────────────────────────────
export default function StoriesBar() {
  const user            = useAuth();
  const { profile }     = useProfile();
  const { stories, myStory, loading, fetchStories, viewStory, deleteStory, getStoryStatus } = useStories();
  const [showCreate,  setShowCreate]  = useState(false);
  const [viewing,     setViewing]     = useState(null);

  const handleView = (sid) => {
    viewStory(sid);
  };

  const handleDelete = async (sid) => {
    const success = await deleteStory(sid);
    if (success) setViewing(null);
  };

  // Görüntülenecek story yok ve takip yok ise stories bar'ı gizle
  if (!loading && stories.length === 0 && !myStory && !profile) return null;

  return (
    <>
      {showCreate && (
        <StoryCreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchStories(); }}
        />
      )}

      {viewing && (
        <StoryViewer
          story={viewing}
          isOwn={viewing.authorId === user?.uid}
          onDelete={handleDelete}
          onView={handleView}
          onClose={() => setViewing(null)}
        />
      )}

      <div style={{
        display: 'flex', gap: 2,
        padding: '10px 8px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        borderBottom: '1px solid #262626',
        background: '#000',
      }}>
        {/* Kendi story butonu */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', padding: '2px 8px', minWidth: 72, flexShrink: 0 }}
             onClick={() => myStory ? setViewing({ ...myStory, username: profile?.username, avatarUrl: profile?.avatarUrl }) : setShowCreate(true)}>
          {/* Ring */}
          <div style={{
            width: 62, height: 62, borderRadius: '50%',
            background: myStory
              ? (getStoryStatus(user.uid) === 'viewed' ? '#363636' : 'linear-gradient(45deg,#FCAF45,#E1306C,#833AB4)')
              : 'transparent',
            border: myStory ? 'none' : '1.5px dashed #737373',
            padding: myStory ? 2.5 : 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{ width: myStory ? '100%' : 56, height: myStory ? '100%' : 56, borderRadius: '50%', border: myStory ? '2.5px solid #000' : 'none', overflow: 'hidden', background: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5' }}>{(profile?.username || '?').charAt(0).toUpperCase()}</span>
              }
            </div>
            {!myStory && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: '#0095F6', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={12} color="#fff" strokeWidth={3} />
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: '#F5F5F5', textAlign: 'center', maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myStory ? 'Hikayem' : 'Ekle'}
          </span>
        </div>

        {/* Takip edilen story'ler */}
        {stories.map(story => {
          const status = getStoryStatus(story.authorId);
          return (
            <div key={story._id}
                 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', padding: '2px 8px', minWidth: 72, flexShrink: 0 }}
                 onClick={() => {
                   // Ekran açılırken profil bilgisini ekle (önceden Stories.jsx içindeki profil fetchingini StoryContext yapmıyor henüz, basitlik için story objesi üzerinden gidiyoruz)
                   // Not: StoryContext şu an sadece Tweet datasını çekiyor. Profil datası Story components içinde birleştirilebilir.
                   setViewing({ ...story, username: story.username || story.authorAvatar, avatarUrl: story.avatarUrl || story.authorAvatarUrl });
                 }}>
              <div style={{ 
                width: 62, height: 62, borderRadius: '50%', 
                background: status === 'viewed' ? '#363636' : 'linear-gradient(45deg,#FCAF45,#E1306C,#833AB4)', 
                padding: 2.5 
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000', overflow: 'hidden', background: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {story.avatarUrl || story.authorAvatarUrl
                    ? <img src={story.avatarUrl || story.authorAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5' }}>{(story.username || story.authorAvatar || '?').charAt(0).toUpperCase()}</span>
                  }
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#F5F5F5', textAlign: 'center', maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {story.username || story.authorAvatar}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
