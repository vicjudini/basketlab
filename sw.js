/* BasketLab · service worker: permite abrir la app sin conexión.
   Cambia CACHE cuando quieras forzar que los dispositivos descarguen de nuevo los archivos base. */
const CACHE='basketlab-v22';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const CDN=/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
const NEVER=/^https:\/\/([a-z0-9-]+\.)?(googleapis\.com|accounts\.google\.com|google\.com|youtube\.com|ytimg\.com|youtube-nocookie\.com|googlevideo\.com)\//;

self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null)))))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE&&k.startsWith('basketlab-'))await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});

async function networkFirst(req){const c=await caches.open(CACHE);try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),5000);const res=await fetch(req,{signal:ctl.signal});clearTimeout(t);if(res&&res.ok)c.put('./index.html',res.clone());return res}catch(err){return (await c.match('./index.html'))||(await c.match('./'))||new Response('<h1>BasketLab</h1><p>Sin conexión y sin copia guardada todavía. Abre la app una vez con Internet.</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}})}}
async function cacheFirst(req){const c=await caches.open(CACHE);const hit=await c.match(req);if(hit)return hit;const res=await fetch(req);if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());return res}
async function staleWhileRevalidate(req){const c=await caches.open(CACHE);const hit=await c.match(req);const net=fetch(req).then(res=>{if(res&&res.ok)c.put(req,res.clone());return res}).catch(()=>hit);return hit||net}

self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=req.url;
 if(NEVER.test(url)&&!CDN.test(url))return;
 if(req.mode==='navigate'){e.respondWith(networkFirst(req));return}
 if(CDN.test(url)){e.respondWith(cacheFirst(req));return}
 if(new URL(url).origin===self.location.origin){e.respondWith(staleWhileRevalidate(req));return}
});
