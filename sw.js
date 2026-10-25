/* PortPlay service worker (bundle, 2026-10-24): caches the vendored engine
   files for the systems actually used, so a game boots offline after its
   first play. Nothing is precached: a file enters the cache only when a
   boot actually requests it, which keeps the cache to the systems this
   visitor plays. Everything outside the engine payload passes straight
   to the network. The engine is version-pinned (4.2.3); an engine bump
   changes the cache name with the version in config.js's successor. */
'use strict';

var CACHE = 'portplay-engine-4.2.3-v1';
var ENGINE_PATH = '/assets/emulatorjs/data/';

self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      return k.indexOf('portplay-engine-') === 0 && k !== CACHE ? caches.delete(k) : Promise.resolve();
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (e.request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.indexOf(ENGINE_PATH) === -1) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      });
    });
  }));
});
