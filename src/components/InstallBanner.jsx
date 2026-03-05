// src/components/InstallBanner.jsx
// ─────────────────────────────────────────────────────────────
// Kullanıcıya "Ana Ekrana Ekle" uyarısı gösterir.
// Android/Chrome: native prompt tetiklenir.
// iOS Safari: adım adım rehber gösterilir.
//
// Kullanım (App.jsx içinde, Navbar'ın üstünde):
//   import InstallBanner from './components/InstallBanner';
//   <InstallBanner />
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { X, Share, Plus, Smartphone } from 'lucide-react';
import usePWAInstall from '../hooks/usePWAInstall';

export default function InstallBanner() {
  const { canInstall, promptInstall, isInstalled, isIOS } = usePWAInstall();
  const [dismissed,  setDismissed]  = useState(false);
  const [showIOSMsg, setShowIOSMsg] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Daha önce kapatmışsa bir daha gösterme (session bazlı)
  useEffect(() => {
    const v = sessionStorage.getItem('pwa-banner-dismissed');
    if (v) setDismissed(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setDismissed(true);
    setShowIOSMsg(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSMsg(prev => !prev);
      return;
    }
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  // Gösterim koşulları
  const shouldShow = !isInstalled && !dismissed && (canInstall || isIOS);
  if (!shouldShow) return null;

  return (
    <>
      {/* ── Ana Banner ── */}
      <div style={bannerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* İkon */}
          <div style={iconWrapStyle}>
            <Smartphone size={20} color="#6366f1" />
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={titleStyle}>Ana Ekrana Ekle</p>
            <p style={subStyle}>Uygulamayı telefon ekranına kısayol olarak ekle.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Kapat */}
          <button onClick={dismiss} style={closeBtnStyle} aria-label="Kapat">
            <X size={16} />
          </button>

          {/* Ekle */}
          <button
            onClick={handleInstall}
            disabled={installing}
            style={installBtnStyle}
          >
            {installing ? '...' : isIOS ? 'Nasıl?' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* ── iOS Rehberi ── */}
      {showIOSMsg && (
        <div style={iosGuideStyle}>
          <p style={iosTitleStyle}>📱 Ana Ekrana Ekle (iOS)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <IOSStep n={1} icon={<Share size={15} color="#6366f1" />}>
              Safari'nin alt menüsündeki{' '}
              <strong style={{ color: '#e4e4e7' }}>Paylaş</strong> butonuna{' '}
              <Share size={12} color="#a5b4fc" style={{ display: 'inline', verticalAlign: 'middle' }} /> dokun.
            </IOSStep>
            <IOSStep n={2} icon={<Plus size={15} color="#6366f1" />}>
              Açılan menüde{' '}
              <strong style={{ color: '#e4e4e7' }}>"Ana Ekrana Ekle"</strong> seçeneğini bul ve dokun.
            </IOSStep>
            <IOSStep n={3} icon="✓">
              Sağ üstteki{' '}
              <strong style={{ color: '#e4e4e7' }}>"Ekle"</strong> butonuna dokun. Hazır! 🎉
            </IOSStep>
          </div>
          <p style={{ fontSize: '11px', color: '#52525b', marginTop: '10px', textAlign: 'center' }}>
            Not: Bu özellik yalnızca Safari tarayıcısında çalışır.
          </p>
        </div>
      )}
    </>
  );
}

function IOSStep({ n, icon, children }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '11px', fontWeight: 700, color: '#a5b4fc',
      }}>
        {typeof icon === 'string' ? icon : n}
      </div>
      <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.55, margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────
const bannerStyle = {
  position:         'fixed',
  bottom:           'calc(64px + env(safe-area-inset-bottom, 0px))',
  left:             '50%',
  transform:        'translateX(-50%)',
  width:            'calc(100% - 24px)',
  maxWidth:         '576px',
  zIndex:           100,
  background:       'rgba(24, 24, 27, 0.97)',
  border:           '1px solid rgba(99,102,241,0.25)',
  borderRadius:     '14px',
  padding:          '12px 14px',
  display:          'flex',
  alignItems:       'center',
  gap:              '12px',
  backdropFilter:   'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow:        '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
  animation:        'bannerSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both',
};

const iconWrapStyle = {
  width:           40,
  height:          40,
  borderRadius:    '10px',
  background:      'rgba(99,102,241,0.12)',
  border:          '1px solid rgba(99,102,241,0.2)',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  flexShrink:      0,
};

const titleStyle = {
  fontSize:    '13px',
  fontWeight:  700,
  color:       '#f4f4f5',
  margin:      0,
  marginBottom: '2px',
};

const subStyle = {
  fontSize: '11px',
  color:    '#71717a',
  margin:   0,
  lineHeight: 1.4,
};

const closeBtnStyle = {
  background:            'transparent',
  border:                'none',
  color:                 '#52525b',
  cursor:                'pointer',
  width:                 32,
  height:                32,
  display:               'flex',
  alignItems:            'center',
  justifyContent:        'center',
  borderRadius:          '8px',
  WebkitTapHighlightColor: 'transparent',
  flexShrink:            0,
};

const installBtnStyle = {
  background:            '#6366f1',
  border:                'none',
  borderRadius:          '8px',
  color:                 '#fff',
  fontSize:              '13px',
  fontWeight:            700,
  padding:               '8px 14px',
  cursor:                'pointer',
  whiteSpace:            'nowrap',
  minHeight:             '36px',
  WebkitTapHighlightColor: 'transparent',
  transition:            'background 0.2s, opacity 0.2s',
  flexShrink:            0,
};

const iosGuideStyle = {
  position:             'fixed',
  bottom:               'calc(136px + env(safe-area-inset-bottom, 0px))',
  left:                 '50%',
  transform:            'translateX(-50%)',
  width:                'calc(100% - 24px)',
  maxWidth:             '576px',
  zIndex:               100,
  background:           '#18181b',
  border:               '1px solid #27272a',
  borderRadius:         '14px',
  padding:              '16px',
  backdropFilter:       'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow:            '0 8px 32px rgba(0,0,0,0.5)',
  animation:            'bannerSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
};

const iosTitleStyle = {
  fontSize:     '13px',
  fontWeight:   700,
  color:        '#e4e4e7',
  marginBottom: '12px',
  textAlign:    'center',
};