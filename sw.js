const CACHE = "tarbawi-v4";

const SHELL = [
  "./",
  "./index.html",
  "./config.js",
  "./supabase.min.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

const NET_TIMEOUT = 3500;

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

function networkFirst(req) {
  return new Promise(resolve => {
    let settled = false;
    const done = r => { if (!settled) { settled = true; resolve(r); } };

    const timer = setTimeout(() => {
      caches.match(req).then(hit => { if (hit) done(hit); });
    }, NET_TIMEOUT);

    fetch(req, { cache: "no-store" })
      .then(res => {
        clearTimeout(timer);
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        done(res);
      })
      .catch(() => {
        clearTimeout(timer);
        caches.match(req).then(hit => {
          if (hit) done(hit);
          else caches.match("./index.html").then(fb => done(fb));
        });
      });
  });
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => hit);
    return hit || net;
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const p = url.pathname;
  const isPage   = req.mode === "navigate" || p.endsWith("/") || p.endsWith("/index.html");
  const isConfig = p.endsWith("/config.js");
  const isLib    = p.endsWith("/supabase.min.js");

  if (isPage || isConfig || isLib) {
    e.respondWith(networkFirst(req));
    return;
  }

  e.respondWith(staleWhileRevalidate(req));
});
