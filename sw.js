/* Service Worker — يجعل التطبيق يعمل بدون إنترنت */
const CACHE = "tarbawi-v3";
const SHELL = [
  "./", "./index.html", "./supabase.min.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // لا تُخزَّن نداءات Supabase إطلاقًا
  if (url.origin !== self.location.origin) return;

  // config.js: الشبكة أولًا حتى تُلتقط أي تعديل فورًا
  if (url.pathname.endsWith("/config.js")) {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const c = r.clone();
      caches.open(CACHE).then(x => x.put(req, c));
      return r;
    }).catch(() => caches.match("./index.html")))
  );
});
