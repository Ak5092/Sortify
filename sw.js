/* ═══════════════════════════════════
   Sortify SW v2.0
   - Offline cache
   - OffscreenCanvas icon generation
     (icons are 100% code — no PNG files needed)
   ═══════════════════════════════════ */
const CACHE = 'sortify-v2.1';
const SHELL = ['./', './index.html', './manifest.json'];

// ── Install ──
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{}))
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);

  // Never intercept Spotify API / auth / Google Fonts
  if(url.hostname.includes('spotify.com')||
     url.hostname.includes('googleapis.com')||
     url.hostname.includes('gstatic.com')){
    return;
  }

  // Icon requests → generate from OffscreenCanvas (icons in code!)
  const iconMatch = url.pathname.match(/\/icons\/icon-(\d+)\.png$/);
  if(iconMatch){
    e.respondWith(generateIcon(parseInt(iconMatch[1],10)));
    return;
  }

  // App shell → stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fresh = fetch(e.request).then(res=>{
        if(res&&res.status===200&&res.type!=='opaque'){
          caches.open(CACHE).then(c=>c.put(e.request,res.clone()));
        }
        return res;
      }).catch(()=>cached);
      return cached||fresh;
    })
  );
});

// ── Icon generation via OffscreenCanvas ──
async function generateIcon(size){
  try{
    const canvas = new OffscreenCanvas(size, size);
    const ctx    = canvas.getContext('2d');
    drawIcon(ctx, size);
    const blob = await canvas.convertToBlob({type:'image/png'});
    return new Response(blob,{
      headers:{
        'Content-Type':'image/png',
        'Cache-Control':'public, max-age=31536000',
      }
    });
  }catch(err){
    // OffscreenCanvas not supported (older Safari) — return 1×1 transparent PNG
    const px = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,96,96,96,0,0,0,4,0,1,39,53,34,180,0,0,0,0,73,69,78,68,174,66,96,130]);
    return new Response(px.buffer,{headers:{'Content-Type':'image/png'}});
  }
}

function drawIcon(ctx, size){
  const cx=size/2, cy=size/2;

  // Background
  const bg = ctx.createLinearGradient(0,0,size,size);
  bg.addColorStop(0,'#010c1a');
  bg.addColorStop(1,'#000508');
  ctx.fillStyle = bg;
  const r = size*0.22;
  ctx.beginPath();
  ctx.moveTo(r,0);ctx.lineTo(size-r,0);
  ctx.quadraticCurveTo(size,0,size,r);
  ctx.lineTo(size,size-r);
  ctx.quadraticCurveTo(size,size,size-r,size);
  ctx.lineTo(r,size);
  ctx.quadraticCurveTo(0,size,0,size-r);
  ctx.lineTo(0,r);
  ctx.quadraticCurveTo(0,0,r,0);
  ctx.closePath(); ctx.fill();

  // Aura glow
  const glow = ctx.createRadialGradient(cx,cy*0.75,0,cx,cy*0.75,size*0.55);
  glow.addColorStop(0,'rgba(59,130,246,0.2)');
  glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow; ctx.fillRect(0,0,size,size);

  // Outer dashed ring
  ctx.save();
  ctx.strokeStyle='#3B82F6';
  ctx.lineWidth=size*0.028;
  ctx.lineCap='round';
  const ringR=size*0.32;
  const circ=2*Math.PI*ringR;
  ctx.setLineDash([circ*(168/202), circ*(34/202)]);
  ctx.translate(cx,cy); ctx.rotate(-Math.PI/2);
  ctx.beginPath(); ctx.arc(0,0,ringR,0,Math.PI*2); ctx.stroke();
  ctx.restore();

  // Inner dashed ring
  ctx.save();
  ctx.strokeStyle='rgba(96,165,250,0.32)';
  ctx.lineWidth=size*0.016;
  ctx.lineCap='round';
  const innerR=size*0.20;
  const ic=2*Math.PI*innerR;
  ctx.setLineDash([ic*(105/126), ic*(21/126)]);
  ctx.translate(cx,cy); ctx.rotate(Math.PI/2);
  ctx.beginPath(); ctx.arc(0,0,innerR,0,Math.PI*2); ctx.stroke();
  ctx.restore();

  // Center dot halo + fill
  const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,size*0.12);
  halo.addColorStop(0,'rgba(59,130,246,0.3)');
  halo.addColorStop(1,'transparent');
  ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(cx,cy,size*0.12,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3B82F6'; ctx.beginPath(); ctx.arc(cx,cy,size*0.055,0,Math.PI*2); ctx.fill();

  // Music wave arcs
  const wY=cy+size*0.1, wW=size*0.22;
  ctx.save(); ctx.setLineDash([]);
  ctx.strokeStyle='rgba(96,165,250,0.55)';
  ctx.lineWidth=size*0.022; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(cx-wW,wY);
  ctx.quadraticCurveTo(cx, wY-size*0.055, cx+wW, wY); ctx.stroke();
  ctx.strokeStyle='rgba(96,165,250,0.28)';
  ctx.lineWidth=size*0.016;
  ctx.beginPath(); ctx.moveTo(cx-wW*.68,wY+size*.042);
  ctx.quadraticCurveTo(cx, wY+size*.01, cx+wW*.68, wY+size*.042); ctx.stroke();
  ctx.restore();
}
