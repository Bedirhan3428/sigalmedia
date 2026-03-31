import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ImagePlus, Video, Loader2, Shield, ShieldAlert, Dices,
  CheckCircle, AlertTriangle,
} from 'lucide-react';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase';
import { API_URL } from '../apiConfig';
import { compressImage, compressVideo, IMAGE_ACCEPT, VIDEO_ACCEPT } from '../utils/mediaCompressor';
import ImageCropper from '../components/ImageCropper';
import PostMediaEditor from '../components/PostMediaEditor';
import MediaCarousel from '../components/MediaCarousel';
import { useProfile } from '../hooks/useProfile.jsx';

const MAX_CHARS = 280;
const MAX_VIDEO_MB = 50;

const PROMPTS = [
  'Ne düşünüyorsun?',
  'Bugün ne oldu?',
  'Okulda neler dönüyor?',
  'Bir şey paylaş...',
  'Kantin kuyruğu yine uzun mu?',
  'O kişi yine baktı mı? 👀',
  'Sınavdan kaç aldın? 😅',
  'Bu hafta en iyi şey neydi?',
];

function randPrompt(cur) {
  const others = PROMPTS.filter(p => p !== cur);
  return others[Math.floor(Math.random() * others.length)];
}

// Upload progress ring
function ProgressRing({ pct }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="#262626" strokeWidth="4" />
      <circle cx="30" cy="30" r={r} fill="none" stroke="#0095F6" strokeWidth="4"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.2s' }} />
      <text x="30" y="34" textAnchor="middle" fontSize="11" fill="#F5F5F5" fontWeight="700"
            style={{ transform: 'rotate(90deg)', transformOrigin: '30px 30px' }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default function Share({ onClose }) {
  const user = useAuth();
  const { profile } = useProfile();

  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [mediaList, setMediaList] = useState([]);
  const [editFlow, setEditFlow] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [diceSpin, setDiceSpin] = useState(false);
  
  // dailyLimit from profile
  const remaining = profile?.dailyLimit ?? 3;

  const imgRef = useRef();
  const vidRef = useRef();
  const textareaRef = useRef();

  const isVerified = user?.emailVerified;
  const isBusy = ['compressing', 'uploading', 'sending'].includes(phase);
  const canPost = (content.trim() || mediaList.length > 0) && remaining > 0 && !isBusy && phase !== 'done' && isVerified;

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  useEffect(() => {
    if (content.trim()) return;
    const id = setInterval(() => setPrompt(p => randPrompt(p)), 3500);
    return () => clearInterval(id);
  }, [content]);



  const handleImageFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newMedia = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: 'image',
      isNew: true
    }));
    setMediaList(prev => [...prev, ...newMedia].slice(0, 5));
    setEditFlow(true);
    e.target.value = '';
  };

  const handlePost = async () => {
    if (!canPost) return;
    setError('');
    setProgress(0);
    setPhase('uploading');

    try {
      let uploadedMedia = [];
      if (mediaList.length > 0) {
        for (let i = 0; i < mediaList.length; i++) {
          setProgress(Math.round(((i) / mediaList.length) * 100));
          const res = await uploadToStorage(mediaList[i]);
          uploadedMedia.push(res);
        }
        setProgress(100);
      }
      setPhase('sending');
      const res = await fetch(`${API_URL}/api/tweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: user.uid,
          content: content.trim(),
          media: uploadedMedia,
          mediaType: uploadedMedia.length > 1 ? 'multi' : (uploadedMedia[0]?.type || null),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gönderi paylaşılamadı.');
        setPhase('error');
        return;
      }
      setPhase('done');
      setTimeout(() => {
        onClose();
        window.location.reload(); 
      }, 900);
    } catch (err) {
      setError('Sunucuya bağlanılamadı: ' + err.message);
      setPhase('error');
    }
  };

  const uploadToStorage = async (item) => {
    const isVideo = item.type === 'video';
    const ext = isVideo ? 'mp4' : 'jpg';
    const folder = isVideo ? 'videos' : 'images';
    const mime = isVideo ? 'video/mp4' : 'image/jpeg';
    const path = `tweets/${folder}/${user.uid}/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const sRef = storageRef(storage, path);
    const task = uploadBytesResumable(sRef, item.file, { contentType: mime });
    return new Promise((resolve, reject) => {
      task.on('state_changed', (snap) => {
          const p = (snap.bytesTransferred / snap.totalBytes) * 100;
          // Sub-progress handling could go here
      }, (err) => reject(err), async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path, type: item.type });
      });
    });
  };

  const handleEditSave = (items) => { setMediaList(items); setEditFlow(false); };
  const handleEditCancel = () => { setEditFlow(false); };
  
  const handleVideoFile = async (e) => {
      const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
      setPhase('compressing'); setError('');
      const sizeMB = file.size / (1024 * 1024); if (sizeMB > MAX_VIDEO_MB) { setError(`Video çok büyük (maks. ${MAX_VIDEO_MB}MB)`); setPhase('error'); return; }
      try {
        const thumbUrl = await new Promise((res) => {
            const vid = document.createElement('video'); const url = URL.createObjectURL(file);
            vid.onloadedmetadata = () => { if (vid.duration > 90) { URL.revokeObjectURL(url); res(null); return; } vid.currentTime = Math.min(0.5, vid.duration * 0.1); };
            vid.onseeked = () => { const c = document.createElement('canvas'); c.width = Math.min(vid.videoWidth, 640); c.height = Math.round(vid.videoHeight * (c.width / vid.videoWidth)); c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.75)); };
            vid.onerror = () => { URL.revokeObjectURL(url); res(null); };
            vid.preload = 'metadata'; vid.src = url; vid.muted = true;
        });
        if (thumbUrl === null) { setError('Video çok uzun veya yüklenemedi.'); setPhase('error'); return; }
        let finalFile = file; let newKB = Math.round(file.size / 1024); let previewUrl = URL.createObjectURL(file);
        try { const result = await compressVideo(file, (p) => { setProgress(Math.round(p.ratio * 100)); }); finalFile = result.file; newKB = Math.round(finalFile.size / 1024); previewUrl = result.url; } catch (err) { console.warn('Video sıkıştırma hatası', err); }
        setMediaList(prev => [...prev, { type: 'video', previewUrl, thumbnailUrl: thumbUrl, file: finalFile, origKB: Math.round(file.size/1024), newKB }].slice(0, 5));
        setPhase('idle');
      } catch (err) { setError('Video işlenemedi: ' + err.message); setPhase('error'); }
  };
  
  const clearMedia = () => { mediaList.forEach(m => { if (m.previewUrl) URL.revokeObjectURL(m.previewUrl); }); setMediaList([]); setPhase('idle'); setError(''); };

  const isSelected = mediaList.length > 0 || content.length > 0;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      
      <div className="modal-content slide-up" style={{
        width: '100%', maxWidth: 470, height: '94dvh',
        background: '#000', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderBottom: 'none'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Step: Media Editor */}
        {editFlow && (
          <PostMediaEditor
            initialMedia={mediaList}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            maxItems={5}
          />
        )}

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
            <X size={26} />
          </button>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Yeni Gönderi</span>
          <button 
            onClick={handlePost} 
            disabled={!canPost}
            className={`premium-gradient-btn ${canPost && !isBusy ? 'pulse-active' : ''}`}
            style={{ 
              borderRadius: 20, padding: '8px 20px', fontSize: 14, 
              display: 'flex', alignItems: 'center', gap: 8,
              minWidth: 90, justifyContent: 'center'
            }}
          >
            {isBusy ? (
              <Loader2 size={18} className="spin" />
            ) : phase === 'done' ? (
              <CheckCircle size={18} />
            ) : (
              'Paylaş'
            )}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#000' }}>
          {/* Progress Bar (Floating) */}
          {isBusy && (
            <div style={{ position: 'sticky', top: 0, zIndex: 5, height: 3, width: '100%', background: 'rgba(255,255,255,0.05)' }}>
               <div style={{ height: '100%', width: `${progress}%`, background: '#0095F6', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(0,149,246,0.5)' }} />
            </div>
          )}

          {/* Banners */}
          {!isVerified && (
            <div style={{ margin: '12px 16px', padding: '12px', background: 'rgba(252,175,69,0.1)', borderRadius: 12, border: '1px solid rgba(252,175,69,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <ShieldAlert size={20} color="#FCAF45" />
              <span style={{ fontSize: 13, color: '#FCAF45', fontWeight: 500 }}>E-postanı doğrula.</span>
            </div>
          )}

          {remaining === 0 && (
            <div style={{ margin: '12px 16px', padding: '12px', background: 'rgba(255,48,64,0.1)', borderRadius: 12, border: '1px solid rgba(255,48,64,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertTriangle size={20} color="#FF6B7A" />
              <span style={{ fontSize: 13, color: '#FF6B7A', fontWeight: 500 }}>Günlük limit doldu.</span>
            </div>
          )}

          {/* ── Selection Step: If nothing selected ─────────────────────────── */}
          {!isSelected && (
              <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Paylaşmaya Başla</h2>
                      <p style={{ color: '#737373', fontSize: 14 }}>Bir fotoğraf, video seç veya bir şeyler yaz.</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="upload-tile" onClick={() => imgRef.current?.click()}>
                          <ImagePlus size={36} />
                          <span style={{ fontWeight: 700, fontSize: 14 }}>Görsel Ekle</span>
                      </div>
                      <div className="upload-tile" onClick={() => vidRef.current?.click()}>
                          <Video size={36} />
                          <span style={{ fontWeight: 700, fontSize: 14 }}>Video Yükle</span>
                      </div>
                  </div>

                  <div className="upload-tile" style={{ padding: 20 }} onClick={() => setContent(' ')}>
                       <Dices size={28} />
                       <span style={{ fontWeight: 700, fontSize: 14 }}>Metin Gönderisi</span>
                  </div>
              </div>
          )}

          {/* ── Share Step: Header media + Caption area ───────────────────── */}
          {isSelected && (
              <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
                  
                  {/* Active Media Carousel */}
                  {mediaList.length > 0 && (
                      <div style={{ position: 'relative', background: '#000' }}>
                          <MediaCarousel media={mediaList.map(m => ({ url: m.previewUrl, type: m.type }))} aspectRatio={1} />
                          <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 8, zIndex: 5 }}>
                              <button onClick={() => setEditFlow(true)} style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                 Düzenle
                              </button>
                              <button onClick={clearMedia} style={{ background: 'rgba(255,48,64,0.8)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <X size={18} />
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Caption Area */}
                  <div style={{ padding: '20px 16px', display: 'flex', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1C1C1C', flexShrink: 0, border: '2px solid #262626', overflow: 'hidden' }}>
                          {profile?.avatarUrl ? <img src={profile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : null}
                      </div>
                      <div style={{ flex: 1 }}>
                          <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
                            placeholder={prompt}
                            disabled={isBusy || remaining === 0 || !isVerified}
                            style={{
                                width: '100%', background: 'transparent', border: 'none',
                                color: '#fff', fontSize: 16, fontFamily: 'inherit',
                                outline: 'none', resize: 'none', lineHeight: 1.6,
                                padding: '4px 0', minHeight: 60
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                             <span style={{ fontSize: 12, fontWeight: 700, color: content.length > 260 ? '#FF3040' : '#444' }}>
                                {content.length} / {MAX_CHARS}
                             </span>
                          </div>
                      </div>
                  </div>

                  {/* Actions / Tools Bar */}
                  <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button onClick={() => imgRef.current?.click()} style={premiumToolBtn}><ImagePlus size={22} /></button>
                      <button onClick={() => vidRef.current?.click()} style={premiumToolBtn}><Video size={22} /></button>
                      <button 
                        onClick={() => { setDiceSpin(true); setTimeout(()=>setDiceSpin(false),500); setContent(randPrompt(content)); }} 
                        style={{ ...premiumToolBtn, transform: diceSpin ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}
                      >
                        <Dices size={22} />
                      </button>
                  </div>

                  {/* Info Section */}
                  <div style={{ margin: '20px 16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <Shield size={18} color="#0095F6" />
                          <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aegis Koruma</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6, margin: 0 }}>
                          Gönderin paylaşılmadan önce yapay zeka tarafından taranır. KVKK ve Topluluk kurallarına uyumunuz denetlenir.
                      </p>
                  </div>
              </div>
          )}
        </div>

        {/* Hidden Inputs */}
        <input ref={imgRef} type="file" multiple accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={handleImageFile} />
        <input ref={vidRef} type="file" accept={VIDEO_ACCEPT} style={{ display: 'none' }} onChange={handleVideoFile} />

        <div className="safe-bottom" style={{ background: '#000' }} />
      </div>
    </div>
  );
}

const premiumToolBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.05)',
  color: '#fff',
  width: 44,
  height: 44,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: '0.2s'
};
