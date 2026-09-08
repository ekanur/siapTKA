const CACHE_NAME = 'siaptka-pwa-v3';

// Core routes to pre-cache safely during install
const PRECACHE_URLS = [
  '/',
  '/login',
  '/latihan',
  '/onboarding-tka',
  '/manifest.json'
];

// Offline fallback HTML if completely uncached page is requested offline
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mode Offline - siapTKA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .badge { display: inline-block; padding: 4px 12px; background: #fef3c7; color: #b45309; border-radius: 9999px; font-size: 11px; font-weight: 700; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; }
    p { font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 12px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 13px; margin-bottom: 8px; }
    .btn-sub { background: #f1f5f9; color: #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Perangkat Sedang Offline</div>
    <h1>Akses Latihan Offline</h1>
    <p>Koneksi ke server sekolah terputus. Anda tetap dapat melanjutkan latihan mandiri menggunakan bank soal lokal yang tersimpan di perangkat.</p>
    <a href="/latihan" class="btn">Buka Beranda Latihan</a>
    <a href="javascript:location.reload()" class="btn btn-sub">Coba Muat Ulang</a>
  </div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[siapTKA SW] Pre-caching core routes');
      for (const url of PRECACHE_URLS) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch (e) {
          console.warn('[siapTKA SW] Pre-cache skip for', url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[siapTKA SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // 1. Session & Student Confirmation API: Network-First with Offline Cache Fallback
  if (url.pathname === '/api/auth/session' || url.pathname === '/api/student/konfirmasi') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // 2. Ignore other API requests (like /api/sync/...) but fail gracefully without crashing
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // 3. Static Next.js Chunks & Assets (_next/static, css, js, fonts, images)
  // Strategy: Stale-While-Revalidate / Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. HTML Page Navigation (mode === 'navigate' or document requests)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
              // Also cache without search params
              if (url.search) {
                cache.put(url.pathname, networkRes.clone());
              }
            });
          }
          return networkRes;
        })
        .catch(async () => {
          // Try exact match in cache
          let cached = await caches.match(req);
          if (cached) return cached;

          // Try match pathname without query
          cached = await caches.match(url.pathname);
          if (cached) return cached;

          // For student exercise subpages (/latihan/...), fall back to cached /latihan shell
          if (url.pathname.startsWith('/latihan')) {
            const latihanShell = await caches.match('/latihan');
            if (latihanShell) return latihanShell;
          }

          // Return offline fallback page
          return new Response(OFFLINE_FALLBACK_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 5. Next.js RSC Data Requests (?_rsc=...) or generic GET
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => {
            return cached || new Response('', { status: 200 });
          })
      );
    })
  );
});