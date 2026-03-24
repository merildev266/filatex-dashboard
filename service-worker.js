var CACHE_NAME = 'filatex-pmo-v4';
var ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './manifest.json',
  './css/mobile.css',
  './css/shared.css',
  './css/accueil.css',
  './css/energy.css',
  './css/investments.css',
  './css/properties.css',
  './css/capex.css',
  './css/csi.css',
  './css/reporting.css',
  './js/shared.js',
  './js/energy.js',
  './js/investments.js',
  './js/properties.js',
  './js/capex.js',
  './js/csi.js',
  './js/reporting.js',
  './js/projects.js',
  './js/accueil.js',
  './js/com_data.js',
  './site_data.js',
  './enr_site_data.js',
  './enr_projects_data.js',
  './hfo_projects.js',
  './props_data.js',
  './props_data_dev_full.js',
  './reporting_data.js'
];

// Install — cache all assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Update cache with fresh response
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(e.request, clone);
      });
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
