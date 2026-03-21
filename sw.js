/* ═══════════════════════════════════════════════
   Sortio Service Worker — v3 PRODUCTION
   
   CRITICAL DESIGN:
   - NEVER intercept navigate requests
     OAuth callbacks (/?code=XXX) are navigate fetches.
     Serving stale cached HTML breaks auth silently.
   - HTML/JS files always served fresh from network.
   - Only static image assets are cached.
═══════════════════════════════════════════════ */
const CACHE = 'sortio-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept cross-origin (Spotify API, fonts, CDN)
  if (url.origin !== self.location.origin) return;

  // CRITICAL: Never intercept navigations — OAuth callback must hit network fresh
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Generated icons — OffscreenCanvas
  const iconMatch = url.pathname.match(/\/icons\/icon-(\d+)\.png$/);
  if (iconMatch) {
    e.respondWith(generateIcon(parseInt(iconMatch[1], 10)));
    return;
  }

  // Static image assets only — network first, cache fallback
  if (/\.(png|jpg|jpeg|gif|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
  // Everything else (HTML, JS, JSON): no interception — always network
});

async function generateIcon(size) {
  try {
    const c = new OffscreenCanvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    
    // Background with rounded corners
    const bg = ctx.createLinearGradient(0, 0, size, size);
    bg.addColorStop(0, '#0a0a0a'); 
    bg.addColorStop(1, '#141414');
    ctx.fillStyle = bg;
    const r = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(r,0); ctx.lineTo(size-r,0);
    ctx.quadraticCurveTo(size,0,size,r); ctx.lineTo(size,size-r);
    ctx.quadraticCurveTo(size,size,size-r,size); ctx.lineTo(r,size);
    ctx.quadraticCurveTo(0,size,0,size-r); ctx.lineTo(0,r);
    ctx.quadraticCurveTo(0,0,r,0); ctx.closePath(); ctx.fill();
    
    // Glow effect
    const glow = ctx.createRadialGradient(cx, cy*.85, 0, cx, cy*.85, size*.6);
    glow.addColorStop(0, 'rgba(121,227,255,.3)');
    glow.addColorStop(.4, 'rgba(255,108,144,.15)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
    
    // Circular gradient ring
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#79e3ff');
    gradient.addColorStop(0.5, '#ff6c90');
    gradient.addColorStop(1, '#8eff71');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = size * .035;
    ctx.lineCap = 'round';
    const rr = size * .38;
    const circ = 2 * Math.PI * rr;
    ctx.setLineDash([circ * (200/220), circ * (20/220)]);
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.resetTransform();
    
    // Letter 'S' for Sortio
    ctx.fillStyle = '#79e3ff';
    ctx.font = `${size * 0.45}px Inter, system-ui, sans-serif`;
    ctx.fontWeight = '900';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', cx, cy * 1.02);
    
    const blob = await c.convertToBlob({ type: 'image/png' });
    return new Response(blob, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=31536000' } });
  } catch {
    const px = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,96,96,96,0,0,0,4,0,1,39,53,34,180,0,0,0,0,73,69,78,68,174,66,96,130]);
    return new Response(px.buffer, { headers: { 'Content-Type': 'image/png' } });
  }
}
