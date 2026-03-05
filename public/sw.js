/* ─────────────────────────────────────────────
   Lise Vitrini — Service Worker
   Strateji: Network-first (her zaman taze veri),
   offline'da cache fallback.
───────────────────────────────────────────── */

const CACHE_NAME   = 'lise-vitrini-v1';
const STATIC_CACHE = 'lise-vitrini-static-v1';

// Offline'da bile çalışmasını istediğimiz kaynaklar
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install: statik dosyaları ön-belleğe al ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Eski SW varsa hemen devral
  self.skipWaiting();
});

// ── Activate: eski cache'leri temizle ────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first strateji ────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API isteklerini cache'leme — her zaman network
  if (url.pathname.startsWith('/api/') || url.hostname === 'localhost') {
    return;
  }

  // Sadece GET isteklerini ele al
  if (request.method !== 'GET') return;

  // Google Fonts, CDN vb. — cache-first
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('api.dicebear.com')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // Uygulama shell — network-first, fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        // SPA: 404 yerine index.html dön
        return cached || caches.match('/index.html');
      })
  );
});