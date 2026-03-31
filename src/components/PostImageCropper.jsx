import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Maximize2, Minimize2, Square, LayoutTemplate } from 'lucide-react';

/**
 * PostImageCropper — Gönderiler için gelişmiş medya düzenleyici
 * Props:
 *   src      : string
 *   onCrop   : (blob) => void
 *   onCancel : () => void
 */
export default function PostImageCropper({ src, onCrop, onCancel }) {
  const canvasRef     = useRef(null);
  const imgRef        = useRef(null);
  const containerRef  = useRef(null);

  const [aspect,   setAspect]   = useState(1);
  const [scale,    setScale]    = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart              = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const BASE_SIZE = 340; 

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext('2d');
    let w = BASE_SIZE;
    let h = BASE_SIZE / aspect;
    const maxH = window.innerHeight * 0.5;
    if (h > maxH) { h = maxH; w = h * aspect; }
    canvas.width  = w;
    canvas.height = h;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    ctx.translate(cx + offset.x, cy + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    const baseScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    ctx.scale(baseScale, baseScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [scale, rotation, offset, imgLoaded, aspect]);

  useEffect(() => { draw(); }, [draw]);

  const onPointerDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  };

  const onPointerUp = () => setDragging(false);

  const handleCrop = () => {
    const canvas  = canvasRef.current;
    canvas.toBlob((blob) => { if (blob) onCrop(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div className="glass-panel" style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      background: '#000', display: 'flex', flexDirection: 'column',
      userSelect: 'none', animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)'
      }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', padding: 8, display: 'flex', alignItems: 'center' }}>
          <X size={26} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Düzenle</span>
        <button onClick={handleCrop} className="premium-gradient-btn" style={{ borderRadius: 20, padding: '8px 24px', fontSize: 14 }}>
          Uygula
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '20px 0' }}>
        
        {/* Aspect Selectors */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: 'Kare (1:1)', value: 1, icon: <Square size={14} /> },
            { label: 'Portre (4:5)', value: 0.8, icon: <LayoutTemplate size={14} style={{ transform: 'rotate(90deg)' }} /> },
            { label: 'Yatay (16:9)', value: 1.77, icon: <LayoutTemplate size={14} /> },
          ].map(opt => (
            <button 
              key={opt.label}
              onClick={() => { setAspect(opt.value); setOffset({x:0, y:0}); setScale(1); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: aspect === opt.value ? '#fff' : 'transparent',
                color: aspect === opt.value ? '#000' : '#A8A8A8',
                border: 'none', padding: '10px 16px', borderRadius: 18,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {opt.icon} {opt.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            position: 'relative',
            width: canvasRef.current?.width || BASE_SIZE,
            height: canvasRef.current?.height || (BASE_SIZE / aspect),
            cursor: dragging ? 'grabbing' : 'grab',
            overflow: 'hidden',
            background: '#111',
            borderRadius: 12,
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            touchAction: 'none',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          <div style={{ 
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(#fff4 1px, transparent 1px), linear-gradient(90deg, #fff4 1px, transparent 1px)`,
            backgroundSize: '33.33% 33.33%',
            opacity: dragging ? 1 : 0, transition: 'opacity 0.2s'
          }} />
        </div>

        <div style={{ width: '100%', maxWidth: 360, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ZoomOut size={20} color="#737373" />
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="range" min="0.8" max="3" step="0.01" 
                value={scale} onChange={e => setScale(parseFloat(e.target.value))}
                style={{ width: '100%', height: 4, borderRadius: 2, background: '#333', appearance: 'none', outline: 'none', accentColor: '#0095F6' }}
              />
            </div>
            <ZoomIn size={20} color="#0095F6" />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
             <button onClick={() => setRotation(r => (r + 90) % 360)} style={cropperToolBtn}>
                <RotateCw size={18} /> 90° Döndür
             </button>
             <button onClick={() => { setScale(1); setRotation(0); setOffset({x:0, y:0}); }} style={{ ...cropperToolBtn, color: '#737373', flex: 0.4 }}>
                Sıfırla
             </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 12, color: '#737373', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
        Görseli parmağınla kaydırarak veya zoom yaparak hizala.
      </div>

      <img ref={imgRef} src={src} alt="" crossOrigin="anonymous" onLoad={() => setImgLoaded(true)} style={{ display: 'none' }} />
    </div>
  );
}

const cropperToolBtn = {
  flex: 1,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  padding: '14px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 700,
  transition: '0.2s'
};
