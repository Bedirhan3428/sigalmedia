// src/hooks/usePWAInstall.js
// ─────────────────────────────────────────────────────────────
// Tarayıcının "beforeinstallprompt" eventini yakalar ve
// istediğin zaman tetikleyebileceğin bir fonksiyon döner.
//
// Kullanım:
//   const { canInstall, promptInstall, isInstalled } = usePWAInstall();
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall,     setCanInstall]     = useState(false);
  const [isInstalled,    setIsInstalled]    = useState(false);

  useEffect(() => {
    // Zaten standalone modda çalışıyorsa (yani kurulu)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Android / Chrome / Edge — beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Kurulum tamamlandığında
    window.addEventListener('appinstalled', () => {
      setCanInstall(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return 'ios'; // iOS özel akış
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
    return outcome;
  };

  // iOS mu?
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  return { canInstall, promptInstall, isInstalled, isIOS };
}