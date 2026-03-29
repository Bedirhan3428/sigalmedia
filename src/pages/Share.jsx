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

export default function Share() {
  const user     = useAuth();
  const navigate = useNavigate();

  const [content,   setContent]   = useState('');
  const [prompt,    setPrompt]    = useState(PROMPTS[0]);
  const [media,     setMedia]     = useState(null); // { type, previewUrl, file, origKB, newKB, duration? }
  const [cropSrc,   setCropSrc]   = useState(null); // image crop flow
  const [cropFile,  setCropFile]  = useState(null); // raw File for after crop
  const [phase,     setPhase]     = useState('idle'); // idle|compressing|uploading|sending|done|error
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');
  const [remaining, setRemaining] = useState(3);
  const [diceSpin,  setDiceSpin]  = useState(false);

  const imgRef = useRef();
  const vidRef = useRef();

  const isVerified = user?.emailVerified;
  const isBusy     = ['compressing','uploading','sending'].includes(phase);
  const canPost    = (content.trim() || media) && remaining > 0 && !isBusy && phase !== 'done' && isVerified;

  // Rotating prompt
  useEffect(() => {
    if (content.trim()) return;
    const id = setInterval(() => setPrompt(p => randPrompt(p)), 3500);
    return () => clearInterval(id);
  }, [content]);

  // Fetch remaining
  useEffect(() => {
    if (!user?.uid) return;
    fetch(`${API_URL}/api/user/${user.uid}`)
      .then(r => r.json())
      .then(d => setRemaining(d?.user?.dailyLimit ?? 3))
      .catch(() => {});
  }, [user]);

  // ── Resim seç → kırpıcı aç ────────────────────────────────────────────────
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCropFile(file);
    setCropSrc(URL.createObjectURL(file));
  };

  // ── Kırpma tamamlandı → sıkıştır ─────────────────────────────────────────
  const handleCropDone = async (blob) => {
    const prevSrc = cropSrc;
    setCropSrc(null);
    setCropFile(null);
    URL.revokeObjectURL(prevSrc);

    if (!blob) return;
    setPhase('compressing');
    setError('');

    try {
      // blob'u File'a çevir, sonra compressImage ile işle
      const rawFile = new File([blob], 'post.jpg', { type: 'image/jpeg' });
      const result  = await compressImage(rawFile);
      setMedia({
        type:       'image',
        previewUrl: result.url,
        file:       result.file,
        origKB:     result.origSizeKB,
        newKB:      result.newSizeKB,
      });
      setPhase('idle');
    } catch (err) {
      setError('Görsel işlenemedi: ' + err.message);
      setPhase('error');
    }
  };

  // ── Video seç ─────────────────────────────────────────────────────────────
  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPhase('compressing');
    setError('');

    // Manuel validasyon
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_MB) {
      setError(`Video çok büyük (maks. ${MAX_VIDEO_MB}MB, seçilen ${sizeMB.toFixed(1)}MB)`);
      setPhase('error');
      return;
    }

    try {
      // Thumbnail extract
      const thumbUrl = await new Promise((res) => {
        const vid  = document.createElement('video');
        const url  = URL.createObjectURL(file);
        vid.onloadedmetadata = () => {
          // Duration check
          if (vid.duration > 90) {
            URL.revokeObjectURL(url);
            res(null); // will error below
            return;
          }
          vid.currentTime = Math.min(0.5, vid.duration * 0.1);
        };
        vid.onseeked = () => {
          const c = document.createElement('canvas');
          c.width  = Math.min(vid.videoWidth,  640);
          c.height = Math.round(vid.videoHeight * (c.width / vid.videoWidth));
          c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          res(c.toDataURL('image/jpeg', 0.75));
        };
        vid.onerror = () => { URL.revokeObjectURL(url); res(null); };
        vid.preload  = 'metadata';
        vid.src      = url;
        vid.muted    = true;
      });

      if (thumbUrl === null) {
        // ... (hata kontrolleri) ...
        const dur = await new Promise(res => {
          const v = document.createElement('video');
          const u = URL.createObjectURL(file);
          v.onloadedmetadata = () => { URL.revokeObjectURL(u); res(v.duration); };
          v.onerror = () => { URL.revokeObjectURL(u); res(0); };
          v.src = u; v.preload = 'metadata';
        });
        if (dur > 90) {
          setError('Video çok uzun (maks. 90 saniye)');
          setPhase('error');
          return;
        }
        setError('Video yüklenemedi. Farklı bir format dene (MP4 önerilen).');
        setPhase('error');
        return;
      }

      // Sıkıştırma başlat...
      let finalFile = file;
      let newKB = Math.round(file.size / 1024);
      let previewUrl = URL.createObjectURL(file);
      
      try {
        const result = await compressVideo(file, (p) => {
           setProgress(Math.round(p.ratio * 100));
        });
        finalFile = result.file;
        newKB = Math.round(finalFile.size / 1024);
        previewUrl = result.url;
      } catch (err) {
        console.warn('Video sıkıştırma hatası', err);
      }

      setMedia({
        type:         'video',
        previewUrl:   previewUrl,
        thumbnailUrl: thumbUrl,
        file:         finalFile,
        origKB:       Math.round(file.size / 1024),
        newKB:        newKB,
      });
      setPhase('idle');
    } catch (err) {
      setError('Video işlenemedi: ' + err.message);
      setPhase('error');
    }
  };

  const clearMedia = () => {
    if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
    setMedia(null);
    setPhase('idle');
    setError('');
  };

  // ── Firebase Storage'a yükle (progress ile) ───────────────────────────────
  const uploadToStorage = () => {
    return new Promise((resolve, reject) => {
      const isVideo = media.type === 'video';
      const ext     = isVideo ? 'mp4' : 'jpg';
      const folder  = isVideo ? 'videos' : 'images';
      const mime    = isVideo ? 'video/mp4' : 'image/jpeg';
      const path    = `tweets/${folder}/${user.uid}/${Date.now()}.${ext}`;
      const sRef    = storageRef(storage, path);

      const task = uploadBytesResumable(sRef, media.file, { contentType: mime });

      task.on(
        'state_changed',
        (snap) => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
        (err)  => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ imageUrl: url, imagePath: path });
        }
      );
    });
  };

  // ── Paylaş ────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!canPost) return;
    setError('');
    setProgress(0);
    setPhase('uploading');

    try {
      let imageUrl  = null;
      let imagePath = null;

      if (media) {
        const result = await uploadToStorage();
        imageUrl  = result.imageUrl;
        imagePath = result.imagePath;
      }

      setPhase('sending');

      const res  = await fetch(`${API_URL}/api/tweet`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          deviceId:  user.uid,
          content:   content.trim(),
          imageUrl,
          imagePath,
          mediaType: media?.type || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gönderi paylaşılamadı.');
        setPhase('error');
        return;
      }

      setPhase('done');
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      setError('Sunucuya bağlanılamadı: ' + err.message);
      setPhase('error');
    }
  };

  return (
    <div className="page" style={{ minHeight: '100dvh', background: '#000' }}>
      {/* Kırpma popup */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={1}
          onCrop={handleCropDone}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); setCropFile(null); }}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #262626',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px',
        paddingTop: 'max(11px, env(safe-area-inset-top))',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F5F5F5', cursor: 'pointer', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center' }}>
          <X size={24} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#F5F5F5' }}>Yeni Gönderi</span>
        <button onClick={handlePost} disabled={!canPost}
                style={{ background: 'none', border: 'none', color: canPost ? '#0095F6' : '#363636', fontWeight: 700, fontSize: 15, cursor: canPost ? 'pointer' : 'not-allowed', fontFamily: 'inherit', minHeight: 40, padding: '0 4px' }}>
          {isBusy ? <Loader2 size={18} className="spin" color="#0095F6" /> : 'Paylaş'}
        </button>
      </div>

      {/* Doğrulama uyarısı */}
      {!isVerified && (
        <div style={{ padding: '10px 16px', background: 'rgba(252,175,69,0.08)', borderBottom: '1px solid rgba(252,175,69,0.25)', fontSize: 13, color: '#FCAF45' }}>
          ⚠️ Gönderi paylaşmak için e-postanı doğrula.
        </div>
      )}

      {/* Limit uyarısı */}
      {remaining === 0 && (
        <div style={{ padding: '10px 16px', background: 'rgba(255,48,64,0.08)', borderBottom: '1px solid rgba(255,48,64,0.2)', fontSize: 13, color: '#FF6B7A' }}>
          Bugünlük 3 gönderi hakkın doldu. Yarın tekrar gel!
        </div>
      )}

      {/* ── İçerik alanı ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1C1C1C', flexShrink: 0 }} />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
          placeholder={prompt}
          disabled={isBusy || remaining === 0 || !isVerified}
          rows={4}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: '#F5F5F5', fontSize: 16, fontFamily: 'inherit',
            outline: 'none', resize: 'none', lineHeight: 1.55,
            minHeight: 100,
          }}
        />
      </div>

      {/* ── Medya önizleme ─────────────────────────────────────────────────── */}
      {media && (
        <div style={{ margin: '0 0 2px', position: 'relative', background: '#1C1C1C', maxHeight: 400, overflow: 'hidden' }}>
          {media.type === 'image'
            ? <img src={media.previewUrl} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
            : <video src={media.previewUrl} controls playsInline style={{ width: '100%', maxHeight: 400, display: 'block', background: '#000' }} />
          }

          {/* Sıkıştırma bilgisi */}
          {media.origKB && media.newKB && media.origKB !== media.newKB && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '3px 8px', fontSize: 11, color: '#a5b4fc' }}>
              {media.origKB}KB → {media.newKB}KB ✓
            </div>
          )}

          {!isBusy && (
            <button onClick={clearMedia} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* ── Upload & Compress progress ──────────────────────────────────────── */}
      {phase === 'compressing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: '1px solid #262626' }}>
          <ProgressRing pct={progress} />
          <span style={{ fontSize: 14, color: '#A8A8A8' }}>
            Video sıkıştırılıyor (veri tasarrufu)...
          </span>
        </div>
      )}
      {phase === 'uploading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: '1px solid #262626' }}>
          <ProgressRing pct={progress} />
          <span style={{ fontSize: 14, color: '#A8A8A8' }}>
            {media?.type === 'video' ? 'Video' : 'Fotoğraf'} yükleniyor...
          </span>
        </div>
      )}
      {phase === 'sending' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #262626', color: '#0095F6' }}>
          <Loader2 size={16} className="spin" /> Aegis analiz ediyor...
        </div>
      )}
      {phase === 'done' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #262626', color: '#1DB954' }}>
          <CheckCircle size={16} /> Paylaşıldı! Ana sayfaya dönülüyor...
        </div>
      )}

      {/* Hata */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(255,48,64,0.08)', borderTop: '1px solid rgba(255,48,64,0.2)', fontSize: 13, color: '#FF6B7A' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          {phase === 'error' && (
            <button onClick={() => setPhase('idle')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#FF6B7A', cursor: 'pointer', textDecoration: 'underline', fontSize: 13, fontFamily: 'inherit' }}>
              Tekrar Dene
            </button>
          )}
        </div>
      )}

      {/* ── Araç çubuğu ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px', borderTop: '1px solid #262626', position: 'sticky', bottom: 0, background: '#000' }}>
        {/* Resim */}
        <button
          onClick={() => imgRef.current?.click()}
          disabled={!!media || isBusy || remaining === 0 || !isVerified}
          style={{ background: 'none', border: 'none', color: !!media || isBusy ? '#363636' : '#F5F5F5', cursor: !!media ? 'not-allowed' : 'pointer', padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, opacity: !!media ? 0.35 : 1 }}
          title="Fotoğraf ekle"
        >
          <ImagePlus size={24} />
        </button>
        <input ref={imgRef} type="file" accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={handleImageFile} />

        {/* Video */}
        <button
          onClick={() => vidRef.current?.click()}
          disabled={!!media || isBusy || remaining === 0 || !isVerified}
          style={{ background: 'none', border: 'none', color: !!media || isBusy ? '#363636' : '#F5F5F5', cursor: !!media ? 'not-allowed' : 'pointer', padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, opacity: !!media ? 0.35 : 1 }}
          title="Video ekle (maks. 90sn)"
        >
          <Video size={24} />
        </button>
        <input ref={vidRef} type="file" accept={VIDEO_ACCEPT} style={{ display: 'none' }} onChange={handleVideoFile} />

        {/* Zar */}
        <button
          onClick={() => {
            setDiceSpin(true);
            setTimeout(() => setDiceSpin(false), 500);
            setContent(randPrompt(content).slice(0, MAX_CHARS));
          }}
          disabled={isBusy || remaining === 0 || !isVerified}
          style={{ background: 'none', border: 'none', color: isBusy ? '#363636' : '#F5F5F5', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transform: diceSpin ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s', opacity: isBusy ? 0.35 : 1 }}
          title="Rastgele ilham"
        >
          <Dices size={22} />
        </button>

        {/* Karakter sayacı */}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: content.length > 260 ? '#FF3040' : content.length > 220 ? '#FCAF45' : '#737373', fontFamily: 'inherit', fontWeight: content.length > 220 ? 700 : 400 }}>
          {MAX_CHARS - content.length}
        </div>

        {/* Aegis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 6 }}>
          <Shield size={12} color="#363636" />
          <span style={{ fontSize: 10, color: '#363636', fontFamily: 'inherit' }}>Aegis</span>
        </div>
      </div>

      {/* Kurallar */}
      <div style={{ margin: '0 16px 24px', padding: '12px 14px', background: '#121212', borderRadius: 10, border: '1px solid #262626', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: <ShieldAlert size={13} color="#0095F6" />, text: 'Her gönderi Aegis YZ denetiminden geçer.' },
          { icon: <ShieldAlert size={13} color="#FCAF45" />, text: 'Çıplaklık ve şiddet otomatik reddedilir.' },
          { icon: <ShieldAlert size={13} color="#FF3040" />, text: 'DM ekranı görüntüsünde isimleri karalayarak paylaş (KVKK).' },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#737373' }}>
            <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span> {text}
          </div>
        ))}
      </div>
    </div>
  );
}
