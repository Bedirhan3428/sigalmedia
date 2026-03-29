import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

/**
 * ImageCropper — canvas tabanlı kırpma popup'ı
 * Props:
 *   src      : string  — önizleme URL
 *   aspect   : number  — en-boy oranı (1 = kare, 4/5 = portrait, 16/9 = landscape)
 *   onCrop   : (blob) => void
 *   onCancel : () => void
 */
export default function ImageCropper({ src, aspect = 1, onCrop, onCancel }) {
  const canvasRef     = useRef(null);
  const imgRef        = useRef(null);
  const containerRef  = useRef(null);

  const [scale,    setScale]    = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart              = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const CROP_SIZE = 320; // px — kırpma alanı boyutu

  // Canvas'a çiz
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    canvas.width  = CROP_SIZE;
    canvas.height = CROP_SIZE / aspect;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    ctx.translate(cx + offset.x, cy + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Fit image in crop area initially
    const baseScale = Math.max(
      canvas.width  / img.naturalWidth,
      canvas.height / img.naturalHeight
    );
    ctx.scale(baseScale, baseScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [scale, rotation, offset, imgLoaded, aspect]);

  useEffect(() => { draw(); }, [draw]);

  // Pointer events for drag
  const onPointerDown = (e) => {
    setDragging(true);
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      ox: offset.x,  oy: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  };

  const onPointerUp = () => setDragging(false);

  // Pinch-to-zoom (touch)
  const lastDist = useRef(0);
  const onTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastDist.current > 0) {
        const delta = dist / lastDist.current;
        setScale(s => Math.min(Math.max(s * delta, 0.5), 5));
      }
      lastDist.current = dist;
    }
  };
  const onTouchEnd = () => { lastDist.current = 0; };

  // Export cropped image
  const handleCrop = () => {
    const canvas  = canvasRef.current;
    const quality = 0.88;
    canvas.toBlob(
      (blob) => { if (blob) onCrop(blob); },
      'image/jpeg',
      quality
    );
  };

  const cropH = CROP_SIZE / aspect;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', maxWidth: 480, padding: '12px 16px',
        borderBottom: '1px solid #262626',
      }}>
        <button onClick={onCancel}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6 }}>
          <X size={22} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Kırp</span>
        <button onClick={handleCrop}
                style={{ background: 'none', border: 'none', color: '#0095F6', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}>
          Tamam
        </button>
      </div>

      {/* Hidden img for source */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        crossOrigin="anonymous"
        onLoad={() => setImgLoaded(true)}
        style={{ display: 'none' }}
      />

      {/* Canvas crop area */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width:    CROP_SIZE,
          height:   cropH,
          cursor:   dragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          borderRadius: aspect === 1 ? '50%' : 8,
          border: '2px solid rgba(255,255,255,0.2)',
          margin: '24px 0',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${CROP_SIZE/3}px ${cropH/3}px`,
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '0 24px', width: '100%', maxWidth: 480 }}>
        {/* Zoom slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <ZoomOut size={18} color="#A8A8A8" />
          <input
            type="range" min="0.5" max="4" step="0.05"
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#0095F6' }}
          />
          <ZoomIn size={18} color="#A8A8A8" />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Rotate */}
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--surface-3,#1C1C1C)', border: '1px solid #262626',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            }}
          >
            <RotateCw size={16} /> Döndür
          </button>

          {/* Reset */}
          <button
            onClick={() => { setScale(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'transparent', border: '1px solid #262626',
              color: '#A8A8A8', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            }}
          >
            Sıfırla
          </button>
        </div>

        {/* Aspect ratio hints */}
        <p style={{ fontSize: 12, color: '#737373', textAlign: 'center' }}>
          Resmi sürükleyerek konumlandır · Kaydırarak büyüt
        </p>
      </div>
    </div>
  );
}
