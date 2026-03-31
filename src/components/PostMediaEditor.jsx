import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Crop, MoveLeft, MoveRight } from 'lucide-react';
import PostImageCropper from './PostImageCropper';
import { compressImage, IMAGE_ACCEPT } from '../utils/mediaCompressor';

/**
 * PostMediaEditor — Çoklu medya yönetimi ve düzenleme bileşeni
 * Props:
 *   initialMedia : array — [{ file, previewUrl, type, ... }]
 *   onSave       : (mediaArray) => void
 *   onCancel     : () => void
 *   maxItems     : number
 */
export default function PostMediaEditor({ initialMedia = [], onSave, onCancel, maxItems = 5 }) {
  const [items, setItems] = useState(initialMedia);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

  const activeItem = items[activeIndex];

  const handleAddFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = maxItems - items.length;
    const toAdd = files.slice(0, remaining);
    const newItems = toAdd.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: 'image',
      isNew: true
    }));
    setItems([...items, ...newItems]);
    setActiveIndex(items.length);
    e.target.value = '';
  };

  const removeItem = (index) => {
    const newItems = [...items];
    if (newItems[index].previewUrl) URL.revokeObjectURL(newItems[index].previewUrl);
    newItems.splice(index, 1);
    setItems(newItems);
    if (activeIndex >= newItems.length) setActiveIndex(Math.max(0, newItems.length - 1));
  };

  const moveItem = (dir) => {
    const newItems = [...items];
    const target = activeIndex + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[activeIndex], newItems[target]] = [newItems[target], newItems[activeIndex]];
    setItems(newItems);
    setActiveIndex(target);
  };

  const handleCropDone = async (blob) => {
    if (!blob) { setEditingIndex(null); return; }
    const idx = editingIndex;
    setEditingIndex(null);
    try {
      const rawFile = new File([blob], `post_${idx}.jpg`, { type: 'image/jpeg' });
      const result = await compressImage(rawFile);
      const newItems = [...items];
      if (newItems[idx].previewUrl) URL.revokeObjectURL(newItems[idx].previewUrl);
      newItems[idx] = { ...newItems[idx], file: result.file, previewUrl: result.url, isEdited: true };
      setItems(newItems);
    } catch (err) { alert("Düzenleme hatası: " + err.message); }
  };

  return (
    <div className="glass-panel" style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: '#000', display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
        <button 
          onClick={() => onSave(items)}
          className="premium-gradient-btn"
          style={{ borderRadius: 20, padding: '8px 24px', fontSize: 14 }}
        >
          Bitti
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Main Focused Preview */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: '#050505' }}>
          {items.length > 0 && activeItem ? (
            <div style={{ width: '100%', maxWidth: 400, aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {activeItem.type === 'video' ? (
                <video src={activeItem.previewUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <img src={activeItem.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
          ) : (
             <div style={{ color: '#444', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                <p>Henüz medya eklemedin.</p>
             </div>
          )}
        </div>

        {/* Thumbnail Tray */}
        <div style={{ padding: '20px 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {items.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setActiveIndex(i)}
                style={{ 
                  width: 72, height: 72, borderRadius: 12, flexShrink: 0,
                  position: 'relative', overflow: 'hidden', cursor: 'pointer',
                  border: i === activeIndex ? '2px solid #0095F6' : '2px solid transparent',
                  transform: i === activeIndex ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s',
                  boxShadow: i === activeIndex ? '0 0 20px rgba(0,149,246,0.3)' : 'none'
                }}
              >
                <img src={item.thumbnailUrl || item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                {item.type === 'video' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}><Trash2 size={16} color="#fff" /></div>}
              </div>
            ))}
            {items.length < maxItems && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 72, height: 72, borderRadius: 12, border: '2px dashed #444', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Plus size={24} color="#777" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions for Active Item */}
        <div style={{ padding: '24px 16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 16, background: '#000' }}>
           <button onClick={() => removeItem(activeIndex)} style={editorActionBtn}><Trash2 size={24} color="#FF3040" /></button>
           <div style={{ display: 'flex', gap: 12 }}>
              <button disabled={activeIndex === 0} onClick={() => moveItem(-1)} style={{ ...editorActionBtn, opacity: activeIndex === 0 ? 0.3 : 1 }}><MoveLeft size={24} /></button>
              <button disabled={activeIndex === items.length - 1} onClick={() => moveItem(1)} style={{ ...editorActionBtn, opacity: activeIndex === items.length - 1 ? 0.3 : 1 }}><MoveRight size={24} /></button>
           </div>
           {activeItem?.type === 'image' && (
             <button onClick={() => setEditingIndex(activeIndex)} style={{ ...editorActionBtn, color: '#0095F6' }}><Crop size={24} /></button>
           )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={handleAddFile} />

      {editingIndex !== null && (
        <PostImageCropper
          src={items[editingIndex].previewUrl}
          onCrop={handleCropDone}
          onCancel={() => setEditingIndex(null)}
        />
      )}

      <div className="safe-bottom" style={{ background: '#000' }} />
    </div>
  );
}

const editorActionBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  width: 56, height: 56, borderRadius: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#fff'
};
