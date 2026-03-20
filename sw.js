/* ══════════════════════════════════════════════════════
   Sortify Service Worker — v3.0 PRODUCTION
   
   CRITICAL DESIGN DECISIONS:
   1. NEVER intercept navigate requests — Spotify OAuth callbacks
      are navigate-mode fetches. Intercepting them can serve stale
      cached HTML, breaking the auth flow entirely.
   2. HTML files are NEVER cached — always network-first.
      This ensures new deployments are always picked up.
   3. Only static assets (icons) are cached.
   ══════════════════════════════════════════════════════ */

const CACHE_NAME = 'sortify-v3';

// ── Install: skip waiting immediately ──────────────────
self.addEventListener('install', e => {
  // Don't pre-cache anything — we'll cache on demand
  self.skipWaiting();
});

// ── Activate: clear ALL old caches ────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: minimal interception strategy ──────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. Never intercept cross-origin requests (Spotify, fonts, etc.)
  if (url.origin !== self.location.origin) {
    return; // Let browser handle naturally
  }

  // 2. CRITICAL: Never intercept navigation requests.
  //    OAuth callbacks (/?code=XXX) are navigate-mode requests.
  //    If we intercept and serve stale cache, the code gets processed
  //    by old JavaScript and auth breaks silently.
  //    Always go to network for navigations, fall back to index.html offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .catch(() => caches.match('/index.html') || new Response('Offline', { status: 503 }))
    );
    return;
  }

  // 3. For icon requests: generate via OffscreenCanvas (no network needed)
  const iconMatch = url.pathname.match(/\/icons\/icon-(\d+)\.png$/);
  if (iconMatch) {
    e.respondWith(generateIcon(parseInt(iconMatch[1], 10)));
    return;
  }

  // 4. For everything else (manifest.json, sw.js itself):
  //    Network first, no caching of HTML/JS files
  const isStaticAsset = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/);
  if (isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
  // All other requests (including manifest.json): network only, no interception
});

// ── Icon generation ────────────────────────────────────
async function generateIcon(size) {
  try {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    drawIcon(ctx, size);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return new Response(blob, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' }
    });
  } catch {
    // OffscreenCanvas not supported — 1×1 transparent PNG
    const px = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,96,96,96,0,0,0,4,0,1,39,53,34,180,0,0,0,0,73,69,78,68,174,66,96,130]);
    return new Response(px.buffer, { headers: { 'Content-Type': 'image/png' } });
  }
}

function drawIcon(ctx, size) {
  const cx = size / 2, cy = size / 2;
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#080808'); bg.addColorStop(1, '#050505');
  ctx.fillStyle = bg;
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fill();
  const glow = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy * 0.8, size * 0.55);
  glow.addColorStop(0, 'rgba(0,217,255,0.25)'); glow.addColorStop(0.5, 'rgba(255,0,110,0.1)'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#00d9ff'); g.addColorStop(1, '#ff006e');
  ctx.strokeStyle = g; ctx.lineWidth = size * 0.028; ctx.lineCap = 'round';
  const rr = size * 0.32, circ = 2 * Math.PI * rr;
  ctx.setLineDash([circ * (168/202), circ * (34/202)]);
  ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2);
  ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  const cd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.1);
  cd.addColorStop(0, '#00d9ff'); cd.addColorStop(1, 'rgba(0,217,255,0)');
  ctx.fillStyle = cd; ctx.beginPath(); ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#00d9ff'; ctx.beginPath(); ctx.arc(cx, cy, size * 0.05, 0, Math.PI * 2); ctx.fill();
}
