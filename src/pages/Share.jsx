import React, { useState, useRef, useEffect } from 'react';
import {
  X, ImagePlus, Loader2, Type, ChevronLeft, Plus,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  Trash2, Crop, Sparkles, Palette, ChevronDown
} from 'lucide-react';
import { Rnd } from 'react-rnd';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase';
import { API_URL } from '../apiConfig';
import { compressImage, compressVideo } from '../utils/mediaCompressor';
import { useProfile } from '../hooks/useProfile.jsx';
import PostImageCropper from '../components/PostImageCropper';

const MAX_CHARS = 280;
const MAX_VIDEO_MB = 50;

const STEP = { SELECT: 'select', PREVIEW: 'preview', CAPTION: 'caption' };

const FONT_COLORS = ['#FFFFFF', '#000000', '#FCAF45', '#E1306C', '#833AB4', '#00C6FF', '#FF3040', '#00E676'];
const FONT_FAMILIES = [
  { label: 'Temiz', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Yazılı', value: '"Courier New", monospace' },
  { label: 'Kalın', value: '"Poppins", sans-serif' },
  { label: 'Klasik', value: '"Inter", sans-serif' },
];

function makeOverlay() {
  return {
    id: 'txt_' + Date.now(),
    text: '',
    x: 10, y: 10,
    color: '#FFFFFF',
    size: 22,
    align: 'left',
    bold: true,
    italic: false,
    fontFamily: FONT_FAMILIES[0].value,
    bgOpacity: 0.45,
  };
}

/* ─────────────────────────────────────────────
   CANVAS BAKING
   Çerçeve boyutu artık ref'den değil, state'ten geliyor. (Hata Çözümü)
───────────────────────────────────────────── */
async function bakeOverlaysIntoImage(previewUrl, overlays, previewSize) {
  const validOverlays = (overlays || []).filter(o => o.text?.trim());

  if (!validOverlays.length) {
    const resp = await fetch(previewUrl);
    return resp.blob();
  }

  // containerRef yerine kaydedilen ölçüleri kullanıyoruz
  const CW = previewSize.w;
  const CH = previewSize.h;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CW;
      canvas.height = CH;
      const ctx = canvas.getContext('2d');

      // Siyah arka plan + objectFit:contain simülasyonu
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CW, CH);
      const scale = Math.min(CW / img.naturalWidth, CH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (CW - dw) / 2, (CH - dh) / 2, dw, dh);

      // Yazıları çiz
      validOverlays.forEach(o => {
        const x = (o.x / 100) * CW;
        const y = (o.y / 100) * CH;
        const fs = o.size;

        const fontStr = [
          o.italic ? 'italic' : '',
          o.bold ? 'bold' : '',
          `${fs}px`,
          o.fontFamily,
        ].filter(Boolean).join(' ');

        ctx.font = fontStr;
        ctx.textAlign = o.align || 'left';
        ctx.textBaseline = 'top';

        const lines = o.text.split('\n');
        const lineH = fs * 1.35;
        const pad = 8;
        const maxW = lines.reduce((acc, ln) => Math.max(acc, ctx.measureText(ln).width), 0);

        // Arka plan hap şekli
        ctx.fillStyle = `rgba(0,0,0,${o.bgOpacity ?? 0.45})`;
        const bgX = o.align === 'center' ? x - maxW / 2 - pad
          : o.align === 'right' ? x - maxW - pad
            : x - pad;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(bgX, y - pad / 2, maxW + pad * 2, lineH * lines.length + pad, 8);
          ctx.fill();
        } else {
          ctx.fillRect(bgX, y - pad / 2, maxW + pad * 2, lineH * lines.length + pad);
        }

        // Gölge ve metin
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = o.color;
        lines.forEach((ln, idx) => ctx.fillText(ln, x, y + idx * lineH));
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      });

      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.93);
    };

    img.onerror = reject;
    img.src = previewUrl;
  });
}

