import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../apiConfig';

const EVENT_QUEUE = [];
let batchTimeoutId = null;

// Bellekteki eventleri arka planda sunucuya gönderir
const flushQueue = async () => {
    if (EVENT_QUEUE.length === 0) return;

    // Queue kopyasını al ve temizle
    const eventsToSend = [...EVENT_QUEUE];
    EVENT_QUEUE.length = 0;

    try {
        await fetch(`${API_URL}/api/analytics/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: eventsToSend }),
        });
    } catch (err) {
        console.error('Analytics batch gönderilemedi, eventler kayboldu:', err);
    }
};

// Sayfa kapanırken kalanları göndermek için (beacon desteklemiyorsa sendBeacon yerine fetch kullanılabilir ama blocklamamalı)
window.addEventListener('beforeunload', () => {
    if (EVENT_QUEUE.length > 0) {
        navigator.sendBeacon(`${API_URL}/api/analytics/batch`, JSON.stringify({ events: EVENT_QUEUE }));
    }
});

export default function useAnalytics() {
    const user = useAuth();
    const userId = user?.uid || 'anonymous';

    const trackEvent = useCallback((action, targetId = null, targetType = null, metadata = {}) => {
        EVENT_QUEUE.push({
            userId,
            action,
            targetId,
            targetType,
            ...metadata, // duration, percentage, source vb.
            timestamp: new Date().toISOString()
        });

        // 10 saniye içinde başka event gelmezse flush. Gelirse bekle.
        // Aslında periyodik yapmak da iyi:
        if (!batchTimeoutId) {
            batchTimeoutId = setTimeout(() => {
                flushQueue();
                batchTimeoutId = null;
            }, 10000); // 10 saniyede bir toplu gönder
        }
        
        // Eğer queue çok dolduysa hemen gönder bekleme
        if (EVENT_QUEUE.length >= 50) {
            clearTimeout(batchTimeoutId);
            batchTimeoutId = null;
            flushQueue();
        }
    }, [userId]);

    return { trackEvent };
}
