/* SAVE AS: sw.js · LOCATION: C:/MarvelApps/scotthub/sw.js
 * Scott Hub offline worker - installable + opens with no signal. NETWORK FIRST:
 * online = newest files; the cache is only the offline fallback. The relay
 * (script.google.com) is never cached here - the app keeps its own last copy. */
const CACHE = "scotthub-v24";
const SHELL = ["./", "index.html", "styles.css", "app.js", "manifest.json", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("scotthub-") && k !== CACHE).map(k => caches.delete(k))))   // v21: every Hub shares this address, so clear only our own
    .then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== "GET") return;
  if (u.pathname.endsWith("/version.json")) return;   // v21: the update check is always live and never piles up in the cache
  if (e.request.cache === "reload" && e.request.destination === "") return;   // applyUpdate's fresh fetch: a failure must really fail, and half a set of new files stays out of the offline copy
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }   // v21: never cache an error page
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
