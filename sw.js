/* SAVE AS: sw.js · LOCATION: C:/MarvelApps/scotthub/sw.js
 * Scott Hub offline worker - installable + opens with no signal. NETWORK FIRST:
 * online = newest files; the cache is only the offline fallback. The relay
 * (script.google.com) is never cached here - the app keeps its own last copy. */
const CACHE = "scotthub-v2";
const SHELL = ["./", "index.html", "styles.css", "app.js", "manifest.json", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
