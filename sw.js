// Caches the app shell so it opens instantly/offline; Binance data is always fetched live.
// Network-first (revalidated, so updates arrive at once); if the network takes over 4 s the saved copy is used instead so the app never hangs.
const V='scalp-v4',SHELL=['./','index.html','lightweight-charts.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 const net=fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r});
 e.respondWith(Promise.race([net,new Promise((_,rej)=>setTimeout(rej,4000))]).catch(()=>caches.match(e.request).then(m=>m||net)))});
