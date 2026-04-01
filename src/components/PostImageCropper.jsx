import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader2, Square, LayoutTemplate } from 'lucide-react';
import { getCroppedImg } from '../utils/cropUtils';

/**
 * PostImageCropper — Advanced media cropper for posts
 * Supports multiple aspect ratios.
 * Props:
 *   src      : string  — Image URL
 *   onCrop   : (blob) => void
 *   onCancel : () => void
 */
export default function PostImageCropper({ src, onCrop, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(src, croppedAreaPixels, rotation);
      onCrop(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Fotoğraf işlenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onCancel} style={iconBtnStyle}>
          <X size={26} />
        </button>
        <span style={titleStyle}>Düzenle</span>
        <button 
          onClick={handleDone} 
          disabled={loading}
          style={premiumBtnStyle}
        >
          {loading ? <Loader2 size={18} className="spin" /> : 'Uygula'}
        </button>
      </div>

      {/* Aspect Ratio Selectors */}
      <div style={aspectSelectorWrapper}>
        <div style={aspectSelectorGroup}>
          {[
            { label: '1:1', value: 1, icon: <Square size={14} /> },
            { label: '4:5', value: 0.8, icon: <LayoutTemplate size={14} style={{ transform: 'rotate(90deg)' }} /> },
            { label: '16:9', value: 1.77, icon: <LayoutTemplate size={14} /> },
          ].map(opt => (
            <button 
              key={opt.label}
              onClick={() => { setAspect(opt.value); setCrop({ x:0, y:0 }); setZoom(1); }}
              style={{
                ...aspectBtnStyle,
                background: aspect === opt.value ? '#fff' : 'transparent',
                color: aspect === opt.value ? '#000' : '#A8A8A8',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cropper Container */}
      <div style={cropperContainerStyle}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          showGrid={true}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: { border: '2px solid rgba(255,255,255,0.4)' }
          }}
        />
      </div>

      {/* Controls */}
      <div style={controlsWrapperStyle}>
        <div style={controlRowStyle}>
          <ZoomOut size={20} color="#737373" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <ZoomIn size={20} color="#0095F6" />
        </div>

        <div style={actionRowStyle}>
          <button 
            onClick={() => setRotation((r) => (r + 90) % 360)}
            style={toolBtnStyle}
          >
            <RotateCw size={18} /> 90° Döndür
          </button>
          <button 
            onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}
            style={{ ...toolBtnStyle, color: '#737373', flex: 0.4 }}
          >
            Sıfırla
          </button>
        </div>
        
        <p style={hintStyle}>
          Görseli parmağınla kaydırarak veya zoom yaparak hizala.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 5000,
  background: '#000',
  display: 'flex',
  flexDirection: 'column',
  animation: 'fadeIn 0.2s ease-out',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid #262626',
  paddingTop: 'max(12px, env(safe-area-inset-top))',
  zIndex: 10,
};

const iconBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#fff',
  padding: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const titleStyle = {
  fontWeight: 800,
  fontSize: 17,
  color: '#fff',
  letterSpacing: '-0.02em',
};

const premiumBtnStyle = {
  background: 'linear-gradient(45deg, #0095F6, #0072b1)',
  border: 'none',
  color: '#fff',
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
  padding: '8px 24px',
  borderRadius: 20,
  minWidth: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0,149,246,0.3)',
};

const aspectSelectorWrapper = {
  padding: '16px 0',
  background: '#000',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 5,
};

const aspectSelectorGroup = {
  display: 'flex',
  gap: 8,
  background: 'rgba(255,255,255,0.05)',
  padding: 6,
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.1)',
};

const aspectBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: 'none',
  padding: '8px 16px',
  borderRadius: 18,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  whiteSpace: 'nowrap',
};

const cropperContainerStyle = {
  position: 'relative',
  flex: 1,
  width: '100%',
  background: '#000',
};

const controlsWrapperStyle = {
  padding: '24px 20px',
  background: '#000',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  borderTop: '1px solid rgba(255,255,255,0.05)',
  paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
};

const controlRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  width: '100%',
};

const sliderStyle = {
  flex: 1,
  height: 4,
  borderRadius: 2,
  background: '#333',
  appearance: 'none',
  outline: 'none',
  accentColor: '#0095F6',
};

const actionRowStyle = {
  display: 'flex',
  gap: 12,
};

const toolBtnStyle = {
  flex: 1,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  color: '#fff',
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: '0.2s',
};

const hintStyle = {
  fontSize: 12,
  color: '#737373',
  textAlign: 'center',
  margin: 0,
};