/* ─────────────────────────────────────────────
   DOĞRUDAN METİN DÜZENLEME (INLINE EDIT)
───────────────────────────────────────────── */
const ContentEditable = ({ html, active, onChange, style }) => {
  const ref = useRef();

  // Dışarıdan gelen metni içeriye aktar
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement !== ref.current) {
      ref.current.innerText = html;
    }
  }, [html]);

  // Aktif olduğunda otomatik odaklan
  useEffect(() => {
    if (active && ref.current) {
      ref.current.focus();
    }
  }, [active]);

  return (
    <div
      ref={ref}
      contentEditable={active}
      suppressContentEditableWarning
      onInput={e => onChange(e.currentTarget.innerText)}
      onPointerDown={e => {
        if (active) e.stopPropagation(); // Düzenlerken sürüklemeyi engeller, yazı seçimine izin verir
      }}
      style={{
        ...style,
        outline: 'none',
        minWidth: 40,
        cursor: active ? 'text' : 'move'
      }}
    />
  );
};

/* ─────────────────────────────────────────────
   SÜRÜKLENEBİLİR YAZI KATMANI
───────────────────────────────────────────── */
function OverlayTextLayer({ overlays, activeId, setActiveId, setOverlays, containerSize }) {
  if (!overlays?.length || containerSize.w === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      {overlays.map(o => (
        <Rnd
          key={o.id}
          bounds="parent"
          enableResizing={false}
          default={{ x: (o.x / 100) * containerSize.w, y: (o.y / 100) * containerSize.h }}
          onDragStart={() => setActiveId(o.id)}
          onDragStop={(_, d) => {
            setOverlays(prev => prev.map(item =>
              item.id === o.id
                ? { ...item, x: (d.x / containerSize.w) * 100, y: (d.y / containerSize.h) * 100 }
                : item
            ));
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={e => { e.stopPropagation(); setActiveId(o.id); }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: activeId === o.id ? 'rgba(0,149,246,0.3)' : `rgba(0,0,0,${o.bgOpacity})`,
              border: activeId === o.id ? '2px solid #0095F6' : '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              display: 'inline-block',
              textAlign: o.align,
            }}
          >
            <ContentEditable
              active={activeId === o.id}
              html={o.text}
              onChange={(newText) => {
                setOverlays(prev => prev.map(item => item.id === o.id ? { ...item, text: newText } : item));
              }}
              style={{
                color: o.color,
                fontSize: o.size,
                fontFamily: o.fontFamily,
                fontWeight: o.bold ? 700 : 400,
                fontStyle: o.italic ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                lineHeight: 1.35,
              }}
            />
            {!o.text && !activeId && (
              <span style={{ color: '#ccc', opacity: 0.7 }}>Metin...</span>
            )}
          </div>
        </Rnd>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AÇILIR MENÜLÜ TASARIM EDİTÖRÜ (BOTTOM PANEL)
───────────────────────────────────────────── */
function OverlayEditor({ overlay, onChange, onDelete }) {
  const [showColors, setShowColors] = useState(false);

  if (!overlay) return null;
  const upd = (k, v) => onChange({ ...overlay, [k]: v });

  const styleBtn = (active) => ({
    background: active ? '#0095F6' : '#1E1E1E',
    border: 'none', color: '#fff', borderRadius: 8,
    width: 38, height: 38, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  });

  return (
    <div style={{
      background: '#0A0A0A', borderTop: '1px solid #1E1E1E',
      padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center',
      animation: 'slideUp 0.25s ease-out', flexWrap: 'wrap', justifyContent: 'space-between'
    }}>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Yazı Tipi Açılır Menü */}
        <div style={{ position: 'relative' }}>
          <select
            value={overlay.fontFamily}
            onChange={e => upd('fontFamily', e.target.value)}
            style={{
              appearance: 'none', background: '#1A1A1A', color: '#fff', border: '1px solid #333',
              borderRadius: 8, padding: '8px 30px 8px 12px', outline: 'none', fontSize: 13, cursor: 'pointer'
            }}
          >
            {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <ChevronDown size={14} color="#aaa" style={{ position: 'absolute', right: 10, top: 12, pointerEvents: 'none' }} />
        </div>

        {/* Yazı Boyutu Açılır Menü */}
        <div style={{ position: 'relative' }}>
          <select
            value={overlay.size}
            onChange={e => upd('size', parseInt(e.target.value))}
            style={{
              appearance: 'none', background: '#1A1A1A', color: '#fff', border: '1px solid #333',
              borderRadius: 8, padding: '8px 30px 8px 12px', outline: 'none', fontSize: 13, cursor: 'pointer'
            }}
          >
            {[14, 18, 22, 28, 36, 48].map(s => <option key={s} value={s}>{s} px</option>)}
          </select>
          <ChevronDown size={14} color="#aaa" style={{ position: 'absolute', right: 10, top: 12, pointerEvents: 'none' }} />
        </div>

        {/* Renk Seçici (Popover) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColors(!showColors)}
            style={{
              width: 34, height: 34, borderRadius: '50%', background: overlay.color,
              border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {overlay.color === '#FFFFFF' && <Palette size={14} color="#000" />}
          </button>

          {showColors && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 10, background: '#1A1A1A',
              padding: 10, borderRadius: 12, display: 'flex', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.6)', border: '1px solid #333'
            }}>
              {FONT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { upd('color', c); setShowColors(false); }}
                  style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: overlay.color === c ? '2px solid #0095F6' : '1px solid #444', cursor: 'pointer' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Düzenleme Araçları */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => upd('bold', !overlay.bold)} style={styleBtn(overlay.bold)}><Bold size={16} /></button>
        <button onClick={() => upd('italic', !overlay.italic)} style={styleBtn(overlay.italic)}><Italic size={16} /></button>
        <button onClick={() => upd('align', overlay.align === 'left' ? 'center' : overlay.align === 'center' ? 'right' : 'left')} style={styleBtn(false)}>
          {overlay.align === 'left' ? <AlignLeft size={16} /> : overlay.align === 'center' ? <AlignCenter size={16} /> : <AlignRight size={16} />}
        </button>
        <div style={{ width: 1, background: '#333', margin: '0 4px' }} />
        <button onClick={onDelete} style={{ ...styleBtn(false), background: 'rgba(255,48,64,0.15)', color: '#FF3040' }}>
          <Trash2 size={16} />
        </button>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   ANA PAYLAŞIM BİLEŞENİ
───────────────────────────────────────────── */
export default function Share({ onClose }) {
  const user = useAuth();
  const { profile } = useProfile();

  const [step, setStep] = useState(STEP.SELECT);
  const [mediaList, setMediaList] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [overlays, setOverlays] = useState([]);
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const [content, setContent] = useState('');
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 }); // Çerçeve boyutunu kaydettiğimiz state

  const mediaInputRef = useRef();
  const mediaContainerRef = useRef();

  const remaining = profile?.dailyLimit ?? 10;
  const isBusy = ['compressing', 'uploading', 'sending'].includes(phase);
  const canPost = mediaList.length > 0 && !isBusy && phase !== 'done' && remaining > 0;

  const currentOverlays = overlays[activeIdx] || [];
  const activeOverlay = currentOverlays.find(o => o.id === activeOverlayId) || null;
  const hasBakeable = currentOverlays.some(o => o.text?.trim());

  // Ekran boyutu takibi (Null hatasının kesin çözümü için DOM referansı yerine ölçüleri kullanıyoruz)
  useEffect(() => {
    if (!mediaContainerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setPreviewSize({ w: width, h: height });
      }
    });
    ro.observe(mediaContainerRef.current);
    return () => ro.disconnect();
  }, [step]); // step değiştiğinde observer'ı tekrar bağla

  const setCurrentOverlays = fn =>
    setOverlays(prev => {
      const next = [...prev];
      while (next.length <= activeIdx) next.push([]);
      next[activeIdx] = typeof fn === 'function' ? fn(next[activeIdx] || []) : fn;
      return next;
    });

  const addOverlay = () => {
    const o = makeOverlay();
    setCurrentOverlays(prev => [...prev, o]);
    setActiveOverlayId(o.id);
  };

  const updateOverlay = updated =>
    setCurrentOverlays(prev => prev.map(o => o.id === updated.id ? updated : o));

  const deleteOverlay = id => {
    setCurrentOverlays(prev => prev.filter(o => o.id !== id));
    setActiveOverlayId(null);
  };

  /* ── Dosya Seçimi ── */
  const handleMediaFiles = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhase('compressing'); setProgress(0); setError('');
    try {
      const newItems = [];
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          newItems.push({ file, previewUrl: URL.createObjectURL(file), type: 'image' });
        } else if (file.type.startsWith('video/')) {
          if (file.size / (1024 * 1024) > MAX_VIDEO_MB) {
            setError(`Bazı videolar çok büyük (maks. ${MAX_VIDEO_MB}MB)`); continue;
          }
          try {
            const r = await compressVideo(file, p => setProgress(Math.round(p.ratio * 100)));
            newItems.push({ type: 'video', previewUrl: r.url, file: r.file });
          } catch {
            newItems.push({ type: 'video', previewUrl: URL.createObjectURL(file), file });
          }
        }
      }
      if (newItems.length) {
        setMediaList(prev => {
          const updated = [...prev, ...newItems].slice(0, 10);
          setActiveIdx(prev.length);
          return updated;
        });
        setStep(STEP.PREVIEW);
      }
    } catch {
      setError('Dosyalar işlenirken bir hata oluştu.');
    } finally {
      setPhase('idle');
      e.target.value = '';
    }
  };

  const removeMedia = idx => {
    setMediaList(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) setStep(STEP.SELECT);
      return next;
    });
    setOverlays(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
    setActiveIdx(i => Math.max(0, Math.min(i, mediaList.length - 2)));
  };

  const handleCropDone = async blob => {
    setShowCropper(false);
    if (!blob) return;
    try {
      const result = await compressImage(new File([blob], `edit_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      const next = [...mediaList];
      URL.revokeObjectURL(next[activeIdx].previewUrl);
      next[activeIdx] = { ...next[activeIdx], file: result.file, previewUrl: result.url };
      setMediaList(next);
    } catch { setError('Görsel işlenemedi.'); }
  };

  /* ── PAYLAŞIM ── */
  const handlePost = async () => {
    if (!canPost) return;
    setError(''); setProgress(0); setPhase('uploading');

    try {
      const token = await user.getIdToken();
      const uploadedMedia = [];

      for (let i = 0; i < mediaList.length; i++) {
        setProgress(Math.round((i / mediaList.length) * 100));
        const item = mediaList[i];
        const isVideo = item.type === 'video';
        const itemOverlays = overlays[i] || [];

        let fileToUpload = item.file;

        // ✅ Yazıları State üzerindeki previewSize boyutları ile basıyoruz. Null hatası yok!
        if (!isVideo && itemOverlays.some(o => o.text?.trim())) {
          const bakedBlob = await bakeOverlaysIntoImage(
            item.previewUrl,
            itemOverlays,
            previewSize
          );
          fileToUpload = new File(
            [bakedBlob],
            `baked_${Date.now()}_${i}.jpg`,
            { type: 'image/jpeg' }
          );
        }

        const ext = isVideo ? 'mp4' : 'jpg';
        const path = `tweets/${isVideo ? 'videos' : 'images'}/${user?.uid}/${Date.now()}-${i}.${ext}`;
        const sRef = storageRef(storage, path);
        const task = uploadBytesResumable(sRef, fileToUpload);
        await task;
        const url = await getDownloadURL(task.snapshot.ref);

        uploadedMedia.push({ url, path, type: item.type });
      }

      setPhase('sending');

      const res = await fetch(`${API_URL}/api/tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: user?.uid,
          content: content.trim(),
          media: uploadedMedia,
          mediaType: uploadedMedia.length > 1 ? 'multi' : uploadedMedia[0].type,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gönderi sunucu tarafında paylaşılamadı.');
      }

      setPhase('done');
      setTimeout(() => { onClose(); window.location.reload(); }, 1200);

    } catch (err) {
      setError('Üzgünüz, bir hata oluştu: ' + err.message);
      setPhase('error');
    }
  };

  /* ─── RENDER ─── */
  return (
    <div onClick={onClose} style={backdropStyle}>
      <div onClick={e => e.stopPropagation()} style={modalStyle}>

        {/* Başlık */}
        <div style={headerStyle}>
          <button
            onClick={step === STEP.SELECT ? onClose : () => {
              setStep(STEP.SELECT); setActiveOverlayId(null);
            }}
            style={iconBtn}
          >
            {step === STEP.SELECT ? <X size={26} /> : <ChevronLeft size={26} />}
          </button>
          <span style={titleStyle}>Yeni Paylaşım</span>

          {step === STEP.PREVIEW && (
            <button onClick={() => setStep(STEP.CAPTION)} style={nextBtnStyle}>İleri</button>
          )}
          {step === STEP.CAPTION && (
            <button
              onClick={handlePost}
              disabled={!canPost}
              style={{ ...postBtnStyle, opacity: canPost ? 1 : 0.35, cursor: canPost ? 'pointer' : 'not-allowed' }}
            >
              {isBusy ? <Loader2 size={18} className="spin" /> : 'Paylaş'}
            </button>
          )}
        </div>

        {/* Yükleme barı */}
        {isBusy && (
          <div style={{ height: 2, background: '#0095F6', width: `${progress}%`, transition: 'width 0.3s' }} />
        )}

        {error && <div style={errorStyle}>{error}</div>}
        {remaining <= 0 && <div style={limitBannerStyle}>Bugünlük gönderi hakkın doldu.</div>}

        {/* ── SEÇİM ── */}
        {step === STEP.SELECT && (
          <div style={selectContainer}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Sparkles size={42} color="#0095F6" />
              <h2 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 800 }}>Harika bir şeyler paylaş!</h2>
              <p style={{ color: '#555', margin: 0 }}>Fotoğraf veya video seçerek hikayeni anlat.</p>
            </div>
            <button onClick={() => mediaInputRef.current.click()} style={mainSelectBtn}>
              <ImagePlus size={32} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Medya Seç</span>
            </button>
            <input ref={mediaInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaFiles} />
          </div>
        )}

        {/* ── ÖNİZLEME & DÜZENLEME ── */}
        {step === STEP.PREVIEW && mediaList.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>

            <div
              ref={mediaContainerRef}
              style={mediaBox}
              onClick={() => { setActiveOverlayId(null); }}
            >
              {mediaList[activeIdx].type === 'video'
                ? <video src={mediaList[activeIdx].previewUrl} controls muted loop style={mediaEl} />
                : <img src={mediaList[activeIdx].previewUrl} style={mediaEl} alt="" />
              }

              {/* Sürüklenebilir ve Düzenlenebilir Yazılar */}
              <OverlayTextLayer
                overlays={currentOverlays}
                activeId={activeOverlayId}
                setActiveId={(id) => { setActiveOverlayId(id); }}
                setOverlays={setCurrentOverlays}
                containerSize={previewSize}
              />

              {/* Araç Çubuğu */}
              <div style={editorTools}>
                <ActionBtn onClick={addOverlay} icon={<Type size={20} />} label="Yazı ekle" />
                {mediaList[activeIdx].type === 'image' && (
                  <ActionBtn onClick={() => setShowCropper(true)} icon={<Crop size={20} />} label="Kırp" />
                )}
              </div>

              {hasBakeable && (
                <div style={bakeTag}>✓ Yazılar görsele işlenecek</div>
              )}
            </div>

            {/* Küçük Resimler (Thumbnails) */}
            <div style={thumbStrip}>
              {mediaList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => { setActiveIdx(i); setActiveOverlayId(null); }}
                  style={{ ...thumbBox, border: i === activeIdx ? '2px solid #0095F6' : '2px solid transparent' }}
                >
                  <img src={m.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {(overlays[i] || []).some(o => o.text?.trim()) && (
                    <div style={overlayBadge}><Type size={9} /></div>
                  )}
                  <button onClick={e => { e.stopPropagation(); removeMedia(i); }} style={removeBtn}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              <button onClick={() => mediaInputRef.current.click()} style={addMoreBtn}><Plus size={22} /></button>
              <input ref={mediaInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMediaFiles} />
            </div>

            {/* Seçili Yazının Ayar Menüsü */}
            {activeOverlay && (
              <OverlayEditor overlay={activeOverlay} onChange={updateOverlay} onDelete={() => deleteOverlay(activeOverlay.id)} />
            )}
          </div>
        )}

        {/* ── PAYLAŞIM AÇIKLAMASI ── */}
        {step === STEP.CAPTION && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={miniPreview}>
                <img src={mediaList[0].previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {mediaList.length > 1 && <div style={multiBadge}>+{mediaList.length - 1}</div>}
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Açıklama yaz..."
                style={captionInput}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#444' }}>Aegis Güvenlik Koruması içeriği kontrol eder.</span>
              <span style={{ fontSize: 12, color: '#444' }}>{content.length}/{MAX_CHARS}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: remaining <= 1 ? '#FF3040' : '#0095F6' }} />
              <span style={{ fontSize: 13, color: '#666' }}>
                {remaining > 0
                  ? <><b style={{ color: '#ccc' }}>{remaining}</b> gönderi hakkın kaldı.</>
                  : <span style={{ color: '#FF3040' }}>Bugünlük hakkın doldu.</span>
                }
              </span>
            </div>
          </div>
        )}

        {showCropper && (
          <PostImageCropper
            src={mediaList[activeIdx].previewUrl}
            onCrop={handleCropDone}
            onCancel={() => setShowCropper(false)}
          />
        )}

        <div style={{ height: 'env(safe-area-inset-bottom)', background: '#000' }} />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes rotate  { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        .spin { animation: rotate 1s linear infinite; }
      `}} />
    </div>
  );
}

function ActionBtn({ onClick, icon, label }) {
  return (
    <button title={label} onClick={onClick} style={{
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.15)',
      color: '#fff', width: 44, height: 44, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>
      {icon}
    </button>
  );
}

/* ── Stiller ── */
const backdropStyle = { position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const modalStyle = { width: '100%', maxWidth: 500, background: '#000', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', maxHeight: '95vh', overflow: 'hidden', border: '1px solid #191919' };
const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #191919' };
const titleStyle = { fontWeight: 800, fontSize: 17, color: '#fff' };
const iconBtn = { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, borderRadius: 8 };
const nextBtnStyle = { background: 'none', border: 'none', color: '#0095F6', fontWeight: 800, fontSize: 15, cursor: 'pointer' };
const postBtnStyle = { background: '#0095F6', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 20px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const errorStyle = { background: 'rgba(255,48,64,0.1)', color: '#FF3040', padding: '10px 14px', margin: '12px 16px 0', borderRadius: 12, fontSize: 13, textAlign: 'center' };
const limitBannerStyle = { background: 'rgba(255,48,64,0.07)', color: '#FF3040', padding: '9px 16px', margin: '6px 16px 0', borderRadius: 12, fontSize: 13, textAlign: 'center', border: '1px solid rgba(255,48,64,0.15)' };

const selectContainer = { padding: '60px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, textAlign: 'center' };
const mainSelectBtn = { background: 'linear-gradient(45deg,#0095F6,#006eb3)', border: 'none', color: '#fff', width: '100%', padding: '22px', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 8px 28px rgba(0,149,246,0.25)' };

const mediaBox = { position: 'relative', width: '100%', aspectRatio: '1', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
const mediaEl = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
const editorTools = { position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200 };
const bakeTag = { position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.72)', color: '#aaa', fontSize: 11, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap', pointerEvents: 'none' };

const thumbStrip = { display: 'flex', gap: 10, padding: '12px 14px', overflowX: 'auto', background: '#000', borderTop: '1px solid #191919' };
const thumbBox = { width: 62, height: 62, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: 'pointer' };
const overlayBadge = { position: 'absolute', bottom: 3, left: 3, background: 'rgba(0,149,246,0.9)', borderRadius: 5, padding: '2px 4px', display: 'flex', alignItems: 'center' };
const addMoreBtn = { width: 62, height: 62, borderRadius: 10, background: '#111', border: '1px dashed #2A2A2A', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };
const removeBtn = { position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.78)', border: 'none', color: '#fff', borderRadius: '50%', width: 17, height: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };

const miniPreview = { width: 78, height: 78, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#111' };
const multiBadge = { position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 10, padding: '2px 5px', borderRadius: 7, fontWeight: 800 };
const captionInput = { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', resize: 'none', minHeight: 100, padding: 0, lineHeight: 1.5 };