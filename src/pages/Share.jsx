import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, ImagePlus, Video, Loader2, Shield, ShieldAlert,
  CheckCircle, AlertTriangle, Type, ChevronLeft, Plus,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  Trash2, Move
} from 'lucide-react';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase';
import { API_URL } from '../apiConfig';
import { compressImage, compressVideo, IMAGE_ACCEPT, VIDEO_ACCEPT } from '../utils/mediaCompressor';
import { useProfile } from '../hooks/useProfile.jsx';

const MAX_CHARS = 280;
const MAX_VIDEO_MB = 50;

/* ─────────────────────────────────────────────
   STEP ENUM
───────────────────────────────────────────── */
const STEP = { SELECT: 'select', PREVIEW: 'preview', CAPTION: 'caption' };

/* ─────────────────────────────────────────────
   TEXT OVERLAY DEFAULTS
───────────────────────────────────────────── */
const FONT_COLORS = ['#FFFFFF', '#000000', '#FCAF45', '#E1306C', '#833AB4', '#00C6FF', '#FF3040'];
const FONT_SIZES = [14, 18, 22, 28, 36];
const FONT_FAMILIES = [
  { label: 'Clean', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
  { label: 'Bold', value: '"Arial Black", sans-serif' },
];

function makeOverlay(text = '') {
  return {
    id: Date.now(),
    text,
    x: 50, y: 50,            // % from top-left of media container
    color: '#FFFFFF',
    size: 22,
    align: 'center',
    bold: false,
    italic: false,
    fontFamily: FONT_FAMILIES[0].value,
    bgOpacity: 0.35,          // semi-transparent pill background
  };
}

/* ─────────────────────────────────────────────
   DRAGGABLE OVERLAY TEXT (on the media)
───────────────────────────────────────────── */
function OverlayTextLayer({ overlays, active, setActive, setOverlays, containerRef }) {
  const dragInfo = useRef(null);

  const startDrag = (e, id) => {
    e.stopPropagation();
    setActive(id);
    const rect = containerRef.current?.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    dragInfo.current = { id, startX: touch.clientX, startY: touch.clientY, rect };
  };

  const onMove = useCallback((e) => {
    if (!dragInfo.current) return;
    const { id, startX, startY, rect } = dragInfo.current;
    const touch = e.touches?.[0] || e;
    const dx = ((touch.clientX - startX) / rect.width) * 100;
    const dy = ((touch.clientY - startY) / rect.height) * 100;
    setOverlays(prev => prev.map(o => o.id === id
      ? { ...o, x: Math.min(95, Math.max(5, o.x + dx)), y: Math.min(95, Math.max(5, o.y + dy)) }
      : o
    ));
    dragInfo.current.startX = touch.clientX;
    dragInfo.current.startY = touch.clientY;
  }, [setOverlays]);

  const endDrag = useCallback(() => { dragInfo.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', endDrag);
    };
  }, [onMove, endDrag]);

  return (
    <>
      {overlays.map(o => (
        <div
          key={o.id}
          onMouseDown={e => startDrag(e, o.id)}
          onTouchStart={e => startDrag(e, o.id)}
          style={{
            position: 'absolute',
            left: `${o.x}%`,
            top: `${o.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: 'move',
            userSelect: 'none',
            zIndex: 10,
            padding: '4px 10px',
            borderRadius: 6,
            background: active === o.id
              ? `rgba(255,255,255,0.18)`
              : `rgba(0,0,0,${o.bgOpacity})`,
            border: active === o.id ? '1.5px dashed rgba(255,255,255,0.7)' : '1.5px solid transparent',
            transition: 'border 0.15s',
          }}
        >
          <span style={{
            color: o.color,
            fontSize: o.size,
            fontFamily: o.fontFamily,
            fontWeight: o.bold ? 700 : 400,
            fontStyle: o.italic ? 'italic' : 'normal',
            textAlign: o.align,
            display: 'block',
            whiteSpace: 'pre-wrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            lineHeight: 1.3,
          }}>
            {o.text || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Metin ekle…</span>}
          </span>
        </div>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   OVERLAY EDITOR PANEL (bottom drawer)
───────────────────────────────────────────── */
function OverlayEditor({ overlay, onChange, onDelete }) {
  if (!overlay) return null;
  const update = (k, v) => onChange({ ...overlay, [k]: v });

  return (
    <div style={{
      background: '#111', borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* text input */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={overlay.text}
          onChange={e => update('text', e.target.value)}
          placeholder="Metin yaz…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#fff', fontSize: 15,
            padding: '10px 14px', outline: 'none', fontFamily: 'inherit',
          }}
          autoFocus
        />
        <button onClick={onDelete} style={{ background: 'rgba(255,48,64,0.15)', border: '1px solid rgba(255,48,64,0.3)', color: '#FF3040', borderRadius: 10, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Trash2 size={17} />
        </button>
      </div>

      {/* Font family */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {FONT_FAMILIES.map(f => (
          <button key={f.value} onClick={() => update('fontFamily', f.value)} style={{
            background: overlay.fontFamily === f.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: overlay.fontFamily === f.value ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            fontFamily: f.value, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Color palette */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {FONT_COLORS.map(c => (
          <button key={c} onClick={() => update('color', c)} style={{
            width: overlay.color === c ? 28 : 22,
            height: overlay.color === c ? 28 : 22,
            borderRadius: '50%',
            background: c,
            border: overlay.color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
          }} />
        ))}
      </div>

      {/* Size + style */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {FONT_SIZES.map(s => (
            <button key={s} onClick={() => update('size', s)} style={{
              background: overlay.size === s ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: overlay.size === s ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: '#fff', borderRadius: 8, width: 36, height: 34, fontSize: 11, cursor: 'pointer', fontWeight: 700,
            }}>
              {s}
            </button>
          ))}
        </div>
        {/* bold / italic / align */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { Icon: Bold, k: 'bold', v: !overlay.bold },
            { Icon: Italic, k: 'italic', v: !overlay.italic },
          ].map(({ Icon, k, v }) => (
            <button key={k} onClick={() => update(k, v)} style={{
              background: overlay[k] ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', borderRadius: 8, width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon size={15} />
            </button>
          ))}
          {[AlignLeft, AlignCenter, AlignRight].map((Icon, i) => {
            const aligns = ['left', 'center', 'right'];
            return (
              <button key={aligns[i]} onClick={() => update('align', aligns[i])} style={{
                background: overlay.align === aligns[i] ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', borderRadius: 8, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MEDIA THUMB (grid item)
───────────────────────────────────────────── */
function MediaThumb({ item, index, active, onClick, onRemove }) {
  return (
    <div onClick={() => onClick(index)} style={{
      position: 'relative', borderRadius: 10, overflow: 'hidden',
      border: active ? '2.5px solid #E1306C' : '2.5px solid transparent',
      cursor: 'pointer', aspectRatio: '1', background: '#1a1a1a',
      flexShrink: 0, width: 72, transition: 'border 0.15s',
    }}>
      {item.type === 'video'
        ? <video src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        : <img src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      }
      <button
        onClick={e => { e.stopPropagation(); onRemove(index); }}
        style={{
          position: 'absolute', top: 4, right: 4,
          background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
          borderRadius: '50%', width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 11,
        }}
      >
        <X size={11} />
      </button>
      {item.type === 'video' && (
        <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: '#fff', fontWeight: 700 }}>
          VİD
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN SHARE COMPONENT
───────────────────────────────────────────── */
export default function Share({ onClose }) {
  const user = useAuth();
  const { profile } = useProfile();

  /* state */
  const [step, setStep] = useState(STEP.SELECT);
  const [mediaList, setMediaList] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [overlays, setOverlays] = useState([]); // per-media: { [mediaIndex]: [overlay, ...] }
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const [content, setContent] = useState('');
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [textMode, setTextMode] = useState(false); // show overlay editor?

  const imgRef = useRef();
  const vidRef = useRef();
  const mediaRef = useRef();   // container for overlay positioning
  const textareaRef = useRef();

  const remaining = profile?.dailyLimit ?? 3;
  const isVerified = user?.emailVerified;
  const isBusy = ['compressing', 'uploading', 'sending'].includes(phase);
  const canPost = (content.trim() || mediaList.length > 0) && remaining > 0 && !isBusy && phase !== 'done' && isVerified;

  /* helpers: overlays are stored per-media index */
  const currentOverlays = overlays[activeIdx] || [];
  const activeOverlay = currentOverlays.find(o => o.id === activeOverlayId) || null;

  const setCurrentOverlays = (fn) =>
    setOverlays(prev => {
      const next = [...prev];
      next[activeIdx] = typeof fn === 'function' ? fn(next[activeIdx] || []) : fn;
      return next;
    });

  const addOverlay = () => {
    const o = makeOverlay('');
    setCurrentOverlays(prev => [...prev, o]);
    setActiveOverlayId(o.id);
    setTextMode(true);
  };

  const updateOverlay = (updated) =>
    setCurrentOverlays(prev => prev.map(o => o.id === updated.id ? updated : o));

  const deleteOverlay = (id) => {
    setCurrentOverlays(prev => prev.filter(o => o.id !== id));
    setActiveOverlayId(null);
    setTextMode(false);
  };

  /* auto-resize textarea */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }, [content]);

  /* ── media handlers ── */
  const handleImageFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newMedia = files.map(file => ({
      file, previewUrl: URL.createObjectURL(file), type: 'image', isNew: true,
    }));
    setMediaList(prev => {
      const merged = [...prev, ...newMedia].slice(0, 10);
      setActiveIdx(prev.length); // focus last added
      return merged;
    });
    setStep(STEP.PREVIEW);
    e.target.value = '';
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPhase('compressing');
    setError('');
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_MB) {
      setError(`Video çok büyük (maks. ${MAX_VIDEO_MB}MB)`);
      setPhase('error'); return;
    }
    try {
      const thumbUrl = await new Promise(res => {
        const vid = document.createElement('video');
        const url = URL.createObjectURL(file);
        vid.onloadedmetadata = () => { if (vid.duration > 90) { URL.revokeObjectURL(url); res(null); return; } vid.currentTime = Math.min(0.5, vid.duration * 0.1); };
        vid.onseeked = () => { const c = document.createElement('canvas'); c.width = Math.min(vid.videoWidth, 640); c.height = Math.round(vid.videoHeight * (c.width / vid.videoWidth)); c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.75)); };
        vid.onerror = () => { URL.revokeObjectURL(url); res(null); };
        vid.preload = 'metadata'; vid.src = url; vid.muted = true;
      });
      if (!thumbUrl) { setError('Video çok uzun veya yüklenemedi.'); setPhase('error'); return; }
      let finalFile = file;
      let previewUrl = URL.createObjectURL(file);
      try { const r = await compressVideo(file, p => setProgress(Math.round(p.ratio * 100))); finalFile = r.file; previewUrl = r.url; } catch { }
      setMediaList(prev => {
        const next = [...prev, { type: 'video', previewUrl, thumbnailUrl: thumbUrl, file: finalFile }].slice(0, 10);
        setActiveIdx(prev.length);
        return next;
      });
      setStep(STEP.PREVIEW);
      setPhase('idle');
    } catch (err) { setError('Video işlenemedi: ' + err.message); setPhase('error'); }
  };

  const removeMedia = (idx) => {
    setMediaList(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) setStep(STEP.SELECT);
      return next;
    });
    setOverlays(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    setActiveIdx(i => Math.min(i, Math.max(0, mediaList.length - 2)));
  };

  /* ── upload & post ── */
  const uploadToStorage = async (item) => {
    const isVideo = item.type === 'video';
    const ext = isVideo ? 'mp4' : 'jpg'; const folder = isVideo ? 'videos' : 'images'; const mime = isVideo ? 'video/mp4' : 'image/jpeg';
    const path = `tweets/${folder}/${user.uid}/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const sRef = storageRef(storage, path);
    const task = uploadBytesResumable(sRef, item.file, { contentType: mime });
    return new Promise((resolve, reject) => {
      task.on('state_changed', () => { }, reject, async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path, type: item.type });
      });
    });
  };

  const handlePost = async () => {
    if (!canPost) return;
    setError(''); setProgress(0); setPhase('uploading');
    try {
      let uploadedMedia = [];
      for (let i = 0; i < mediaList.length; i++) {
        setProgress(Math.round((i / mediaList.length) * 100));
        const res = await uploadToStorage(mediaList[i]);
        // attach overlay data for this media item
        const itemOverlays = (overlays[i] || []).filter(o => o.text.trim());
        res.overlays = itemOverlays;
        uploadedMedia.push(res);
      }
      setProgress(100);
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
      if (!res.ok) { setError(data.error || 'Gönderi paylaşılamadı.'); setPhase('error'); return; }
      setPhase('done');
      setTimeout(() => { onClose(); window.location.reload(); }, 900);
    } catch (err) { setError('Sunucuya bağlanılamadı: ' + err.message); setPhase('error'); }
  };

  /* ── active media item ── */
  const activeMedia = mediaList[activeIdx];

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#000',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '96dvh',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
        }}
      >

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: '#000',
        }}>
          <button
            onClick={step === STEP.SELECT ? onClose : () => { setStep(STEP.SELECT); setTextMode(false); }}
            style={hdrBtn}
          >
            {step === STEP.SELECT ? <X size={24} /> : <ChevronLeft size={24} />}
          </button>

          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: '#fff' }}>
            {step === STEP.SELECT && 'Yeni Gönderi'}
            {step === STEP.PREVIEW && 'Düzenle'}
            {step === STEP.CAPTION && 'Paylaş'}
          </span>

          {step === STEP.SELECT && (
            <div style={{ width: 40 }} />
          )}

          {step === STEP.PREVIEW && (
            <button
              onClick={() => { setTextMode(false); setActiveOverlayId(null); setStep(STEP.CAPTION); }}
              style={{ ...hdrBtn, color: '#3897F0', fontWeight: 700, fontSize: 15 }}
            >
              İleri
            </button>
          )}

          {step === STEP.CAPTION && (
            <button
              onClick={handlePost}
              disabled={!canPost}
              style={{
                ...hdrBtn,
                color: canPost ? '#3897F0' : '#333',
                fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {isBusy ? <Loader2 size={18} className="spin" /> : phase === 'done' ? <CheckCircle size={18} color="#4BB543" /> : 'Paylaş'}
            </button>
          )}
        </div>

        {/* ── UPLOAD PROGRESS ── */}
        {isBusy && (
          <div style={{ height: 2, background: '#111' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#3897F0', transition: 'width 0.3s' }} />
          </div>
        )}

        {/* ── BANNERS ── */}
        {!isVerified && (
          <Banner icon={<ShieldAlert size={16} color="#FCAF45" />} color="#FCAF45" text="E-postanı doğrula, paylaşım yapabilmek için." />
        )}
        {remaining === 0 && (
          <Banner icon={<AlertTriangle size={16} color="#FF6B7A" />} color="#FF6B7A" text="Günlük gönderi limitine ulaştın." />
        )}
        {error && (
          <Banner icon={<AlertTriangle size={16} color="#FF3040" />} color="#FF3040" text={error} />
        )}

        {/* ══════════════════════
            STEP: SELECT
        ══════════════════════ */}
        {step === STEP.SELECT && (
          <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => imgRef.current?.click()} style={selectTile}>
              <ImagePlus size={28} color="#3897F0" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Fotoğraf Ekle</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Galerinizden seçin</div>
              </div>
            </button>
            <button onClick={() => vidRef.current?.click()} style={selectTile}>
              <Video size={28} color="#E1306C" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Video Yükle</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Maks. 50 MB · 90 saniye</div>
              </div>
            </button>
            <button onClick={() => { setStep(STEP.CAPTION); }} style={selectTile}>
              <AlignLeft size={28} color="#A8A8A8" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Yalnızca Metin</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Düşüncelerini yaz</div>
              </div>
            </button>
          </div>
        )}

        {/* ══════════════════════
            STEP: PREVIEW / EDIT
        ══════════════════════ */}
        {step === STEP.PREVIEW && mediaList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* ── Main Media View ── */}
            <div
              ref={mediaRef}
              onClick={() => { if (!textMode) { setActiveOverlayId(null); } }}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                background: '#0a0a0a',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {activeMedia?.type === 'video' ? (
                <video
                  src={activeMedia.previewUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  controls muted loop playsInline
                />
              ) : activeMedia ? (
                <img
                  src={activeMedia.previewUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  alt=""
                />
              ) : null}

              {/* Overlay text layer */}
              <OverlayTextLayer
                overlays={currentOverlays}
                active={activeOverlayId}
                setActive={setActiveOverlayId}
                setOverlays={setCurrentOverlays}
                containerRef={mediaRef}
              />

              {/* Top-right actions */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 20 }}>
                <ActionBtn onClick={addOverlay} icon={<Type size={18} />} label="Metin ekle" />
                <ActionBtn onClick={() => imgRef.current?.click()} icon={<Plus size={18} />} label="Ekle" />
              </div>

              {/* Hint */}
              {currentOverlays.length === 0 && (
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                  <span style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.55)', fontSize: 12, borderRadius: 20, padding: '4px 12px', backdropFilter: 'blur(4px)' }}>
                    Aa — Metin eklemek için dokunun
                  </span>
                </div>
              )}
            </div>

            {/* ── Thumbnail Strip ── */}
            <div style={{
              display: 'flex', gap: 8, padding: '10px 12px', overflowX: 'auto',
              background: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              {mediaList.map((item, i) => (
                <MediaThumb
                  key={i}
                  item={item}
                  index={i}
                  active={i === activeIdx}
                  onClick={idx => { setActiveIdx(idx); setActiveOverlayId(null); setTextMode(false); }}
                  onRemove={removeMedia}
                />
              ))}
            </div>

            {/* ── Overlay Editor ── */}
            {textMode && activeOverlay && (
              <div style={{ overflowY: 'auto' }}>
                <OverlayEditor
                  overlay={activeOverlay}
                  onChange={updateOverlay}
                  onDelete={() => deleteOverlay(activeOverlay.id)}
                />
              </div>
            )}

            {/* if overlay selected but editor not shown, show quick-edit hint */}
            {activeOverlayId && !textMode && (
              <div
                onClick={() => setTextMode(true)}
                style={{ textAlign: 'center', padding: '10px 16px', cursor: 'pointer', color: '#3897F0', fontSize: 13, fontWeight: 600 }}
              >
                Metni düzenle →
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════
            STEP: CAPTION
        ══════════════════════ */}
        {step === STEP.CAPTION && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Thumbnail row (if media) */}
            {mediaList.length > 0 && (
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {mediaList.map((item, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 90, height: 90, position: 'relative', overflow: 'hidden', background: '#111' }}>
                    {item.type === 'video'
                      ? <video src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      : <img src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    }
                    {/* overlay text badge */}
                    {(overlays[i] || []).filter(o => o.text.trim()).length > 0 && (
                      <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 5px', fontSize: 10, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Type size={9} /> {(overlays[i] || []).filter(o => o.text.trim()).length}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Caption Input */}
            <div style={{ display: 'flex', gap: 12, padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0, overflow: 'hidden' }}>
                {profile?.avatarUrl && <img src={profile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Bir açıklama yaz…"
                  disabled={isBusy || remaining === 0 || !isVerified}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    color: '#fff', fontSize: 15, fontFamily: 'inherit',
                    outline: 'none', resize: 'none', lineHeight: 1.6, padding: 0, minHeight: 72,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 12, color: content.length > 260 ? '#FF3040' : '#3a3a3a', fontWeight: 600 }}>
                    {content.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>
            </div>

            {/* Aegis info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Shield size={16} color="#3897F0" />
              <span style={{ fontSize: 13, color: '#555' }}>Aegis Koruma — içeriğin paylaşılmadan taranır.</span>
            </div>

            {/* Daily Limit indicator */}
            {remaining > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: remaining <= 1 ? '#FF3040' : '#4BB543' }} />
                <span style={{ fontSize: 13, color: '#666' }}>Bugün {remaining} gönderi hakkın kaldı.</span>
              </div>
            )}
          </div>
        )}

        {/* Hidden file inputs */}
        <input ref={imgRef} type="file" multiple accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={handleImageFile} />
        <input ref={vidRef} type="file" accept={VIDEO_ACCEPT} style={{ display: 'none' }} onChange={handleVideoFile} />

        <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: '#000' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */
function Banner({ icon, color, text }) {
  return (
    <div style={{
      margin: '8px 12px', padding: '10px 14px',
      background: `${color}18`, borderRadius: 10,
      border: `1px solid ${color}30`,
      display: 'flex', gap: 10, alignItems: 'center',
    }}>
      {icon}
      <span style={{ fontSize: 13, color, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

function ActionBtn({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff', borderRadius: 10, width: 40, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const hdrBtn = {
  background: 'none', border: 'none', color: '#fff',
  cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 40,
};

const selectTile = {
  display: 'flex', alignItems: 'center', gap: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '16px 18px',
  cursor: 'pointer', textAlign: 'left', width: '100%',
};