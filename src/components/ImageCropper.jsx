import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader2 } from 'lucide-react';
import { getCroppedImg } from '../utils/cropUtils';

/**
 * ImageCropper — Modern profile picture cropping component using react-easy-crop
 * Props:
 *   src      : string  — Image URL (blob or dataUrl)
 *   aspect   : number  — Aspect ratio (default 1 for profile)
 *   onCrop   : (blob) => void
 *   onCancel : () => void
 */
export default function ImageCropper({ src, aspect = 1, onCrop, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
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
          <X size={24} />
        </button>
        <span style={titleStyle}>Profili Düzenle</span>
        <button 
          onClick={handleDone} 
          disabled={loading}
          style={{ ...actionBtnStyle, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? <Loader2 size={20} className="spin" /> : 'Kaydet'}
        </button>
      </div>

      {/* Cropper Container */}
      <div style={cropperContainerStyle}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          cropShape={aspect === 1 ? 'round' : 'rect'}
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
          <ZoomOut size={18} color="#737373" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <ZoomIn size={18} color="#0095F6" />
        </div>

        <div style={actionRowStyle}>
          <button 
            onClick={() => setRotation((r) => (r + 90) % 360)}
            style={toolBtnStyle}
          >
            <RotateCw size={16} /> 90° Döndür
          </button>
          <button 
            onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}
            style={{ ...toolBtnStyle, color: '#737373', border: '1px solid #262626' }}
          >
            Sıfırla
          </button>
        </div>
        
        <p style={hintStyle}>
          Görseli sürükleyerek veya iki parmakla hizalayabilirsin.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
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
  fontWeight: 700,
  fontSize: 16,
  color: '#fff',
};

const actionBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#0095F6',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  padding: '8px 12px',
  minWidth: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cropperContainerStyle = {
  position: 'relative',
  flex: 1,
  width: '100%',
  background: '#000',
};

const controlsWrapperStyle = {
  padding: '24px 20px',
  background: 'linear-gradient(to top, #000 80%, transparent)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
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
  background: '#262626',
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
  background: '#1C1C1C',
  border: '1px solid #333',
  borderRadius: 12,
  color: '#fff',
  padding: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const hintStyle = {
  fontSize: 12,
  color: '#737373',
  textAlign: 'center',
  margin: 0,
};
